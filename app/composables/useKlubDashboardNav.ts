import { KLUB_SHARED_ROUTES, PUBLIC_ROUTES } from '~/config/klubRoutes'
import type { PanelNavRole } from '~/data/panelNavigationCatalog'
import { dashboardLink } from '~/utils/dashboardLink'
import type { DashboardModuleLink } from '~/utils/dashboardLink'

const KLUB_PUBLIC_TILES: DashboardModuleLink[] = [
  dashboardLink('Feed klubowy', 'Aktualności + ogłoszenia + kalendarz', 'i-lucide-rss', KLUB_SHARED_ROUTES.feed, 'text-primary', 'bg-primary/12'),
  dashboardLink('Kalendarz klubu', 'Treningi i zawody', 'i-lucide-calendar-days', PUBLIC_ROUTES.kalendarz, 'text-purple-600', 'bg-purple-500/12'),
  dashboardLink('Aktualności', 'Komunikaty klubu', 'i-lucide-newspaper', PUBLIC_ROUTES.aktualnosci, 'text-warning', 'bg-warning/10'),
  dashboardLink('Ranking zawodników', 'Wyniki w klubie', 'i-lucide-trophy', PUBLIC_ROUTES.zawodnicy, 'text-yellow-600', 'bg-yellow-500/12'),
  dashboardLink('Galeria', 'Zdjęcia z sali', 'i-lucide-images', PUBLIC_ROUTES.galeria, 'text-pink-500', 'bg-pink-500/12'),
  dashboardLink('Ogłoszenia', 'Tablica klubu', 'i-lucide-megaphone', PUBLIC_ROUTES.ogloszenia, 'text-violet-500', 'bg-violet-500/10')
]

function isKlubModulePath(to: string) {
  const path = to.split('?')[0] ?? to
  return path.startsWith('/klub') || Object.values(PUBLIC_ROUTES).includes(path as typeof PUBLIC_ROUTES[keyof typeof PUBLIC_ROUTES])
}

export function useKlubDashboardNav() {
  const auth = useAuth()
  const { moduleGroupsForRole } = usePanelNavigationFlags()

  const panelRole = computed<PanelNavRole>(() => {
    if (auth.isAdmin.value || auth.isSuperAdmin.value) return 'admin'
    if (auth.isTrainer.value) return 'trainer'
    return 'athlete'
  })

  const moduleGroups = computed(() => {
    const seen = new Set<string>()
    const items: DashboardModuleLink[] = []

    for (const group of moduleGroupsForRole(panelRole.value)) {
      for (const item of group.items) {
        if (!isKlubModulePath(item.to)) continue
        if (seen.has(item.to)) continue
        seen.add(item.to)
        items.push(item)
      }
    }

    for (const tile of KLUB_PUBLIC_TILES) {
      if (seen.has(tile.to)) continue
      seen.add(tile.to)
      items.push(tile)
    }

    for (const path of Object.values(KLUB_SHARED_ROUTES)) {
      if (seen.has(path)) continue
      const label = path.replace('/klub/', '')
      items.push(
        dashboardLink(
          label.charAt(0).toUpperCase() + label.slice(1),
          'Moduł klubu',
          'i-lucide-layout-grid',
          path,
          'text-primary',
          'bg-primary/10'
        )
      )
      seen.add(path)
    }

    return items.length
      ? [{ title: 'Klub Slavia', items }]
      : []
  })

  return { moduleGroups, panelRole }
}
