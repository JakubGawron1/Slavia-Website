import { panelNavNormalizePath } from '~/data/panelNavigationCatalog'

const ATHLETE_PANEL_PRIMARY_PATHS = [
  '/athlete',
  '/athlete/wyniki',
  '/athlete/kalendarz',
  '/athlete/skladki'
] as const

/** Publiczny profil `/athlete/imie-nazwisko--uuid` — nie panel zalogowanego zawodnika. */
export function isAthletePublicProfileRoute(path: string): boolean {
  const normalized = panelNavNormalizePath(path)
  if (!normalized.startsWith('/athlete/')) return false
  const segments = normalized.slice('/athlete/'.length).split('/').filter(Boolean)
  if (segments.length !== 1) return false
  return segments[0]!.includes('--')
}

/** Trasy panelu zawodnika (`/athlete/**`), bez publicznych profili. */
export function isAthletePanelRoute(path: string): boolean {
  const normalized = panelNavNormalizePath(path)
  if (normalized === '/athlete') return true
  if (!normalized.startsWith('/athlete/')) return false
  return !isAthletePublicProfileRoute(normalized)
}

export function isAthleteMobileNavPrimaryRoute(path: string): boolean {
  const normalized = panelNavNormalizePath(path)
  return (ATHLETE_PANEL_PRIMARY_PATHS as readonly string[]).includes(normalized)
}

/** Aktywna zakładka „Więcej” — pozostałe moduły panelu poza czterema skrótami. */
export function isAthleteMobileNavMoreRoute(path: string): boolean {
  if (!isAthletePanelRoute(path)) return false
  const normalized = panelNavNormalizePath(path)
  if (normalized === '/athlete') return false
  return !isAthleteMobileNavPrimaryRoute(normalized)
}

export const ATHLETE_MOBILE_NAV_ROUTES = ATHLETE_PANEL_PRIMARY_PATHS
