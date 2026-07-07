/** Dostęp do narzędzi treningowych: zawodnik, trener, admin, superadmin. */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  const blocked = await guardAuthenticatedRoute(auth, to)
  if (blocked) return blocked
  if (!auth.user.value) return

  const roles = auth.roles.value
  const allowed =
    roles.includes('Athlete')
    || roles.includes('Trainer')
    || roles.includes('Admin')
    || roles.includes('SuperAdmin')

  if (!allowed) {
    return navigateTo('/')
  }
})

