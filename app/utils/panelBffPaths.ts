/** Kanoniczne GET-y panelu obsługiwane przez BFF `/api/panel/*` (whitelist po stronie serwera). */
export const PANEL_BFF_GET_PATHS = [
  '/api/athletes/me/dashboard',
  '/api/trainer/dashboard'
] as const

export type PanelBffGetPath = (typeof PANEL_BFF_GET_PATHS)[number]

export function isPanelBffPath(pathOrUrl: string): boolean {
  const path = pathOrUrl.split('?')[0] ?? pathOrUrl
  return (PANEL_BFF_GET_PATHS as readonly string[]).includes(path)
}

/** `/api/athletes/me/dashboard` → `/api/panel/athletes/me/dashboard` */
export function panelApiUrl(apiPath: string): string {
  const normalized = apiPath.replace(/^\/?api\//, '').replace(/^\//, '')
  return `/api/panel/${normalized}`
}
