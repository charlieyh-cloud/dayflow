import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  /** 아이콘만 있는 버튼. 이 경우 label 을 반드시 넘겨야 한다. */
  iconOnly?: boolean
  /**
   * 접근 가능한 이름. 시각적 텍스트가 없을 때 필수.
   * 아이콘 전용 버튼에서 이름이 비면 스크린리더 사용자는 용도를 알 수 없다.
   */
  label?: string
  isLoading?: boolean
  /** 로딩 중 스크린리더에 읽히는 문구. */
  loadingLabel?: string
  children?: ReactNode
}

/**
 * 공통 버튼.
 *
 * - 최소 44×44 터치 타겟
 * - 이중 포커스 링 (global.css 의 :focus-visible)
 * - 로딩 중에는 `aria-busy` 로 상태를 알린다
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconOnly = false,
  label,
  isLoading = false,
  loadingLabel = '처리 중',
  disabled,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    iconOnly ? styles.iconOnly : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      {...rest}
      type={type}
      className={classNames}
      disabled={disabled ?? isLoading}
      aria-busy={isLoading || undefined}
      aria-label={label}
    >
      {isLoading ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          <span className="sr-only">{loadingLabel}</span>
        </>
      ) : null}
      {children}
    </button>
  )
}
