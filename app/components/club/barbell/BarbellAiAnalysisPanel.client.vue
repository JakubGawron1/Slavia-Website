<script setup lang="ts">
/**
 * Panel analizy toru sztangi z AI — MoveNet, korekta toru vision, interpretacja LLM.
 */
import BarbellPathAnalyzer from '~/components/club/BarbellPathAnalyzer.client.vue'
import BarbellPathChart from '~/components/club/barbell/BarbellPathChart.client.vue'
import {
  buildBiomechanicalFeedback,
  detectLiftPhases,
  type BarbellSample,
  type BarbellTechniqueMetrics,
  type CameraQualityAssessment,
  type LiftPhaseAnalysis
} from '~/utils/barbellPathAnalysis'
import {
  useBarbellPathAi,
  type BarbellPathAiProviderId,
  type BarbellPathTrackingProviderId
} from '~/composables/useBarbellPathAi'
import { barbellPathQuotaMetrics } from '~/composables/useOlympicCoachAi'
import OlympicCoachQuotaStrip from '~/components/trainer/OlympicCoachQuotaStrip.vue'

const toast = useToast()

interface BarbellAttempt {
  id: string
  weightKg: number
  samples: BarbellSample[]
  rawSamples: BarbellSample[]
  pathSource: 'ai' | 'algorithm'
  metrics: BarbellTechniqueMetrics | null
  feedback: string[]
  refineMeta: { model: string; provider: string; method: string } | null
  refineNotes: string | null
  cameraQuality: CameraQualityAssessment | null
}

const attempts = ref<BarbellAttempt[]>([])
const activeAttemptId = ref<string | null>(null)
const pendingWeightKg = ref(98)

const analyzedSamples = ref<BarbellSample[]>([])
const rawSamples = ref<BarbellSample[]>([])
const pathSource = ref<'ai' | 'algorithm'>('algorithm')
const refineMeta = ref<{ model: string; provider: string; method: string } | null>(null)
const refineNotes = ref<string | null>(null)
const metrics = ref<BarbellTechniqueMetrics | null>(null)
const heuristicHints = ref<string[]>([])
const cameraQuality = ref<CameraQualityAssessment | null>(null)
const playbackSec = ref<number | undefined>(undefined)

type LiftType = 'snatch' | 'clean_jerk' | 'unknown'
const liftType = ref<LiftType>('unknown')

const {
  provider,
  trackingProvider,
  aiStatus,
  refineBlockedReason,
  providers,
  trackingProviders,
  loading: aiLoading,
  interpretation,
  lastModel,
  error: aiError,
  interpret,
  reset: resetAi
} = useBarbellPathAi()

const barbellQuotaMetrics = computed(() => barbellPathQuotaMetrics(aiStatus.value))
const aiRefineDisabled = computed(() => !!refineBlockedReason.value)
const hasResults = computed(() => analyzedSamples.value.length >= 2)

const phaseAnalysis = computed((): LiftPhaseAnalysis => {
  if (analyzedSamples.value.length < 6) {
    return { segments: [], splitIdx: null, cleanMarkerY: null, jerkMarkerY: null }
  }
  return detectLiftPhases(analyzedSamples.value, liftType.value)
})

const canAskAi = computed(
  () => analyzedSamples.value.length >= 6 && metrics.value != null && !aiLoading.value
)

const activeAttempt = computed(() =>
  attempts.value.find(a => a.id === activeAttemptId.value) ?? null
)

const cameraBadgeColor = computed(() => {
  const score = cameraQuality.value?.score ?? 0
  if (score >= 75) return 'success'
  if (score >= 50) return 'warning'
  return 'error'
})

function loadAttempt(attempt: BarbellAttempt) {
  activeAttemptId.value = attempt.id
  analyzedSamples.value = attempt.samples
  rawSamples.value = attempt.rawSamples
  pathSource.value = attempt.pathSource
  refineMeta.value = attempt.refineMeta
  refineNotes.value = attempt.refineNotes
  metrics.value = attempt.metrics
  heuristicHints.value = attempt.feedback
  cameraQuality.value = attempt.cameraQuality
  playbackSec.value = undefined
  resetAi()
}

