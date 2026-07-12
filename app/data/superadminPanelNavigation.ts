import { dashboardLink, type DashboardModuleLink } from '~/utils/dashboardLink'

/** Kategorie modułów SuperAdmin w bocznym panelu (bez pulpitu). */
export const SUPERADMIN_SIDEBAR_GROUPS: { title: string, items: DashboardModuleLink[] }[] = [
  {
    title: 'Zespół i konta',
    items: [
      dashboardLink('Konta i role', 'Administratorzy i trenerzy', 'i-lucide-shield-alert', '/superadmin/zawodnicy?tab=accounts', 'text-red-500', 'bg-red-500/10'),
      dashboardLink('Baza zawodników', 'Pełna edycja profili', 'i-lucide-users', '/superadmin/zawodnicy', 'text-blue-500', 'bg-blue-500/10')
    ]
  },
  {
    title: 'System i bezpieczeństwo',
    items: [
      dashboardLink('Logi systemowe', 'Audyt operacji', 'i-lucide-history', '/superadmin/audit-logs', 'text-primary', 'bg-primary/10'),
      dashboardLink('Podgląd roli', 'Symulator read-only', 'i-lucide-eye', '/superadmin/podglad-roli', 'text-amber-600', 'bg-amber-500/10'),
      dashboardLink('Workery cron', 'Zadania w tle', 'i-lucide-timer', '/superadmin/workers', 'text-fuchsia-500', 'bg-fuchsia-500/10'),
      dashboardLink('Nawigacja paneli', 'Widoczność modułów ról', 'i-lucide-layout-grid', '/superadmin/nawigacja-paneli', 'text-sky-500', 'bg-sky-500/10')
    ]
  },
  {
    title: 'Narzędzia',
    items: [
      dashboardLink('Narzędzia developera', 'Diagnostyka API i PWA', 'i-lucide-terminal', '/superadmin/developer', 'text-violet-500', 'bg-violet-500/10'),
      dashboardLink('Import danych', 'Federacje i CSV', 'i-lucide-file-up', '/superadmin/import', 'text-cyan-600', 'bg-cyan-500/10')
    ]
  }
]

/** Etykiety tras SuperAdmin do breadcrumbów w sidebarze (fallback bez PanelPageHeader). */
export const SUPERADMIN_ROUTE_BREADCRUMBS: Record<string, string> = {
  '/superadmin': 'Pulpit',
  '/superadmin/zawodnicy': 'Baza zawodników',
  '/superadmin/audit-logs': 'Logi systemowe',
  '/superadmin/podglad-roli': 'Podgląd roli',
  '/superadmin/workers': 'Workery cron',
  '/superadmin/developer': 'Narzędzia developera',
  '/superadmin/nawigacja-paneli': 'Nawigacja paneli',
  '/superadmin/import': 'Import danych'
}

/** @deprecated Użyj buildSuperadminSidebarNavStructure */
export const SUPERADMIN_SIDEBAR_NAV: DashboardModuleLink[] = [
  dashboardLink('Pulpit', 'Dashboard superadmina', 'i-lucide-layout-dashboard', '/superadmin', 'text-primary', 'bg-primary/10'),
  ...SUPERADMIN_SIDEBAR_GROUPS.flatMap(g => g.items)
]
