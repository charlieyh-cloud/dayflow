import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from './Button'
import styles from './Banner.module.css'

/**
 * "새 버전이 있습니다" 배너.
 *
 * registerType: 'prompt' 이므로 새 Service Worker 는 대기 상태로 머문다.
 * 사용자가 직접 갱신을 선택해야 교체된다. 작성 중이던 내용을 예고 없이
 * 날리지 않기 위해서다.
 */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // 한 시간마다 갱신 여부를 확인한다.
      if (!registration) return
      setInterval(
        () => {
          void registration.update()
        },
        60 * 60 * 1000,
      )
    },
  })

  if (!needRefresh) return null

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </svg>
      <p className={styles.message}>새 버전이 있습니다. 지금 새로고침하면 최신 기능을 사용할 수 있습니다.</p>
      <span className={styles.actions}>
        <Button
          onClick={() => {
            void updateServiceWorker(true)
          }}
        >
          새로고침
        </Button>
        <Button variant="secondary" onClick={() => setNeedRefresh(false)}>
          나중에
        </Button>
      </span>
    </div>
  )
}
