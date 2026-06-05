import { apiRoutes } from '~/config/api'
import { groupPublicBoardByAthlete } from '~/composables/usePublicFetch'
import type { Athlete, AthletePaymentStatusRow, CompetitionResult } from '~/types/models'
import {
  boardRowToCompetitionResult,
  mapAthleteToCard,
  resolveWeightCategoryThreshold,
  formatWeightCategoryText,
  cardGender,
  type PublicBoardRow
} from '~/utils/zawodnicyRanking'
import { sinclairTotal } from '~/utils/sinclair'
import { effectiveBodyweightKgForSinclair } from '~/utils/sinclairAthlete'

export function useZawodnicyPage() {
  const auth = useAuth()
  const apiFetch = useApi()

  const canSeeClubTrainingRanking = computed(() => auth.isTrainer.value || auth.isAdmin.value)

  const {
    data: playersRaw,
    pending: playersPending,
    error: playersError,
    refresh: refreshPlayersPublic
  } = usePublicLazyFetch<Athlete[]>('athletes', {
    key: 'players-public-athletes',
    default: () => [] as Athlete[]
  })

  const { data: publicBoardRaw } = usePublicLazyFetch<PublicBoardRow[]>('results/public-board', {
    key: 'players-public-board',
    default: () => [] as PublicBoardRow[]
  })

  if (import.meta.client) {
    onMounted(() => {
      const onFocus = () => {
        void refreshPlayersPublic()
      }
      window.addEventListener('focus', onFocus)
      onUnmounted(() => window.removeEventListener('focus', onFocus))
    })
  }

  const bundlePending = computed(() => playersPending.value)
  const error = computed(() => playersError.value)
  const status = computed(() => (bundlePending.value ? 'pending' : 'success'))
  const players = computed(() => playersRaw.value ?? [])

  const trainingByAthlete = ref<Record<string, CompetitionResult[]>>({})

  const competitionByAthlete = computed<Record<string, CompetitionResult[]>>(() => {
    const grouped = groupPublicBoardByAthlete<PublicBoardRow>(publicBoardRaw.value ?? [])
    const out: Record<string, CompetitionResult[]> = {}
    for (const [athleteId, rows] of Object.entries(grouped)) {
      out[athleteId] = rows
        .map(boardRowToCompetitionResult)
        .sort((a, b) => a.date.localeCompare(b.date))
    }
    return out
  })

  async function refreshTrainingResults() {
    trainingByAthlete.value = {}
    if (!auth.isLoggedIn.value || players.value.length === 0) return

    if (canSeeClubTrainingRanking.value) {
      const out: Record<string, CompetitionResult[]> = {}
      await Promise.all(
        players.value.map(async (p) => {
          out[p.id] = await apiFetch<CompetitionResult[]>(
            apiRoutes.results.athlete(p.id, 'training')
          ).catch(() => [] as CompetitionResult[])
        })
      )
      trainingByAthlete.value = out
      return
    }

    await auth.ensureSession()
    const myAthleteId = auth.user.value?.athlete_id
    if (!myAthleteId) return
    const rows = await apiFetch<CompetitionResult[]>(
      apiRoutes.results.athlete(myAthleteId, 'training')
    ).catch(() => [] as CompetitionResult[])
    trainingByAthlete.value = { [myAthleteId]: rows }
  }

  watch(
    [
      () => auth.isLoggedIn.value,
      () => players.value.length,
      () => auth.user.value?.athlete_id,
      () => canSeeClubTrainingRanking.value
    ],
    () => {
      void refreshTrainingResults()
    },
    { immediate: true }
  )

  function currentMonth() {
    return new Date().toISOString().slice(0, 7)
  }

  const { data: paymentStatuses } = useAsyncData(
    'players-payment-statuses',
    async () => {
      await auth.ensureSession()
      if (!auth.isLoggedIn.value) return [] as AthletePaymentStatusRow[]
      const q = `?month=${encodeURIComponent(currentMonth())}`
      return await apiFetch<AthletePaymentStatusRow[]>(`${apiRoutes.payments.status}${q}`).catch(() => [])
    },
    { default: () => [] as AthletePaymentStatusRow[] }
  )

  const paidByAthleteId = computed(() => {
    const map = new Map<string, boolean>()
    for (const r of (paymentStatuses.value ?? [])) {
      if (r?.athlete_id) map.set(r.athlete_id, !!r.is_paid)
    }
    return map
  })

  const categories = [
    { label: 'Wszyscy', value: 'all' },
    { label: 'Mężczyźni', value: 'male' },
    { label: 'Kobiety', value: 'female' }
  ]
  const selectedCategory = ref('all')
  const filterActiveOnly = ref(false)
  const filterWeightThreshold = ref<string>('all')
  const filterPaymentStaff = ref<'all' | 'paid' | 'unpaid' | 'standing'>('all')

  const canUseStaffFilters = computed(() =>
    auth.isLoggedIn.value && (auth.isTrainer.value || auth.isAdmin.value)
  )

  const weightCategoryFilterOptions = computed(() => {
    const set = new Set<number>()
    for (const p of players.value) {
      const t = resolveWeightCategoryThreshold(p.gender ?? undefined, p.bodyweight ?? undefined, p.weight_category ?? undefined)
      if (t > 0) set.add(t)
    }
    return [...set].sort((a, b) => a - b)
  })

  function playerPassesListFilters(p: Athlete): boolean {
    if (selectedCategory.value !== 'all' && p.gender !== selectedCategory.value) {
      return false
    }
    if (filterActiveOnly.value && p.is_active === false) {
      return false
    }
    if (filterWeightThreshold.value !== 'all') {
      const want = Number(filterWeightThreshold.value)
      const t = resolveWeightCategoryThreshold(p.gender ?? undefined, p.bodyweight ?? undefined, p.weight_category ?? undefined)
      if (!Number.isFinite(want) || t !== want) {
        return false
      }
    }
    if (canUseStaffFilters.value && filterPaymentStaff.value !== 'all') {
      const paid = paidByAthleteId.value.get(p.id) ?? false
      const so = p.has_standing_order === true
      if (filterPaymentStaff.value === 'paid' && !paid) return false
      if (filterPaymentStaff.value === 'unpaid' && paid) return false
      if (filterPaymentStaff.value === 'standing' && !so) return false
    }
    return true
  }

  const playersFiltered = computed(() => players.value.filter(playerPassesListFilters))

  function mapPlayerToCard(p: Athlete) {
    return mapAthleteToCard(
      p,
      competitionByAthlete.value,
      trainingByAthlete.value,
      paidByAthleteId.value,
      auth.isLoggedIn.value
    )
  }

  const mappedPlayers = computed(() =>
    playersFiltered.value
      .map(mapPlayerToCard)
      .sort((a, b) => b.sinclair - a.sinclair)
  )

  const rankingPlayers = computed(() => mappedPlayers.value.filter(x => x.total > 0 && x.sinclair > 0))
  const podium = computed(() => rankingPlayers.value.slice(0, 3))
  const filteredRankings = computed(() =>
    mappedPlayers.value.filter(x => x.total > 0 && x.sinclair > 0)
  )

  const trainingRanking = computed(() => {
    if (!auth.isLoggedIn.value) return []
    return playersFiltered.value
      .map((p) => {
        const approved = (trainingByAthlete.value[p.id] ?? [])
          .slice()
          .sort((a, b) => a.date.localeCompare(b.date))
        let bestRow: CompetitionResult | null = null
        for (const r of approved) {
          if (!bestRow || r.total > bestRow.total) bestRow = r
        }
        const totalKg = bestRow?.total ?? 0
        const effectiveWeight = effectiveBodyweightKgForSinclair(p)
        const sg = cardGender(p.gender ?? undefined)
        let sc = 0
        if (totalKg > 0 && effectiveWeight > 0 && sg) {
          const calc = sinclairTotal(totalKg, effectiveWeight, sg)
          if (!Number.isNaN(calc)) sc = calc
        }
        return {
          id: p.id,
          name: p.full_name,
          photo: p.image_url || undefined,
          weightCategoryText: formatWeightCategoryText(
            resolveWeightCategoryThreshold(p.gender ?? undefined, p.bodyweight ?? undefined, p.weight_category ?? undefined),
            p.bodyweight ?? undefined
          ),
          total: totalKg,
          sinclair: Number(sc.toFixed(2)),
          entries: approved.length
        }
      })
      .filter(x => x.entries > 0)
      .sort((a, b) => b.sinclair - a.sinclair)
  })

  const showTrainingSection = computed(() => auth.isLoggedIn.value && canSeeClubTrainingRanking.value)
  const trainingPodium = computed(() => trainingRanking.value.slice(0, 3))

  const exportKind = ref<'competition' | 'training'>('competition')

  function downloadRankingCsv() {
    const rows = exportKind.value === 'training' && canSeeClubTrainingRanking.value
      ? trainingRanking.value
      : filteredRankings.value
    const kindLabel = exportKind.value === 'training' ? 'trening' : 'zawody'
    const header = ['Pozycja', 'Imię i nazwisko', 'Kategoria', 'Total (kg)', 'Sinclair', 'Rodzaj rankingu']
    const lines = rows.map((r, i) => [
      String(i + 1),
      `"${String(r.name).replace(/"/g, '""')}"`,
      `"${String('weightCategoryText' in r ? (r.weightCategoryText || '') : '').replace(/"/g, '""')}"`,
      String(r.total ?? ''),
      String(r.sinclair ?? ''),
      kindLabel
    ].join(';'))
    const csv = `\uFEFF${header.join(';')}\n${lines.join('\n')}\n`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ranking-slavia-${kindLabel}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    auth,
    apiFetch,
    canSeeClubTrainingRanking,
    players,
    bundlePending,
    error,
    status,
    refreshPlayersPublic,
    competitionByAthlete,
    trainingByAthlete,
    categories,
    selectedCategory,
    filterActiveOnly,
    filterWeightThreshold,
    filterPaymentStaff,
    canUseStaffFilters,
    weightCategoryFilterOptions,
    playersFiltered,
    mappedPlayers,
    rankingPlayers,
    podium,
    filteredRankings,
    trainingRanking,
    showTrainingSection,
    trainingPodium,
    exportKind,
    downloadRankingCsv
  }
}
