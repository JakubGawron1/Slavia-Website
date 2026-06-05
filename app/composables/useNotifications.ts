import { apiRoutes } from '~/config/api'
import type { ClubNotification } from '~/types/notifications'

export type { ClubNotification } from '~/types/notifications'

export function useNotifications() {
  const auth = useAuth()
  const api = useApi()

  const items = ref<ClubNotification[]>([])
  const loading = ref(false)

  async function refresh() {
    if (!auth.isLoggedIn.value) return
    loading.value = true
    try {
      items.value = await api<ClubNotification[]>(apiRoutes.notifications.collection)
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    await api(apiRoutes.notifications.one(id), { method: 'DELETE' })
    items.value = items.value.filter(i => i.id !== id)
  }

  async function markRead(id: string) {
    await api(apiRoutes.notifications.markRead(id), { method: 'PATCH' })
    items.value = items.value.map(i => (i.id === id ? { ...i, is_read: true } : i))
  }

  async function markAllRead() {
    await api(apiRoutes.notifications.markAllRead, { method: 'PATCH' })
    items.value = items.value.map(i => ({ ...i, is_read: true }))
  }

  async function deleteAll() {
    await api(apiRoutes.notifications.deleteAll, { method: 'DELETE' })
    items.value = []
  }

  function clearLocal() {
    items.value = []
  }

  return { items, loading, refresh, remove, markRead, markAllRead, deleteAll, clearLocal }
}
