/**
 * Sesja CMS na stronach publicznych (blog, galeria, ogłoszenia).
 * Po hydracji odświeża role z GET /api/auth/me (baza, nie tylko JWT).
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

  onMounted(() => {
    void hydrateSession()
  })

  return {
    auth,
    canManage,
    sessionReady,
    hydrateSession
  }
}
