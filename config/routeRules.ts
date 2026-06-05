/** Trasy panelu — CSR (SPA), bez SSR, bez prerenderu i bez cache CDN. */
export const panelNoStore = {
  ssr: false as const,
  prerender: false as const,
  headers: { 'cache-control': 'private, no-store' }
}

/** Publiczny BFF — krótki cache na Vercel (zgodny z ISR list). */
export const publicBffCache = {
  headers: {
    'cache-control': 'public, s-maxage=60, stale-while-revalidate=300'
  }
}

export function buildRouteRules(devDisableRootIsr: boolean) {
  return {
    '/api/public/**': publicBffCache,

    '/': devDisableRootIsr ? { isr: false, prerender: true } : { isr: 600, prerender: true },
    '/zawodnicy': { isr: 900, prerender: true },
    '/zawodnicy/archiwum': { isr: 900, prerender: true },
    '/galeria': { isr: 1800, prerender: true },
    '/aktualnosci': { isr: 600, prerender: true },
    '/aktualnosci/**': { isr: 600 },
    '/klub/**': { isr: 900 },

    '/kalendarz': { isr: 900, prerender: true },
    '/kontakt': { prerender: true },
    '/logowanie': { prerender: true },
    '/banned': { prerender: true },
    '/kalkulator-proporcji': { prerender: true },
    '/kalkulator-sinclair': { prerender: true },
    '/kalkulator-max-pr': { prerender: true },

    '/ogloszenia': { ...panelNoStore },

    '/athlete/**': panelNoStore,
    '/trainer/**': panelNoStore,
    '/admin/**': panelNoStore,
    '/superadmin/**': panelNoStore,
    '/chat': panelNoStore,
    '/profil': panelNoStore,
    '/attendance': panelNoStore,
    '/powiadomienia': panelNoStore,
    '/dziennik': panelNoStore
  } as const
}
