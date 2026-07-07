/** CMS — Editor, Admin lub SuperAdmin. */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  const blocked = await guardAuthenticatedRoute(auth, to)
  if (blocked) return blocked
  if (!auth.user.value) return
  if (!auth.canEditCms.value) {
    return navigateTo('/')
  }
})
