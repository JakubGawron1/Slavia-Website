<script setup lang="ts">
/**
 * Produkcyjny panel analizy toru — spójny układ: wideo + wyniki w jednej karcie.
 */
import BarbellPathAnalyzer from '~/components/club/BarbellPathAnalyzer.client.vue'
import BarbellPathChart from '~/components/club/barbell/BarbellPathChart.client.vue'
import {
  detectLiftPhases,
  type BarbellSample,
  type BarbellTechniqueMetrics,
  type CameraQualityAssessment,
  type LiftPhaseAnalysis
} from '~/utils/barbellPathAnalysis'

const props = withDefaults(
  defineProps<{
    /** Trener / zawodnik — bez AI refine. */
    showLiftType?: boolean
  }>(),
  { showLiftType: true }
)

type LiftType = 'snatch' | 'clean_jerk' | 'unknown'

const analyzedSamples = ref<BarbellSample[]>([])
const rawSamples = ref<BarbellSample[]>([])
const pathSource = ref<'ai' | 'algorithm'>('algorithm')
const metrics = ref<BarbellTechniqueMetrics | null>(null)
const feedback = ref<string[]>([])
const cameraQuality = ref<CameraQualityAssessment | null>(null)
const playbackSec = ref<number | undefined>(undefined)
const liftType = ref<LiftType>('unknown')
const attemptWeightKg = ref<number | null>(null)

const hasResults = computed(() => analyzedSamples.value.length >= 2)

const phaseAnalysis = computed((): LiftPhaseAnalysis => {
  if (analyzedSamples.value.length < 6) {
    return { segments: [], splitIdx: null, cleanMarkerY: null, jerkMarkerY: null }
  }
  return detectLiftPhases(analyzedSamples.value, liftType.value)
})

const cameraBadgeColor = computed(() => {
  const score = cameraQuality.value?.score ?? 0
  if (score >= 75) return 'success'
  if (score >= 50) return 'warning'
  return 'error'
})

const metricTiles = computed(() => {
  if (!metrics.value) return []
  const m = metrics.value
  return [
    { label: 'Stabilność', value: `${m.stabilityScore}%`, accent: true },
    { label: 'Długość toru', value: String(m.trajectoryLength), accent: false },
    { label: 'Max odchyłka X', value: String(m.maxHorizontalDeviation), accent: false },
    { label: 'Śr. odchyłka', value: String(m.meanDeviation), accent: false },
    { label: 'Max prędkość Y', value: String(m.maxVerticalSpeed), accent: false }
  ]
})

function onAnalyzed(payload: {
  samples: BarbellSample[]
  rawSamples: BarbellSample[]
  metrics: BarbellTechniqueMetrics
  feedback: string[]
  pathSource: 'ai' | 'algorithm'
  cameraQuality?: CameraQualityAssessment | null
}) {
  analyzedSamples.value = payload.samples
  rawSamples.value = payload.rawSamples
  pathSource.value = payload.pathSource
  metrics.value = payload.metrics
  feedback.value = payload.feedback
  cameraQuality.value = payload.cameraQuality ?? null
  playbackSec.value = undefined
}

function onPlaybackTime(t: number) {
  playbackSec.value = t
}
</script>

