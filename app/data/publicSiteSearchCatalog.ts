import { KLUB_SHARED_ROUTES, PUBLIC_ROUTES } from '~/config/klubRoutes'
import type { GlobalSearchAudience } from '~/types/globalSearch'

export type PublicSiteSearchEntry = {
  id: string
  label: string
  description: string
  to: string
  icon: string
  /** Klucz strony CMS — treść pól trafia do indeksu wyszukiwania. */
  cmsPageName?: string
  /** Dodatkowe frazy (np. synonimy, słowa kluczowe SEO). */
  keywords?: string
  /** Domyślnie `public`. */
  audiences?: GlobalSearchAudience[]
}

/** Publiczne trasy klubu indeksowane w wyszukiwarce belki (bez paneli i tras wymagających logowania). */
export const PUBLIC_SITE_SEARCH_CATALOG: PublicSiteSearchEntry[] = [
  {
    id: 'home',
    label: 'Strona główna',
    description: 'CKS Slavia Ruda Śląska — treningi podnoszenia ciężarów, kadra i narzędzia klubowe.',
    to: '/',
    icon: 'i-lucide-home',
    cmsPageName: 'home',
    keywords: 'slavia ruda śląska klub ciężary trening'
  },
  {
    id: 'o-klubie',
    label: 'O klubie',
    description: 'Historia sekcji, kamienie milowe i tradycja CKS Slavia od założenia.',
    to: '/o-klubie',
    icon: 'i-lucide-history',
    cmsPageName: 'o-klubie',
    keywords: 'historia klubu kamienie milowe'
  },
  {
    id: 'kontakt',
    label: 'Kontakt',
    description: 'Zapisy na treningi, pytania o klub i współpracę — formularz kontaktowy.',
    to: '/kontakt',
    icon: 'i-lucide-mail',
    cmsPageName: 'kontakt',
    keywords: 'adres email telefon zapisy formularz'
  },
  {
    id: 'zawodnicy',
    label: 'Zawodnicy i ranking',
    description: 'Kadra klubu, ranking Sinclair i wyniki z zawodów.',
    to: PUBLIC_ROUTES.zawodnicy,
    icon: 'i-lucide-trophy',
    keywords: 'ranking sinclair kadra wyniki'
  },
  {
    id: 'wyniki-zawodow',
    label: 'Wyniki zawodów',
    description: 'Tablica startów i wyniki klubowiczów na zawodach.',
    to: `${PUBLIC_ROUTES.zawodnicy}#wyniki-zawodow`,
    icon: 'i-lucide-list-checks',
    keywords: 'wyniki zawody starty tablica'
  },
  {
    id: 'archiwum',
    label: 'Archiwum zawodników',
    description: 'Byli zawodnicy i zawodniczki sekcji.',
    to: '/zawodnicy/archiwum',
    icon: 'i-lucide-archive',
    keywords: 'archiwum byli zawodnicy'
  },
  {
    id: 'porownanie',
    label: 'Porównanie zawodników',
    description: 'Porównaj dwóch zawodników — Sinclair, boje i statystyki.',
    to: '/zawodnicy/porownanie',
    icon: 'i-lucide-git-compare',
    keywords: 'porównanie statystyki'
  },
  {
    id: 'kalendarz',
    label: 'Kalendarz',
    description: 'Zawody, treningi i wydarzenia klubowe.',
    to: PUBLIC_ROUTES.kalendarz,
    icon: 'i-lucide-calendar',
    keywords: 'zawody treningi wydarzenia terminy'
  },
  {
    id: 'aktualnosci',
    label: 'Aktualności',
    description: 'Relacje z zawodów, nowinki organizacyjne i życie sekcji.',
    to: PUBLIC_ROUTES.aktualnosci,
    icon: 'i-lucide-newspaper',
    keywords: 'aktualności blog wpisy'
  },
  {
    id: 'galeria',
    label: 'Galeria',
    description: 'Zdjęcia i filmy z treningów oraz startów na zawodach.',
    to: PUBLIC_ROUTES.galeria,
    icon: 'i-lucide-camera',
    keywords: 'zdjęcia filmy galeria'
  },
  {
    id: 'sinclair',
    label: 'Kalkulator Sinclair',
    description: 'Przelicz dwubój na punkty Sinclair (wzór 2025–2028).',
    to: '/kalkulator-sinclair',
    icon: 'i-lucide-calculator',
    keywords: 'sinclair kalkulator punkty dwubój'
  },
  {
    id: 'proporcje',
    label: 'Kalkulator proporcji',
    description: 'Złote standardy relacji między bojami — audyt swoich maxów.',
    to: PUBLIC_ROUTES.proporcje,
    icon: 'i-lucide-sliders-horizontal',
    keywords: 'proporcje boje przysiad wycisk martwy'
  },
  {
    id: 'max-pr',
    label: 'Kalkulator Max PR',
    description: 'Szacuj 1RM z ciężaru i powtórzeń — przysiad, wycisk, martwy i inne.',
    to: '/kalkulator-max-pr',
    icon: 'i-lucide-dumbbell',
    keywords: '1rm max pr kalkulator'
  },
  {
    id: 'wyzwania',
    label: 'Wyzwania miesiąca',
    description: 'Ranking aktywności treningowej w klubie.',
    to: KLUB_SHARED_ROUTES.wyzwania,
    icon: 'i-lucide-flame',
    keywords: 'wyzwania aktywność trening'
  },
  {
    id: 'rekordy',
    label: 'Rekordy klubu',
    description: 'Hall of fame i rekordy sekcji.',
    to: KLUB_SHARED_ROUTES.rekordy,
    icon: 'i-lucide-medal',
    keywords: 'rekordy hall of fame'
  },
  {
    id: 'ogloszenia',
    label: 'Tablica ogłoszeń',
    description: 'Komunikaty organizacyjne dla członków klubu.',
    to: PUBLIC_ROUTES.ogloszenia,
    icon: 'i-lucide-megaphone',
    audiences: ['loggedIn'],
    keywords: 'ogłoszenia tablica komunikaty'
  },
  {
    id: 'logowanie',
    label: 'Logowanie',
    description: 'Zaloguj się do panelu zawodnika, trenera lub admina.',
    to: '/logowanie',
    icon: 'i-lucide-log-in',
    audiences: ['guest'],
    keywords: 'konto hasło logowanie'
  }
]
