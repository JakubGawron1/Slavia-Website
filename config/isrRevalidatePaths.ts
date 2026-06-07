import { prerenderRoutes } from './prerender'

/**
 * Trasy publiczne z ISR (routeRules) — on-demand revalidate przez nagłówek
 * `x-prerender-revalidate` (Vercel + Nitro bypassToken). Purge używa GET (nie HEAD).
 *
 * Utrzymuj spójnie z `config/routeRules.ts` i `config/prerender.ts`.
 * Strony tylko `prerender` bez `isr` ignorują bypass — dodaj `isr` w routeRules.
 */
export const ISR_REVALIDATE_PATHS: readonly string[] = [
  ...prerenderRoutes,
  '/klub/rekordy',
  '/banned'
]

/** Publiczny BFF — krótki CDN cache (s-maxage=60); odświeżenie po stronie origin. */
export const PUBLIC_BFF_REVALIDATE_PATHS: readonly string[] = [
  '/api/public/athletes',
  '/api/public/athletes/archive',
  '/api/public/posts',
  '/api/public/gallery',
  '/api/public/competitions',
  '/api/public/results/public-board',
  '/api/public/results/public-board-olympic',
  '/api/public/cms/variables',
  '/api/public/cms/navigation',
  '/api/public/challenges/monthly-training-sessions'
]

export const ALL_VERCEL_CACHE_PURGE_PATHS: readonly string[] = [
  ...ISR_REVALIDATE_PATHS,
  ...PUBLIC_BFF_REVALIDATE_PATHS
]
