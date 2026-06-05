/** Kalendarz osobisty — zawodnik lub SuperAdmin (pełny dostęp). */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.ensureSession()
  if (!auth.user.value) {
    return navigateTo({ path: '/logowanie', query: { redirect: to.fullPath } })
  }
  if (!auth.canAccessAthletePortal.value) {
    return navigateTo('/kalendarz')
  }
})
