import { expect, test } from '@playwright/test'

test('signup Pixel is consent-gated and records a completed free registration', async ({ page }) => {
  const metaScriptRequests: string[] = []

  await page.route('https://connect.facebook.net/**', async (route) => {
    metaScriptRequests.push(route.request().url())
    await route.abort()
  })
  await page.route('**/api/auth/register', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, email: 'pixel-test@example.test' }),
    })
  })

  await page.goto('/signup?utm_source=meta&utm_campaign=free-account-test')

  // The supplied raw noscript beacon is intentionally not used: it would
  // bypass the visitor's privacy choice. No Meta code loads before consent.
  expect(metaScriptRequests).toHaveLength(0)
  await expect.poll(() => page.evaluate(() => Boolean(window.fbq))).toBe(false)

  await page.getByRole('button', { name: 'Allow marketing measurement' }).click()
  await expect.poll(() => metaScriptRequests.length).toBe(1)
  await expect.poll(() => page.evaluate(() => {
    const queue = window.fbq?.queue as unknown[][] | undefined
    return queue?.some((args) => args[0] === 'track' && args[1] === 'PageView') ?? false
  })).toBe(true)

  await page.locator('#businessName').fill('Meta Pixel Test Business')
  await page.locator('#email').fill('pixel-test@example.test')
  await page.locator('#password').fill('pixel-test-password')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect.poll(() => page.evaluate(() => {
    const queue = window.fbq?.queue as unknown[][] | undefined
    return queue?.some((args) => args[0] === 'track' && args[1] === 'CompleteRegistration') ?? false
  })).toBe(true)

  const registrationCall = await page.evaluate(() => {
    const queue = window.fbq?.queue as unknown[][] | undefined
    return queue?.find((args) => args[0] === 'track' && args[1] === 'CompleteRegistration')
  })
  expect(registrationCall?.[2]).toMatchObject({ content_name: 'Free Account' })
  expect(registrationCall?.[3]).toMatchObject({ eventID: expect.stringMatching(/^[A-Za-z0-9_-]{8,100}$/) })
})
