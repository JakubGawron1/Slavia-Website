import { isSlaviaPrivateRoute } from '~/composables/useSlaviaSeo'

export default defineNuxtPlugin(async (nuxtApp) => {
  const backendProvider = useBackendProvider()
  await backendProvider.hydrateFromServer()

  const auth = useAuth()
  if (!auth.token.value) {
    auth.user.value = null
    return
  }

  const path = nuxtApp._route?.path ?? useRoute().path
  // Panele na SSR muszą znać sesję przed middleware; publiczne trasy — w tle.
  if (import.meta.server && isSlaviaPrivateRoute(path)) {
    await auth.ensureSession()
    return
  }

  void auth.ensureSession()
})
