import type { InputHTMLAttributes } from 'react'
import { FieldError } from './FieldError'
import { useFieldIds } from '@/lib/use-field-ids'
import styles from './Field.module.css'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'id'> {
  /** 항상 필요하다. 시각적으로 숨기려면 visuallyHiddenLabel 을 쓴다. */
  label: string
  id?: string
  hint?: string
  /** 오류 문구. 원인과 해결 방법을 함께 적는다. */
  error?: string
  visuallyHiddenLabel?: boolean
}

/**
 * 라벨·힌트·오류가 항상 연결되는 텍스트 입력.
 * placeholder 를 라벨 대신 쓰지 않는다.
 */
export function Input({
  label,
  id,
  hint,
  error,
  visuallyHiddenLabel = false,
  required,
  ...rest
}: InputProps) {
  const { inputId, hintId, errorId, describedBy } = useFieldIds(id, Boolean(hint), Boolean(error))

  return (
    <div className={styles.field}>
      <label className={visuallyHiddenLabel ? 'sr-only' : styles.label} htmlFor={inputId}>
        {label}
        {required ? (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (필수)</span> : null}
      </label>

      {hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}

      <input
        {...rest}
        id={inputId}
        className={`${styles.control} ${error ? styles.invalid : ''}`}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />

      {error && errorId ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}
