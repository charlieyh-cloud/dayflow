import type { InputHTMLAttributes } from 'react'
import { FieldError } from './FieldError'
import { useFieldIds } from '@/lib/use-field-ids'
import styles from './Field.module.css'

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'id' | 'type'
> {
  label: string
  id?: string
  hint?: string
  error?: string
}

/**
 * 체크박스. 라벨 전체가 클릭·터치 영역이며 높이는 최소 44px 이다.
 */
export function Checkbox({ label, id, hint, error, ...rest }: CheckboxProps) {
  const { inputId, hintId, errorId, describedBy } = useFieldIds(id, Boolean(hint), Boolean(error))

  return (
    <div className={styles.field}>
      <label className={styles.checkboxField} htmlFor={inputId}>
        <input
          {...rest}
          type="checkbox"
          id={inputId}
          className={styles.checkbox}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        <span className={styles.checkboxText}>
          <span className={styles.checkboxLabel}>{label}</span>
          {hint ? (
            <span className={styles.hint} id={hintId}>
              {hint}
            </span>
          ) : null}
        </span>
      </label>

      {error && errorId ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}
