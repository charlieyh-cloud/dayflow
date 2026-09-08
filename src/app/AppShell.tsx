import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { SkipLink } from '@/components/SkipLink'
import { OfflineBanner } from '@/components/OfflineBanner'
import { UpdateBanner } from '@/components/UpdateBanner'
import styles from './AppShell.module.css'

const MAIN_ID = 'main-content'

interface NavItem {
  to: string
  label: string
}

// STEP 3 에서 주간·월간 뷰가 추가된다.
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '오늘' },
  { to: '/calendar', label: '캘린더' },
  { to: '/list', label: '목록' },
  { to: '/settings', label: '설정' },
]

/**
 * 앱 셸 — 랜드마크 구조(header / nav / main / footer)와 스킵 링크를 제공한다.
 *
 * 스킵 링크는 DOM 최상단에 두어 첫 Tab 에서 바로 잡히게 한다.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <SkipLink targetId={MAIN_ID} />

      <div>
        <UpdateBanner />
        <OfflineBanner />

        <header className={styles.header}>
          <div className={styles.headerInner}>
            <a className={styles.brand} href="/">
              <img className={styles.brandMark} src="/favicon.svg" alt="" width="28" height="28" />
              DayFlow
            </a>
          </div>

          <nav className={styles.nav} aria-label="주요">
            <ul className={styles.navList}>
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </header>
      </div>

      <main className={styles.main} id={MAIN_ID} tabIndex={-1}>
        {children}
      </main>

      <footer className={styles.footer}>
        <p>DayFlow — 기록에서 완료까지</p>
      </footer>
    </div>
  )
}
