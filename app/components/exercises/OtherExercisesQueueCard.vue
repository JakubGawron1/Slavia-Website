<script setup lang="ts">
import type { ExerciseSubmissionDto } from '~/types/models'

const props = defineProps<{
  pendingSubs: ExerciseSubmissionDto[]
  pending?: boolean
  exerciseItems: { label: string, value: string }[]
}>()

const emit = defineEmits<{
  approve: [submission: ExerciseSubmissionDto]
  reject: [submission: ExerciseSubmissionDto]
}>()

const queueQuery = ref('')
const queueExerciseFilter = ref<string>('all')

const queueFiltered = computed(() => {
  const q = queueQuery.value.trim().toLowerCase()
  return props.pendingSubs.filter((s) => {
    if (queueExerciseFilter.value !== 'all' && s.exercise_id !== queueExerciseFilter.value) return false
    if (!q) return true
    const hay = `${s.athlete_name || ''} ${s.athlete_id} ${s.exercise_name} ${s.notes || ''} ${s.value} ${s.performed_at}`.toLowerCase()
    return hay.includes(q)
  })
})

const queueStats = computed(() => {
  const list = props.pendingSubs
  return {
    total: list.length,
    uniqueAthletes: new Set(list.map(x => x.athlete_id)).size,
    uniqueExercises: new Set(list.map(x => x.exercise_id)).size
  }
})
</script>

<template>
  <UCard>
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <h2 class="text-lg font-semibold text-highlighted">Kolejka do zatwierdzenia</h2>
        <p class="mt-1 text-sm text-muted">
          Oczekujące:
          <span class="font-mono font-bold text-highlighted">{{ queueStats.total }}</span>
          · zawodników:
          <span class="font-mono font-bold text-highlighted">{{ queueStats.uniqueAthletes }}</span>
          · ćwiczeń:
          <span class="font-mono font-bold text-highlighted">{{ queueStats.uniqueExercises }}</span>
        </p>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
        <UFormField label="Szukaj" class="sm:w-64">
          <UInput v-model="queueQuery" icon="i-lucide-search" placeholder="Zawodnik, ćwiczenie, data…" />
        </UFormField>
        <UFormField label="Ćwiczenie" class="sm:w-72">
          <USelect
            v-model="queueExerciseFilter"
            :items="[{ label: 'Wszystkie', value: 'all' }, ...exerciseItems]"
            class="w-full"
          />
        </UFormField>
      </div>
    </div>

    <div v-if="pending" class="flex items-center gap-2 text-muted">
      <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
      Ładowanie…
    </div>
    <div v-else-if="!pendingSubs.length" class="text-sm text-muted">
      Brak oczekujących zgłoszeń — wszystko sprawdzone.
    </div>
    <div v-else-if="queueFiltered.length === 0" class="text-sm text-muted">
      Brak wyników dla podanych filtrów.
    </div>
    <div v-else class="space-y-2">
      <div
        v-for="r in queueFiltered"
        :key="r.id"
        class="flex flex-col gap-3 rounded-xl border border-default/60 p-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="text-sm">
          <p class="font-semibold text-highlighted">{{ r.athlete_name || r.athlete_id }}</p>
          <p class="text-muted">
            {{ r.exercise_name }} ·
            <span class="font-mono font-bold">{{ r.value }} {{ r.unit }}</span> · {{ r.performed_at }}
          </p>
          <p v-if="r.notes" class="mt-1 text-xs text-muted">Notatka zawodnika: {{ r.notes }}</p>
        </div>
        <div class="flex gap-2">
          <UButton size="sm" icon="i-lucide-check" @click="emit('approve', r)">Zatwierdź</UButton>
          <UButton size="sm" color="error" variant="soft" icon="i-lucide-x" @click="emit('reject', r)">
            Odrzuć
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>
