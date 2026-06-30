/** localStorage prefix — legacy wpisy czyszczone przy logout. */
export const ATHLETE_DASHBOARD_CACHE_KEY_PREFIX = 'slavia_athlete_dashboard_v1'

/** Usuwa zapisane wpisy dashboardu zawodnika (migracja po wyłączeniu cache API). */
export function clearAthleteDashboardCache(userId?: string): void {
  if (!import.meta.client) return
  try {
    if (userId) {
      localStorage.removeItem(`${ATHLETE_DASHBOARD_CACHE_KEY_PREFIX}_${userId}`)
      return
    }
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(`${ATHLETE_DASHBOARD_CACHE_KEY_PREFIX}_`)) {
        keys.push(key)
      }
    }
    for (const key of keys) {
      localStorage.removeItem(key)
    }
  } catch {
    /* ignore */
  }
}
