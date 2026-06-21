export type RolePreviewRole = 'Athlete' | 'Trainer' | 'Admin'

export type RolePreviewState = {
  targetUserId: string
  targetUsername: string
  previewRole: RolePreviewRole
  athleteId: string | null
  athleteName: string | null
  startedAt: string
}

const LS_KEY = 'slavia_role_preview_v1'
export const ROLE_PREVIEW_STATE_KEY = 'slavia_role_preview'

function readStored(): RolePreviewState | null {
  if (!import.meta.client) return null
  try {
    const raw = sessionStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as RolePreviewState
  } catch {
    return null
  }
}

/** Stan podglądu roli bez zależności od `useApi` (używane w interceptorze HTTP). */
export function useRolePreviewState() {
  const auth = useAuth()
  const state = useState<RolePreviewState | null>(ROLE_PREVIEW_STATE_KEY, () => null)

  if (import.meta.client && !state.value) {
    state.value = readStored()
  }

  if (import.meta.client) {
    onMounted(() => {
      if (!state.value) {
        state.value = readStored()
      }
    })
  }

  const isActive = computed(
    () => auth.isSuperAdmin.value && !!state.value?.targetUserId
  )

  const isReadOnly = computed(() => isActive.value)

  /** Podgląd perspektywy zawodnika (dane „moje”, nie konta SA). */
  const isAthletePreview = computed(
    () => isActive.value && state.value?.previewRole === 'Athlete'
  )

  /** Ładowanie modułów zawodnika: własna rola Athlete lub podgląd SA. */
  const viewingAthletePortal = computed(
    () => auth.isAthlete.value || isAthletePreview.value
  )

  const previewAthleteId = computed(() => state.value?.athleteId ?? null)

  function persist(next: RolePreviewState | null) {
    state.value = next
    if (!import.meta.client) return
    try {
      if (next) sessionStorage.setItem(LS_KEY, JSON.stringify(next))
      else sessionStorage.removeItem(LS_KEY)
    } catch {
      // ignore
    }
  }

  return {
    state,
    isActive,
    isReadOnly,
    isAthletePreview,
    viewingAthletePortal,
    previewAthleteId,
    persist
  }
}
