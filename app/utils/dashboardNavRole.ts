import type { PanelNavRole } from '~/data/panelNavigationCatalog'
import { panelAreaFromPath } from '~/composables/useSlaviaPanelArea'

export type DashboardNavRole = PanelNavRole | 'superadmin'

const DASHBOARD_PREFIXES: DashboardNavRole[] = ['superadmin', 'admin', 'trainer', 'athlete']

/** Rola panelu do zapisu nawigacji CMS — z trasy lub jawnego override. */
export function resolveDashboardNavRole(
  path: string,
  explicit?: PanelNavRole | 'superadmin' | null
): DashboardNavRole | null {
  if (explicit) return explicit
  const area = panelAreaFromPath(path)
  if (DASHBOARD_PREFIXES.includes(area as DashboardNavRole)) {
    return area as DashboardNavRole
  }
  return null
}
