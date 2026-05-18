export type ClubHistoryMilestoneCategory =
  | 'founding'
  | 'sport'
  | 'facility'
  | 'community'
  | 'digital'

export interface ClubHistoryMilestone {
  id: string
  year: number
  title: string
  description: string
  category: ClubHistoryMilestoneCategory
  icon: string
}

/** Kamienie milowe CKS Slavia — statyczna konfiguracja do czasu CMS/API. */
export const clubHistoryMilestones: ClubHistoryMilestone[] = [
  {
    id: 'founding',
    year: 1987,
    title: 'Założenie sekcji',
    description:
      'Powstanie sekcji podnoszenia ciężarów w Rudzie Śląskiej — pierwsze treningi młodzieży pod okiem pasjonatów sztangi olimpijskiej.',
    category: 'founding',
    icon: 'i-lucide-flag'
  },
  {
    id: 'first-starts',
    year: 1998,
    title: 'Pierwsze starty w lidze',
    description:
      'Debiut zawodników klubu w zawodach śląskich — regularne starty w lidze regionalnej i budowa tradycji startowej.',
    category: 'sport',
    icon: 'i-lucide-medal'
  },
  {
    id: 'konopnicka',
    year: 2008,
    title: 'Sala przy ul. Konopnickiej',
    description:
      'Stała baza treningowa przy ul. Konopnickiej 13 — miejsce, w którym trenujemy do dziś, z pomostami i sprzętem olimpijskim.',
    category: 'facility',
    icon: 'i-lucide-building-2'
  },
  {
    id: 'pzpc',
    year: 2014,
    title: 'Struktura CKS i PZPC',
    description:
      'Formalizacja klubu sportowego, przynależność do Polskiego Związku Podnoszenia Ciężarów i uporządkowany system grup wiekowych.',
    category: 'community',
    icon: 'i-lucide-shield-check'
  },
  {
    id: 'women-section',
    year: 2019,
    title: 'Rozwój sekcji kobiecej',
    description:
      'Dynamiczny wzrost liczby zawodniczek, starty w mistrzostwach Polski i wspólna sala dla wszystkich kategorii wiekowych.',
    category: 'sport',
    icon: 'i-lucide-users-round'
  },
  {
    id: 'national-podium',
    year: 2022,
    title: 'Medale na MP',
    description:
      'Wyróżnienia zawodników i zawodniczek na mistrzostwach Polski juniorów i seniorów — efekt wieloletniej pracy sztabu trenerskiego.',
    category: 'sport',
    icon: 'i-lucide-trophy'
  },
  {
    id: 'digital-slavia',
    year: 2025,
    title: 'Platforma Slavia',
    description:
      'Ranking Sinclair, dziennik treningowy, kalendarz startów i aplikacja mobilna — narzędzia łączące kadrę, zawodników i rodziców.',
    category: 'digital',
    icon: 'i-lucide-smartphone'
  }
]

export const clubHistoryCategoryLabels: Record<ClubHistoryMilestoneCategory, string> = {
  founding: 'Początki',
  sport: 'Sport',
  facility: 'Infrastruktura',
  community: 'Klub',
  digital: 'Cyfrowo'
}
