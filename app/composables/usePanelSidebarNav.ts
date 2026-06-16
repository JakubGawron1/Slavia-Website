import type { PanelBreadcrumbItem } from '~/components/panel/PanelBreadcrumb.vue'
import type { PanelArea } from '~/composables/useSlaviaPanelArea'
import { panelEyebrow } from '~/composables/useSlaviaPanelArea'
import {
  buildRoleSidebarNavStructure,
  buildSuperadminSidebarNavStructure,
  flattenSidebarNavStructure,
  isPanelSidebarRoute,
  panelDashboardHomeLink,
  panelSidebarAreaFromPath,
  panelSidebarNavTargetMatches,
  PANEL_SIDEBAR_BRAND_ICON,
  sidebarBreadcrumbLeaf,
  sidebarGroupHasActiveRoute,
  superadminSidebarBreadcrumbLeaf,
  type PanelSidebarArea,
  type PanelSidebarNavGroup,
  type PanelSidebarNavStructure
} from '~/data/panelSidebarNavigation'

const COLLAPSED_LS_KEY = 'slavia-panel-sidebar-collapsed'
const BREADCRUMBS_STATE_KEY = 'panel-sidebar-breadcrumbs'
const SECTIONS_LS_PREFIX = 'slavia-panel-sidebar-sections'

const ROLE_SWITCHER_SHORT: Record<PanelArea, string> = {
  superadmin: 'SuperAdmin',
  admin: 'admina',
  trainer: 'trenera',
  athlete: 'zawodnika',
  staff: 'Slavia',
  public: 'Slavia'
}

const PANEL_ROOT_ICON: Record<PanelSidebarArea, string> = {
  superadmin: 'i-lucide-crown',
  admin: 'i-lucide-shield',
  trainer: 'i-lucide-dumbbell'
}

function sectionStateKey(area: PanelSidebarArea, groupId: string): string {
  return `${area}:${groupId}`
}

