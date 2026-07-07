/**
 * Kadra na stronach publicznych (blog, galeria, ogłoszenia) — sesja i uprawnienia do edycji.
 * Odświeża role z GET /api/auth/me przed pokazaniem przycisków tworzenia.
 */
export function useClubContentAdmin() {
  const auth = useAuth()
  const sessionReady = ref(false)

  const canManage = computed(() => auth.canManageClubContent.value)

  const showManageActions = computed(() => canManage.value && sessionReady.value)

  let hydrateInFlight: Promise<void> | null = null

  async function hydrateSession() {
    if (!import.meta.client) return
    if (hydrateInFlight) return hydrateInFlight
    hydrateInFlight = (async () => {
      try {
        if (auth.token.value) {
          await auth.refreshSession()
        }
      } finally {
        sessionReady.value = true
        hydrateInFlight = null
      }
    })()
    return hydrateInFlight
  }

  if (import.meta.client) {
    onBeforeMount(() => {
      void hydrateSession()
    })
    watch(
      () => auth.token.value,
      (t) => {
        if (t) void hydrateSession()
        else sessionReady.value = true
      }
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
