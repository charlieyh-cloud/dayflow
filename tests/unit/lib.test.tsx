import { render, screen } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { contrastRatio, parseHex, relativeLuminance } from '@/lib/contrast'
import { getFocusableElements } from '@/lib/focus'
import { useOnlineStatus } from '@/lib/use-online-status'
import { OfflineBanner } from '@/components/OfflineBanner'

describe('contrast', () => {
  it('3자리·6자리 16진 표기를 모두 읽는다', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseHex('25479E')).toEqual({ r: 37, g: 71, b: 158 })
  })

  it('잘못된 값은 오류를 던진다', () => {
    expect(() => parseHex('#12345')).toThrow('올바른 16진 색상 값이 아닙니다')
  })

  it('흑백의 상대 휘도가 0 과 1 이다', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0)
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5)
  })

  it('흑백 대비가 21:1 이다', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2)
  })

  it('전경과 배경 순서를 바꿔도 결과가 같다', () => {
    expect(contrastRatio('#25479e', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#25479e'), 10)
  })
})

describe('getFocusableElements', () => {
  it('포커스 가능한 요소만 문서 순서로 반환한다', () => {
    render(
      <div data-testid="box">
        <button type="button">첫 번째</button>
        <button type="button" disabled>
          비활성
        </button>
        <input type="hidden" />
        <input aria-label="입력" />
        <span tabIndex={-1}>건너뜀</span>
        <a href="/next">링크</a>
      </div>,
    )

    const names = getFocusableElements(screen.getByTestId('box')).map((el) => el.tagName.toLowerCase())
    expect(names).toEqual(['button', 'input', 'a'])
  })

  it('aria-hidden 요소는 제외한다', () => {
    render(
      <div data-testid="box">
        {/* 잘못된 마크업을 일부러 만들어 필터링을 검증한다. */}
        {/* eslint-disable-next-line jsx-a11y/no-aria-hidden-on-focusable */}
        <button type="button" aria-hidden="true">
          숨김
        </button>
        <button type="button">보임</button>
      </div>,
    )

    const found = getFocusableElements(screen.getByTestId('box'))
    expect(found).toHaveLength(1)
    expect(found[0]).toHaveTextContent('보임')
  })
})

/** navigator.onLine 을 임시로 바꾼다. */
function setOnline(value: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', { value, configurable: true })
}

describe('useOnlineStatus', () => {
  it('offline 이벤트에 반응한다', () => {
    setOnline(true)
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)

    act(() => {
      setOnline(false)
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current).toBe(false)

    act(() => {
      setOnline(true)
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current).toBe(true)
  })
})

describe('OfflineBanner', () => {
  it('온라인일 때는 배너를 보이지 않는다', () => {
    setOnline(true)
    render(<OfflineBanner />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('오프라인일 때 상태 메시지를 보여준다', () => {
    setOnline(false)
    render(<OfflineBanner />)
    expect(screen.getByRole('status')).toHaveTextContent('오프라인입니다')
    setOnline(true)
  })
})
