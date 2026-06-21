import type { BrowserContext, Page, Route } from '@playwright/test'

/** Token używany wyłącznie w smoke E2E — backend jest mockowany w przeglądarce. */
export const E2E_ATHLETE_TOKEN = 'e2e-smoke-athlete-token'

export const E2E_ATHLETE_MOCK = {
  userId: 'e2e-user-athlete',
  athleteId: 'e2e-athlete-1',
  username: 'e2e.athlete',
  fullName: 'Smoke Zawodnik'
} as const

function paymentMonthIso(): string {
  return new Date().toISOString().slice(0, 7)
}

function buildAthleteDashboardMock() {
  const paymentMonth = paymentMonthIso()
  const { userId, athleteId, fullName } = E2E_ATHLETE_MOCK

  return {
    athlete: {
      id: athleteId,
      user_id: userId,
      full_name: fullName,
      is_active: true,
      birth_year: 2000,
      gender: 'male'
    },
    pending_results_count: 0,
    calendar_entries: [],
    attendance_summary: {
      athlete_id: athleteId,
      present_count: 12,
      absent_count: 2,
      pending_count: 0,
      attendance_percent: 86
    },
    payment_status: {
      month: paymentMonth,
      due_date: `${paymentMonth}-10`,
      is_paid: true,
      is_overdue: false,
      has_standing_order: false
    }
  }
}

function isMockedBackendPath(pathname: string): boolean {
  if (pathname === '/api/auth/me') return true
  if (pathname === '/api/athletes/me/dashboard') return true
  if (pathname === '/api/athletes') return true
  if (pathname === '/api/system/mobile-releases/latest') return true
  if (pathname.startsWith('/api/system/feature-flags')) return true
  return false
}

function mockJsonResponse(route: Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body)
  })
}

/** Mockuje wywołania Rust API w przeglądarce (panel `/athlete` ma `ssr: false`). */
export async function setupAthleteDashboardMocks(page: Page) {
  const { userId, athleteId, username, fullName } = E2E_ATHLETE_MOCK

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const method = route.request().method()

    if (method !== 'GET' || !isMockedBackendPath(path)) {
      await route.continue()
      return
    }

    if (path === '/api/auth/me') {
      await mockJsonResponse(route, {
        id: userId,
        username,
        roles: ['Athlete'],
        is_banned: false,
        banned_reason: null,
        athlete_id: athleteId,
        athlete_full_name: fullName
      })
      return
    }

    if (path === '/api/athletes/me/dashboard') {
      await mockJsonResponse(route, buildAthleteDashboardMock())
      return
    }

    if (path === '/api/athletes') {
      await mockJsonResponse(route, [])
      return
    }

    if (path === '/api/system/mobile-releases/latest') {
      await mockJsonResponse(route, null)
      return
    }

    if (path.startsWith('/api/system/feature-flags')) {
      await mockJsonResponse(route, [])
      return
    }

    await route.continue()
  })
}

export async function seedAthleteSession(context: BrowserContext, baseURL: string) {
  await context.addCookies([
    {
      name: 'slavia_token',
      value: E2E_ATHLETE_TOKEN,
      url: baseURL
    }
  ])
}

/** Wyłącza onboarding i inne overlaye lokalne, które mogą zasłaniać dashboard. */
export async function dismissAthleteDashboardOverlays(page: Page) {
  const onboardingKey = `slavia-onboarding-athlete-v1-${E2E_ATHLETE_MOCK.userId}`
  await page.addInitScript((key: string) => {
    try {
      localStorage.setItem(key, '1')
      localStorage.setItem('slavia_onboarding_athlete_v1_done', '1')
      localStorage.setItem('slavia_hide_payment_reminder', '1')
    } catch {
      /* ignore */
    }
  }, onboardingKey)
}
