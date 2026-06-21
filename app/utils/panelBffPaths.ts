/** Kanoniczne GET-y panelu obsługiwane przez BFF `/api/panel/*` (whitelist po stronie serwera). */
const ATHLETE_UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

export const PANEL_BFF_GET_PATHS = [
  '/api/athletes/me/dashboard',
  '/api/trainer/dashboard',
  '/api/payments/my/status'
] as const

/** Wzorce GET (np. UUID zawodnika) — ACL weryfikowany po stronie backendu. */
export const PANEL_BFF_GET_PATTERNS: RegExp[] = [
  new RegExp(`^/api/attendance/summary/${ATHLETE_UUID}$`, 'i')
]

export type PanelBffGetPath = (typeof PANEL_BFF_GET_PATHS)[number]

export function isPanelBffPath(pathOrUrl: string): boolean {
  const path = pathOrUrl.split('?')[0] ?? pathOrUrl
  if ((PANEL_BFF_GET_PATHS as readonly string[]).includes(path)) return true
  return PANEL_BFF_GET_PATTERNS.some(re => re.test(path))
}

/** `/api/athletes/me/dashboard` → `/api/panel/athletes/me/dashboard` */
export function panelApiUrl(apiPath: string): string {
  const normalized = apiPath.replace(/^\/?api\//, '').replace(/^\//, '')
  return `/api/panel/${normalized}`
}
