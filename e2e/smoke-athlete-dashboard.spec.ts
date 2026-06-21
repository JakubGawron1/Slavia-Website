/**
 * Smoke E2E — panel zawodnika `/athlete`.
 *
 * Wymaga lokalnego Nuxta (bez Rust API):
 *   PLAYWRIGHT_START_SERVER=1 pnpm test:e2e e2e/smoke-athlete-dashboard.spec.ts
 *
 * Opcjonalne zmienne:
 *   PLAYWRIGHT_BASE_URL — domyślnie http://127.0.0.1:3000
 *   PLAYWRIGHT_START_SERVER=1 — auto-start `nuxt dev` (jak w CI)
 *   CI=true — retries + reporter github (playwright.config.ts)
 *
 * Auth: cookie `slavia_token` + mock API w przeglądarce (bez konta testowego na HF/Vercel).
 */
import { expect, test } from '@playwright/test'
import {
  dismissAthleteDashboardOverlays,
  E2E_ATHLETE_MOCK,
  seedAthleteSession,
  setupAthleteDashboardMocks
} from './helpers/athleteDashboardMocks'

const gotoOpts = { waitUntil: 'domcontentloaded' as const, timeout: 60_000 }

test.describe('smoke — panel zawodnika', () => {
  test.beforeEach(async ({ context, page, baseURL }) => {
    await setupAthleteDashboardMocks(page)
    await dismissAthleteDashboardOverlays(page)
    await seedAthleteSession(context, baseURL ?? 'http://127.0.0.1:3000')
  })

  test('dashboard zawodnika — hero, sekcje i KPI', async ({ page }) => {
    const meRes = page.waitForResponse(
      (r) => r.url().includes('/api/auth/me') && r.ok(),
      { timeout: 30_000 }
    )

    const res = await page.goto('/athlete', gotoOpts)
    expect(res?.ok()).toBeTruthy()
    await meRes

    await expect(page).toHaveURL(/\/athlete/, { timeout: 20_000 })
    await expect(page).not.toHaveURL(/\/logowanie/)

    await expect(page.getByText(/Panel Zawodnika/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(new RegExp(`Cześć,\\s*${E2E_ATHLETE_MOCK.fullName}`, 'i')).first()).toBeVisible({
      timeout: 15_000
    })

    await expect(page.getByRole('button', { name: 'Powitanie' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Dziś i ten miesiąc' })).toBeVisible({ timeout: 15_000 })

    await expect(page.getByText('Składka', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Frekwencja', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Wyniki oczek.', { exact: true }).first()).toBeVisible()

    await expect(page.getByText('Opłacona').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('86%').first()).toBeVisible()
  })
})