<template>
  <div
    class="overflow-hidden rounded-3xl border border-default/60 bg-card shadow-sm ring-1 ring-primary/10"
  >
    <!-- Pasek konfiguracji sesji -->
    <div
      v-if="showLiftType"
      class="border-b border-default/50 bg-linear-to-r from-muted/30 via-card to-card px-4 py-4 sm:px-6"
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <UFormField
            label="Typ ruchu"
            class="min-w-0"
          >
            <USelect
              v-model="liftType"
              size="md"
              :items="[
                { label: 'Nie określono (auto)', value: 'unknown' },
                { label: 'Rwanie (snatch)', value: 'snatch' },
                { label: 'Podrzut (C&J)', value: 'clean_jerk' }
              ]"
            />
          </UFormField>
          <UFormField
            label="Ciężar podejścia (kg)"
            class="min-w-0"
          >
            <UInput
              v-model.number="attemptWeightKg"
              type="number"
              min="0"
              max="400"
              step="0.5"
              placeholder="np. 98"
            />
          </UFormField>
        </div>
        <p class="max-w-md text-[11px] leading-relaxed text-muted lg:text-right">
          Typ ruchu wpływa na fazy CLEAN/JERK lub PULL/SNATCH na wykresie. Ciężar pomaga oznaczyć próbę w sesji.
        </p>
      </div>
    </div>

    <!-- Główny obszar roboczy -->
    <div class="grid xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:items-start">
      <!-- Lewa kolumna: wideo + analiza -->
      <section class="min-w-0 border-b border-default/50 p-4 sm:p-6 xl:border-b-0 xl:border-r">
        <BarbellPathAnalyzer
          panel-embed
          premium-overlay
          :lift-type="liftType"
          @analyzed="onAnalyzed"
          @playback-time="onPlaybackTime"
        />
      </section>

      <!-- Prawa kolumna: wyniki -->
      <aside class="flex min-h-[280px] flex-col bg-muted/10 p-4 sm:p-6">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Wyniki
            </p>
            <h3 class="mt-1 text-base font-bold text-highlighted">
              Tor i metryki
            </h3>
          </div>
          <UBadge
            v-if="hasResults"
            color="primary"
            variant="subtle"
            size="sm"
          >
            Gotowe
          </UBadge>
        </div>

        <div
          v-if="!hasResults"
          class="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-default/70 bg-card/60 px-6 py-10 text-center"
        >
          <span class="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UIcon
              name="i-lucide-line-chart"
              class="size-6"
            />
          </span>
          <p class="text-sm font-semibold text-highlighted">
            Wykres pojawi się po analizie
          </p>
          <p class="mt-2 max-w-xs text-xs leading-relaxed text-muted">
            Wgraj wideo po lewej i uruchom analizę — tutaj zobaczysz profil toru, fazy ruchu i wskazówki techniczne.
          </p>
        </div>

        <template v-else>
          <div class="mb-4 flex flex-wrap gap-2">
            <UBadge
              v-if="attemptWeightKg"
              color="primary"
              variant="subtle"
            >
              {{ attemptWeightKg }} kg
            </UBadge>
            <UBadge
              v-if="cameraQuality"
              :color="cameraBadgeColor"
              variant="subtle"
            >
              Kadr {{ cameraQuality.score }}% · {{ cameraQuality.angle }}
            </UBadge>
            <UBadge
              v-for="seg in phaseAnalysis.segments"
              :key="seg.label"
              :color="seg.phase === 'jerk' || seg.phase === 'snatch' ? 'success' : 'error'"
              variant="subtle"
            >
              {{ seg.label }}
            </UBadge>
          </div>

          <BarbellPathChart
            class="shrink-0 overflow-hidden rounded-2xl border border-default/60 bg-card shadow-sm"
            :samples="analyzedSamples"
            :reference-samples="pathSource === 'ai' ? rawSamples : undefined"
            :until-sec="playbackSec"
            :lift-type="liftType"
            profile-relative
            lab-mode
          />

          <div
            v-if="metrics"
            class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"
          >
            <div
              v-for="tile in metricTiles"
              :key="tile.label"
              class="rounded-xl border border-default/50 bg-card px-3 py-2.5"
            >
              <p class="text-[10px] font-medium uppercase tracking-wide text-muted">
                {{ tile.label }}
              </p>
              <p
                class="mt-0.5 text-lg font-black tabular-nums"
                :class="tile.accent ? 'text-primary' : 'text-highlighted'"
              >
                {{ tile.value }}
              </p>
            </div>
          </div>

          <div
            v-if="feedback.length"
            class="mt-4 flex-1 rounded-2xl border border-primary/15 bg-linear-to-br from-primary/6 via-card to-card p-4"
          >
            <div class="mb-3 flex items-center gap-2">
              <UIcon
                name="i-lucide-lightbulb"
                class="size-4 text-primary"
              />
              <h4 class="text-sm font-bold text-highlighted">
                Wskazówki techniczne
              </h4>
            </div>
            <ul class="space-y-2 text-sm leading-relaxed text-muted">
              <li
                v-for="(msg, idx) in feedback"
                :key="idx"
                class="flex gap-2.5 rounded-lg bg-muted/20 px-2.5 py-2"
              >
                <span class="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{{ msg }}</span>
              </li>
            </ul>
          </div>
        </template>
      </aside>
    </div>
  </div>
</template>
