/** Kalendarz osobisty — zawodnik lub SuperAdmin (pełny dostęp). */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  const blocked = await guardAuthenticatedRoute(auth, to)
  if (blocked) return blocked
  if (!auth.user.value) return
  if (!auth.canAccessAthletePortal.value) {
    return navigateTo('/kalendarz')
  }
})
