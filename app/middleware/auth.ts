export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  return guardAuthenticatedRoute(auth, to)
})
