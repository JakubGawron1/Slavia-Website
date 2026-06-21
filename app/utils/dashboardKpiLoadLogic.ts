/** Opóźnienia backoff (ms) przed kolejną próbą po 502/503 — 1s, 2s, 4s. */
export const DASHBOARD_KPI_RETRY_DELAYS_MS = [1_000, 2_000, 4_000] as const

export const DASHBOARD_KPI_MAX_ATTEMPTS = 3

export function isDashboardKpiRetryableError(error: unknown): boolean {
  const err = error as { response?: { status?: number }, statusCode?: number }
  const status = err?.response?.status ?? err?.statusCode
  return status === 502 || status === 503
}

export type DashboardKpiFetchRetryOptions = {
  maxAttempts?: number
  delaysMs?: readonly number[]
  sleep?: (ms: number) => Promise<void>
}

export async function fetchWithDashboardKpiRetry<T>(
  fetcher: () => Promise<T>,
  options?: DashboardKpiFetchRetryOptions
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? DASHBOARD_KPI_MAX_ATTEMPTS
  const delaysMs = options?.delaysMs ?? DASHBOARD_KPI_RETRY_DELAYS_MS
  const sleep = options?.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)))

  let lastError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fetcher()
    } catch (error) {
      lastError = error
      const canRetry = isDashboardKpiRetryableError(error) && attempt + 1 < maxAttempts
      if (!canRetry) {
        throw error
      }
      await sleep(delaysMs[attempt] ?? delaysMs[delaysMs.length - 1]!)
    }
  }

  throw lastError
}
