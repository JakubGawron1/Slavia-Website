/** Dziennik treningów — zawodnik lub SuperAdmin; kadra bez roli zawodnika → panel trenera. */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  const blocked = await guardAuthenticatedRoute(auth, to)
  if (blocked) return blocked
  if (!auth.user.value) return
  if (!auth.canAccessAthletePortal.value) {
    if (auth.isTrainer.value) {
      return navigateTo('/trainer/dziennik')
    }
    return navigateTo('/')
  }
})
