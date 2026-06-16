import type { PanelModuleGroup } from '~/data/panelNavigationCatalog'
import { panelNavNormalizePath } from '~/data/panelNavigationCatalog'
import { SUPERADMIN_ROUTE_BREADCRUMBS, SUPERADMIN_SIDEBAR_GROUPS } from '~/data/superadminPanelNavigation'
import { dashboardLink, type DashboardModuleLink } from '~/utils/dashboardLink'
import type { PanelArea } from '~/composables/useSlaviaPanelArea'

export const PANEL_SIDEBAR_PREFIXES = ['/superadmin', '/admin', '/trainer'] as const

export type PanelSidebarArea = Extract<PanelArea, 'superadmin' | 'admin' | 'trainer'>

export type PanelSidebarNavGroup = {
  id: string
  title: string
  items: DashboardModuleLink[]
}

export type PanelSidebarNavStructure = {
  home: DashboardModuleLink
  groups: PanelSidebarNavGroup[]
}

export function isPanelSidebarRoute(path: string): boolean {
  return PANEL_SIDEBAR_PREFIXES.some(prefix => path.startsWith(prefix))
}

export function panelSidebarAreaFromPath(path: string): PanelSidebarArea | null {
  if (path.startsWith('/superadmin')) return 'superadmin'
  if (path.startsWith('/admin')) return 'admin'
  if (path.startsWith('/trainer')) return 'trainer'
  return null
}

export const PANEL_DASHBOARD_HOME: Record<
  PanelSidebarArea,
  { to: string, label: string, icon: string, color: string, bg: string }
> = {
  superadmin: {
    to: '/superadmin',
    label: 'Pulpit',
    icon: 'i-lucide-layout-dashboard',
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  admin: {
    to: '/admin',
    label: 'Pulpit',
    icon: 'i-lucide-layout-dashboard',
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  trainer: {
    to: '/trainer',
    label: 'Pulpit',
    icon: 'i-lucide-layout-dashboard',
    color: 'text-primary',
    bg: 'bg-primary/10'
  }
}

export const PANEL_SIDEBAR_BRAND_ICON: Record<PanelSidebarArea, string> = {
  superadmin: 'i-lucide-crown',
  admin: 'i-lucide-shield',
  trainer: 'i-lucide-dumbbell'
}

export function panelDashboardHomeLink(area: PanelSidebarArea): DashboardModuleLink {
  const home = PANEL_DASHBOARD_HOME[area]
  return dashboardLink(home.label, home.label, home.icon, home.to, home.color, home.bg)
}

function navItemDedupeKey(to: string): string {
  return to.split('#')[0] ?? to
}

function sidebarSectionId(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function isDashboardHomeItem(item: DashboardModuleLink, area: PanelSidebarArea): boolean {
  return panelNavNormalizePath(navItemDedupeKey(item.to)) === panelNavNormalizePath(PANEL_DASHBOARD_HOME[area].to)
}

function dedupeGroupItems(
  items: DashboardModuleLink[],
  area: PanelSidebarArea,
  seen: Set<string>
): DashboardModuleLink[] {
  const out: DashboardModuleLink[] = []
  for (const item of items) {
    if (isDashboardHomeItem(item, area)) continue
    const key = navItemDedupeKey(item.to)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

/** Grupy modułów z katalogu panelu (admin / trener). */
export function buildRoleSidebarNavStructure(
  groups: PanelModuleGroup[],
  area: PanelSidebarArea
): PanelSidebarNavStructure {
  const seen = new Set<string>()
  const navGroups: PanelSidebarNavGroup[] = []

  for (const group of groups) {
    const items = dedupeGroupItems(group.items, area, seen)
    if (!items.length) continue
    navGroups.push({
      id: sidebarSectionId(group.title),
      title: group.title,
      items
    })
  }

  return {
    home: panelDashboardHomeLink(area),
    groups: navGroups
  }
}

export function buildSuperadminSidebarNavStructure(): PanelSidebarNavStructure {
  return {
    home: panelDashboardHomeLink('superadmin'),
    groups: SUPERADMIN_SIDEBAR_GROUPS.map(group => ({
      id: sidebarSectionId(group.title),
      title: group.title,
      items: group.items
    }))
  }
}

export function flattenSidebarNavStructure(structure: PanelSidebarNavStructure): DashboardModuleLink[] {
  return [structure.home, ...structure.groups.flatMap(g => g.items)]
}

function parseNavTarget(to: string): { path: string, query: Record<string, string> } {
  const [path, search = ''] = to.split('?')
  const query: Record<string, string> = {}
  if (search) {
    for (const part of search.split('&')) {
      const [k, v] = part.split('=')
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v ?? '')
    }
  }
  return { path: panelNavNormalizePath(path || '/'), query }
}

export function panelSidebarNavTargetMatches(
  route: { path: string, query: Record<string, unknown> },
  to: string
): boolean {
  const target = parseNavTarget(to)
  const routePath = panelNavNormalizePath(route.path)
  const pathMatches =
    routePath === target.path
    || (Object.keys(target.query).length === 0 && routePath.startsWith(`${target.path}/`))

  if (!pathMatches) return false

  if (Object.keys(target.query).length > 0) {
    for (const [key, value] of Object.entries(target.query)) {
      if (String(route.query[key] ?? '') !== value) return false
    }
    return true
  }

  const tab = String(route.query.tab ?? '')
  if (routePath === target.path && tab === 'accounts') return false

  return true
}

export function sidebarGroupHasActiveRoute(
  items: DashboardModuleLink[],
  route: { path: string, query: Record<string, unknown> }
): boolean {
  return items.some(item => panelSidebarNavTargetMatches(route, item.to))
}

export function sidebarBreadcrumbLeaf(
  path: string,
  query: Record<string, unknown>,
  navItems: DashboardModuleLink[]
): string | null {
  for (const item of navItems) {
    if (panelSidebarNavTargetMatches({ path, query }, item.to)) {
      return item.title
    }
  }

  const routePath = panelNavNormalizePath(path)
  let best: { title: string, pathLen: number } | null = null

  for (const item of navItems) {
    const targetPath = parseNavTarget(item.to).path
    if (routePath === targetPath || routePath.startsWith(`${targetPath}/`)) {
      if (!best || targetPath.length > best.pathLen) {
        best = { title: item.title, pathLen: targetPath.length }
      }
    }
  }

  return best?.title ?? null
}

export function superadminSidebarBreadcrumbLeaf(path: string, query: Record<string, unknown>): string | null {
  const tab = String(query.tab ?? '')
  if (path === '/superadmin/zawodnicy' && tab === 'accounts') {
    return 'Konta i role'
  }
  return SUPERADMIN_ROUTE_BREADCRUMBS[path] ?? null
}

/** @deprecated Użyj flattenSidebarNavStructure */
export function flattenPanelSidebarModules(
  groups: PanelModuleGroup[],
  area: PanelSidebarArea
): DashboardModuleLink[] {
  return flattenSidebarNavStructure(buildRoleSidebarNavStructure(groups, area))
}

export function superadminSidebarNavItems(): DashboardModuleLink[] {
  return flattenSidebarNavStructure(buildSuperadminSidebarNavStructure())
}
