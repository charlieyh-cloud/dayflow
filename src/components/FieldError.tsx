import styles from './Field.module.css'

export interface FieldErrorProps {
  id: string
  children: string
}

/**
 * 폼 오류 메시지.
 * 색상만으로 오류를 알리지 않도록 경고 아이콘과 "오류:" 접두 텍스트를 함께 낸다.
 */
export function FieldError({ id, children }: FieldErrorProps) {
  return (
    <p className={styles.error} id={id}>
      <svg
        className={styles.errorIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </svg>
      <span>
        <span className="sr-only">오류: </span>
        {children}
      </span>
    </p>
  )
}
