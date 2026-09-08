import type { ReactNode, SelectHTMLAttributes } from 'react'
import { FieldError } from './FieldError'
import { useFieldIds } from '@/lib/use-field-ids'
import styles from './Field.module.css'

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'id'> {
  label: string
  id?: string
  hint?: string
  error?: string
  visuallyHiddenLabel?: boolean
  children: ReactNode
}

/**
 * 네이티브 select 기반 선택 컨트롤.
 * 커스텀 드롭다운 대신 네이티브를 쓰는 이유는 모바일 스크린리더·키보드 지원이
 * 기본으로 보장되기 때문이다.
 */
export function Select({
  label,
  id,
  hint,
  error,
  visuallyHiddenLabel = false,
  required,
  children,
  ...rest
}: SelectProps) {
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

      <select
        {...rest}
        id={inputId}
        className={`${styles.control} ${error ? styles.invalid : ''}`}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      >
        {children}
      </select>

      {error && errorId ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}
