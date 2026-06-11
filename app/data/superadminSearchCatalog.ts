import { dashboardLink } from '~/utils/dashboardLink'

export type SuperadminSearchEntry = {
  id: string
  label: string
  description: string
  to: string
  icon: string
  keywords?: string
}

function link(
  id: string,
  label: string,
  description: string,
  icon: string,
  to: string,
  color: string,
  bg: string,
  keywords?: string
): SuperadminSearchEntry {
  const mod = dashboardLink(label, description, icon, to, color, bg)
  return {
    id,
    label: mod.title,
    description: mod.description,
    to: mod.to,
    icon: mod.icon,
    keywords
  }
}

/** Moduły panelu SuperAdmin — indeks wyszukiwarki globalnej. */
export const SUPERADMIN_SEARCH_CATALOG: SuperadminSearchEntry[] = [
  // System i bezpieczeństwo
  link('sa-accounts', 'Konta i role', 'Administratorzy, trenerzy, zawodnicy', 'i-lucide-shield-alert', '/superadmin/zawodnicy?tab=accounts', 'text-red-500', 'bg-red-500/10', 'konta role uprawnienia'),
  link('sa-audit', 'Logi systemowe', 'Audyt operacji', 'i-lucide-history', '/superadmin/audit-logs', 'text-primary', 'bg-primary/10', 'audyt logi'),
  link('sa-role-preview', 'Podgląd roli', 'Symulator read-only konta', 'i-lucide-eye', '/superadmin/podglad-roli', 'text-amber-600', 'bg-amber-500/10', 'impersonate podgląd zawodnik trener'),
  link('sa-workers', 'Workery cron', 'Zadania w tle', 'i-lucide-timer', '/superadmin/workers', 'text-fuchsia-500', 'bg-fuchsia-500/10'),
  link('sa-developer', 'Narzędzia developera', 'Diagnostyka API i PWA', 'i-lucide-terminal', '/superadmin/developer', 'text-violet-500', 'bg-violet-500/10', 'developer seo cwv'),
  link('sa-panel-nav', 'Nawigacja paneli', 'Widoczność modułów ról', 'i-lucide-layout-grid', '/superadmin/nawigacja-paneli', 'text-sky-500', 'bg-sky-500/10', 'feature flags moduły'),
  link('sa-import', 'Import danych', 'Federacje i CSV', 'i-lucide-file-up', '/superadmin/import', 'text-cyan-600', 'bg-cyan-500/10'),
  link('sa-athletes', 'Baza zawodników', 'Pełna edycja profili', 'i-lucide-users', '/superadmin/zawodnicy', 'text-blue-500', 'bg-blue-500/10'),
  link('sa-barbell', 'Barbell Lab', 'Eksperymenty wizji', 'i-lucide-beaker', '/superadmin/barbell-lab', 'text-pink-500', 'bg-pink-500/10', 'analiza sztangi wideo'),
  // Administracja treści
  link('sa-contact', 'Wiadomości (kontakt)', 'Formularz publiczny', 'i-lucide-mail', '/admin/kontakt-wiadomosci', 'text-info', 'bg-info/12'),
  link('sa-changelog', 'Changelog', 'Historia wydań', 'i-lucide-file-text', '/admin/changelog', 'text-success', 'bg-success/12'),
  link('sa-posts', 'Aktualności', 'Wpisy klubu', 'i-lucide-newspaper', '/aktualnosci', 'text-orange-500', 'bg-orange-500/10'),
  link('sa-announcements', 'Ogłoszenia', 'Tablica klubu', 'i-lucide-megaphone', '/ogloszenia', 'text-violet-500', 'bg-violet-500/10'),
  link('sa-gallery', 'Galeria', 'Zdjęcia na stronie', 'i-lucide-images', '/galeria', 'text-pink-500', 'bg-pink-500/10'),
  link('sa-calendar', 'Kalendarz', 'Wydarzenia klubu', 'i-lucide-calendar', '/kalendarz', 'text-purple-500', 'bg-purple-500/10'),
  // Kadra trenera (skróty SA)
  link('sa-trainer-results', 'Starty zawodników', 'Lista startów', 'i-lucide-list-checks', '/trainer/wyniki', 'text-teal-500', 'bg-teal-500/10'),
  link('sa-trainer-payments', 'Składki', 'Zatwierdzanie wpłat', 'i-lucide-banknote', '/trainer/skladki', 'text-green-600', 'bg-green-500/10'),
  link('sa-trainer-attendance', 'Obecności', 'Weryfikacja', 'i-lucide-user-check', '/klub/obecnosc', 'text-indigo-600', 'bg-indigo-500/10'),
  link('sa-trainer-diary', 'Dzienniki', 'Wpisy treningowe', 'i-lucide-book-marked', '/trainer/dziennik', 'text-cyan-600', 'bg-cyan-500/10'),
  link('sa-trainer-plans', 'Plany', 'Monitoring progresu', 'i-lucide-clipboard-list', '/trainer/plany', 'text-emerald-600', 'bg-emerald-500/10'),
  link('sa-trainer-regen', 'Regeneracja', 'Check-in zawodników', 'i-lucide-heart-pulse', '/trainer/regeneracja', 'text-rose-600', 'bg-rose-500/10'),
  link('sa-trainer-exercises', 'Inne ćwiczenia', 'Ranking, weryfikacja i słownik', 'i-lucide-bar-chart-3', '/trainer/cwiczenia', 'text-lime-600', 'bg-lime-500/10'),
  link('sa-trainer-barbell', 'Analiza sztangi', 'Wideo i diagnostyka', 'i-lucide-scan-line', '/trainer/analiza-sztangi', 'text-orange-500', 'bg-orange-500/10'),
  link('sa-trainer-monitoring', 'Monitoring', 'Metryki kadry', 'i-lucide-activity', '/trainer/monitoring', 'text-sky-600', 'bg-sky-500/10'),
  link('sa-trainer-chat', 'Czat', 'Wiadomości 1:1', 'i-lucide-messages-square', '/klub/czat', 'text-info', 'bg-info/12'),
  // Klub
  link('sa-ranking', 'Ranking zawodników', 'Wyniki publiczne', 'i-lucide-trophy', '/zawodnicy', 'text-yellow-600', 'bg-yellow-500/10'),
  link('sa-challenges', 'Wyzwania miesiąca', 'Aktywność', 'i-lucide-flame', '/klub/wyzwania', 'text-orange-600', 'bg-orange-500/10'),
  link('sa-notifications', 'Powiadomienia', 'Alerty', 'i-lucide-bell', '/klub/powiadomienia', 'text-amber-600', 'bg-amber-500/10'),
  link('sa-proporcje', 'Proporcje', 'Kalkulator bojów', 'i-lucide-sigma', '/kalkulator-proporcji', 'text-success', 'bg-success/12')
]

export const SUPERADMIN_DASHBOARD_ENTRY: SuperadminSearchEntry = {
  id: 'sa-dashboard',
  label: 'Panel SuperAdmin',
  description: 'Dashboard platformy — KPI, moduły i skróty',
  to: '/superadmin',
  icon: 'i-lucide-shield-check',
  keywords: 'superadmin dashboard'
}
