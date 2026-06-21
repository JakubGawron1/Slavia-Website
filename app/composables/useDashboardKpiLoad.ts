import { fetchWithDashboardKpiRetry } from '~/utils/dashboardKpiLoadLogic'
import { apiFetchOrEmpty, type ApiFetchOrEmptyDeps } from '~/utils/apiFetchOrEmpty'

/**
 * Lekki helper do KPI na dashboardzie — śledzi dane, ładowanie i błąd sieci/API.
 * Zakres: pojedyncze fetch'e KPI (np. składka, frekwencja na /athlete).
 * Przy 502/503 (np. cold start HF): exponential backoff 1s → 2s, max 3 próby.
 */
export function useDashboardKpiLoad<T>(options?: {
  initialLoading?: boolean
  /** Toast PL po wyczerpaniu prób (domyślnie wyłączony). */
  toastOnFailure?: boolean
}) {
  const data = ref<T | null>(null)
  const loading = ref(options?.initialLoading ?? false)
  const failed = ref(false)
  const toast = options?.toastOnFailure ? useToast() : null
  const toastDeps: ApiFetchOrEmptyDeps | undefined = toast
    ? { addToast: (t) => toast.add(t) }
    : undefined

  async function refresh(fetcher: () => Promise<T>, refreshOptions?: { skip?: boolean }) {
    if (refreshOptions?.skip) {
      data.value = null
      failed.value = false
      loading.value = false
      return
    }

    loading.value = true
    failed.value = false
    const result = await apiFetchOrEmpty(
      () => fetchWithDashboardKpiRetry(fetcher),
      options?.toastOnFailure
        ? {
            toast: {
              title: 'KPI niedostępne',
              description: 'Serwer odpowiada z opóźnieniem. Spróbuj odświeżyć za chwilę.',
              color: 'warning'
            }
          }
        : undefined,
      toastDeps
    )
    data.value = result
    failed.value = result === null
    loading.value = false
  }

  return { data, loading, failed, refresh }
}
