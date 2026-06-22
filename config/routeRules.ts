import { KLUB_SHARED_ROUTES } from '../app/config/klubRoutes'
import { slaviaSecurityHeaders, withSecurityHeaders } from './securityHeaders'

/** Trasy panelu — CSR (SPA), bez SSR, bez prerenderu i bez cache CDN. */
export const panelNoStore = {
  ssr: false as const,
  prerender: false as const,
  headers: withSecurityHeaders({ 'cache-control': 'private, no-store' })
}

/** Publiczny BFF — krótki cache na Vercel (zgodny z ISR list). */
export const publicBffCache = {
  headers: withSecurityHeaders({
    'cache-control': 'public, s-maxage=60, stale-while-revalidate=300'
  })
}

/** Panelowy BFF — tylko prywatny cache przeglądarki (Bearer), bez współdzielonego CDN. */
export const panelBffCache = {
  headers: withSecurityHeaders({
    'cache-control': 'private, max-age=10, stale-while-revalidate=30',
    vary: 'Authorization'
  })
}

export function buildRouteRules(devDisableRootIsr: boolean) {
  return {
    '/**': { headers: { ...slaviaSecurityHeaders } },

    '/api/public/**': publicBffCache,
    '/api/panel/**': panelBffCache,

    '/': devDisableRootIsr ? { isr: false, prerender: true } : { isr: 600, prerender: true },

    '/zawodnicy': { isr: 900, prerender: true },
    '/zawodnicy/archiwum': { isr: 900, prerender: true },
    '/galeria': { isr: 1800, prerender: true },
    '/aktualnosci': { isr: 600, prerender: true },
    '/aktualnosci/**': { isr: 600 },
    '/kalendarz': { isr: 900, prerender: true },
    '/kalkulator-proporcji': { isr: 3600, prerender: true },
    '/klub/**': { isr: 900 },

    '/o-klubie': { isr: 900, prerender: true },
    '/kontakt': { isr: 3600, prerender: true },
    '/logowanie': { isr: 3600, prerender: true },
    '/banned': { isr: 3600, prerender: true },
    '/kalkulator-sinclair': { isr: 3600, prerender: true },
    '/kalkulator-max-pr': { isr: 3600, prerender: true },

    '/ogloszenia': { ...panelNoStore },
    '/klub': panelNoStore,
    '/klub/dokumenty/**': panelNoStore,
    [KLUB_SHARED_ROUTES.obecnosc]: panelNoStore,
    [KLUB_SHARED_ROUTES.czat]: panelNoStore,
    [KLUB_SHARED_ROUTES.powiadomienia]: panelNoStore,

    '/athlete/**': panelNoStore,
    '/trainer/**': panelNoStore,
    '/admin/**': panelNoStore,
    '/superadmin/**': panelNoStore
  } as const
}

