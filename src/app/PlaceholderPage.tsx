import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { Checkbox } from '@/components/Checkbox'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { Select } from '@/components/Select'
import { useToast } from '@/components/toast-context'
import styles from './PlaceholderPage.module.css'

export interface PlaceholderPageProps {
  title: string
  description: string
  /** 이 화면이 구현될 단계. 없으면 배지를 숨긴다. */
  step?: string
}

/**
 * STEP 1 자리표시자 화면.
 *
 * 공통 컴포넌트를 실제로 렌더해 두어 Lighthouse·axe 검사가
 * 빈 페이지가 아니라 실제 UI 를 대상으로 돌게 한다.
 */
export function PlaceholderPage({ title, description, step }: PlaceholderPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const { showToast } = useToast()

  // 화면 제목을 문서 제목에 반영한다 (WCAG 2.4.2 Page Titled).
  useEffect(() => {
    document.title = `${title} · DayFlow`
  }, [title])

  const handleSave = (): void => {
    if (taskTitle.trim() === '') {
      setError('일정 제목을 입력해 주세요. 예: 팀 주간 회의')
      document.getElementById('demo-task-title')?.focus()
      return
    }
    setError(undefined)
    setIsModalOpen(false)
    showToast(`'${taskTitle}' 일정을 저장했습니다.`, {
      tone: 'success',
      action: { label: '실행 취소', onClick: () => showToast('저장을 취소했습니다.', { tone: 'info' }) },
    })
    setTaskTitle('')
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      {step ? <p className={styles.badge}>{step}에서 구현 예정</p> : null}

      <section className={styles.demo} aria-labelledby="demo-heading">
        <h2 className={styles.demoTitle} id="demo-heading">
          공통 컴포넌트 미리보기
        </h2>
        <p className={styles.description}>
          아래 요소는 모두 키보드만으로 조작할 수 있습니다. Tab 으로 이동하고 Enter 또는 Space 로 실행하세요.
        </p>

        <Input
          label="일정 제목"
          id="demo-task-title"
          hint="언제 무엇을 할지 알아볼 수 있게 적어 주세요."
          placeholder="예: 팀 주간 회의"
          value={taskTitle}
          onChange={(event) => setTaskTitle(event.target.value)}
          {...(error ? { error } : {})}
          required
        />

        <Select label="카테고리" defaultValue="work">
          <option value="personal">개인</option>
          <option value="work">업무</option>
          <option value="health">건강</option>
          <option value="study">학습</option>
          <option value="family">가족</option>
        </Select>

        <Checkbox label="완료 처리" hint="완료한 일정은 대시보드 통계에 반영됩니다." />

        <div className={styles.row}>
          <Button onClick={() => setIsModalOpen(true)}>일정 저장하기</Button>
          <Button variant="secondary" onClick={() => showToast('알림 예시입니다.', { tone: 'info' })}>
            알림 띄우기
          </Button>
          <Button variant="danger" onClick={() => showToast('삭제할 수 없습니다.', { tone: 'error' })}>
            오류 알림
          </Button>
        </div>
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="일정을 저장할까요?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave}>저장</Button>
          </>
        }
      >
        <p>
          입력한 내용을 저장합니다. 저장 뒤 10초 안에는 실행 취소할 수 있습니다. Esc 키를 누르거나 배경을
          클릭해도 닫힙니다.
        </p>
      </Modal>
    </div>
  )
}
