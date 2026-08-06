import { expect, test } from '@playwright/test'

test('browser installation assets are valid and do not alter the signup funnel', async ({ page, request }) => {
  await page.goto('/signup')
  await expect(page).toHaveTitle(/UnReal BS/i)

  const manifestLink = page.locator('link[rel="manifest"]')
  await expect(manifestLink).toHaveAttribute('href', '/manifest.webmanifest')

  const manifestResponse = await request.get('/manifest.webmanifest')
  expect(manifestResponse.ok()).toBeTruthy()
  expect(manifestResponse.headers()['content-type']).toContain('application/manifest+json')
  const manifest = await manifestResponse.json()
  expect(manifest).toMatchObject({
    name: 'UnReal BS — Business Systems',
    short_name: 'UnReal BS',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: '#070712',
  })
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src: '/pwa/icon-192.png', sizes: '192x192', purpose: 'any' }),
    expect.objectContaining({ src: '/pwa/icon-512.png', sizes: '512x512', purpose: 'any' }),
    expect.objectContaining({ src: '/pwa/maskable-512.png', sizes: '512x512', purpose: 'maskable' }),
  ]))

  for (const icon of manifest.icons) {
    const iconResponse = await request.get(icon.src)
    expect(iconResponse.ok(), icon.src).toBeTruthy()
    expect(iconResponse.headers()['content-type'], icon.src).toBe('image/png')
  }

  const workerResponse = await request.get('/sw.js')
  expect(workerResponse.ok()).toBeTruthy()
  expect(workerResponse.headers()['content-type']).toContain('application/javascript')
  expect(workerResponse.headers()['cache-control']).toContain('no-store')
  expect(workerResponse.headers()['service-worker-allowed']).toBe('/')

  await expect.poll(() => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    return registration.scope
  })).toBe('http://127.0.0.1:3100/')

  await expect(page.getByRole('heading', { level: 2, name: /Get started free/i })).toBeVisible()
})
