import { KLUB_BOARD_ROUTES, KLUB_SHARED_ROUTES } from '../app/config/klubRoutes'

import { withSecurityHeaders } from './securityHeaders'



/** Trasy panelu — CSR (SPA), bez SSR i bez cache CDN. */

export const panelNoStore = {

  ssr: false as const,

  prerender: false as const,

  headers: withSecurityHeaders({ 'cache-control': 'private, no-store' })

}



/** Publiczny BFF — bez cache CDN (dane zawsze świeże z HF). */

export const publicBffNoStore = {

  headers: withSecurityHeaders({

    'cache-control': 'private, no-store'

  })

}



/** Panelowy BFF — tylko prywatny cache przeglądarki (Bearer), bez współdzielonego CDN. */

export const panelBffCache = {

  headers: withSecurityHeaders({

    'cache-control': 'private, max-age=10, stale-while-revalidate=30',

    vary: 'Authorization'

  })

}



export function buildRouteRules() {

  return {

    /** Domyślnie: SSR, bez cache edge Vercel (publiczne strony dynamiczne w tym). */

    '/**': {

      headers: withSecurityHeaders({ 'cache-control': 'private, no-store' })

    },



    '/api/public/**': publicBffNoStore,

    '/api/panel/**': panelBffCache,



    '/ogloszenia': panelNoStore,

    '/klub': panelNoStore,

    [KLUB_BOARD_ROUTES.dokumenty]: panelNoStore,

    [KLUB_BOARD_ROUTES.generator]: panelNoStore,

    [KLUB_BOARD_ROUTES.typy]: panelNoStore,

    '/klub/dokumenty/**': panelNoStore,

    [KLUB_SHARED_ROUTES.obecnosc]: panelNoStore,

    [KLUB_SHARED_ROUTES.czat]: panelNoStore,

    [KLUB_SHARED_ROUTES.powiadomienia]: panelNoStore,

    [KLUB_SHARED_ROUTES.samouczek]: panelNoStore,



    '/athlete/**': panelNoStore,

    '/trainer/**': panelNoStore,

    '/admin/**': panelNoStore,

    '/superadmin/**': panelNoStore

  } as const
}

