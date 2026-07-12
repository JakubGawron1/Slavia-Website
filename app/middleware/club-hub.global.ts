import { isClubHubExperimentalPath } from '~/config/klubRoutes'

/** Blokuje hub /klub, samouczek i dokumenty zarządu gdy flaga `club_hub` jest wyłączona. */
export default defineNuxtRouteMiddleware(to => {
  if (!import.meta.client) return
  if (!isClubHubExperimentalPath(to.path)) return

  const clubHubOn = useExperimentalFlag('club_hub')
  if (clubHubOn.value) return

  const { primaryDashboardPath } = useRoleDashboardNav()
  const redirect = primaryDashboardPath.value

  if (normalizePath(to.path) === normalizePath(redirect)) return

  const toast = useToast()
  toast.add({
    title: 'Moduł jest wyłączony',
    description:
      'Strefa klubu i dokumenty zarządu są funkcją eksperymentalną. Włącz „club_hub” w /superadmin/developer.',
    color: 'warning'
  })

  return navigateTo(redirect)
})

function normalizePath(path: string): string {
  const p = path.split('?')[0]?.split('#')[0] ?? path
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1)
  return p
}
