import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * 실제 브라우저에서 돌리는 접근성 검사.
 *
 * critical / serious 위반이 1건이라도 있으면 실패한다 (PRD 8.4).
 * jsdom 기반 jest-axe 가 잡지 못하는 색상 대비와 레이아웃 문제를 여기서 잡는다.
 */

const ROUTES = [
  { path: '/', name: '오늘' },
  { path: '/calendar', name: '캘린더' },
  { path: '/list', name: '목록' },
  { path: '/settings', name: '설정' },
]

async function analyze(page: Page) {
  return new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
}

/** critical / serious 위반만 골라 읽기 쉬운 문자열로 만든다. */
function formatBlocking(violations: Awaited<ReturnType<typeof analyze>>['violations']): string {
  return violations
    .filter((v) => v.impact === 'critical' || v.impact === 'serious')
    .map((v) => `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`)
    .join('\n\n')
}

for (const route of ROUTES) {
  test(`${route.name} 화면에 axe critical/serious 위반이 없다`, async ({ page }) => {
    await page.goto(route.path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const results = await analyze(page)
    expect(formatBlocking(results.violations), `${route.name} 화면 접근성 위반`).toBe('')
  })
}

test('모달이 열린 상태에도 위반이 없다', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '일정 저장하기' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()

  const results = await analyze(page)
  expect(formatBlocking(results.violations), '모달 접근성 위반').toBe('')
})

test('오류 상태의 폼에 위반이 없다', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '일정 저장하기' }).click()
  await page.getByRole('button', { name: '저장', exact: true }).click()
  await expect(page.getByText('일정 제목을 입력해 주세요.')).toBeVisible()

  const results = await analyze(page)
  expect(formatBlocking(results.violations), '폼 오류 상태 접근성 위반').toBe('')
})

test('다크 모드에서도 위반이 없다', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const results = await analyze(page)
  expect(formatBlocking(results.violations), '다크 모드 접근성 위반').toBe('')
})

test('텍스트를 200% 확대해도 가로 스크롤이 생기지 않는다', async ({ page }) => {
  // 320px 폭에서 200% 확대는 640px 논리 폭과 같다 (WCAG 1.4.10 Reflow).
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/')
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  )
  expect(hasHorizontalScroll, '200% 확대 시 가로 스크롤이 생겼습니다').toBe(false)
})

test('모션 감소 설정에서 애니메이션이 사실상 제거된다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const duration = await page.evaluate(() => {
    const probe = document.createElement('div')
    probe.style.transition = 'opacity var(--duration-normal) linear'
    document.body.append(probe)
    const value = getComputedStyle(probe).transitionDuration
    probe.remove()
    return value
  })

  // 0.01ms 는 브라우저마다 0s 또는 1e-05s 로 보고된다. 어느 쪽이든 사실상 즉시다.
  expect(Number.parseFloat(duration)).toBeLessThan(0.05)
})
