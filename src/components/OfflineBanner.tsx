import { useOnlineStatus } from '@/lib/use-online-status'
import styles from './Banner.module.css'

/**
 * 오프라인 상태 표시.
 * 상태 변화는 aria-live 로 알리되, 화면에도 항상 보이게 둔다.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  return (
    <div aria-live="polite">
      {isOnline ? null : (
        <div className={`${styles.banner} ${styles.offline}`} role="status">
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M1 1l22 22" />
            <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
            <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
            <path d="M8.53 16.11a6 6 0 016.95 0" />
            <path d="M12 20h.01" />
          </svg>
          <p className={styles.message}>
            오프라인입니다. 변경한 내용은 기기에 저장되며, 연결이 돌아오면 자동으로 동기화됩니다.
          </p>
        </div>
      )}
    </div>
  )
}