function onAnalyzed(payload: {
  samples: BarbellSample[]
  rawSamples: BarbellSample[]
  metrics: BarbellTechniqueMetrics
  feedback: string[]
  pathSource: 'ai' | 'algorithm'
  refineMeta?: { model: string; provider: string; method: string } | null
  refineNotes?: string | null
  cameraQuality?: CameraQualityAssessment | null
}) {
  const weight = Math.max(0, pendingWeightKg.value || 0) || attempts.value.length + 1
  const attempt: BarbellAttempt = {
    id: `attempt-${Date.now()}`,
    weightKg: weight,
    samples: payload.samples,
    rawSamples: payload.rawSamples,
    pathSource: payload.pathSource,
    metrics: payload.metrics,
    feedback: payload.feedback,
    refineMeta: payload.refineMeta ?? null,
    refineNotes: payload.refineNotes ?? null,
    cameraQuality: payload.cameraQuality ?? null
  }
  attempts.value = [...attempts.value, attempt].slice(-5)
  loadAttempt(attempt)
  toast.add({
    title: `Zapisano próbę ${weight} kg`,
    color: 'success'
  })
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

function onTrackingProviderChange(id: BarbellPathTrackingProviderId) {
  trackingProvider.value = id
}
</script>

<template>
  <div class="overflow-hidden rounded-3xl border border-default/60 bg-card shadow-sm ring-1 ring-primary/10">
    <div class="border-b border-default/50 bg-linear-to-br from-primary/8 via-card to-card px-4 py-4 sm:px-6">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Analiza AI
          </p>
          <h2 class="mt-1 text-lg font-black text-highlighted sm:text-xl">
            Tor sztangi · MoveNet + Trener AI
          </h2>
          <p class="mt-1 max-w-2xl text-xs leading-relaxed text-muted sm:text-sm">
            Profil lub lekki kąt 3/4. Gradient prędkości, fazy CLEAN/JERK, korekta toru i interpretacja techniki.
          </p>
        </div>
        <div class="flex shrink-0 flex-col gap-2 lg:max-w-sm">
          <UAlert
            v-if="aiRefineDisabled"
            color="warning"
            variant="subtle"
            icon="i-lucide-shield-alert"
            title="Limit korekty toru"
            :description="refineBlockedReason ?? undefined"
            class="text-xs"
          />
        </div>
      </div>

      <div
        v-if="barbellQuotaMetrics.length"
        class="mt-4 rounded-xl border border-default/50 bg-muted/15 p-3"
      >
        <p class="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
          Limity free tier
        </p>
        <OlympicCoachQuotaStrip
          :metrics="barbellQuotaMetrics"
          :columns="2"
        />
      </div>
    </div>

    <div class="border-b border-default/50 px-4 py-4 sm:px-6">
      <div class="grid gap-3 sm:grid-cols-3">
        <UFormField label="Typ ruchu">
          <USelect
            v-model="liftType"
            size="md"
            :items="[
              { label: 'Nie określono', value: 'unknown' },
              { label: 'Rwanie (snatch)', value: 'snatch' },
              { label: 'Podrzut (C&J)', value: 'clean_jerk' }
            ]"
          />
        </UFormField>
        <UFormField label="Ciężar następnej próby (kg)">
          <UInput
            v-model.number="pendingWeightKg"
            type="number"
            min="0"
            max="400"
            step="0.5"
          />
        </UFormField>
        <UFormField label="Agent śledzenia toru">
          <USelect
            :model-value="trackingProvider"
            size="md"
            :items="trackingProviders.map(p => ({ label: p.label, value: p.id }))"
            @update:model-value="onTrackingProviderChange($event as BarbellPathTrackingProviderId)"
          />
        </UFormField>
      </div>
      <p class="mt-2 text-[11px] text-muted">
        {{ trackingProviders.find(p => p.id === trackingProvider)?.description }}
      </p>

      <div
        v-if="attempts.length"
        class="mt-4 flex flex-wrap items-center gap-2 border-t border-default/40 pt-4"
      >
        <span class="text-[10px] font-bold uppercase tracking-wider text-muted">Próby</span>
        <UButton
          v-for="att in attempts"
          :key="att.id"
          size="sm"
          :color="att.id === activeAttemptId ? 'primary' : 'neutral'"
          :variant="att.id === activeAttemptId ? 'solid' : 'outline'"
          class="min-w-16 font-bold tabular-nums"
          @click="loadAttempt(att)"
        >
          {{ att.weightKg }} kg
        </UButton>
      </div>
    </div>

    <div class="grid xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:items-start">
      <section class="min-w-0 border-b border-default/50 p-4 sm:p-6 xl:border-b-0 xl:border-r">
        <BarbellPathAnalyzer
          panel-embed
          ai-panel-embed
          premium-overlay
          :ai-refine-path="!aiRefineDisabled"
          :lift-type="liftType"
          :tracking-provider="trackingProvider"
          @analyzed="onAnalyzed"
          @playback-time="onPlaybackTime"
        />
      </section>

      <aside class="flex flex-col gap-4 bg-muted/10 p-4 sm:p-6">
        <div
          v-if="!hasResults"
          class="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-default/70 bg-card/50 px-6 py-10 text-center"
        >
          <UIcon
            name="i-lucide-sparkles"
            class="mb-3 size-8 text-primary/80"
          />
          <p class="text-sm font-semibold text-highlighted">
            Wyniki AI pojawią się tutaj
          </p>
          <p class="mt-2 max-w-xs text-xs text-muted">
            Po analizie: wykres 2D, metryki, fazy ruchu i opcjonalna interpretacja trenera LLM.
          </p>
        </div>

        <template v-else>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-if="cameraQuality"
              :color="cameraBadgeColor"
              variant="subtle"
            >
              Kadr {{ cameraQuality.score }}% · {{ cameraQuality.angle }}
            </UBadge>
            <UBadge
              v-if="activeAttempt"
              color="primary"
              variant="subtle"
            >
              {{ activeAttempt.weightKg }} kg
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
            class="overflow-hidden rounded-2xl border border-default/60 bg-card shadow-sm"
            :samples="analyzedSamples"
            :reference-samples="pathSource === 'ai' ? rawSamples : undefined"
            :until-sec="playbackSec"
            :lift-type="liftType"
            lab-mode
            profile-relative
          />

          <div
            v-if="pathSource === 'ai' && refineMeta"
            class="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-muted"
          >
            <p class="font-semibold text-highlighted">
              Tor skorygowany przez AI
            </p>
            <p class="mt-0.5 font-mono text-[10px]">
              {{ refineMeta.method }} · {{ refineMeta.provider }}
            </p>
            <p
              v-if="refineNotes"
              class="mt-1.5 text-sm leading-relaxed"
            >
              {{ refineNotes }}
            </p>
          </div>

          <div
            v-if="metrics"
            class="grid grid-cols-3 gap-2"
          >
            <div class="rounded-xl border border-default/50 bg-card px-3 py-2">
              <p class="text-[10px] text-muted">Stabilność</p>
              <p class="text-lg font-black text-primary">{{ metrics.stabilityScore }}%</p>
            </div>
            <div class="rounded-xl border border-default/50 bg-card px-3 py-2">
              <p class="text-[10px] text-muted">Długość</p>
              <p class="text-lg font-black text-highlighted">{{ metrics.trajectoryLength }}</p>
            </div>
            <div class="rounded-xl border border-default/50 bg-card px-3 py-2">
              <p class="text-[10px] text-muted">Max ΔX</p>
              <p class="text-lg font-black text-highlighted">{{ metrics.maxHorizontalDeviation }}</p>
            </div>
          </div>
        </template>

        <div class="mt-auto rounded-2xl border border-primary/20 bg-card p-4 shadow-sm">
          <div class="mb-3">
            <h3 class="text-sm font-bold text-highlighted">
              Interpretacja AI
            </h3>
            <p class="text-[11px] text-muted">
              Dodatkowy komentarz techniczny po narysowaniu toru
            </p>
          </div>

          <UFormField
            label="Agent"
            class="mb-3"
          >
            <USelect
              :model-value="provider"
              size="sm"
              :items="providers.map(p => ({ label: p.label, value: p.id }))"
              @update:model-value="onProviderChange($event as BarbellPathAiProviderId)"
            />
          </UFormField>

          <UButton
            block
            icon="i-lucide-sparkles"
            color="primary"
            size="md"
            :loading="aiLoading"
            :disabled="!canAskAi"
            @click="runAiInterpretation"
          >
            Poproś AI o ocenę
          </UButton>

          <div
            v-if="aiLoading"
            class="mt-3 flex items-center gap-2 rounded-lg bg-muted/20 px-3 py-2 text-xs text-muted"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="size-3.5 animate-spin"
            />
            Analiza techniczna…
          </div>

          <UAlert
            v-else-if="aiError"
            class="mt-3"
            color="error"
            variant="subtle"
            :title="aiError"
          />

          <div
            v-else-if="interpretation"
            class="mt-3 max-h-64 overflow-y-auto rounded-lg border border-primary/15 bg-primary/5 p-3"
          >
            <p
              v-if="lastModel"
              class="mb-2 font-mono text-[10px] text-muted"
            >
              {{ lastModel }}
            </p>
            <div class="whitespace-pre-wrap text-sm leading-relaxed text-highlighted">
              {{ interpretation }}
            </div>
          </div>

          <p
            v-else
            class="mt-3 text-[11px] leading-relaxed text-muted"
          >
            Tor jest korygowany przy analizie. Ten przycisk generuje rozszerzoną ocenę techniki.
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>
