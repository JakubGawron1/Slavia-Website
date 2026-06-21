/**
 * Smoke E2E — SuperAdmin podgląd roli zawodnika na `/athlete`.
 *
 * Wymaga lokalnego Nuxta (bez Rust API):
 *   PLAYWRIGHT_START_SERVER=1 pnpm test:e2e e2e/smoke-role-preview-athlete-dashboard.spec.ts
 *
 * Mockuje BFF `/api/panel/athletes/me/dashboard` z nagłówkiem `X-Slavia-Role-Preview`
 * oraz bezpośrednie `/api/system/role-preview/athlete-dashboard/*` (rewrite klienta).
 */
import { expect, test } from '@playwright/test'
import {
  dismissRolePreviewAthleteOverlays,
  E2E_PREVIEW_TARGET,
  seedRolePreviewAthleteSession,
  seedRolePreviewState,
  setupRolePreviewAthleteDashboardMocks
} from './helpers/rolePreviewAthleteDashboardMocks'

const gotoOpts = { waitUntil: 'domcontentloaded' as const, timeout: 60_000 }

test.describe('smoke — SuperAdmin podgląd roli zawodnika', () => {
  test.beforeEach(async ({ context, page, baseURL }) => {
    await setupRolePreviewAthleteDashboardMocks(page)
    await dismissRolePreviewAthleteOverlays(page)
    await seedRolePreviewState(context)
    await seedRolePreviewAthleteSession(context, baseURL ?? 'http://127.0.0.1:3000')
  })

  test('dashboard zawodnika — dane docelowego konta i baner podglądu', async ({ page }) => {
    const meRes = page.waitForResponse(
      (r) => r.url().includes('/api/auth/me') && r.ok(),
      { timeout: 30_000 }
    )

    const dashboardRes = page.waitForResponse(
      (r) => r.url().includes('/api/panel/athletes/me/dashboard') && r.ok(),
      { timeout: 30_000 }
    )

    const res = await page.goto('/athlete', gotoOpts)
    expect(res?.ok()).toBeTruthy()
    await meRes
    const dashboardResponse = await dashboardRes

    expect(dashboardResponse.request().headers()['x-slavia-role-preview']).toBe(
      E2E_PREVIEW_TARGET.userId
    )

    await expect(page).toHaveURL(/\/athlete/, { timeout: 20_000 })
    await expect(page).not.toHaveURL(/\/logowanie/)

    await expect(page.getByText(/Podgląd read-only/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/widzisz panel jako/i).first()).toBeVisible()
    await expect(page.getByText(E2E_PREVIEW_TARGET.fullName).first()).toBeVisible()

    await expect(page.getByText(/Strefa zawodnika/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(new RegExp(`Cześć,\\s*${E2E_PREVIEW_TARGET.fullName}`, 'i')).first()).toBeVisible({
      timeout: 15_000
    })

    await expect(page.getByRole('button', { name: 'Powitanie' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Dziś i ten miesiąc' })).toBeVisible({ timeout: 15_000 })

    await expect(page.getByText('Frekwencja', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('86%').first()).toBeVisible()
    await expect(page.getByText('Wyniki oczek.', { exact: true }).first()).toBeVisible()
  })
})
