import { dashboardLink, type DashboardModuleLink } from '~/utils/dashboardLink'

export type PanelNavRole = 'admin' | 'trainer' | 'athlete'

export const PANEL_NAV_FLAG_PREFIX = 'panel_nav_'

export type PanelNavModuleDef = {
  id: string
  role: PanelNavRole
  group: string
  title: string
  description: string
  icon: string
  to: string
  color: string
  bg: string
  /** Gdy true — wyłączenie blokuje też bezpośredni URL (nie tylko kafel na dashboardzie). */
  gateRoute?: boolean
}

function mod(
  role: PanelNavRole,
  slug: string,
  group: string,
  title: string,
  description: string,
  icon: string,
  to: string,
  color: string,
  bg: string,
  gateRoute = false
): PanelNavModuleDef {
  return {
    id: `${PANEL_NAV_FLAG_PREFIX}${role}_${slug}`,
    role,
    group,
    title,
    description,
    icon,
    to,
    color,
    bg,
    gateRoute
  }
}

/** Kanoniczna lista modułów widocznych na dashboardach ról (admin / trener / zawodnik). */
export const PANEL_NAV_MODULES: PanelNavModuleDef[] = [
  // —— Zawodnik ——
  mod('athlete', 'wyniki', 'Najczęstsze', 'Moje starty', 'Zgłoś wynik i historia', 'i-lucide-trophy', '/athlete/wyniki', 'text-amber-600', 'bg-amber-500/12', true),
  mod('athlete', 'skladki', 'Najczęstsze', 'Składka klubowa', 'Zgłoś płatność i status', 'i-lucide-banknote', '/athlete/skladki', 'text-primary', 'bg-primary/15', true),
  mod('athlete', 'kalendarz', 'Najczęstsze', 'Kalendarz startów', 'Przypisania od kadry', 'i-lucide-calendar-heart', '/athlete/kalendarz', 'text-primary', 'bg-primary/15', true),
  mod('athlete', 'obecnosc', 'Najczęstsze', 'Obecność i QR', 'Kalendarz, skaner, zgłoszenia', 'i-lucide-user-check', '/attendance', 'text-primary', 'bg-primary/12', true),
  mod('athlete', 'czat', 'Najczęstsze', 'Czat z trenerem', 'Wiadomości 1:1', 'i-lucide-messages-square', '/chat', 'text-info', 'bg-info/14', true),
  mod('athlete', 'powiadomienia', 'Najczęstsze', 'Powiadomienia', 'Alerty od kadry', 'i-lucide-bell', '/powiadomienia', 'text-amber-600', 'bg-amber-500/12', true),
  mod('athlete', 'dziennik', 'Trening i progres', 'Dziennik treningów', 'Wpisy po jednostkach', 'i-lucide-book-marked', '/dziennik', 'text-info', 'bg-info/12', true),
  mod('athlete', 'timeline', 'Trening i progres', 'Historia treningów', 'Oś czasu aktywności', 'i-lucide-timeline', '/athlete/timeline', 'text-primary', 'bg-primary/10', true),
  mod('athlete', 'plany', 'Trening i progres', 'Plany treningowe', 'Cele i progres', 'i-lucide-clipboard-list', '/athlete/plany', 'text-success', 'bg-success/12', true),
  mod('athlete', 'regeneracja', 'Trening i progres', 'Regeneracja', 'Check-in snu i zmęczenia', 'i-lucide-heart-pulse', '/athlete/regeneracja', 'text-error', 'bg-error/10', true),
  mod('athlete', 'kalendarz_klubu', 'Klub i narzędzia', 'Kalendarz klubu', 'Treningi i zawody', 'i-lucide-calendar-days', '/kalendarz', 'text-purple-600', 'bg-purple-500/12'),
  mod('athlete', 'aktualnosci', 'Klub i narzędzia', 'Aktualności', 'Komunikaty klubu', 'i-lucide-newspaper', '/aktualnosci', 'text-warning', 'bg-warning/10'),
  mod('athlete', 'wyzwania', 'Klub i narzędzia', 'Wyzwania miesiąca', 'Ranking aktywności', 'i-lucide-flame', '/klub/wyzwania', 'text-orange-600', 'bg-orange-500/12'),
  mod('athlete', 'ranking', 'Klub i narzędzia', 'Ranking zawodników', 'Wyniki w klubie', 'i-lucide-trophy', '/zawodnicy', 'text-yellow-600', 'bg-yellow-500/12'),
  mod('athlete', 'analiza_sztangi', 'Klub i narzędzia', 'Tor sztangi', 'Analiza nagrania', 'i-lucide-scan-line', '/athlete/analiza-sztangi', 'text-orange-600', 'bg-orange-500/12', true),
  mod('athlete', 'exercises', 'Klub i narzędzia', 'Inne ćwiczenia', 'Przysiad, wycisk, martwy', 'i-lucide-bar-chart-3', '/athlete/exercises', 'text-warning', 'bg-warning/10', true),
  mod('athlete', 'proporcje', 'Klub i narzędzia', 'Proporcje (ratio)', 'Kalkulator bojów', 'i-lucide-sigma', '/kalkulator-proporcji', 'text-success', 'bg-success/12'),

  // —— Trener ——
  mod('trainer', 'wyniki', 'Najczęstsze', 'Wszystkie starty', 'Lista startów z edycją', 'i-lucide-list-checks', '/trainer/wyniki', 'text-teal-500', 'bg-teal-500/10', true),
  mod('trainer', 'zawodnicy', 'Najczęstsze', 'Zespół i konta', 'Zawodnicy + logowania', 'i-lucide-users-round', '/trainer/zawodnicy', 'text-blue-500', 'bg-blue-500/10', true),
  mod('trainer', 'skladki', 'Najczęstsze', 'Składki klubowe', 'Widok miesiąca i zatwierdzanie', 'i-lucide-banknote', '/trainer/skladki', 'text-green-600', 'bg-green-500/10', true),
  mod('trainer', 'obecnosc', 'Najczęstsze', 'Lista obecności', 'Statusy i weryfikacja', 'i-lucide-user-check', '/attendance', 'text-indigo-600', 'bg-indigo-500/10', true),
  mod('trainer', 'dziennik', 'Najczęstsze', 'Dzienniki treningów', 'Wpisy po jednostkach', 'i-lucide-book-marked', '/trainer/dziennik', 'text-cyan-600', 'bg-cyan-500/10', true),
  mod('trainer', 'czat', 'Najczęstsze', 'Czat z zawodnikami', 'Wiadomości 1:1', 'i-lucide-messages-square', '/chat', 'text-info', 'bg-info/12', true),
  mod('trainer', 'kalendarz', 'Planowanie i monitoring', 'Kalendarz', 'Zawody i treningi klubu', 'i-lucide-calendar', '/kalendarz', 'text-purple-500', 'bg-purple-500/10'),
  mod('trainer', 'plany', 'Planowanie i monitoring', 'Plany treningowe', 'Cykle i monitoring progresu', 'i-lucide-clipboard-list', '/trainer/plany', 'text-emerald-600', 'bg-emerald-500/10', true),
  mod('trainer', 'regeneracja', 'Planowanie i monitoring', 'Regeneracja', 'Check-in snu i zmęczenia', 'i-lucide-heart-pulse', '/trainer/regeneracja', 'text-rose-600', 'bg-rose-500/10', true),
  mod('trainer', 'wydarzenia', 'Planowanie i monitoring', 'Feed wydarzeń', 'Aktywności w klubie', 'i-lucide-list-collapse', '/trainer/wydarzenia', 'text-fuchsia-600', 'bg-fuchsia-500/10', true),
  mod('trainer', 'monitoring', 'Planowanie i monitoring', 'Monitoring', 'Metryki systemowe', 'i-lucide-activity', '/trainer/monitoring', 'text-sky-600', 'bg-sky-500/10', true),
  mod('trainer', 'aktualnosci', 'Klub i treści', 'Aktualności', 'Wpisy na stronie', 'i-lucide-newspaper', '/aktualnosci', 'text-amber-600', 'bg-amber-500/10'),
  mod('trainer', 'wyzwania', 'Klub i treści', 'Wyzwania miesiąca', 'Ranking aktywności', 'i-lucide-flame', '/klub/wyzwania', 'text-orange-600', 'bg-orange-500/10'),
  mod('trainer', 'ranking', 'Klub i treści', 'Ranking zawodników', 'Publiczne wyniki', 'i-lucide-trophy', '/zawodnicy', 'text-yellow-600', 'bg-yellow-500/10'),
  mod('trainer', 'powiadomienia', 'Klub i treści', 'Powiadomienia', 'Alerty systemowe', 'i-lucide-bell', '/powiadomienia', 'text-amber-600', 'bg-amber-500/10', true),
  mod('trainer', 'analiza_sztangi', 'Narzędzia', 'Analiza toru sztangi', 'Wideo i diagnostyka', 'i-lucide-scan-line', '/trainer/analiza-sztangi', 'text-orange-500', 'bg-orange-500/10', true),
  mod('trainer', 'exercises', 'Narzędzia', 'Inne ćwiczenia', 'Ranking siłowy', 'i-lucide-bar-chart-3', '/trainer/exercises', 'text-lime-600', 'bg-lime-500/10', true),
  mod('trainer', 'cwiczenia', 'Narzędzia', 'Słownik ćwiczeń', 'Baza do planów', 'i-lucide-library', '/trainer/cwiczenia', 'text-indigo-500', 'bg-indigo-500/10', true),
  mod('trainer', 'proporcje', 'Narzędzia', 'Proporcje (ratio)', 'Kalkulator bojów', 'i-lucide-sigma', '/kalkulator-proporcji', 'text-success', 'bg-success/12'),

  // —— Admin ——
  mod('admin', 'zawodnicy', 'Najczęstsze', 'Zespół i konta', 'Zawodnicy + logowania', 'i-lucide-users-round', '/admin/zawodnicy', 'text-blue-500', 'bg-blue-500/10', true),
  mod('admin', 'kontakt', 'Najczęstsze', 'Wiadomości (kontakt)', 'Skrzynka formularza', 'i-lucide-mail', '/admin/kontakt-wiadomosci', 'text-info', 'bg-info/12', true),
  mod('admin', 'changelog', 'Najczęstsze', 'Changelog', 'Historia wydań', 'i-lucide-file-text', '/admin/changelog', 'text-success', 'bg-success/12', true),
  mod('admin', 'powiadomienia', 'Najczęstsze', 'Powiadomienia', 'Alerty systemowe', 'i-lucide-bell', '/powiadomienia', 'text-amber-600', 'bg-amber-500/10', true),
  mod('admin', 'aktualnosci', 'Treści publiczne', 'Aktualności', 'Wpisy na stronie', 'i-lucide-newspaper', '/aktualnosci', 'text-orange-500', 'bg-orange-500/10'),
  mod('admin', 'ogloszenia', 'Treści publiczne', 'Ogłoszenia', 'Tablica klubu', 'i-lucide-megaphone', '/ogloszenia', 'text-violet-500', 'bg-violet-500/10'),
  mod('admin', 'galeria', 'Treści publiczne', 'Galeria', 'Zdjęcia', 'i-lucide-images', '/galeria', 'text-pink-500', 'bg-pink-500/10'),
  mod('admin', 'ranking', 'Treści publiczne', 'Ranking zawodników', 'Wyniki publiczne', 'i-lucide-trophy', '/zawodnicy', 'text-yellow-500', 'bg-yellow-500/10'),
  mod('admin', 'wyzwania', 'Treści publiczne', 'Wyzwania miesiąca', 'Aktywność w klubie', 'i-lucide-flame', '/klub/wyzwania', 'text-orange-500', 'bg-orange-500/10'),
  mod('admin', 'kalendarz', 'Treści publiczne', 'Kalendarz', 'Wydarzenia', 'i-lucide-calendar', '/kalendarz', 'text-purple-500', 'bg-purple-500/10'),
  mod('admin', 'proporcje', 'Konto i narzędzia', 'Proporcje (ratio)', 'Kalkulator bojów', 'i-lucide-sigma', '/kalkulator-proporcji', 'text-success', 'bg-success/12')
]

