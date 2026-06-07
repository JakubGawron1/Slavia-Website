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
    '/api/ai/public/**': panelNoStore,

    '/': devDisableRootIsr ? { isr: false, prerender: true } : { isr: 600, prerender: true },
    '/zawodnicy': { isr: 900, prerender: true },
    '/zawodnicy/archiwum': { isr: 900, prerender: true },
    '/galeria': { isr: 1800, prerender: true },
    '/aktualnosci': { isr: 600, prerender: true },
    '/aktualnosci/**': { isr: 600 },
    '/klub/**': { isr: 900 },

    '/kalendarz': { isr: 900, prerender: true },
    '/o-klubie': { isr: 900, prerender: true },
    '/kontakt': { isr: 3600, prerender: true },
    '/logowanie': { isr: 3600, prerender: true },
    '/banned': { isr: 3600, prerender: true },
    '/kalkulator-proporcji': { isr: 3600, prerender: true },
    '/kalkulator-sinclair': { isr: 3600, prerender: true },
    '/kalkulator-max-pr': { isr: 3600, prerender: true },

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
