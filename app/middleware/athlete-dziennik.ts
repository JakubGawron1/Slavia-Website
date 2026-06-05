/** Dziennik treningów — zawodnik lub SuperAdmin; kadra bez roli zawodnika → panel trenera. */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.ensureSession()
  if (!auth.user.value) {
    return navigateTo({ path: '/logowanie', query: { redirect: to.fullPath } })
  }
  if (!auth.canAccessAthletePortal.value) {
    if (auth.isTrainer.value) {
      return navigateTo('/trainer/dziennik')
    }
    return navigateTo('/')
  }
})
