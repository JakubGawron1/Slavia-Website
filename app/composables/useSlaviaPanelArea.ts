export type PanelArea = 'trainer' | 'admin' | 'athlete' | 'superadmin' | 'staff' | 'public'

const PANEL_EYEBROWS: Record<PanelArea, string> = {
  trainer: 'Panel trenera',
  admin: 'Administracja',
  athlete: 'Panel zawodnika',
  superadmin: 'Superadministracja',
  staff: 'Slavia',
  public: 'CKS Slavia'
}

export function panelEyebrow(area: PanelArea): string {
  return PANEL_EYEBROWS[area]
}

/** Ustala obszar panelu na podstawie ścieżki (np. middleware / breadcrumb). */
export function panelAreaFromPath(path: string): PanelArea {
  if (path.startsWith('/superadmin')) return 'superadmin'
  if (path.startsWith('/trainer')) return 'trainer'
  if (path.startsWith('/admin')) return 'admin'
  if (path.startsWith('/athlete')) return 'athlete'
  return 'staff'
}