export type PanelModuleGroup = { title: string, items: DashboardModuleLink[] }

export function panelNavModulesForRole(role: PanelNavRole): PanelNavModuleDef[] {
  return PANEL_NAV_MODULES.filter(m => m.role === role)
}

export function panelModuleLinkFromDef(def: PanelNavModuleDef): DashboardModuleLink {
  return {
    ...dashboardLink(def.title, def.description, def.icon, def.to, def.color, def.bg),
    panelNavId: def.id
  }
}

export function buildPanelModuleGroups(role: PanelNavRole): PanelModuleGroup[] {
  const byGroup = new Map<string, DashboardModuleLink[]>()
  for (const def of panelNavModulesForRole(role)) {
    const items = byGroup.get(def.group) ?? []
    items.push(panelModuleLinkFromDef(def))
    byGroup.set(def.group, items)
  }
  return [...byGroup.entries()].map(([title, items]) => ({ title, items }))
}

export const PANEL_NAV_ROLE_LABELS: Record<PanelNavRole, string> = {
  admin: 'Panel admina',
  trainer: 'Panel trenera',
  athlete: 'Panel zawodnika'
}

export const PANEL_NAV_ROLE_SHORT: Record<PanelNavRole, string> = {
  admin: 'Admin',
  trainer: 'Trener',
  athlete: 'Zawodnik'
}

