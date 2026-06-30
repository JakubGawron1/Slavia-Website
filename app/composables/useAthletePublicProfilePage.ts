import type { AthletePublicProfile, CompetitionResult } from '~/types/models'
import { publicApiUrl } from '~/composables/usePublicFetch'
import { parseSlugId } from '~/utils/slug'

const PUBLIC_PROFILE_FETCH = {
  timeout: 12_000,
  cache: 'no-store' as const,
  headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
}

/** Dane i uprawnienia profilu publicznego zawodnika (`/athlete/[slug]`). */
export async function useAthletePublicProfilePage() {
  const route = useRoute()
  const apiFetch = useApi()
  const auth = useAuth()

  const shareLite = computed(() => {
    const q = route.query.share
    return q === '1' || q === 'public'
  })

  const athleteId = computed(() => parseSlugId(String(route.params.slug || '')))

  const canViewAthleteTraining = computed(() => {
    if (shareLite.value) return false
    if (!auth.isLoggedIn.value) return false
    if (auth.isTrainer.value || auth.isAdmin.value) return true
    const linked = auth.user.value?.athlete_id
    return !!(linked && linked === athleteId.value)
  })

  const canEditAthlete = computed(() => auth.isTrainer.value)

  const athleteDetailKey = computed(() => `athlete-detail-${athleteId.value}`)
  const { data: athlete, error } = await useAsyncData(
    athleteDetailKey,
    async () => {
      if (!athleteId.value) return null
      return await $fetch<AthletePublicProfile>(
        publicApiUrl(`athletes/${encodeURIComponent(athleteId.value)}`),
        PUBLIC_PROFILE_FETCH
      )
    },
    { watch: [athleteId] }
  )

  const athleteResultsKey = computed(() => `athlete-results-${athleteId.value}`)
  const { data: results } = await useAsyncData(
    athleteResultsKey,
    async () => {
      if (!athleteId.value) return []
      return await $fetch<CompetitionResult[]>(
        publicApiUrl(`results/athlete/${encodeURIComponent(athleteId.value)}`),
        PUBLIC_PROFILE_FETCH
      ).catch(() => [] as CompetitionResult[])
    },
    { watch: [athleteId], default: () => [] }
  )

  const athleteTrainingKey = computed(() => `athlete-training-${athleteId.value}`)
  const { data: trainingResults } = await useLazyAsyncData(
    athleteTrainingKey,
    async () => {
      if (!athleteId.value || shareLite.value) return []
      await auth.ensureSession()
      if (!auth.isLoggedIn.value) return []
      if (!canViewAthleteTraining.value) return []
      return await apiFetch<CompetitionResult[]>(
        `/api/results/athlete/${encodeURIComponent(athleteId.value)}?kind=training`
      ).catch(() => [] as CompetitionResult[])
    },
    {
      watch: [
        athleteId,
        () => auth.isLoggedIn.value,
        shareLite,
        () => auth.user.value?.athlete_id,
        () => auth.isTrainer.value,
        () => auth.isAdmin.value
      ],
      default: () => []
    }
  )

  return {
    shareLite,
    athleteId,
    canViewAthleteTraining,
    canEditAthlete,
    athlete,
    error,
    results,
    trainingResults
  }
}
