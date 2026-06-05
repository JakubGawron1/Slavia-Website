/** CMS — Editor, Admin lub SuperAdmin. */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.ensureSession()
  if (!auth.user.value) {
    return navigateTo({ path: '/logowanie', query: { redirect: to.fullPath } })
  }
  if (!auth.canEditCms.value) {
    return navigateTo('/')
  }
})
