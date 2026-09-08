import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
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
            {/* 서브경로 배포(GitHub Pages)에서도 깨지지 않도록 BASE_URL 을 붙인다.
                절대경로 "/favicon.svg" 는 사이트 루트를 가리켜 404 가 된다. */}
            <Link className={styles.brand} to="/">
              <img
                className={styles.brandMark}
                src={`${import.meta.env.BASE_URL}favicon.svg`}
                alt=""
                width="28"
                height="28"
              />
              DayFlow
            </Link>
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
