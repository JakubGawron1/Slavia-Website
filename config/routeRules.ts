import {
  KLUB_LEGACY_REDIRECTS,
  KLUB_SHARED_ROUTES,
  KLUB_TO_PUBLIC_REDIRECTS
} from '../app/config/klubRoutes'

/** Trasy panelu — CSR (SPA), bez SSR, bez prerenderu i bez cache CDN. */
export const panelNoStore = {
  ssr: false as const,
  prerender: false as const,
  headers: { 'cache-control': 'private, no-store' }
}

const redirect301 = (entries: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(entries).map(([from, to]) => [
      from,
      { redirect: { to, statusCode: 301 as const } }
    ])
  )

/** Publiczny BFF — krótki cache na Vercel (zgodny z ISR list). */
export const publicBffCache = {
  headers: {
    'cache-control': 'public, s-maxage=60, stale-while-revalidate=300'
  }
}

export function buildRouteRules(devDisableRootIsr: boolean) {
  return {
    '/api/public/**': publicBffCache,
    '/api/ai/public/**': panelNoStore,

    '/': devDisableRootIsr ? { isr: false, prerender: true } : { isr: 600, prerender: true },

    ...redirect301(KLUB_LEGACY_REDIRECTS),
    ...redirect301(KLUB_TO_PUBLIC_REDIRECTS),
    '/klub/aktualnosci/**': { redirect: { to: '/aktualnosci/**', statusCode: 301 } },

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
    [KLUB_SHARED_ROUTES.obecnosc]: panelNoStore,
    [KLUB_SHARED_ROUTES.czat]: panelNoStore,
    [KLUB_SHARED_ROUTES.powiadomienia]: panelNoStore,

    '/athlete/**': panelNoStore,
    '/trainer/**': panelNoStore,
    '/admin/**': panelNoStore,
    '/superadmin/**': panelNoStore,
    '/profil': panelNoStore,
    '/dziennik': panelNoStore
  } as const
}
