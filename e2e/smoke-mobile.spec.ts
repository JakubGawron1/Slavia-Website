import { expect, test } from '@playwright/test'

const gotoOpts = { waitUntil: 'domcontentloaded' as const, timeout: 60_000 }

test.describe('mobile — publiczne trasy', () => {
  test('zawodnicy ładują się na wąskim viewportcie', async ({ page }) => {
    const res = await page.goto('/zawodnicy', gotoOpts)
    expect(res?.ok()).toBeTruthy()
    await expect(page.getByText(/Elita|Kadra/i).first()).toBeVisible()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)
  })

  test('kalendarz ładuje się na mobile', async ({ page }) => {
    const res = await page.goto('/kalendarz', gotoOpts)
    expect(res?.ok()).toBeTruthy()
    await expect(page.locator('body')).toBeVisible()
  })

  test('archiwum kadry na mobile', async ({ page }) => {
    const res = await page.goto('/zawodnicy/archiwum', gotoOpts)
    expect(res?.ok()).toBeTruthy()
    await expect(page).toHaveURL(/\/zawodnicy\/archiwum/)
    await expect(page.getByText(/Archiwum zawodników/i).first()).toBeVisible({ timeout: 15_000 })
  })
})