/** Stan bocznego panelu nawigacji (design 3.0). */
export function usePanelSidebarNav() {
  const route = useRoute()
  const panelNav = usePanelNavigationFlags()
  const breadcrumbs = useState<PanelBreadcrumbItem[]>(BREADCRUMBS_STATE_KEY, () => [])

  const collapsed = useState<boolean>('panel-sidebar-collapsed', () => {
    if (!import.meta.client) return false
    return localStorage.getItem(COLLAPSED_LS_KEY) === '1'
  })

  const mobileOpen = useState<boolean>('panel-sidebar-mobile-open', () => false)
  const sectionOpenState = useState<Record<string, boolean>>('panel-sidebar-sections-open', () => ({}))

  function loadSectionState(area: PanelSidebarArea) {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(`${SECTIONS_LS_PREFIX}:${area}`)
      if (!raw) return
      const parsed = JSON.parse(raw) as Record<string, boolean>
      sectionOpenState.value = { ...sectionOpenState.value, ...parsed }
    } catch {
      /* ignore corrupt LS */
    }
  }

  function persistSectionState(area: PanelSidebarArea) {
    if (!import.meta.client) return
    const prefix = `${area}:`
    const slice: Record<string, boolean> = {}
    for (const [key, value] of Object.entries(sectionOpenState.value)) {
      if (key.startsWith(prefix)) slice[key] = value
    }
    localStorage.setItem(`${SECTIONS_LS_PREFIX}:${area}`, JSON.stringify(slice))
  }

  function setBreadcrumbs(items: PanelBreadcrumbItem[]) {
    breadcrumbs.value = items
  }

  function clearBreadcrumbs() {
    breadcrumbs.value = []
  }

  function toggleCollapsed() {
    collapsed.value = !collapsed.value
    if (import.meta.client) {
      localStorage.setItem(COLLAPSED_LS_KEY, collapsed.value ? '1' : '0')
    }
  }

  function openMobile() {
    mobileOpen.value = true
  }

  function closeMobile() {
    mobileOpen.value = false
  }

  const showSidebarForRoute = computed(() => isPanelSidebarRoute(route.path))

  const sidebarArea = computed(() => panelSidebarAreaFromPath(route.path))

  const sidebarNavStructure = computed((): PanelSidebarNavStructure | null => {
    const area = sidebarArea.value
    if (!area) return null
    if (area === 'superadmin') return buildSuperadminSidebarNavStructure()
    if (area === 'trainer') {
      return buildRoleSidebarNavStructure(panelNav.moduleGroupsForRole('trainer'), 'trainer')
    }
    return buildRoleSidebarNavStructure(panelNav.moduleGroupsForRole('admin'), 'admin')
  })

  const sidebarNavGroups = computed((): PanelSidebarNavGroup[] => sidebarNavStructure.value?.groups ?? [])

  const sidebarHomeLink = computed(() => sidebarNavStructure.value?.home ?? null)

  const sidebarNavItems = computed(() => {
    if (!sidebarNavStructure.value) return []
    return flattenSidebarNavStructure(sidebarNavStructure.value)
  })

  watch(
    sidebarArea,
    (area) => {
      if (area) loadSectionState(area)
    },
    { immediate: true }
  )

  function defaultSectionOpen(group: PanelSidebarNavGroup, index: number): boolean {
    if (sidebarGroupHasActiveRoute(group.items, route)) return true
    return index === 0
  }

  function isSectionOpen(group: PanelSidebarNavGroup, index: number): boolean {
    const area = sidebarArea.value
    if (!area) return true
    const key = sectionStateKey(area, group.id)
    if (key in sectionOpenState.value) return sectionOpenState.value[key] === true
    return defaultSectionOpen(group, index)
  }

  function toggleSection(group: PanelSidebarNavGroup) {
    const area = sidebarArea.value
    if (!area) return
    const key = sectionStateKey(area, group.id)
    const index = sidebarNavGroups.value.findIndex(g => g.id === group.id)
    const next = !isSectionOpen(group, index)
    sectionOpenState.value = { ...sectionOpenState.value, [key]: next }
    persistSectionState(area)
  }

  function openSectionForActiveRoute() {
    const area = sidebarArea.value
    if (!area) return
    let changed = false
    const next = { ...sectionOpenState.value }
    for (const group of sidebarNavGroups.value) {
      if (!sidebarGroupHasActiveRoute(group.items, route)) continue
      const key = sectionStateKey(area, group.id)
      if (next[key] !== true) {
        next[key] = true
        changed = true
      }
    }
    if (changed) {
      sectionOpenState.value = next
      persistSectionState(area)
    }
  }

  const sidebarEyebrow = computed(() => {
    const area = sidebarArea.value
    return area ? panelEyebrow(area) : 'Slavia'
  })

  const sidebarBrandIcon = computed(() => {
    const area = sidebarArea.value
    return area ? PANEL_SIDEBAR_BRAND_ICON[area] : 'i-lucide-dumbbell'
  })

  const sidebarDashboardTo = computed(() => {
    const area = sidebarArea.value
    return area ? panelDashboardHomeLink(area).to : '/'
  })

  const roleSwitcherShortLabel = (area: PanelArea) => ROLE_SWITCHER_SHORT[area] ?? area

  const resolvedBreadcrumbs = computed((): PanelBreadcrumbItem[] => {
    if (breadcrumbs.value.length) return breadcrumbs.value

    const area = sidebarArea.value
    if (!area) return []

    const root: PanelBreadcrumbItem = {
      label: panelEyebrow(area),
      to: panelDashboardHomeLink(area).to,
      icon: PANEL_ROOT_ICON[area]
    }

    if (route.path === panelDashboardHomeLink(area).to) {
      return [root]
    }

    const leaf =
      area === 'superadmin'
        ? superadminSidebarBreadcrumbLeaf(route.path, route.query)
        : sidebarBreadcrumbLeaf(route.path, route.query, sidebarNavItems.value)

    if (!leaf) return [root]
    return [root, { label: leaf }]
  })

  watch(
    () => route.fullPath,
    () => {
      breadcrumbs.value = []
      mobileOpen.value = false
      openSectionForActiveRoute()
    }
  )

  watch(sidebarNavGroups, () => {
    openSectionForActiveRoute()
  }, { immediate: true })

  return {
    collapsed,
    mobileOpen,
    breadcrumbs,
    setBreadcrumbs,
    clearBreadcrumbs,
    toggleCollapsed,
    openMobile,
    closeMobile,
    showSidebarForRoute,
    sidebarArea,
    sidebarEyebrow,
    sidebarBrandIcon,
    sidebarDashboardTo,
    sidebarHomeLink,
    sidebarNavGroups,
    sidebarNavItems,
    isSectionOpen,
    toggleSection,
    roleSwitcherShortLabel,
    resolvedBreadcrumbs,
    panelSidebarNavTargetMatches
  }
}

export { panelSidebarNavTargetMatches }
