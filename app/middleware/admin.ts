export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.ensureSession()
  if (!auth.user.value) {
    return navigateTo({ path: '/logowanie', query: { redirect: to.fullPath } })
  }
  if (auth.canEditCms.value && !auth.isAdmin.value && to.path !== '/admin/cms') {
    return navigateTo('/admin/cms')
  }
  if (!auth.isAdmin.value) {
    return navigateTo('/')
  }
})
