/** Trasy panelu zawodnika — CSR w routeRules. Bez publicznych profili `/athlete/*--uuid`. */
export const ATHLETE_PANEL_CSR_PATHS = [
  '/athlete',
  '/athlete/wyniki',
  '/athlete/wrapped',
  '/athlete/analiza-sztangi',
  '/athlete/timeline',
  '/athlete/dziennik',
  '/athlete/dziennik/redaguj',
  '/athlete/kalendarz',
  '/athlete/ai-coach',
  '/athlete/plany',
  '/athlete/exercises',
  '/athlete/regeneracja',
  '/athlete/skladki'
] as const
