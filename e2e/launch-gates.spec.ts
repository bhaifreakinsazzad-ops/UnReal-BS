import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
  if (testInfo.project.name.includes('reduced-motion')) {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  }
})

test('public funnel renders and marketing remains consent-gated', async ({ page }) => {
  const metaRequests: string[] = []
  await page.route('https://connect.facebook.net/**', async (route) => {
    metaRequests.push(route.request().url())
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  })

  await page.goto('/unreal-bs')
  await expect(page).toHaveTitle(/UnReal BS/i)
  await expect(page.getByRole('dialog', { name: 'Marketing privacy choices' })).toBeVisible()
  expect(metaRequests).toHaveLength(0)

  await page.getByRole('button', { name: 'Allow marketing measurement' }).click()
  await expect.poll(() => metaRequests.length).toBeGreaterThan(0)

  await page.goto('/apply')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: /Submit Eligibility Application/i })).toBeVisible()
})

test('dark commerce and authenticated boundaries fail closed', async ({ page }) => {
  const product = await page.goto('/p/not-a-real-product')
  expect(product?.status()).toBe(404)

  await page.goto('/')
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2F$/)
  await expect(page.getByRole('heading', { name: /Sign in to your workspace/i })).toBeVisible()
})

test('health endpoints disclose capabilities, never secrets', async ({ request }) => {
  const live = await request.get('/api/health/live')
  expect(live.ok()).toBeTruthy()
  expect(await live.json()).toEqual({ status: 'live' })

  const ready = await request.get('/api/health/ready')
  expect(ready.status()).toBe(503)
  const body = await ready.text()
  expect(body).toContain('capabilities')
  expect(body).not.toContain('e2e-only-secret')
  expect(body).not.toContain('e2e-only-password')
})

test('public funnel is overflow-safe from 320px through 1440px', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'One project covers the complete viewport matrix.')
  for (const width of [320, 360, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/unreal-bs')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1)
  }
})

test('keyboard focus and preview CSP are present', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'One desktop project covers keyboard and headers.')
  const response = await page.goto('/unreal-bs')
  expect(response?.headers()['content-security-policy-report-only']).toContain("default-src 'self'")
  expect(response?.headers()['content-security-policy']).toBeUndefined()
  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toBeVisible()
  await page.getByRole('button', { name: 'Decline' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Marketing privacy choices' })).toBeHidden()
})
