import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/Toast'
import { useToast } from '@/components/toast-context'

function Harness() {
  const { showToast } = useToast()
  return (
    <>
      <button type="button" onClick={() => showToast('일정을 저장했습니다.', { tone: 'success' })}>
        성공 알림
      </button>
      <button type="button" onClick={() => showToast('저장하지 못했습니다.', { tone: 'error' })}>
        오류 알림
      </button>
      <button
        type="button"
        onClick={() =>
          showToast('일정을 삭제했습니다.', {
            tone: 'info',
            action: { label: '실행 취소', onClick: () => showToast('삭제를 취소했습니다.') },
          })
        }
      >
        실행 취소 알림
      </button>
    </>
  )
}

// 가짜 타이머가 다음 테스트로 새면 userEvent 가 멈춘다. 항상 되돌린다.
afterEach(() => {
  vi.useRealTimers()
})

function renderHarness() {
  return render(
    <ToastProvider>
      <Harness />
    </ToastProvider>,
  )
}

describe('ToastProvider', () => {
  it('성공 토스트는 polite 라이브 리전으로 알린다', async () => {
    const user = userEvent.setup()
    renderHarness()

    await user.click(screen.getByRole('button', { name: '성공 알림' }))

    const toast = await screen.findByRole('status')
    expect(toast).toHaveTextContent('일정을 저장했습니다.')
    expect(toast).toHaveAttribute('aria-live', 'polite')
  })

  it('오류 토스트는 assertive alert 로 알린다', async () => {
    const user = userEvent.setup()
    renderHarness()

    await user.click(screen.getByRole('button', { name: '오류 알림' }))

    const toast = await screen.findByRole('alert')
    expect(toast).toHaveAttribute('aria-live', 'assertive')
  })

  it('상태를 색상 외에 텍스트로도 알린다', async () => {
    const user = userEvent.setup()
    renderHarness()

    await user.click(screen.getByRole('button', { name: '성공 알림' }))
    expect(await screen.findByText('완료:')).toBeInTheDocument()
  })

  it('실행 취소 버튼을 누르면 콜백이 실행되고 토스트가 닫힌다', async () => {
    const user = userEvent.setup()
    renderHarness()

    await user.click(screen.getByRole('button', { name: '실행 취소 알림' }))
    await user.click(await screen.findByRole('button', { name: '실행 취소' }))

    expect(await screen.findByText('삭제를 취소했습니다.')).toBeInTheDocument()
    expect(screen.queryByText('일정을 삭제했습니다.')).not.toBeInTheDocument()
  })

  it('닫기 버튼으로 토스트를 없앨 수 있다', async () => {
    const user = userEvent.setup()
    renderHarness()

    await user.click(screen.getByRole('button', { name: '성공 알림' }))
    await user.click(await screen.findByRole('button', { name: '알림 닫기' }))

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it('시간이 지나면 자동으로 사라진다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderHarness()

    await user.click(screen.getByRole('button', { name: '성공 알림' }))
    expect(screen.getByRole('status')).toBeInTheDocument()

    // 타이머 콜백의 상태 변경을 React 가 반영하도록 act 로 감싼다.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('실행 취소 토스트는 10초 동안 유지된다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderHarness()

    await user.click(screen.getByRole('button', { name: '실행 취소 알림' }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(9_000)
    })
    expect(screen.getByRole('button', { name: '실행 취소' })).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_500)
    })
    expect(screen.queryByRole('button', { name: '실행 취소' })).not.toBeInTheDocument()
  })

  it('axe 위반이 없다', async () => {
    const user = userEvent.setup()
    const { container } = renderHarness()

    await user.click(screen.getByRole('button', { name: '성공 알림' }))
    await screen.findByRole('status')

    expect(await axe(container)).toHaveNoViolations()
  })

  it('Provider 밖에서 useToast 를 쓰면 오류를 던진다', () => {
    // React 가 콘솔에 찍는 오류 로그를 테스트 출력에서 감춘다.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Harness />)).toThrow('ToastProvider')
    spy.mockRestore()
  })
})
