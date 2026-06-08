import { apiRoutes } from '~/config/api'

export type OtherExerciseOption = {
  id: string
  name: string
  category?: string | null
}

export async function useOtherExercisesCatalog(cacheKey: string, options?: { enabled?: () => boolean }) {
  const apiFetch = useApi()

  const { data: exercisesRaw, pending, refresh } = await useAsyncData(
    cacheKey,
    async (): Promise<OtherExerciseOption[]> => {
      if (options?.enabled && !options.enabled()) return []
      return await apiFetch<OtherExerciseOption[]>(apiRoutes.exercises.list).catch(() => [])
    },
    { default: () => [] }
  )

  const exerciseItems = computed(() =>
    (exercisesRaw.value ?? []).map(e => ({
      label: e.category ? `${e.name} · ${e.category}` : e.name,
      value: e.id
    }))
  )

  const selectedExerciseId = ref('')

  watch(
    () => exerciseItems.value,
    (items) => {
      if (selectedExerciseId.value) return
      selectedExerciseId.value = items[0]?.value ?? ''
    },
    { immediate: true }
  )

  const selectedExercise = computed(() =>
    (exercisesRaw.value ?? []).find(e => e.id === selectedExerciseId.value) ?? null
  )

  return {
    exercisesRaw,
    exerciseItems,
    selectedExerciseId,
    selectedExercise,
    pending,
    refresh
  }
}
