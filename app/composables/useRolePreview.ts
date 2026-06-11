import type { Athlete, CompetitionResult, MyCalendarEntry } from '~/types/models'
import {
  useRolePreviewState,
  type RolePreviewRole,
  type RolePreviewState
} from '~/composables/useRolePreviewState'

export type RolePreviewContext = {
  user_id: string
  username: string
  roles: string[]
  preview_roles: string[]
  athlete_id: string | null
  athlete_name: string | null
}

export type RolePreviewAthleteBundle = {
  athlete: Athlete | null
  calendar_entries: MyCalendarEntry[]
  results: CompetitionResult[]
}

const PREVIEW_ROOT: Record<RolePreviewRole, string> = {
  Athlete: '/athlete',
  Trainer: '/trainer',
  Admin: '/admin'
}

export function useRolePreview() {
  const { state, isActive, isReadOnly, persist } = useRolePreviewState()
  const apiFetch = useApi()
  const toast = useToast()

  const previewRoot = computed(() =>
    state.value ? PREVIEW_ROOT[state.value.previewRole] : null
  )

  function pathAllowedInPreview(path: string): boolean {
    if (!isActive.value || !state.value) return true
    const role = state.value.previewRole
    if (path.startsWith('/superadmin')) return false
    if (path.startsWith('/logowanie') || path === '/banned') return false
    if (role === 'Athlete') {
      return path.startsWith('/athlete')
        || path.startsWith('/klub')
        || path.startsWith('/kalkulator')
        || path.startsWith('/zawodnicy')
        || path.startsWith('/aktualnosci')
        || path.startsWith('/ogloszenia')
        || path.startsWith('/galeria')
        || path.startsWith('/kalendarz')
    }
    if (role === 'Trainer') {
      return path.startsWith('/trainer') || path.startsWith('/klub') || path.startsWith('/kalkulator')
    }
    if (role === 'Admin') {
      return path.startsWith('/admin') || path.startsWith('/klub') || path.startsWith('/aktualnosci')
        || path.startsWith('/ogloszenia') || path.startsWith('/galeria') || path.startsWith('/kalendarz')
    }
    return false
  }

  async function fetchContext(userId: string): Promise<RolePreviewContext> {
    return apiFetch<RolePreviewContext>(`/api/system/role-preview/context/${encodeURIComponent(userId)}`)
  }

  async function auditSession(
    action: 'start' | 'end',
    targetUserId: string,
    previewRole: RolePreviewRole
  ) {
    await apiFetch('/api/system/role-preview/session', {
      method: 'POST',
      body: { action, target_user_id: targetUserId, preview_role: previewRole }
    })
  }

  async function startPreview(userId: string, previewRole: RolePreviewRole) {
    const auth = useAuth()
    if (!auth.isSuperAdmin.value) {
      throw new Error('Only SuperAdmin can start role preview')
    }
    const ctx = await fetchContext(userId)
    if (!ctx.preview_roles.includes(previewRole)) {
      throw new Error('Wybrana rola nie jest dostępna dla tego konta')
    }
    await auditSession('start', userId, previewRole)
    const next: RolePreviewState = {
      targetUserId: ctx.user_id,
      targetUsername: ctx.username,
      previewRole,
      athleteId: ctx.athlete_id,
      athleteName: ctx.athlete_name,
      startedAt: new Date().toISOString()
    }
    persist(next)
    await navigateTo(PREVIEW_ROOT[previewRole])
  }

  async function endPreview() {
    if (!state.value) return
    const { targetUserId, previewRole } = state.value
    try {
      await auditSession('end', targetUserId, previewRole)
    } catch {
      // wyczyść lokalnie nawet przy błędzie sieci
    }
    persist(null)
    await navigateTo('/superadmin/podglad-roli')
  }

  async function fetchAthleteBundle(): Promise<RolePreviewAthleteBundle | null> {
    if (!state.value?.targetUserId) return null
    return apiFetch<RolePreviewAthleteBundle>(
      `/api/system/role-preview/athlete-bundle/${encodeURIComponent(state.value.targetUserId)}`
    ).catch(() => null)
  }

  function blockMutationIfPreview(): boolean {
    if (!isReadOnly.value) return false
    toast.add({
      title: 'Podgląd read-only',
      description: 'Zakończ symulację roli, aby zapisywać zmiany.',
      color: 'warning'
    })
    return true
  }

  return {
    state,
    isActive,
    isReadOnly,
    previewRoot,
    pathAllowedInPreview,
    fetchContext,
    startPreview,
    endPreview,
    fetchAthleteBundle,
    blockMutationIfPreview
  }
}
