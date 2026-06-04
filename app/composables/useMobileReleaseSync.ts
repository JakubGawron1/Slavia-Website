import type { MobileReleaseInfo } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'

/** Synchronizacja wydań aplikacji mobilnej z GitHub (SuperAdmin). */
export function useMobileReleaseSync() {
  const apiFetch = useApi()
  const toast = useToast()
  const syncing = ref(false)

  async function syncMobileReleases() {
    syncing.value = true
    try {
      const res = await apiFetch<MobileReleaseInfo>('/api/system/mobile-releases/sync', { method: 'POST' })
      toast.add({
        title: 'Zsynchronizowano aplikację mobilną',
        description: `Najnowsza wersja: ${res.version}`,
        color: 'success'
      })
    } catch (e) {
      toast.add({
        title: 'Błąd synchronizacji',
        description: getApiErrorMessage(e),
        color: 'error'
      })
    } finally {
      syncing.value = false
    }
  }

  return { syncing, syncMobileReleases }
}
