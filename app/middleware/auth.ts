export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.ensureSession()
  if (!auth.user.value) {
    if (auth.token.value && auth.sessionLoadError.value) {
      return
    }
    return navigateTo({ path: '/logowanie', query: { redirect: to.fullPath } })
  }
})
