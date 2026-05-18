/**
 * Sesja CMS na stronach publicznych (blog, galeria, ogłoszenia).
 * Odświeża role z GET /api/auth/me (baza) przed pokazaniem przycisków tworzenia.
 */
export function useClubContentAdmin() {
  const auth = useAuth()
  const sessionReady = ref(false)

  const canManage = computed(() => auth.canManageClubContent.value)

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
    sessionReady,
    hydrateSession
  }
}
