import { expect, test, type Page, type Route } from '@playwright/test'

/** Minimalna kadra do smoke E2E — bez Rust API na :8080. */
export const E2E_PUBLIC_ATHLETES = [
  {
    id: 'e2e-athlete-compare-1',
    full_name: 'E2E Smoke Zawodnik',
    gender: 'male',
    birth_year: 2000,
    weight_category: '73 kg',
    is_active: true
  },
  {
    id: 'e2e-athlete-compare-2',
    full_name: 'E2E Smoke Zawodniczka',
    gender: 'female',
    birth_year: 2001,
    weight_category: '64 kg',
    is_active: true
  }
] as const

function mockJson(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body)
  })
}

/** Mockuje GET `/api/public/athletes` w przeglądarce (CSR / lazy fetch). */
export async function setupPublicAthletesListMock(page: Page) {
  await page.route('**/api/public/athletes', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }
    await mockJson(route, E2E_PUBLIC_ATHLETES)
  })
}

/** Mockuje POST `/api/contact` — bez proxy do backendu. */
export async function setupContactPostMock(page: Page) {
  await page.route('**/api/contact', async (route) => {
    if (route.request().method() === 'POST') {
      await mockJson(route, { ok: true })
      return
    }
    await route.continue()
  })
}

/** Wypełnia formularz kontaktowy (UInput v-model — pressSequentially zamiast fill). */
export async function fillContactForm(page: Page) {
  const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Wyślij' }) })
  await expect(form).toBeVisible()

  const name = form.locator('input[autocomplete="name"]')
  const email = form.locator('input[autocomplete="email"]')
  const message = form.locator('textarea')

  await name.click()
  await name.pressSequentially('Smoke E2E', { delay: 10 })
  await email.click()
  await email.pressSequentially('smoke@example.com', { delay: 10 })
  await message.click()
  await message.pressSequentially('Test wiadomości smoke', { delay: 10 })

  await expect(name).toHaveValue('Smoke E2E')
  await expect(email).toHaveValue('smoke@example.com')
}
