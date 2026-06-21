import { getApiDetailedErrorMessage } from '~/composables/useApi'

export type ApiFetchOrEmptyToast = {
  title: string
  description?: string
  color?: 'warning' | 'error' | 'info' | 'success' | 'primary' | 'neutral'
}

export type ApiFetchOrEmptyOptions<T> = {
  /** Wartość przy błędzie (domyślnie `null`). */
  fallback?: T
  /** Toast po błędzie: `true` = domyślny komunikat, obiekt = własny, brak = cicho. */
  toast?: boolean | ApiFetchOrEmptyToast
}

export type ApiFetchOrEmptyDeps = {
  addToast?: (toast: ApiFetchOrEmptyToast) => void
  getErrorMessage?: (error: unknown) => string
}

const DEFAULT_TOAST: ApiFetchOrEmptyToast = {
  title: 'Brak danych',
  description: 'Nie udało się pobrać danych z serwera.',
  color: 'warning'
}

/**
 * Wykonuje fetch API; przy błędzie zwraca `fallback` (domyślnie `null`) zamiast rzucać.
 * Opcjonalny toast — centralizacja wzorca zamiast `.catch(() => null)`.
 */
export async function apiFetchOrEmpty<T>(
  fetcher: () => Promise<T>,
  options?: ApiFetchOrEmptyOptions<T | null>,
  deps?: ApiFetchOrEmptyDeps
): Promise<T | null> {
  try {
    return await fetcher()
  } catch (error) {
    const toastOpt = options?.toast
    if (toastOpt && deps?.addToast) {
      const base = toastOpt === true ? DEFAULT_TOAST : { ...DEFAULT_TOAST, ...toastOpt }
      const description = toastOpt === true
        ? (deps.getErrorMessage?.(error) ?? base.description)
        : (base.description ?? deps.getErrorMessage?.(error))
      deps.addToast({ ...base, description })
    }
    return (options?.fallback ?? null) as T | null
  }
}

export function createApiFetchOrEmptyDeps(
  addToast: (toast: ApiFetchOrEmptyToast) => void
): ApiFetchOrEmptyDeps {
  return {
    addToast,
    getErrorMessage: getApiDetailedErrorMessage
  }
}
