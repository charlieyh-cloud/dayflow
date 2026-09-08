import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'
import { useFocusTrap } from '@/lib/use-focus-trap'
import styles from './Modal.module.css'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** 하단 액션 영역. 확인/취소 버튼 등. */
  footer?: ReactNode
  /** 배경 클릭으로 닫히지 않게 하려면 false. 파괴적 작업 확인창에 쓴다. */
  closeOnOverlayClick?: boolean
  closeLabel?: string
}

/**
 * 접근 가능한 모달 다이얼로그.
 *
 * - `role="dialog"` + `aria-modal` + `aria-labelledby`
 * - 포커스 트랩, Esc 로 닫기, 닫힌 뒤 원래 위치로 포커스 복원
 * - 열려 있는 동안 배경 스크롤 잠금
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  closeOnOverlayClick = true,
  closeLabel = '닫기',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useFocusTrap(dialogRef, isOpen)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // 배경 스크롤을 잠근다.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!closeOnOverlayClick) return
      if (event.target === event.currentTarget) onClose()
    },
    [closeOnOverlayClick, onClose],
  )

  if (!isOpen) return null

  return createPortal(
    // 배경 클릭 닫기는 편의 기능이다. 동일 동작이 닫기 버튼과 Esc 로도
    // 제공되므로 키보드 핸들러를 중복해 달지 않는다.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        className={styles.dialog}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.header}>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
          <Button variant="ghost" iconOnly label={closeLabel} onClick={onClose}>
            <svg
              className={styles.closeIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
        </div>

        <div className={styles.body}>{children}</div>

        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
