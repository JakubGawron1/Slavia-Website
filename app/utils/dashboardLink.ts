/** Karta modułu na dashboardzie (panel trenera / admin / zawodnik). */
export type DashboardModuleLink = {
  title: string
  description: string
  icon: string
  to: string
  color: string
  bg: string
  /** Id flagi `panel_nav_*` — do filtrowania widoczności przez superadmina. */
  panelNavId?: string
}

export function dashboardLink(
  title: string,
  description: string,
  icon: string,
  to: string,
  color: string,
  bg: string
): DashboardModuleLink {
  return { title, description, icon, to, color, bg }
}
