/** Dostęp do narzędzi treningowych: zawodnik, trener, admin, superadmin. */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.ensureSession()
  if (!auth.user.value) {
    return navigateTo({ path: '/logowanie', query: { redirect: to.fullPath } })
  }

  const roles = auth.user.value.roles ?? []
  const allowed =
    roles.includes('Athlete')
    || roles.includes('Trainer')
    || roles.includes('Admin')
    || roles.includes('SuperAdmin')

  if (!allowed) {
    return navigateTo('/')
  }
})

