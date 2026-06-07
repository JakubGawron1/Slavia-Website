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
  feed: '/klub/feed'
} as const

/** Trasy /klub/ wymagające logowania (CSR, no-store). */
export const KLUB_AUTH_PATHS = [
  KLUB_SHARED_ROUTES.obecnosc,
  KLUB_SHARED_ROUTES.czat,
  KLUB_SHARED_ROUTES.powiadomienia
] as const
