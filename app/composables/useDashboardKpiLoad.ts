import { fetchWithDashboardKpiRetry } from '~/utils/dashboardKpiLoadLogic'

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

  async function refresh(fetcher: () => Promise<T>, refreshOptions?: { skip?: boolean }) {
    if (refreshOptions?.skip) {
      data.value = null
      failed.value = false
      loading.value = false
      return
    }

    loading.value = true
    failed.value = false
    try {
      data.value = await fetchWithDashboardKpiRetry(fetcher)
    } catch {
      data.value = null
      failed.value = true
      toast?.add({
        title: 'KPI niedostępne',
        description: 'Serwer odpowiada z opóźnieniem. Spróbuj odświeżyć za chwilę.',
        color: 'warning'
      })
    } finally {
      loading.value = false
    }
  }

  return { data, loading, failed, refresh }
}
