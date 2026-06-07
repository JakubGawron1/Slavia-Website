import { getApiDetailedErrorMessage, getApiErrorMessage } from '~/composables/useApi'

export type VercelCacheStatus = {
  configured: boolean
  on_vercel: boolean
  site_origin: string
  isr_path_count: number
  total_path_count: number
}

export type VercelCachePurgeResult = {
  origin: string
  okCount: number
  failCount: number
  path_count: number
  scope: string
  at: string
  results: { path: string, ok: boolean, status?: number, error?: string }[]
}

export function useDeveloperVercelCache() {
  const auth = useAuth()
  const toast = useToast()

  const vercelCacheStatus = ref<VercelCacheStatus | null>(null)
  const vercelCacheStatusLoading = ref(false)
  const vercelCachePurgeRunning = ref(false)
  const vercelCachePurgeLastResult = ref<VercelCachePurgeResult | null>(null)

  async function refreshVercelCacheStatus() {
    if (!auth.token.value) {
      return
    }
    vercelCacheStatusLoading.value = true
    try {
      vercelCacheStatus.value = await $fetch<VercelCacheStatus>('/api/system/vercel-cache/status', {
        headers: { Authorization: `Bearer ${auth.token.value}` }
      })
    } catch (e) {
      toast.add({
        title: 'Status cache Vercel niedostępny',
        description: getApiErrorMessage(e),
        color: 'warning'
      })
    } finally {
      vercelCacheStatusLoading.value = false
    }
  }

  async function purgeVercelCache(scope: 'all' | 'isr' | 'bff' = 'all') {
    if (vercelCachePurgeRunning.value) {
      return
    }
    if (!auth.token.value) {
      toast.add({ title: 'Brak tokenu', description: 'Zaloguj się ponownie.', color: 'warning' })
      return
    }
    vercelCachePurgeRunning.value = true
    try {
      const res = await $fetch<VercelCachePurgeResult>('/api/system/vercel-cache/purge', {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token.value}` },
        body: { scope }
      })
      vercelCachePurgeLastResult.value = res
      toast.add({
        title: 'Cache Vercel — revalidacja wysłana',
        description: `${res.okCount}/${res.path_count} tras OK · origin: ${res.origin}`,
        color: res.failCount > 0 ? 'warning' : 'success'
      })
      await refreshVercelCacheStatus()
    } catch (e) {
      toast.add({
        title: 'Nie udało się wyczyścić cache',
        description: getApiDetailedErrorMessage(e),
        color: 'error'
      })
    } finally {
      vercelCachePurgeRunning.value = false
    }
  }

  return {
    vercelCacheStatus,
    vercelCacheStatusLoading,
    vercelCachePurgeRunning,
    vercelCachePurgeLastResult,
    refreshVercelCacheStatus,
    purgeVercelCache
  }
}