/** Ścieżki w głównym pasku nawigacji (belka „Strony klubu”). */
export const SITE_NAV_MAIN_PATHS = [
  '/ogloszenia',
  '/aktualnosci',
  '/galeria',
  '/zawodnicy',
  '/kalendarz'
] as const

export function panelNavNormalizePath(path: string): string {
  const p = path.split('?')[0]?.split('#')[0] ?? path
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1)
  return p
}

/** Moduły panelu wskazujące ten sam URL co link w nawigacji. */
export function panelNavModulesForNavPath(path: string): PanelNavModuleDef[] {
  const normalized = panelNavNormalizePath(path)
  return PANEL_NAV_MODULES.filter(m => panelNavNormalizePath(m.to) === normalized)
}

/** Moduł steruje też linkiem w głównym navbarze (nie tylko kafel na dashboardzie). */
export function panelNavModuleInSiteNavbar(mod: PanelNavModuleDef): boolean {
  return (SITE_NAV_MAIN_PATHS as readonly string[]).includes(panelNavNormalizePath(mod.to))
}

/** Inne panele, w których ten sam URL ma osobny przełącznik. */
export function panelNavSharedInOtherPanels(mod: PanelNavModuleDef): PanelNavRole[] {
  return PANEL_NAV_MODULES
    .filter(m => m.to === mod.to && m.id !== mod.id)
    .map(m => m.role)
}

export function panelNavRolesForUserRoles(roles: string[]): PanelNavRole[] {
  const list: PanelNavRole[] = []
  if (roles.includes('Admin') || roles.includes('SuperAdmin')) list.push('admin')
  if (roles.includes('Trainer') || roles.includes('SuperAdmin')) list.push('trainer')
  if (roles.includes('Athlete') || roles.includes('SuperAdmin')) list.push('athlete')
  return list
}

export function panelNavModulesForUserRoles(roles: string[]): PanelNavModuleDef[] {
  const panelRoles = new Set(panelNavRolesForUserRoles(roles))
  return PANEL_NAV_MODULES.filter(m => panelRoles.has(m.role))
}
