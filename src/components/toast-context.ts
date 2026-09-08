import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  message: string
  tone: ToastTone
  action?: ToastAction
  /** 자동으로 사라지기까지의 시간(ms). 0 이면 사라지지 않는다. */
  durationMs: number
}

export interface ShowToastOptions {
  tone?: ToastTone
  action?: ToastAction
  durationMs?: number
}

export interface ToastContextValue {
  showToast: (message: string, options?: ShowToastOptions) => string
  dismissToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

/** 토스트를 띄우는 훅. ToastProvider 안에서만 쓸 수 있다. */
export function useToast(): ToastContextValue {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast 는 ToastProvider 안에서만 사용할 수 있습니다.')
  return value
}
