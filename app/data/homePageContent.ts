import { PUBLIC_ROUTES } from '~/config/klubRoutes'

export interface HomeChampionRow {
  id: string
  full_name: string
  image_url?: string | null
  total: number
  sinclair: number
  weightCategory: string | null
  birthYear: number | null
}

export interface HomeNewsPost {
  id: string
  title: string
  content?: string
  image_url?: string
  created_at: string
}

export interface HomeTrainingGroup {
  id: string
  label: string
  ageRange: string
  description: string
  highlights: string[]
  icon: string
  accent: string
}

export interface HomeClubTool {
  to: string
  label: string
  description: string
  icon: string
}

export interface HomeFaqItem {
  q: string
  a: string
}

export const HOME_TRAINING_GROUPS: HomeTrainingGroup[] = [
  {
    id: 'youth',
    label: 'Młodzicy / Młodziczki',
    ageRange: '11–14 lat',
    description:
      'Pierwszy kontakt ze sztangą — technika ćwiczeń pomocniczych, koordynacja i ogólnorozwojówka. Bez ścigania się z ciężarem.',
    highlights: [
      'Bezpieczna nauka rwania i podrzutu',
      'Mobilność i stabilizacja na lata',
      'Aktywne zabawy i wzmacnianie ogółu'
    ],
    icon: 'i-lucide-sparkles',
    accent: 'from-success/15 to-success/0 border-success/35 text-success'
  },
  {
    id: 'junior',
    label: 'Juniorzy / Juniorki',
    ageRange: '15–20 lat',
    description:
      'Pełnoprawne treningi dwuboju — progres techniczny, plan startowy i pierwsze poważne zawody. Łączymy szkołę ze sportem.',
    highlights: [
      'Indywidualne plany treningowe',
      'Starty w lidze śląskiej i mistrzostwach Polski',
      'Prowadzenie obozów i zgrupowań'
    ],
    icon: 'i-lucide-trending-up',
    accent: 'from-amber-500/15 to-amber-500/0 border-amber-500/30 text-amber-600 dark:text-amber-300'
  },
  {
    id: 'senior',
    label: 'Senior / Open',
    ageRange: '20+ lat',
    description:
      'Trening dla dorosłych — od „chcę spróbować" po starty w zawodach mastersów. Praca pod indywidualne cele i tryb życia.',
    highlights: [
      'Plan dopasowany do pracy/życia',
      'Konsultacje techniczne i wideoanaliza',
      'Możliwość startu w zawodach klubowych'
    ],
    icon: 'i-lucide-flame',
    accent: 'from-primary/20 to-primary/0 border-primary/30 text-primary'
  }
]

export const HOME_CLUB_TOOLS: HomeClubTool[] = [
  {
    to: PUBLIC_ROUTES.zawodnicy,
    label: 'Zawodnicy i wyniki',
    description: 'Pełna lista kadry, ranking Sinclair i tablica startów z zawodów.',
    icon: 'i-lucide-trophy'
  },
  {
    to: '/kalkulator-sinclair',
    label: 'Kalkulator Sinclair',
    description: 'Przelicz dwubój na punkty Sinclair zgodnie ze wzorem 2025–2028.',
    icon: 'i-lucide-calculator'
  },
  {
    to: PUBLIC_ROUTES.proporcje,
    label: 'Kalkulator proporcji',
    description: '„Złote standardy" relacji między bojami — szybki audyt swoich maxów.',
    icon: 'i-lucide-sliders-horizontal'
  },
  {
    to: '/kalkulator-max-pr',
    label: 'Kalkulator Max PR',
    description: 'Szacuj 1RM z ciężaru i powtórzeń — przysiad, wycisk, martwy i inne ćwiczenia.',
    icon: 'i-lucide-dumbbell'
  },
  {
    to: PUBLIC_ROUTES.aktualnosci,
    label: 'Aktualności klubu',
    description: 'Relacje z zawodów, nowinki organizacyjne i życie sekcji.',
    icon: 'i-lucide-newspaper'
  },
  {
    to: PUBLIC_ROUTES.galeria,
    label: 'Galeria',
    description: 'Zdjęcia i filmy z treningów oraz startów na zawodach.',
    icon: 'i-lucide-camera'
  },
  {
    to: '/o-klubie',
    label: 'O klubie',
    description: 'Historia sekcji, kamienie milowe i tradycja CKS Slavia od założenia.',
    icon: 'i-lucide-history'
  },
  {
    to: '/kontakt',
    label: 'Kontakt',
    description: 'Napisz do nas — pomożemy zacząć przygodę z ciężarami.',
    icon: 'i-lucide-mail'
  }
]

export const HOME_FAQ: HomeFaqItem[] = [
  {
    q: 'Czy muszę mieć doświadczenie, żeby zacząć trenować?',
    a: 'Nie. Zdecydowana większość zawodników i zawodniczek przyszła do nas „z ulicy". Pierwsze tygodnie to bezpieczna nauka techniki i ogólnorozwojówka — bez ścigania się z ciężarami.'
  },
  {
    q: 'Czy potrzebuję własnego sprzętu na początek?',
    a: 'Wystarczą wygodne ubrania sportowe i zmienne obuwie. Sztangi, krążki i sprzęt techniczny — wszystko mamy na sali. Buty „lifterki" przydają się dopiero, gdy serio zaczynasz trenować dwubój.'
  },
  {
    q: 'Od jakiego wieku można dołączyć?',
    a: 'Standardowo prowadzimy grupy od ok. 11 roku życia. W indywidualnych przypadkach (np. rodzeństwo starszych zawodników) decyzję podejmuje trener po krótkim spotkaniu zapoznawczym.'
  },
  {
    q: 'Jak wygląda pierwszy trening?',
    a: 'Spokojnie. Zaczynamy od rozmowy o celach i zdrowiu, potem rozgrzewka, podstawowe ćwiczenia ogólnorozwojowe i pierwsze próby z drążkiem PCV lub bardzo lekką sztangą. Bez stresu.'
  },
  {
    q: 'Czy w klubie startują też dziewczyny i kobiety?',
    a: 'Oczywiście. Sekcja kobieca rośnie z roku na rok — startują w zawodach śląskich i ogólnopolskich, a sala zawsze jest „miksowana".'
  }
]

export const HOME_TRAINING_DAYS = [
  { day: 'Poniedziałek', hours: '15:00 – 18:00' },
  { day: 'Środa', hours: '15:00 – 18:00' },
  { day: 'Piątek', hours: '15:00 – 18:00' }
] as const

/** Identyfikatory sekcji strony głównej z opóźnioną hydratacją (F-15). */
export const HOME_LAZY_HYDRATED_SECTIONS = [
  'pillars-history-groups',
  'ranking',
  'news',
  'tools-gallery-footer'
] as const

export type HomeLazyHydratedSectionId = (typeof HOME_LAZY_HYDRATED_SECTIONS)[number]
