export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  const blocked = await guardAuthenticatedRoute(auth, to)
  if (blocked) return blocked
  if (!auth.user.value) return
  if (!auth.isBoardMember.value) {
    const clubHubOn = useExperimentalFlag('club_hub')
    if (clubHubOn.value) {
      return navigateTo('/klub')
    }
    const { primaryDashboardPath } = useRoleDashboardNav()
    return navigateTo(primaryDashboardPath.value)
  }
})
