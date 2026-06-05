/** Jedna skrócona ścieżka `/dziennik` → widok zawodnika lub listy trenera (jak wcześniejszy routing `/athlete/dziennik`). */
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
  return navigateTo('/athlete/dziennik')
})
