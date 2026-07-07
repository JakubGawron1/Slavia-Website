/** Panel trenera — tylko trener i superadmin (admin bez roli trenera nie ma dostępu). */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  const blocked = await guardAuthenticatedRoute(auth, to)
  if (blocked) return blocked
  if (!auth.user.value) return

  const roles = auth.roles.value

  const allowed =
    roles.includes('Trainer')
    || roles.includes('SuperAdmin')

  if (!allowed) {
    return navigateTo('/')
  }
})
