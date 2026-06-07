<script setup lang="ts">
/**
 * Analizator toru sztangi dla Barbell Lab — MoveNet + wykres 2D + interpretacja AI (Groq).
 */
import BarbellPathAnalyzer from '~/components/club/BarbellPathAnalyzer.client.vue'
import BarbellPathChart from '~/components/club/barbell/BarbellPathChart.client.vue'
import {
  buildBiomechanicalFeedback,
  type BarbellSample,
  type BarbellTechniqueMetrics
} from '~/utils/barbellPathAnalysis'
import { useBarbellPathAi, type BarbellPathAiProviderId } from '~/composables/useBarbellPathAi'

const toast = useToast()

const analyzedSamples = ref<BarbellSample[]>([])
const metrics = ref<BarbellTechniqueMetrics | null>(null)
const heuristicHints = ref<string[]>([])
const playbackSec = ref<number | undefined>(undefined)

type LiftType = 'snatch' | 'clean_jerk' | 'unknown'
const liftType = ref<LiftType>('unknown')

const {
  provider,
  providers,
  loading: aiLoading,
  interpretation,
  lastModel,
  error: aiError,
  interpret,
  reset: resetAi
} = useBarbellPathAi()

const displaySamples = computed(() => analyzedSamples.value)
const canAskAi = computed(
  () => analyzedSamples.value.length >= 6 && metrics.value != null && !aiLoading.value
)

function onAnalyzed(payload: {
  samples: BarbellSample[]
  metrics: BarbellTechniqueMetrics
  feedback: string[]
}) {
  analyzedSamples.value = payload.samples
  metrics.value = payload.metrics
  heuristicHints.value = payload.feedback
  playbackSec.value = undefined
  resetAi()
}

function onPlaybackTime(t: number) {
  playbackSec.value = t
}

async function runAiInterpretation() {
  if (!metrics.value || analyzedSamples.value.length < 6) {
    toast.add({
      title: 'Najpierw uruchom analizę wideo',
      color: 'warning'
    })
    return
  }

  const hints =
    heuristicHints.value.length > 0
      ? heuristicHints.value
      : buildBiomechanicalFeedback(analyzedSamples.value)

  const res = await interpret({
    samples: analyzedSamples.value,
    metrics: metrics.value,
    heuristicHints: hints,
    liftType: liftType.value
  })

  if (res) {
    toast.add({ title: 'Interpretacja AI gotowa', color: 'success' })
  } else if (aiError.value) {
    toast.add({ title: 'Błąd AI', description: aiError.value, color: 'error' })
  }
}

function onProviderChange(id: BarbellPathAiProviderId) {
  provider.value = id
  resetAi()
}
</script>

<template>
  <div class="space-y-8">
    <UAlert
      color="info"
      variant="subtle"
      icon="i-lucide-flask-conical"
      title="Barbell Lab — analiza toru"
      description="MoveNet w przeglądarce (offline). Interpretacja tekstowa przez klubowy Trener AI (Groq). Agent można podmienić w selektorze — domyślnie free tier Groq."
    />

    <BarbellPathAnalyzer
      lab-embed
      @analyzed="onAnalyzed"
      @playback-time="onPlaybackTime"
    />

    <div
      v-if="displaySamples.length >= 2"
      class="grid gap-6 lg:grid-cols-2"
    >
      <div class="space-y-4">
        <BarbellPathChart
          :samples="displaySamples"
          :until-sec="playbackSec"
        />
        <UCard
          v-if="metrics"
          class="rounded-2xl border-default/60"
        >
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-default/50 p-3">
              <p class="text-xs text-muted">Stabilność</p>
              <p class="text-xl font-black text-primary">{{ metrics.stabilityScore }}%</p>
            </div>
            <div class="rounded-xl border border-default/50 p-3">
              <p class="text-xs text-muted">Długość toru</p>
              <p class="text-xl font-black text-highlighted">{{ metrics.trajectoryLength }}</p>
            </div>
            <div class="rounded-xl border border-default/50 p-3">
              <p class="text-xs text-muted">Max odchyłka X</p>
              <p class="text-xl font-black text-highlighted">{{ metrics.maxHorizontalDeviation }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <UCard class="rounded-2xl border-primary/20">
        <template #header>
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="font-bold text-highlighted">
                Interpretacja AI
              </h3>
              <p class="mt-1 text-xs text-muted">
                Metryki toru + heurystyki lokalne → LLM (backend klubu)
              </p>
            </div>
            <UBadge
              color="primary"
              variant="subtle"
              size="sm"
            >
              Lab
            </UBadge>
          </div>
        </template>

        <div class="space-y-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <UFormField label="Typ ruchu">
              <USelect
                v-model="liftType"
                :items="[
                  { label: 'Nie określono', value: 'unknown' },
                  { label: 'Rwanie (snatch)', value: 'snatch' },
                  { label: 'Podrzut (C&J)', value: 'clean_jerk' }
                ]"
              />
            </UFormField>
            <UFormField label="Agent AI">
              <USelect
                :model-value="provider"
                :items="providers.map(p => ({ label: p.label, value: p.id }))"
                @update:model-value="onProviderChange($event as BarbellPathAiProviderId)"
              />
            </UFormField>
          </div>

          <p class="text-[11px] leading-relaxed text-muted">
            {{ providers.find(p => p.id === provider)?.description }}
          </p>

          <UButton
            block
            icon="i-lucide-sparkles"
            color="primary"
            :loading="aiLoading"
            :disabled="!canAskAi"
            @click="runAiInterpretation"
          >
            Poproś AI o ocenę techniki
          </UButton>

          <div
            v-if="aiLoading"
            class="flex items-center gap-2 rounded-xl bg-muted/20 px-4 py-3 text-sm text-muted"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="size-4 animate-spin"
            />
            Groq analizuje metryki toru…
          </div>

          <UAlert
            v-else-if="aiError"
            color="error"
            variant="subtle"
            :title="aiError"
          />

          <div
            v-else-if="interpretation"
            class="space-y-2 rounded-xl border border-primary/25 bg-primary/5 p-4"
          >
            <p
              v-if="lastModel"
              class="font-mono text-[10px] text-muted"
            >
              model: {{ lastModel }} · agent: {{ provider }}
            </p>
            <div class="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed text-highlighted dark:prose-invert">
              {{ interpretation }}
            </div>
          </div>

          <p
            v-else
            class="text-xs text-muted"
          >
            Uruchom analizę wideo, potem wygeneruj interpretację. Wskazówki AI nie zastępują oceny trenera.
          </p>
        </div>
      </UCard>
    </div>
  </div>
</template>
