import { expect, test } from '@playwright/test'

const gotoOpts = { waitUntil: 'domcontentloaded' as const, timeout: 60_000 }

test.describe('smoke publiczne', () => {
  test('strona główna odpowiada', async ({ page }) => {
    const res = await page.goto('/', gotoOpts)
    expect(res?.ok()).toBeTruthy()
    await expect(page.locator('body')).toBeVisible()
  })

  test('lista zawodników — treść rankingu', async ({ page }) => {
    const res = await page.goto('/zawodnicy', gotoOpts)
    expect(res?.ok()).toBeTruthy()
    await expect(page.getByText(/Elita|Kadra i Ranking/i).first()).toBeVisible()
  })

  test('archiwum kadry odpowiada', async ({ page }) => {
    const res = await page.goto('/zawodnicy/archiwum', gotoOpts)
    expect(res?.ok()).toBeTruthy()
    await expect(page).toHaveURL(/\/zawodnicy\/archiwum/)
    await expect(page.getByText(/Archiwum zawodników/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('galeria odpowiada', async ({ page }) => {
    const res = await page.goto('/galeria', gotoOpts)
    expect(res?.ok()).toBeTruthy()
    await expect(page.locator('body')).toBeVisible()
  })

  test('kalendarz odpowiada', async ({ page }) => {
    const res = await page.goto('/kalendarz', gotoOpts)
    expect(res?.ok()).toBeTruthy()
    await expect(page.locator('body')).toBeVisible()
  })

  test('logowanie — formularz widoczny', async ({ page }) => {
    await page.goto('/logowanie', gotoOpts)
    await expect(page.locator('input[type="password"], input[autocomplete="current-password"]').first()).toBeVisible()
  })

  test('porównanie zawodników — lista przez BFF', async ({ page }) => {
    const res = await page.goto('/zawodnicy/porownanie', gotoOpts)
    expect(res?.ok()).toBeTruthy()
    await expect(page.getByText(/Porównanie zawodników/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('kontakt — formularz widoczny', async ({ page }) => {
    const res = await page.goto('/kontakt', gotoOpts)
    expect(res?.ok()).toBeTruthy()
    await expect(page.getByText(/Wyślij wiadomość/i).first()).toBeVisible()
    await expect(page.locator('input[name="website"]')).toHaveCount(1)
  })

  test('ogloszenia (CSR) ładują shell strony', async ({ page }) => {
    const res = await page.goto('/ogloszenia', gotoOpts)
    expect(res?.ok()).toBeTruthy()
    await expect(page.locator('body')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/ogłoszeń|Ogłoszenia|Tablica/i).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('PWA i manifest', () => {
  test('manifest.webmanifest jest dostępny i spójny z config/pwa.ts', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest')
    expect(res.ok()).toBeTruthy()
    const manifest = await res.json() as {
      name?: string
      short_name?: string
      theme_color?: string
      start_url?: string
    }
    expect(manifest.name).toContain('Slavia')
    expect(manifest.short_name).toBe('Slavia')
    expect(manifest.theme_color).toBe('#140a0f')
    expect(manifest.start_url).toBe('/')
  })
})

test.describe('ochrona tras', () => {
  test('import SA przekierowuje na logowanie bez sesji', async ({ page }) => {
    await page.goto('/superadmin/import', gotoOpts)
    await page.waitForURL(/\/logowanie/, { timeout: 20_000 })
  })

  test('panel zawodnika wymaga logowania', async ({ page }) => {
    await page.goto('/athlete', gotoOpts)
    await page.waitForURL(/\/logowanie/, { timeout: 20_000 })
  })

  test('panel trenera wymaga logowania', async ({ page }) => {
    await page.goto('/trainer', gotoOpts)
    await page.waitForURL(/\/logowanie/, { timeout: 20_000 })
  })

  test('Trener AI wymaga logowania', async ({ page }) => {
    await page.goto('/athlete/ai-coach', gotoOpts)
    await page.waitForURL(/\/logowanie/, { timeout: 20_000 })
  })
})

test.describe('AI coach smoke', () => {
  test('publiczny status asystenta przez BFF', async ({ request }) => {
    const res = await request.get('/api/ai/public/status')
    expect(res.ok()).toBeTruthy()
    const body = await res.json() as { available?: boolean, reason?: string }
    expect(typeof body.available).toBe('boolean')
  })
})
