/**
 * 공통 컴포넌트 접근성 테스트.
 *
 * axe 자동 검사 + 자동 검사가 잡지 못하는 항목(포커스 이동, 라벨 연결,
 * 키보드 조작)을 함께 확인한다.
 */
import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/Button'
import { Checkbox } from '@/components/Checkbox'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { Select } from '@/components/Select'
import { SkipLink } from '@/components/SkipLink'

describe('Button', () => {
  it('axe 위반이 없다', async () => {
    const { container } = render(<Button>저장</Button>)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('아이콘 전용 버튼도 접근 가능한 이름을 가진다', async () => {
    const { container } = render(
      <Button iconOnly label="닫기">
        <svg aria-hidden="true" viewBox="0 0 24 24" />
      </Button>,
    )
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('키보드 Enter 로 실행된다', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>저장</Button>)

    await user.tab()
    expect(screen.getByRole('button')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('로딩 중에는 aria-busy 로 상태를 알린다', () => {
    render(<Button isLoading>저장</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
    expect(screen.getByText('처리 중')).toBeInTheDocument()
  })
})

describe('Input', () => {
  it('axe 위반이 없다', async () => {
    const { container } = render(<Input label="일정 제목" hint="예: 팀 회의" />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('라벨이 입력에 연결된다', () => {
    render(<Input label="일정 제목" />)
    expect(screen.getByLabelText('일정 제목')).toBeInTheDocument()
  })

  it('오류가 aria-describedby 로 연결되고 aria-invalid 가 설정된다', () => {
    render(<Input label="일정 제목" error="일정 제목을 입력해 주세요." />)
    const input = screen.getByLabelText('일정 제목')

    expect(input).toHaveAttribute('aria-invalid', 'true')
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy as string)).toHaveTextContent('일정 제목을 입력해 주세요.')
  })

  it('오류 메시지는 색상 외에 텍스트로도 오류임을 알린다', () => {
    render(<Input label="일정 제목" error="입력이 필요합니다." />)
    expect(screen.getByText('오류:')).toBeInTheDocument()
  })

  it('힌트와 오류가 함께 있으면 둘 다 연결된다', () => {
    render(<Input label="일정 제목" hint="짧게 적어 주세요." error="비어 있습니다." />)
    const describedBy = screen.getByLabelText('일정 제목').getAttribute('aria-describedby')
    expect(describedBy?.split(' ')).toHaveLength(2)
  })

  it('필수 입력은 스크린리더에 필수임을 알린다', () => {
    render(<Input label="일정 제목" required />)
    expect(screen.getByText('(필수)')).toBeInTheDocument()
  })
})

describe('Select', () => {
  it('axe 위반이 없다', async () => {
    const { container } = render(
      <Select label="카테고리">
        <option value="work">업무</option>
        <option value="personal">개인</option>
      </Select>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('라벨이 연결되고 키보드로 값을 바꿀 수 있다', async () => {
    const user = userEvent.setup()
    render(
      <Select label="카테고리" defaultValue="work">
        <option value="work">업무</option>
        <option value="personal">개인</option>
      </Select>,
    )

    const select = screen.getByLabelText('카테고리')
    await user.selectOptions(select, 'personal')
    expect(select).toHaveValue('personal')
  })
})

describe('Checkbox', () => {
  it('axe 위반이 없다', async () => {
    const { container } = render(<Checkbox label="완료 처리" hint="통계에 반영됩니다." />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Space 키로 토글된다', async () => {
    const user = userEvent.setup()
    render(<Checkbox label="완료 처리" />)

    const checkbox = screen.getByRole('checkbox', { name: /완료 처리/ })
    await user.tab()
    expect(checkbox).toHaveFocus()
    await user.keyboard(' ')
    expect(checkbox).toBeChecked()
  })
})

/** 모달 열고 닫기를 검증하기 위한 테스트용 하네스. */
function ModalHarness() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        열기
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="확인">
        <p>내용</p>
      </Modal>
    </>
  )
}

describe('Modal', () => {
  it('axe 위반이 없다', async () => {
    const { baseElement } = render(
      <Modal isOpen onClose={() => {}} title="일정을 저장할까요?">
        <p>내용</p>
      </Modal>,
    )
    expect(await axe(baseElement)).toHaveNoViolations()
  })

  it('dialog 역할과 제목이 연결된다', () => {
    render(
      <Modal isOpen onClose={() => {}} title="일정을 저장할까요?">
        <p>내용</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: '일정을 저장할까요?' })).toBeInTheDocument()
  })

  it('열리면 내부 첫 요소로 포커스가 이동한다', async () => {
    render(
      <Modal isOpen onClose={() => {}} title="확인">
        <button type="button">내부 버튼</button>
      </Modal>,
    )
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus()
    })
  })

  it('Esc 로 닫힌다', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Modal isOpen onClose={onClose} title="확인">
        <p>내용</p>
      </Modal>,
    )

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('Tab 이 모달 밖으로 새지 않는다', async () => {
    const user = userEvent.setup()
    render(
      <>
        <button type="button">바깥 버튼</button>
        <Modal isOpen onClose={() => {}} title="확인">
          <button type="button">내부 버튼</button>
        </Modal>
      </>,
    )

    // 닫기 → 내부 버튼 → 다시 닫기 로 순환한다.
    await user.tab()
    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: '바깥 버튼' })).not.toHaveFocus()
  })

  it('닫히면 열기 전 요소로 포커스가 복원된다', async () => {
    const user = userEvent.setup()
    render(<ModalHarness />)

    const opener = screen.getByRole('button', { name: '열기' })
    await user.click(opener)
    await user.keyboard('{Escape}')

    await waitFor(() => expect(opener).toHaveFocus())
  })

  it('닫혀 있으면 아무것도 렌더하지 않는다', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="확인">
        <p>내용</p>
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('SkipLink', () => {
  it('본문으로 이동하는 링크를 제공한다', async () => {
    const { container } = render(
      <>
        <SkipLink targetId="main-content" />
        <main id="main-content">본문</main>
      </>,
    )
    const link = screen.getByRole('link', { name: '본문 바로가기' })
    expect(link).toHaveAttribute('href', '#main-content')
    expect(await axe(container)).toHaveNoViolations()
  })
})
