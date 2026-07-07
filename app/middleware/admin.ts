export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  const blocked = await guardAuthenticatedRoute(auth, to)
  if (blocked) return blocked
  if (!auth.user.value) return
  if (auth.canEditCms.value && !auth.isAdmin.value && to.path !== '/admin/cms') {
    return navigateTo('/admin/cms')
  }
  if (!auth.isAdmin.value) {
    return navigateTo('/')
  }
})
