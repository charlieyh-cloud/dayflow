/**
 * `virtual:pwa-register/react` 스텁.
 *
 * 이 가상 모듈은 vite-plugin-pwa 가 빌드 시에 만들어 준다.
 * Vitest 는 그 플러그인 없이 돌기 때문에 테스트에서만 대체한다.
 * 실제 Service Worker 등록 동작은 Playwright(tests/e2e)가 검증한다.
 */
import { useState } from 'react'

export interface RegisterSWOptions {
  onRegisteredSW?: (swUrl: string, registration: ServiceWorkerRegistration | undefined) => void
  onRegisterError?: (error: unknown) => void
}

export function useRegisterSW(_options: RegisterSWOptions = {}) {
  const needRefresh = useState(false)
  const offlineReady = useState(false)

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker: async (_reloadPage?: boolean): Promise<void> => {},
  }
}
