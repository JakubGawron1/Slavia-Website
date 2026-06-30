import type { RouteLocationRaw } from 'vue-router'
import type { Athlete, Competition } from '~/types/models'
import { PUBLIC_ROUTES, KLUB_SHARED_ROUTES } from '~/config/klubRoutes'

type GalleryPhoto = { id: string }

type BlogPost = { id: string, published?: boolean }

type ChallengeRow = {
  athlete_id: string
  full_name: string
  session_count?: number | null
}

export type KlubStatCard = {
  label: string
  value: string | number
  icon: string
  tone?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  hint?: string | null
  to?: RouteLocationRaw | string
}

type AttendanceSummary = {
  attendance_percent: number
  present_count: number
  pending_count: number
}

export function useKlubDashboardStats() {
  const auth = useAuth()
  const api = useApi()

  const { data: athletes, pending: athletesPending } = usePublicLazyFetch<Athlete[]>('athletes', {
    key: 'klub-stats-athletes',
    default: () => []
  })

  const { data: competitions, pending: competitionsPending } = usePublicLazyFetch<Competition[]>('competitions', {
    key: 'klub-stats-competitions',
    default: () => []
  })

  const { data: posts, pending: postsPending } = usePublicLazyFetch<BlogPost[]>('posts', {
    key: 'klub-stats-posts',
    default: () => []
  })

  const { data: photos, pending: photosPending } = usePublicLazyFetch<GalleryPhoto[]>('gallery', {
    key: 'klub-stats-gallery',
    default: () => []
  })

  const { data: challenge, pending: challengePending } = usePublicLazyFetch<{
    month: string
    leaderboard: ChallengeRow[]
  }>('challenges/monthly-training-sessions', {
    key: 'klub-stats-challenge',
    default: () => ({ month: '', leaderboard: [] })
  })

  const { data: roleStats, pending: rolePending } = useAsyncData(
    'klub-stats-role',
    async () => {
      await auth.ensureSession()
      if (auth.isAthlete.value && auth.user.value?.athlete_id) {
        const summary = await api<AttendanceSummary>(
          `/api/attendance/summary/${auth.user.value.athlete_id}`
        ).catch(() => null)
        return { kind: 'athlete' as const, summary }
      }
      if (auth.isTrainer.value || auth.isAdmin.value || auth.isSuperAdmin.value) {
        const pending = await api<{ id: string }[]>(
          '/api/attendance?verification_state=pending'
        ).catch(() => [])
        return { kind: 'staff' as const, pendingCount: pending.length }
      }
      return { kind: 'none' as const }
    },
    { default: () => ({ kind: 'none' as const }) }
  )

  const pending = computed(
    () =>
      athletesPending.value
      || competitionsPending.value
      || postsPending.value
      || photosPending.value
      || challengePending.value
      || rolePending.value
  )

  const activeAthletes = computed(
    () => (athletes.value ?? []).filter(a => a.is_active !== false).length
  )

  const clubCompetitions = computed(() =>
    (competitions.value ?? []).filter(
      c => !!c.club_participates && c.status !== 'cancelled'
    )
  )

  const upcomingClubStarts = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return clubCompetitions.value.filter(c => (c.date ?? '') >= today).length
  })

  const clubStartsThisYear = computed(() => {
    const year = new Date().getFullYear().toString()
    return clubCompetitions.value.filter(c => (c.date ?? '').startsWith(year)).length
  })

  const publishedPosts = computed(
    () => (posts.value ?? []).filter(p => p.published !== false).length
  )

  const challengeLeader = computed(() => challenge.value?.leaderboard?.[0] ?? null)

  const statCards = computed((): KlubStatCard[] => {
    const cards: KlubStatCard[] = [
      {
        label: 'Aktywni zawodnicy',
        value: activeAthletes.value,
        icon: 'i-lucide-users',
        tone: 'primary',
        hint: 'Ranking publiczny',
        to: PUBLIC_ROUTES.zawodnicy
      },
      {
        label: 'Nadchodzące starty klubu',
        value: upcomingClubStarts.value,
        icon: 'i-lucide-calendar-days',
        tone: 'info',
        hint: 'Zawody oznaczone w kalendarzu',
        to: PUBLIC_ROUTES.kalendarz
      },
      {
        label: 'Starty klubu w tym roku',
        value: clubStartsThisYear.value,
        icon: 'i-lucide-trophy',
        tone: 'success',
        hint: 'Łącznie zaplanowane i rozegrane',
        to: PUBLIC_ROUTES.kalendarz
      },
      {
        label: 'Aktualności',
        value: publishedPosts.value,
        icon: 'i-lucide-newspaper',
        tone: 'warning',
        to: PUBLIC_ROUTES.aktualnosci
      },
      {
        label: 'Zdjęcia w galerii',
        value: photos.value?.length ?? 0,
        icon: 'i-lucide-images',
        tone: 'neutral',
        to: PUBLIC_ROUTES.galeria
      }
    ]

    const leader = challengeLeader.value
    if (leader) {
      const sessions = leader.session_count ?? 0
      cards.push({
        label: 'Lider wyzwania',
        value: sessions,
        icon: 'i-lucide-flame',
        tone: 'warning',
        hint: leader.full_name,
        to: KLUB_SHARED_ROUTES.wyzwania
      })
    } else {
      cards.push({
        label: 'Wyzwanie miesiąca',
        value: '—',
        icon: 'i-lucide-flame',
        tone: 'neutral',
        hint: 'Brak wpisów w tym miesiącu',
        to: KLUB_SHARED_ROUTES.wyzwania
      })
    }

    const rs = roleStats.value
    if (rs?.kind === 'athlete' && rs.summary) {
      cards.push({
        label: 'Twoja frekwencja',
        value: `${rs.summary.attendance_percent}%`,
        icon: 'i-lucide-user-check',
        tone: rs.summary.attendance_percent >= 80 ? 'success' : 'warning',
        hint: `${rs.summary.present_count} obecności · ${rs.summary.pending_count} oczekuje`,
        to: KLUB_SHARED_ROUTES.obecnosc
      })
    } else if (rs?.kind === 'staff') {
      cards.push({
        label: 'Obecności do weryfikacji',
        value: rs.pendingCount,
        icon: 'i-lucide-clipboard-check',
        tone: rs.pendingCount > 0 ? 'warning' : 'success',
        hint: rs.pendingCount > 0 ? 'Wymaga kadry' : 'Kolejka pusta',
        to: KLUB_SHARED_ROUTES.obecnosc
      })
    }

    return cards
  })

  return { statCards, pending }
}
