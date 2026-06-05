export default defineNuxtRouteMiddleware(async to => {
  if (!import.meta.client) return

  const auth = useAuth()
  await auth.ensureSession()
  if (!auth.isLoggedIn.value) return

  const panelNav = usePanelNavigationFlags()
  if (!panelNav.hydratedFromApi.value) {
    await panelNav.hydrateFromApi()
  }

  if (panelNav.canAccessPath(to.path)) return

  const redirect = panelNav.redirectPathForBlockedRoute(to.path)
  if (normalizePath(to.path) === normalizePath(redirect)) return

  return navigateTo(redirect)
})

function normalizePath(path: string): string {
  const p = path.split('?')[0]?.split('#')[0] ?? path
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1)
  return p
}
