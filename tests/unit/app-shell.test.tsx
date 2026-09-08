/**
 * 앱 셸 회귀 테스트.
 *
 * 서브경로 배포(GitHub Pages 의 /dayflow/)에서 절대경로 에셋이 404 가 되는
 * 문제를 실제 배포에서 겪었다. 같은 실수를 다시 하지 않도록 고정한다.
 */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { AppShell } from '@/app/AppShell'

function renderShell() {
  return render(
    <MemoryRouter>
      <AppShell>
        <h1>오늘</h1>
      </AppShell>
    </MemoryRouter>,
  )
}

describe('AppShell', () => {
  it('랜드마크 구조를 갖춘다', () => {
    renderShell()

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: '주요' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('본문 바로가기 링크가 main 을 가리킨다', () => {
    renderShell()

    const skipLink = screen.getByRole('link', { name: '본문 바로가기' })
    expect(skipLink).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it('브랜드 아이콘 경로에 BASE_URL 이 붙는다', () => {
    const { container } = renderShell()

    const brandMark = container.querySelector('header img')
    expect(brandMark).not.toBeNull()

    const src = brandMark?.getAttribute('src') ?? ''
    // 절대경로 "/favicon.svg" 는 서브경로 배포에서 사이트 루트를 가리켜 404 가 된다.
    expect(src).toBe(`${import.meta.env.BASE_URL}favicon.svg`)
    expect(src.startsWith(import.meta.env.BASE_URL)).toBe(true)
  })

  it('브랜드 아이콘은 장식이므로 대체 텍스트가 비어 있다', () => {
    const { container } = renderShell()
    // 링크 텍스트가 "DayFlow" 를 이미 제공하므로 아이콘을 중복해 읽지 않는다.
    expect(container.querySelector('header img')).toHaveAttribute('alt', '')
    expect(screen.getByRole('link', { name: 'DayFlow' })).toBeInTheDocument()
  })

  it('내비게이션이 5개 화면 링크를 제공한다', () => {
    renderShell()

    const nav = screen.getByRole('navigation', { name: '주요' })
    const links = screen.getAllByRole('link').filter((link) => nav.contains(link))
    expect(links.map((link) => link.textContent)).toEqual(['오늘', '캘린더', '목록', '설정'])
  })

  it('axe 위반이 없다', async () => {
    const { container } = renderShell()
    expect(await axe(container)).toHaveNoViolations()
  })
})
