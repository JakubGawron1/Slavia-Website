import type { GlobalSearchAudience } from '~/types/globalSearch'

export type GlobalSearchExtraEntry = {
  id: string
  label: string
  description: string
  to: string
  icon: string
  audiences: GlobalSearchAudience[]
  keywords?: string
  panelNavId?: string
  gateRoute?: boolean
}

/** Trasy spoza katalogu panelu — dashboards, konto, skróty kadry. */
export const GLOBAL_SEARCH_EXTRAS: GlobalSearchExtraEntry[] = [
  {
    id: 'klub-hub',
    label: 'Strefa klubu',
    description: 'Moduły wspólne — obecność, czat, wyzwania i ranking',
    to: '/klub',
    icon: 'i-lucide-layout-grid',
    audiences: ['loggedIn'],
    keywords: 'hub klub moduły'
  },
  {
    id: 'klub-samouczek',
    label: 'Samouczek aplikacji',
    description: 'Interaktywny przewodnik po panelach i modułach klubu',
    to: '/klub/samouczek',
    icon: 'i-lucide-graduation-cap',
    audiences: ['loggedIn'],
    keywords: 'samouczek pomoc tutorial przewodnik help'
  },
  {
    id: 'athlete-dashboard',
    label: 'Panel zawodnika',
    description: 'Dashboard — starty, składki, dziennik i plany',
    to: '/athlete',
    icon: 'i-lucide-user',
    audiences: ['athlete'],
    keywords: 'dashboard zawodnik'
  },
  {
    id: 'trainer-dashboard',
    label: 'Panel trenera',
    description: 'Dashboard kadry — zespół, składki i monitoring',
    to: '/trainer',
    icon: 'i-lucide-dumbbell',
    audiences: ['trainer'],
    keywords: 'dashboard trener'
  },
  {
    id: 'admin-dashboard',
    label: 'Panel admina',
    description: 'Dashboard administracji klubu',
    to: '/admin',
    icon: 'i-lucide-layout-dashboard',
    audiences: ['admin'],
    keywords: 'dashboard admin'
  },
  {
    id: 'editor-cms',
    label: 'CMS — treści stron',
    description: 'Edycja treści publicznych stron i nawigacji',
    to: '/admin/cms',
    icon: 'i-lucide-layout-template',
    audiences: ['editor', 'admin'],
    keywords: 'cms treści strony'
  },
  {
    id: 'admin-konta',
    label: 'Konta użytkowników',
    description: 'Zarządzanie logowaniami i rolami',
    to: '/admin/konta',
    icon: 'i-lucide-key-round',
    audiences: ['admin'],
    keywords: 'konta użytkownicy hasła'
  },
  {
    id: 'athlete-wrapped',
    label: 'Slavia Wrapped',
    description: 'Podsumowanie roku treningowego zawodnika',
    to: '/athlete/wrapped',
    icon: 'i-lucide-gift',
    audiences: ['athlete'],
    keywords: 'wrapped podsumowanie rok'
  },
  {
    id: 'trainer-cwiczenia-slownik',
    label: 'Słownik ćwiczeń',
    description: 'Baza ćwiczeń poza dwubojem — panel trenera',
    to: '/trainer/cwiczenia-slownik',
    icon: 'i-lucide-book-open',
    audiences: ['trainer'],
    keywords: 'słownik ćwiczenia baza'
  },
  {
    id: 'trainer-exercises-legacy',
    label: 'Ćwiczenia (legacy)',
    description: 'Starszy widok ćwiczeń trenera',
    to: '/trainer/exercises',
    icon: 'i-lucide-dumbbell',
    audiences: ['trainer'],
    keywords: 'ćwiczenia ranking'
  },
  {
    id: 'aktualnosci-nowy',
    label: 'Nowy wpis aktualności',
    description: 'Redaguj nową aktualność na stronie klubu',
    to: '/aktualnosci/nowy',
    icon: 'i-lucide-pen-line',
    audiences: ['admin', 'editor'],
    keywords: 'blog wpis redakcja'
  }
]
