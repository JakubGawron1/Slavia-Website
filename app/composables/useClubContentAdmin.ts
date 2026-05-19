/**
 * Sesja CMS na stronach publicznych (blog, galeria, ogłoszenia).
 * Odświeża role z GET /api/auth/me (baza) przed pokazaniem przycisków tworzenia.
 */
export function useClubContentAdmin() {
  const auth = useAuth()
  const sessionReady = ref(false)

  const canManage = computed(() => auth.canManageClubContent.value)

  /** Przyciski CMS widoczne od razu po zalogowaniu (zanim GET /me odświeży role). */
  const showManageActions = computed(() => {
    if (canManage.value) return true
    if (!import.meta.client) return false
    return Boolean(auth.token.value) && !sessionReady.value
  })

  async function hydrateSession() {
    if (!import.meta.client) return
    if (auth.token.value) {
      await auth.refreshSession()
    }
    sessionReady.value = true
  }

  if (import.meta.client) {
    onBeforeMount(() => {
      void hydrateSession()
    })
    onNuxtReady(() => {
      void hydrateSession()
    })
    watch(
      () => auth.token.value,
      (t) => {
        if (t) void hydrateSession()
        else sessionReady.value = true
      }
    )
    watch(
      () => auth.roles.value,
      () => {
        sessionReady.value = true
      },
      { deep: true }
    )
  }

  return {
    auth,
    canManage,
    showManageActions,
    sessionReady,
    hydrateSession
  }
}
