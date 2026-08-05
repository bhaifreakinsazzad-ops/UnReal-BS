import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 5'] } },
    { name: 'chromium-reduced-motion', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build && npm run start -- --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100/api/health/live',
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      AUTH_SECRET: 'e2e-only-secret-at-least-32-characters',
      NEXTAUTH_URL: 'http://127.0.0.1:3100',
      NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3100',
      ADMIN_EMAIL: 'admin@example.test',
      ADMIN_PASSWORD: 'e2e-only-password',
      NEXT_PUBLIC_META_PIXEL_ID: '1234567890',
      NEXT_PUBLIC_CONSENT_VERSION: 'e2e-v1',
      COMMERCE_ENABLED: 'false',
      STORE_PUBLIC_ENABLED: 'false',
      MARKETPLACE_SELLERS_ENABLED: 'false',
      TURNSTILE_ENABLED: 'false',
      CSP_ENFORCE: 'false',
    },
  },
})
