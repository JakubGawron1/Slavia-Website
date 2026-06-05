import { panelAreaFromPath } from '~/composables/useSlaviaPanelArea'

export const ACCOUNT_SETTINGS_SECTION_ID = 'ustawienia-konta'
export const ACCOUNT_SETTINGS_QUERY_KEY = 'konto'

export type RoleDashboardItem = {
  label: string
  to: string
  icon: string
  area: 'superadmin' | 'admin' | 'trainer' | 'athlete'
}

const DASHBOARD_BY_AREA: Record<RoleDashboardItem['area'], Omit<RoleDashboardItem, 'area'>> = {
  superadmin: { label: 'Panel SuperAdmin', to: '/superadmin', icon: 'i-lucide-crown' },
  admin: { label: 'Panel admina', to: '/admin', icon: 'i-lucide-shield' },
  trainer: { label: 'Panel trenera', to: '/trainer', icon: 'i-lucide-dumbbell' },
  athlete: { label: 'Panel zawodnika', to: '/athlete', icon: 'i-lucide-user' }
}

/** Nawigacja między dashboardami ról; ustawienia konta są sekcją na dashboardzie (hash). */
export function useRoleDashboardNav() {
  const auth = useAuth()
  const route = useRoute()

  const primaryDashboardPath = computed(() => {
    if (auth.isSuperAdmin.value) return '/superadmin'
    if (auth.isAdmin.value) return '/admin'
    if (auth.isTrainer.value) return '/trainer'
    if (auth.isAthlete.value) return '/athlete'
    return '/'
  })

  const currentDashboardRoot = computed(() => {
    const area = panelAreaFromPath(route.path)
    if (area === 'superadmin') return '/superadmin'
    if (area === 'admin') return '/admin'
    if (area === 'trainer') return '/trainer'
    if (area === 'athlete') return '/athlete'
    return null
  })

  /** Ustawienia na dashboardzie, na którym użytkownik aktualnie jest (nie zawsze „pierwszy” panel roli). */
  const accountSettingsPath = computed(() => ({
    path: currentDashboardRoot.value ?? primaryDashboardPath.value,
    hash: `#${ACCOUNT_SETTINGS_SECTION_ID}`,
    query: { [ACCOUNT_SETTINGS_QUERY_KEY]: '1' }
  }))

  const availableDashboards = computed((): RoleDashboardItem[] => {
    const roles = new Set(auth.roles.value || [])
    const list: RoleDashboardItem[] = []
    if (roles.has('SuperAdmin')) {
      list.push({ area: 'superadmin', ...DASHBOARD_BY_AREA.superadmin })
    }
    if (roles.has('Admin') || roles.has('SuperAdmin')) {
      list.push({ area: 'admin', ...DASHBOARD_BY_AREA.admin })
    } else if (roles.has('Editor')) {
      list.push({ area: 'admin', label: 'CMS', to: '/admin/cms', icon: 'i-lucide-layout-template' })
    }
    if (roles.has('Trainer') || roles.has('SuperAdmin')) {
      list.push({ area: 'trainer', ...DASHBOARD_BY_AREA.trainer })
    }
    if (roles.has('Athlete') || roles.has('SuperAdmin')) {
      list.push({ area: 'athlete', ...DASHBOARD_BY_AREA.athlete })
    }
    return list
  })

  const otherDashboards = computed(() => {
    const root = currentDashboardRoot.value
    if (!root) return availableDashboards.value.map(d => ({ label: d.label, to: d.to, icon: d.icon }))
    return availableDashboards.value
      .filter(d => d.to !== root)
      .map(d => ({ label: d.label, to: d.to, icon: d.icon }))
  })

  const accountQuickLinks = [
    { label: 'Profil', hash: '#profil', icon: 'i-lucide-user' },
    { label: 'Wygląd', hash: '#wyglad', icon: 'i-lucide-palette' },
    { label: 'Aplikacje', hash: '#aplikacje', icon: 'i-lucide-smartphone' },
    { label: 'Bezpieczeństwo', hash: '#bezpieczenstwo', icon: 'i-lucide-shield-check' }
  ] as const

  return {
    primaryDashboardPath,
    accountSettingsPath,
    availableDashboards,
    otherDashboards,
    currentDashboardRoot,
    accountQuickLinks,
    accountSettingsSectionId: ACCOUNT_SETTINGS_SECTION_ID
  }
}
