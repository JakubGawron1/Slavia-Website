import type { AthleteDashboardResponse } from '~/types/models'

/** localStorage prefix — pełny klucz: `{prefix}_{userId}`. */
export const ATHLETE_DASHBOARD_CACHE_KEY_PREFIX = 'slavia_athlete_dashboard_v1'

/** Po tym czasie wpis jest usuwany i nie pokazujemy go jako stale (24 h). */
export const ATHLETE_DASHBOARD_CACHE_TTL_MS = 24 * 60 * 60 * 1000

export type AthleteDashboardCacheEntry = {
  fetchedAt: number
  userId: string
  paymentMonth: string
  data: AthleteDashboardResponse
}

export function athleteDashboardCacheKey(userId: string): string {
  return `${ATHLETE_DASHBOARD_CACHE_KEY_PREFIX}_${userId}`
}

function parseEntry(raw: string): AthleteDashboardCacheEntry | null {
  try {
    const entry = JSON.parse(raw) as AthleteDashboardCacheEntry
    if (
      !entry
      || typeof entry.fetchedAt !== 'number'
      || typeof entry.userId !== 'string'
      || typeof entry.paymentMonth !== 'string'
      || !entry.data
    ) {
      return null
    }
    if (Date.now() - entry.fetchedAt > ATHLETE_DASHBOARD_CACHE_TTL_MS) {
      return null
    }
    return entry
  } catch {
    return null
  }
}

/** Odczyt cache dla zalogowanego zawodnika (weryfikacja userId + miesiąc składki). */
export function readAthleteDashboardCache(
  userId: string,
  paymentMonth: string
): AthleteDashboardCacheEntry | null {
  if (!import.meta.client || !userId) return null
  try {
    const raw = localStorage.getItem(athleteDashboardCacheKey(userId))
    if (!raw) return null
    const entry = parseEntry(raw)
    if (!entry || entry.userId !== userId || entry.paymentMonth !== paymentMonth) {
      return null
    }
    return entry
  } catch {
    return null
  }
}

/**
 * Najświeższy wpis cache dla danego miesiąca — używany przed hydracją auth (SWR).
 * Po `ensureSession` porównaj `entry.userId` z kontem.
 */
export function peekAthleteDashboardCache(paymentMonth: string): AthleteDashboardCacheEntry | null {
  if (!import.meta.client) return null
  let best: AthleteDashboardCacheEntry | null = null
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(`${ATHLETE_DASHBOARD_CACHE_KEY_PREFIX}_`)) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const entry = parseEntry(raw)
      if (!entry || entry.paymentMonth !== paymentMonth) continue
      if (!best || entry.fetchedAt > best.fetchedAt) {
        best = entry
      }
    }
  } catch {
    return null
  }
  return best
}

export function writeAthleteDashboardCache(
  userId: string,
  paymentMonth: string,
  data: AthleteDashboardResponse
): void {
  if (!import.meta.client || !userId) return
  const entry: AthleteDashboardCacheEntry = {
    fetchedAt: Date.now(),
    userId,
    paymentMonth,
    data
  }
  try {
    localStorage.setItem(athleteDashboardCacheKey(userId), JSON.stringify(entry))
  } catch {
    /* ignore (quota / private mode) */
  }
}

/** Usuwa cache dashboardu — przy logout bez userId czyści wszystkie wpisy zawodnika. */
export function clearAthleteDashboardCache(userId?: string): void {
  if (!import.meta.client) return
  try {
    if (userId) {
      localStorage.removeItem(athleteDashboardCacheKey(userId))
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

/** Tylko właściciel konta z rolą Athlete — bez podglądu SA (prywatność). */
export function canPersistAthleteDashboardCache(
  isAthlete: boolean,
  isRolePreviewActive: boolean,
  userId: string | undefined | null
): boolean {
  return !!userId && isAthlete && !isRolePreviewActive
}
