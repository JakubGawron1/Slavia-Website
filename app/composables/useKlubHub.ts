import { KLUB_SHARED_ROUTES, PUBLIC_ROUTES } from '~/config/klubRoutes'
import type { KlubStatCard } from '~/composables/useKlubDashboardStats'
import type { DashboardModuleLink } from '~/utils/dashboardLink'

export type KlubHubContext = 'athlete' | 'trainer' | 'admin' | 'superadmin'

const HUB_COPY: Record<KlubHubContext, { headline: string, subline: string, cta: string }> = {
  athlete: {
    headline: 'Twój klub w jednym miejscu',
    subline: 'Frekwencja, wyzwania, czat i kalendarz — bez szukania w menu.',
    cta: 'Pełna strefa klubu'
  },
  trainer: {
    headline: 'Klub pod kontrolą kadry',
    subline: 'Weryfikuj obecności, śledź aktywność i reaguj na wydarzenia zespołu.',
    cta: 'Hub klubu'
  },
  admin: {
    headline: 'Centrum klubu Slavia',
    subline: 'Statystyki, komunikacja i moduły wspólne dla całej społeczności.',
    cta: 'Otwórz hub klubu'
  },
  superadmin: {
    headline: 'Puls klubu',
    subline: 'Szybki podgląd aktywności, frekwencji i treści publicznych.',
    cta: 'Strefa klubu'
  }
}

const STAT_PRIORITY: Record<KlubHubContext, string[]> = {
  athlete: [
    'Twoja frekwencja',
    'Lider wyzwania',
    'Wyzwanie miesiąca',
    'Nadchodzące wydarzenia',
    'Aktualności'
  ],
  trainer: [
    'Obecności do weryfikacji',
    'Aktywni zawodnicy',
    'Lider wyzwania',
    'Wyzwanie miesiąca',
    'Nadchodzące wydarzenia'
  ],
  admin: [
    'Obecności do weryfikacji',
    'Aktywni zawodnicy',
    'Aktualności',
    'Nadchodzące wydarzenia',
    'Lider wyzwania'
  ],
  superadmin: [
    'Aktywni zawodnicy',
    'Obecności do weryfikacji',
    'Nadchodzące wydarzenia',
    'Aktualności',
    'Zdjęcia w galerii'
  ]
}

const QUICK_PRIORITY: Record<KlubHubContext, string[]> = {
  athlete: [
    KLUB_SHARED_ROUTES.obecnosc,
    KLUB_SHARED_ROUTES.wyzwania,
    KLUB_SHARED_ROUTES.czat,
    PUBLIC_ROUTES.kalendarz,
    PUBLIC_ROUTES.aktualnosci,
    PUBLIC_ROUTES.zawodnicy
  ],
  trainer: [
    KLUB_SHARED_ROUTES.obecnosc,
    KLUB_SHARED_ROUTES.wyzwania,
    KLUB_SHARED_ROUTES.rekordy,
    KLUB_SHARED_ROUTES.czat,
    PUBLIC_ROUTES.kalendarz,
    PUBLIC_ROUTES.aktualnosci
  ],
  admin: [
    KLUB_SHARED_ROUTES.obecnosc,
    KLUB_SHARED_ROUTES.wyzwania,
    PUBLIC_ROUTES.aktualnosci,
    PUBLIC_ROUTES.kalendarz,
    KLUB_SHARED_ROUTES.powiadomienia,
    PUBLIC_ROUTES.galeria
  ],
  superadmin: [
    KLUB_SHARED_ROUTES.obecnosc,
    KLUB_SHARED_ROUTES.wyzwania,
    PUBLIC_ROUTES.aktualnosci,
    PUBLIC_ROUTES.kalendarz,
    PUBLIC_ROUTES.zawodnicy,
    KLUB_SHARED_ROUTES.czat
  ]
}

function pickStatsByLabel(cards: KlubStatCard[], priority: string[], limit: number): KlubStatCard[] {
  const picked: KlubStatCard[] = []
  const used = new Set<string>()
  for (const label of priority) {
    const match = cards.find(card => card.label === label && !used.has(card.label))
    if (!match) continue
    used.add(match.label)
    picked.push(match)
    if (picked.length >= limit) return picked
  }
  for (const card of cards) {
    if (used.has(card.label)) continue
    used.add(card.label)
    picked.push(card)
    if (picked.length >= limit) break
  }
  return picked
}

function pickQuickLinks(items: DashboardModuleLink[], context: KlubHubContext, limit = 5) {
  const normalized = items.map(item => ({
    ...item,
    path: item.to.split('?')[0] ?? item.to
  }))
  const priority = QUICK_PRIORITY[context]
  const picked: DashboardModuleLink[] = []
  const used = new Set<string>()

  for (const path of priority) {
    const match = normalized.find(item => item.path === path && !used.has(item.to))
    if (!match) continue
    used.add(match.to)
    picked.push(match)
    if (picked.length >= limit) return picked
  }

  for (const item of normalized) {
    if (used.has(item.to)) continue
    used.add(item.to)
    picked.push(item)
    if (picked.length >= limit) break
  }
  return picked
}

export function resolveKlubHubContext(explicit?: KlubHubContext | null): KlubHubContext {
  if (explicit) return explicit
  const auth = useAuth()
  if (auth.isSuperAdmin.value) return 'superadmin'
  if (auth.isAdmin.value) return 'admin'
  if (auth.isTrainer.value) return 'trainer'
  return 'athlete'
}

export function useKlubHub(explicitContext?: KlubHubContext | null) {
  const context = computed(() => resolveKlubHubContext(explicitContext))
  const { statCards, pending } = useKlubDashboardStats()
  const { moduleGroups } = useKlubDashboardNav()

  const copy = computed(() => HUB_COPY[context.value])

  const featuredStats = computed(() =>
    pickStatsByLabel(statCards.value, STAT_PRIORITY[context.value], 4)
  )

  const quickLinks = computed(() => {
    const items = moduleGroups.value.flatMap(g => g.items)
    return pickQuickLinks(items, context.value)
  })

  const hasQuickLinks = computed(() => quickLinks.value.length > 0)

  return {
    context,
    copy,
    featuredStats,
    quickLinks,
    hasQuickLinks,
    pending,
    hubPath: '/klub' as const
  }
}
