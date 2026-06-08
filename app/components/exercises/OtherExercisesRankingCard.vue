<script setup lang="ts">
import type { ExerciseBoardRowV2 } from '~/types/models'

const props = withDefaults(
  defineProps<{
    exerciseItems: { label: string, value: string }[]
    selectedExerciseId: string
    ranking: ExerciseBoardRowV2[]
    pending?: boolean
    highlightAthleteId?: string | null
    showExercisePicker?: boolean
  }>(),
  {
    pending: false,
    highlightAthleteId: null,
    showExercisePicker: true
  }
)

const emit = defineEmits<{
  'update:selectedExerciseId': [value: string]
}>()

const myRankIndex = computed(() => {
  const id = props.highlightAthleteId
  if (!id) return -1
  return props.ranking.findIndex(r => r.athlete_id === id)
})

function scrollToMyRank() {
  if (!import.meta.client) return
  const el = document.getElementById('other-exercises-my-rank-row')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const podium = computed(() => props.ranking.slice(0, 3))
</script>

<template>
  <div class="space-y-6">
    <UCard v-if="podium.length">
      <h2 class="mb-4 text-lg font-semibold text-highlighted">Podium</h2>
      <div class="grid gap-3 sm:grid-cols-3">
        <div
          v-for="(p, idx) in podium"
          :key="p.athlete_id"
          class="rounded-xl border border-default/60 bg-muted/10 p-4 text-center"
        >
          <p class="text-xs font-bold text-muted">#{{ idx + 1 }}</p>
          <p class="mt-1 font-semibold text-highlighted">{{ p.athlete_name }}</p>
          <p class="text-2xl font-black text-primary">
            {{ p.best_value }}<span class="text-sm"> {{ p.unit }}</span>
          </p>
        </div>
      </div>
    </UCard>

    <UCard>
      <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div class="min-w-0">
          <h2 class="text-lg font-semibold text-highlighted">Ranking klubu</h2>
          <p class="text-sm text-muted">
            Tylko zatwierdzone wyniki — osobno od startów w rwaniu i podrzucie.
          </p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
          <UFormField v-if="showExercisePicker" label="Ćwiczenie" class="sm:w-96">
            <USelect
              :model-value="selectedExerciseId"
              :items="exerciseItems"
              size="lg"
              class="w-full"
              @update:model-value="emit('update:selectedExerciseId', $event)"
            />
          </UFormField>
          <div v-if="highlightAthleteId" class="flex items-center gap-2">
            <UButton
              v-if="myRankIndex >= 0"
              size="sm"
              variant="soft"
              color="primary"
              icon="i-lucide-target"
              class="rounded-xl"
              @click="scrollToMyRank"
            >
              Skocz do mnie (#{{ myRankIndex + 1 }})
            </UButton>
            <UBadge
              v-else
              color="neutral"
              variant="subtle"
              size="sm"
              title="Brak Twojego zatwierdzonego wyniku w tym ćwiczeniu"
            >
              Brak Twojego wyniku
            </UBadge>
          </div>
        </div>
      </div>

      <div v-if="pending" class="flex items-center gap-2 text-muted">
        <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
        Ładowanie rankingu…
      </div>
      <div v-else-if="ranking.length === 0" class="text-sm text-muted">
        Brak zatwierdzonych wyników dla wybranego ćwiczenia.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b border-default text-left text-muted">
              <th class="py-2 pr-3">Msc.</th>
              <th class="py-2 px-3">Zawodnik</th>
              <th class="py-2 px-3 text-right">Wynik</th>
              <th class="py-2 px-3 text-right">Wpisów</th>
              <th class="py-2 pl-3">Ostatni</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in ranking"
              :id="highlightAthleteId && row.athlete_id === highlightAthleteId ? 'other-exercises-my-rank-row' : undefined"
              :key="row.athlete_id"
              class="border-b border-default/60 align-top"
              :class="highlightAthleteId && row.athlete_id === highlightAthleteId ? 'bg-primary/5' : ''"
            >
              <td class="py-2 pr-3 font-mono font-bold text-muted">{{ idx + 1 }}</td>
              <td class="py-2 px-3 font-medium text-highlighted">{{ row.athlete_name }}</td>
              <td class="py-2 px-3 text-right font-mono font-black text-primary">
                {{ row.best_value }} {{ row.unit }}
              </td>
              <td class="py-2 px-3 text-right font-mono text-muted">{{ row.entries }}</td>
              <td class="py-2 pl-3 font-mono text-xs text-muted">{{ row.last_performed_at || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
