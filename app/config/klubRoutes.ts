/**
 * Publiczne strony klubu — kanoniczne URL-e w korzeniu (SEO, nawigacja www).
 */
export const PUBLIC_ROUTES = {
  kalendarz: '/kalendarz',
  aktualnosci: '/aktualnosci',
  zawodnicy: '/zawodnicy',
  galeria: '/galeria',
  proporcje: '/kalkulator-proporcji',
  ogloszenia: '/ogloszenia'
} as const

/**
 * Moduły współdzielone między rolami — sekcja /klub/ (wymagają logowania lub community).
 */
export const KLUB_SHARED_ROUTES = {
  obecnosc: '/klub/obecnosc',
  czat: '/klub/czat',
  powiadomienia: '/klub/powiadomienia',
  wyzwania: '/klub/wyzwania',
  rekordy: '/klub/rekordy',
  samouczek: '/klub/samouczek'
} as const

/** Moduły dokumentów zarządu — repozytorium Slavia-cms (`board/`). */
export const KLUB_BOARD_ROUTES = {
  dokumenty: '/klub/dokumenty',
  generator: '/klub/dokumenty/generator',
  typy: '/klub/dokumenty/typy'
} as const

/** Trasy /klub/ wymagające logowania (CSR, no-store). */
export const KLUB_AUTH_PATHS = [
  KLUB_SHARED_ROUTES.obecnosc,
  KLUB_SHARED_ROUTES.czat,
  KLUB_SHARED_ROUTES.powiadomienia,
  KLUB_SHARED_ROUTES.samouczek,
  KLUB_BOARD_ROUTES.dokumenty,
  KLUB_BOARD_ROUTES.generator,
  KLUB_BOARD_ROUTES.typy
] as const

export function normalizeKlubPath(path: string): string {
  const p = path.split('?')[0]?.split('#')[0] ?? path
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1)
  return p
}

/** Trasy sterowane flagą eksperymentalną `club_hub` (devtools, domyślnie wyłączone). */
export function isClubHubExperimentalPath(path: string): boolean {
  const normalized = normalizeKlubPath(path)
  if (normalized === '/klub') return true
  if (normalized.startsWith('/klub/dokumenty')) return true
  if (normalized === KLUB_SHARED_ROUTES.samouczek) return true
  return false
}

