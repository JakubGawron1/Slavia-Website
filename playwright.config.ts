import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke E2E bez logowania — pełne ścieżki paneli wymagają konta testowego.
 * Uruchomienie: `pnpm exec playwright install chromium` (raz).
 * Auto-start dev: `PLAYWRIGHT_START_SERVER=1 pnpm test:e2e`
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  workers: process.env.CI ? 2 : 1,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'desktop-chrome',
      testIgnore: /smoke-mobile\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'mobile-pixel5',
      testMatch: /smoke-mobile\.spec\.ts/,
      use: { ...devices['Pixel 5'] }
    }
  ],
  ...(process.env.PLAYWRIGHT_START_SERVER === '1'
    ? {
        webServer: {
          command: 'pnpm exec nuxt dev --host 127.0.0.1 --port 3000',
          url: 'http://127.0.0.1:3000',
          reuseExistingServer: true,
          timeout: 420_000
        }
      }
    : {})
})
