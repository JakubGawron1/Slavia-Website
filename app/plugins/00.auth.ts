export default defineNuxtPlugin(async () => {
  const backendProvider = useBackendProvider()
  await backendProvider.hydrateFromServer()
  const auth = useAuth()
  await auth.ensureSession()
})
