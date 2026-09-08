import { useEffect, useState } from 'react'
import { Button } from './Button'
import styles from './Banner.module.css'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * 홈 화면 설치 안내 배너.
 *
 * 앱 진입 즉시가 아니라 사용자가 의미 있는 행동(첫 일정 등록 등)을 마친 뒤
 * 노출한다. iOS 는 beforeinstallprompt 를 지원하지 않으므로 STEP 4 에서
 * "공유 → 홈 화면에 추가" 안내를 따로 붙인다.
 */
export function InstallPrompt({ isEligible }: { isEligible: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const handler = (event: Event): void => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || !isEligible || isDismissed) return null

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <p className={styles.message}>홈 화면에 추가하면 앱처럼 바로 열 수 있고, 알림도 받을 수 있습니다.</p>
      <span className={styles.actions}>
        <Button
          onClick={() => {
            void deferredPrompt.prompt().then(() => setDeferredPrompt(null))
          }}
        >
          설치
        </Button>
        <Button variant="secondary" onClick={() => setIsDismissed(true)}>
          닫기
        </Button>
      </span>
    </div>
  )
}
