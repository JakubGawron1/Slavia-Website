import type { GroupedAdminAccounts } from '~/types/models'

/** Panel ban/unban w `/superadmin/developer` — wydzielona logika. */
export function useDeveloperBanPanel() {
  const apiFetch = useApi()
  const toast = useToast()

  const banUserId = ref('')
  const banUserOptions = ref<{ label: string, value: string }[]>([])
  const banUserSelected = ref<string>('')
  const banReason = ref('')
  const banPending = ref(false)

  async function refreshBanUsersCatalog() {
    try {
      const data = await apiFetch<GroupedAdminAccounts>('/api/admins/grouped')
      const all = [
        ...(data.admins ?? []),
        ...(data.trainers ?? []),
        ...(data.athletes ?? [])
      ]
      const seen = new Set<string>()
      const items = all
        .filter((u) => {
          if (!u?.id || seen.has(u.id)) return false
          seen.add(u.id)
          return true
        })
        .map((u) => {
          const roles = Array.isArray(u.roles) ? u.roles.join(', ') : ''
          const suffix = roles ? ` · ${roles}` : ''
          return { label: `${u.username}${suffix}`, value: u.id }
        })
        .sort((a, b) => a.label.localeCompare(b.label, 'pl'))
      banUserOptions.value = [{ label: '— wybierz konto —', value: '' }, ...items]
    } catch {
      banUserOptions.value = [{ label: '— wybierz konto —', value: '' }]
    }
  }

  watch(banUserSelected, (id) => {
    if (typeof id === 'string') {
      banUserId.value = id
    }
  })

  async function devBanUser() {
    const id = banUserId.value.trim()
    if (!id) {
      toast.add({ title: 'Podaj user_id', color: 'warning' })
      return
    }
    banPending.value = true
    try {
      await apiFetch(`/api/admins/${encodeURIComponent(id)}/ban`, {
        method: 'PATCH',
        body: { reason: banReason.value.trim() || undefined }
      })
      toast.add({ title: 'Zbanowano konto', color: 'success' })
    } catch (e) {
      toast.add({ title: 'Ban nieudany', description: getApiDetailedErrorMessage(e), color: 'error' })
    } finally {
      banPending.value = false
    }
  }

  async function devUnbanUser() {
    const id = banUserId.value.trim()
    if (!id) {
      toast.add({ title: 'Podaj user_id', color: 'warning' })
      return
    }
    banPending.value = true
    try {
      await apiFetch(`/api/admins/${encodeURIComponent(id)}/unban`, { method: 'PATCH' })
      toast.add({ title: 'Cofnięto bana', color: 'success' })
    } catch (e) {
      toast.add({ title: 'Unban nieudany', description: getApiDetailedErrorMessage(e), color: 'error' })
    } finally {
      banPending.value = false
    }
  }

  return {
    banUserId,
    banUserOptions,
    banUserSelected,
    banReason,
    banPending,
    refreshBanUsersCatalog,
    devBanUser,
    devUnbanUser
  }
}
