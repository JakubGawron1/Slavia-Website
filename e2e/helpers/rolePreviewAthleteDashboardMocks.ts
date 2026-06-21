import type { BrowserContext, Page, Route } from '@playwright/test'
import {
  buildAthleteDashboardMockBody,
  dismissAthleteDashboardOverlays,
  mockJsonResponse
} from './athleteDashboardMocks'

/** Token SuperAdmin — backend mockowany w przeglądarce. */
export const E2E_SUPERADMIN_TOKEN = 'e2e-smoke-superadmin-token'

export const E2E_SUPERADMIN_MOCK = {
  userId: 'e2e-user-superadmin',
  username: 'e2e.superadmin'
} as const

/** Konto zawodnika podglądane przez SuperAdmin (nie to samo co konto SA). */
export const E2E_PREVIEW_TARGET = {
  userId: 'e2e-target-athlete-user',
  athleteId: 'e2e-target-athlete-1',
  username: 'preview.target',
  fullName: 'Podgląd Cel Zawodnik'
} as const

const ROLE_PREVIEW_LS_KEY = 'slavia_role_preview_v1'

function buildRolePreviewAthleteDashboardMock() {
  return buildAthleteDashboardMockBody({
    userId: E2E_PREVIEW_TARGET.userId,
    athleteId: E2E_PREVIEW_TARGET.athleteId,
    fullName: E2E_PREVIEW_TARGET.fullName
  })
}

function rolePreviewAthleteDashboardPath(): string {
  return `/api/system/role-preview/athlete-dashboard/${encodeURIComponent(E2E_PREVIEW_TARGET.userId)}`
}

function isRolePreviewDashboardRequest(path: string, previewHeader: string | undefined): boolean {
  return previewHeader === E2E_PREVIEW_TARGET.userId
    && (path === '/api/panel/athletes/me/dashboard' || path === rolePreviewAthleteDashboardPath())
}

function isMockedRolePreviewPath(pathname: string): boolean {
  if (pathname === '/api/auth/me') return true
  if (pathname === '/api/panel/athletes/me/dashboard') return true
  if (pathname === rolePreviewAthleteDashboardPath()) return true
  if (pathname === '/api/athletes') return true
  if (pathname === '/api/system/mobile-releases/latest') return true
  if (pathname.startsWith('/api/system/feature-flags')) return true
  return false
}

/** Mockuje BFF panelu + przepisane endpointy role-preview (SuperAdmin read-only). */
export async function setupRolePreviewAthleteDashboardMocks(page: Page) {
  const previewDashboardPath = rolePreviewAthleteDashboardPath()

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const method = route.request().method()
    const previewHeader = route.request().headers()['x-slavia-role-preview']

    if (method !== 'GET' || !isMockedRolePreviewPath(path)) {
      await route.continue()
      return
    }

    if (path === '/api/auth/me') {
      await mockJsonResponse(route, {
        id: E2E_SUPERADMIN_MOCK.userId,
        username: E2E_SUPERADMIN_MOCK.username,
        roles: ['SuperAdmin'],
        is_banned: false,
        banned_reason: null,
        athlete_id: null,
        athlete_full_name: null
      })
      return
    }

    if (isRolePreviewDashboardRequest(path, previewHeader) || path === previewDashboardPath) {
      await mockJsonResponse(route, buildRolePreviewAthleteDashboardMock())
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

export async function seedRolePreviewAthleteSession(context: BrowserContext, baseURL: string) {
  await context.addCookies([
    {
      name: 'slavia_token',
      value: E2E_SUPERADMIN_TOKEN,
      url: baseURL
    }
  ])
}

/** Stan podglądu w sessionStorage (hydracja `useRolePreviewState`). */
export async function seedRolePreviewState(page: Page) {
  const state = {
    targetUserId: E2E_PREVIEW_TARGET.userId,
    targetUsername: E2E_PREVIEW_TARGET.username,
    previewRole: 'Athlete',
    athleteId: E2E_PREVIEW_TARGET.athleteId,
    athleteName: E2E_PREVIEW_TARGET.fullName,
    startedAt: new Date().toISOString()
  }

  await page.addInitScript(({ key, json }: { key: string, json: string }) => {
    try {
      sessionStorage.setItem(key, json)
    } catch {
      /* ignore */
    }
  }, { key: ROLE_PREVIEW_LS_KEY, json: JSON.stringify(state) })
}

export async function dismissRolePreviewAthleteOverlays(page: Page) {
  await dismissAthleteDashboardOverlays(page)
}
