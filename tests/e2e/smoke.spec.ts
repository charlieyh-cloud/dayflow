import { expect, test } from '@playwright/test'

test.describe('앱 셸', () => {
  test('첫 화면이 뜨고 문서 제목이 설정된다', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/오늘 · DayFlow/)
    await expect(page.getByRole('heading', { level: 1, name: '오늘' })).toBeVisible()
  })

  test('랜드마크 구조를 갖춘다', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('navigation', { name: '주요' })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })

  test('첫 Tab 에서 본문 바로가기 링크가 잡힌다', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')

    const skipLink = page.getByRole('link', { name: '본문 바로가기' })
    await expect(skipLink).toBeFocused()
    // 포커스를 받으면 화면에 실제로 보여야 한다.
    await expect(skipLink).toBeVisible()
  })

  test('키보드만으로 뷰를 이동할 수 있다', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: '목록' }).press('Enter')
    await expect(page.getByRole('heading', { level: 1, name: '목록' })).toBeVisible()
    await expect(page).toHaveTitle(/목록 · DayFlow/)
  })

  test('없는 주소는 안내 화면을 보여준다', async ({ page }) => {
    await page.goto('/does-not-exist')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('페이지를 찾을 수 없습니다')
  })
})

test.describe('공통 컴포넌트', () => {
  test('모달을 키보드로 열고 Esc 로 닫으면 포커스가 복원된다', async ({ page }) => {
    await page.goto('/')

    const opener = page.getByRole('button', { name: '일정 저장하기' })
    await opener.click()

    const dialog = page.getByRole('dialog', { name: '일정을 저장할까요?' })
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener).toBeFocused()
  })

  test('빈 제목으로 저장하면 오류가 안내되고 해당 필드로 포커스가 간다', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: '일정 저장하기' }).click()
    await page.getByRole('button', { name: '저장', exact: true }).click()

    const input = page.getByLabel('일정 제목')
    await expect(input).toBeFocused()
    await expect(page.getByText('일정 제목을 입력해 주세요.')).toBeVisible()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  test('저장에 성공하면 실행 취소가 가능한 알림이 뜬다', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel('일정 제목').fill('팀 주간 회의')
    await page.getByRole('button', { name: '일정 저장하기' }).click()
    await page.getByRole('button', { name: '저장', exact: true }).click()

    const toast = page.getByRole('status').filter({ hasText: '팀 주간 회의' })
    await expect(toast).toBeVisible()
    await expect(toast.getByRole('button', { name: '실행 취소' })).toBeVisible()
  })

  test('모든 인터랙티브 요소가 최소 44x44 터치 타겟을 만족한다', async ({ page }) => {
    await page.goto('/')

    // 스크린리더 전용 요소(.sr-only)는 포커스 전까지 화면에 없으므로 제외한다.
    // 포커스 시 크기는 아래 별도 테스트에서 검증한다.
    const targets = page.locator(
      [
        'button:visible:not(.sr-only)',
        'a:visible:not(.sr-only)',
        'select:visible:not(.sr-only)',
        'input[type="checkbox"]:visible:not(.sr-only)',
      ].join(', '),
    )
    const count = await targets.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const element = targets.nth(i)
      const box = await element.boundingBox()
      if (!box) continue

      const name =
        (await element.textContent())?.trim() || (await element.getAttribute('aria-label')) || `#${i}`

      // 체크박스는 라벨 전체가 타겟이므로 감싸는 라벨 크기를 본다.
      const isCheckbox = (await element.getAttribute('type')) === 'checkbox'
      const measured = isCheckbox ? await element.locator('xpath=ancestor::label[1]').boundingBox() : box
      if (!measured) continue

      expect(measured.height, `"${name}" 높이가 44px 미만입니다`).toBeGreaterThanOrEqual(44)
      expect(measured.width, `"${name}" 너비가 44px 미만입니다`).toBeGreaterThanOrEqual(44)
    }
  })

  test('본문 바로가기 링크는 포커스를 받으면 충분한 크기로 나타난다', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')

    const skipLink = page.getByRole('link', { name: '본문 바로가기' })
    await expect(skipLink).toBeFocused()

    const box = await skipLink.boundingBox()
    expect(box).not.toBeNull()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
  })
})

test.describe('PWA', () => {
  test('manifest 가 설치 가능한 형태를 갖춘다', async ({ page, request }) => {
    await page.goto('/')

    const href = await page.locator('link[rel="manifest"]').getAttribute('href')
    expect(href).toBeTruthy()

    const response = await request.get(new URL(href as string, page.url()).toString())
    expect(response.ok()).toBe(true)

    const manifest = (await response.json()) as {
      name: string
      start_url: string
      display: string
      icons: { sizes: string; purpose?: string }[]
    }

    expect(manifest.name).toBeTruthy()
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons.some((icon) => icon.sizes === '512x512')).toBe(true)
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true)
  })

  test('Service Worker 가 등록되고 캐시되지 않는다', async ({ page, request }) => {
    await page.goto('/')

    await page.waitForFunction(() => navigator.serviceWorker.controller !== null || true)
    const registered = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      return registration !== undefined
    })
    expect(registered).toBe(true)

    // sw.js 는 no-cache 여야 갱신이 반영된다.
    const response = await request.get('/sw.js')
    expect(response.ok()).toBe(true)
    expect(response.headers()['cache-control']).toContain('no-cache')
  })

  test('오프라인 폴백 페이지가 배포된다', async ({ request }) => {
    const response = await request.get('/offline.html')
    expect(response.ok()).toBe(true)
    expect(await response.text()).toContain('지금은 오프라인입니다')
  })
})
