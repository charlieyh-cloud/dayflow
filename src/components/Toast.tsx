import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { ToastContext, type ShowToastOptions, type Toast, type ToastTone } from './toast-context'
import styles from './Toast.module.css'

const TONE_PREFIX: Record<ToastTone, string> = {
  success: '완료',
  error: '오류',
  info: '알림',
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  const className = `${styles.icon} ${styles[`${tone}Icon`]}`
  const shared = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    'aria-hidden': true,
  }

  if (tone === 'success') {
    return (
      <svg {...shared}>
        <circle cx="12" cy="12" r="10" />
        <path d="m8 12 3 3 5-6" />
      </svg>
    )
  }
  if (tone === 'error') {
    return (
      <svg {...shared}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </svg>
    )
  }
  return (
    <svg {...shared}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-5" />
      <path d="M12 8h.01" />
    </svg>
  )
}

/**
 * 토스트 알림 영역.
 *
 * 오류는 `role="alert"`(assertive), 나머지는 `role="status"`(polite) 로 알린다.
 * 실행 취소처럼 조작이 필요한 토스트는 자동으로 사라지기 전에 충분한 시간을 준다.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, options: ShowToastOptions = {}): string => {
      const id = crypto.randomUUID()
      const tone = options.tone ?? 'info'
      // 실행 취소 등 액션이 있으면 기본 10초를 준다 (PRD F-01-5).
      const durationMs = options.durationMs ?? (options.action ? 10_000 : 5_000)

      const toast: Toast = {
        id,
        message,
        tone,
        durationMs,
        ...(options.action ? { action: options.action } : {}),
      }

      setToasts((current) => [...current, toast])

      if (durationMs > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismissToast(id), durationMs),
        )
      }

      return id
    },
    [dismissToast],
  )

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* 위치 지정용 컨테이너다. 알림 자체는 각 토스트의 status/alert 역할이 담당한다.
          역할 없는 div 에 aria-label 을 붙이면 aria-prohibited-attr 위반이 된다. */}
      <div className={styles.region}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.tone]}`}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
          >
            <ToastIcon tone={toast.tone} />
            <p className={styles.content}>
              <span className="sr-only">{TONE_PREFIX[toast.tone]}: </span>
              {toast.message}
            </p>
            <span className={styles.actions}>
              {toast.action ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    toast.action?.onClick()
                    dismissToast(toast.id)
                  }}
                >
                  {toast.action.label}
                </Button>
              ) : null}
              <Button variant="ghost" iconOnly label="알림 닫기" onClick={() => dismissToast(toast.id)}>
                <svg
                  className={styles.icon}
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
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
