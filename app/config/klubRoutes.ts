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
  rekordy: '/klub/rekordy'
} as const

/** Trasy /klub/ wymagające logowania (CSR, no-store). */
export const KLUB_AUTH_PATHS = [
  KLUB_SHARED_ROUTES.obecnosc,
  KLUB_SHARED_ROUTES.czat,
  KLUB_SHARED_ROUTES.powiadomienia
] as const

/** Stare ścieżki panelowe → /klub/ (301). */
export const KLUB_LEGACY_REDIRECTS: Record<string, string> = {
  '/attendance': KLUB_SHARED_ROUTES.obecnosc,
  '/chat': KLUB_SHARED_ROUTES.czat,
  '/powiadomienia': KLUB_SHARED_ROUTES.powiadomienia
}

/** Po migracji: /klub/* publiczne → korzeń (301, zakładki). */
export const KLUB_TO_PUBLIC_REDIRECTS: Record<string, string> = {
  '/klub/kalendarz': PUBLIC_ROUTES.kalendarz,
  '/klub/galeria': PUBLIC_ROUTES.galeria,
  '/klub/ogloszenia': PUBLIC_ROUTES.ogloszenia,
  '/klub/aktualnosci': PUBLIC_ROUTES.aktualnosci,
  '/klub/zawodnicy': PUBLIC_ROUTES.zawodnicy,
  '/klub/zawodnicy/archiwum': `${PUBLIC_ROUTES.zawodnicy}/archiwum`,
  '/klub/zawodnicy/porownanie': `${PUBLIC_ROUTES.zawodnicy}/porownanie`,
  '/klub/kalkulator-proporcji': PUBLIC_ROUTES.proporcje
}
