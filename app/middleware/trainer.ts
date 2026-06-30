/** Panel trenera — tylko trener i superadmin (admin bez roli trenera nie ma dostępu). */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.ensureSession()
  if (!auth.user.value) {
    return navigateTo({ path: '/logowanie', query: { redirect: to.fullPath } })
  }

  const roles = auth.roles.value

  const allowed =
    roles.includes('Trainer')
    || roles.includes('SuperAdmin')

  if (!allowed) {
    return navigateTo('/')
  }
})
