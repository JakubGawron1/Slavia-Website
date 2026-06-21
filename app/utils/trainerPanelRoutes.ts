import { panelNavNormalizePath } from '~/data/panelNavigationCatalog'

const TRAINER_PANEL_PRIMARY_PATHS = [
  '/trainer',
  '/trainer/wyniki',
  '/trainer/zawodnicy',
  '/trainer/skladki'
] as const

/** Trasy panelu trenera (`/trainer/**`). */
export function isTrainerPanelRoute(path: string): boolean {
  const normalized = panelNavNormalizePath(path)
  return normalized === '/trainer' || normalized.startsWith('/trainer/')
}

export function isTrainerMobileNavPrimaryRoute(path: string): boolean {
  const normalized = panelNavNormalizePath(path)
  return (TRAINER_PANEL_PRIMARY_PATHS as readonly string[]).includes(normalized)
}

/** Aktywna zakładka „Więcej” — pozostałe moduły panelu poza czterema skrótami. */
export function isTrainerMobileNavMoreRoute(path: string): boolean {
  if (!isTrainerPanelRoute(path)) return false
  const normalized = panelNavNormalizePath(path)
  if (normalized === '/trainer') return false
  return !isTrainerMobileNavPrimaryRoute(normalized)
}

export const TRAINER_MOBILE_NAV_ROUTES = TRAINER_PANEL_PRIMARY_PATHS
