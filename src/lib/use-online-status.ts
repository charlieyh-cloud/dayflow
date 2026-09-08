import { useEffect, useState } from 'react'

/**
 * 온라인/오프라인 상태를 구독한다.
 *
 * 오프라인 상태와 동기화 대기 건수는 UI 에 명확히 보여야 한다 (PRD F-09-7).
 * navigator.onLine 은 "네트워크 인터페이스가 살아있다"만 알려주므로
 * STEP 4 에서 실제 서버 도달 여부 확인을 덧붙인다.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  useEffect(() => {
    const handleOnline = (): void => setIsOnline(true)
    const handleOffline = (): void => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
