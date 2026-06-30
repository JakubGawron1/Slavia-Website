import { KLUB_BOARD_ROUTES, KLUB_SHARED_ROUTES } from '../app/config/klubRoutes'

import { ATHLETE_PANEL_CSR_PATHS } from '../config/athletePanelCsrPaths'



import { withSecurityHeaders } from './securityHeaders'



/** Trasy panelu — CSR (SPA), bez SSR i bez cache CDN. */

export const panelNoStore = {

  ssr: false as const,

  prerender: false as const,

  headers: withSecurityHeaders({ 'cache-control': 'private, no-store' })

}



const apiNoStore = {

  headers: withSecurityHeaders({

    'cache-control': 'private, no-store'

  })

}



/** Publiczny BFF — bez cache (dane zawsze świeże z HF). */

export const publicBffNoStore = apiNoStore



/** Panelowy BFF — bez cache przeglądarki (Bearer). */

export const panelBffNoStore = apiNoStore



const athletePanelRouteRules = Object.fromEntries(
  ATHLETE_PANEL_CSR_PATHS.map(path => [path, panelNoStore])
) as Record<string, typeof panelNoStore>

export function buildRouteRules() {

  return {

    /** Domyślnie: SSR, bez cache edge Vercel (publiczne strony dynamiczne w tym). */

    '/**': {

      headers: withSecurityHeaders({ 'cache-control': 'private, no-store' })

    },



    '/api/public/**': publicBffNoStore,

    '/api/auth/**': panelBffNoStore,

    '/api/panel/**': panelBffNoStore,



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



    ...athletePanelRouteRules,

    '/trainer/**': panelNoStore,

    '/admin/**': panelNoStore,

    '/superadmin/**': panelNoStore

  } as const

}


