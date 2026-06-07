<script setup lang="ts">
/**
 * Analizator toru sztangi dla Barbell Lab — MoveNet + AI rysuje tor + wykres 2D.
 */
import BarbellPathAnalyzer from '~/components/club/BarbellPathAnalyzer.client.vue'
import BarbellPathChart from '~/components/club/barbell/BarbellPathChart.client.vue'
import {
  buildBiomechanicalFeedback,
  type BarbellSample,
  type BarbellTechniqueMetrics
} from '~/utils/barbellPathAnalysis'
import {
  useBarbellPathAi,
  type BarbellPathAiProviderId,
  type BarbellPathTrackingProviderId
} from '~/composables/useBarbellPathAi'
import { barbellPathQuotaMetrics } from '~/composables/useOlympicCoachAi'
import OlympicCoachQuotaStrip from '~/components/trainer/OlympicCoachQuotaStrip.vue'

const toast = useToast()

const analyzedSamples = ref<BarbellSample[]>([])
const rawSamples = ref<BarbellSample[]>([])
const pathSource = ref<'ai' | 'algorithm'>('algorithm')
const refineMeta = ref<{ model: string; provider: string; method: string } | null>(null)
const refineNotes = ref<string | null>(null)
const metrics = ref<BarbellTechniqueMetrics | null>(null)
const heuristicHints = ref<string[]>([])
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

const canAskAi = computed(
  () => analyzedSamples.value.length >= 6 && metrics.value != null && !aiLoading.value
)

function onAnalyzed(payload: {
  samples: BarbellSample[]
  rawSamples: BarbellSample[]
  metrics: BarbellTechniqueMetrics
  feedback: string[]
  pathSource: 'ai' | 'algorithm'
  refineMeta?: { model: string; provider: string; method: string } | null
  refineNotes?: string | null
}) {
  analyzedSamples.value = payload.samples
  rawSamples.value = payload.rawSamples
  pathSource.value = payload.pathSource
  refineMeta.value = payload.refineMeta ?? null
  refineNotes.value = payload.refineNotes ?? null
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

function onTrackingProviderChange(id: BarbellPathTrackingProviderId) {
  trackingProvider.value = id
}
</script>

<template>
  <div class="space-y-8">
    <UAlert
      color="info"
      variant="subtle"
      icon="i-lucide-flask-conical"
      title="Barbell Lab — tor rysowany z udziałem AI"
      description="MoveNet daje surowe punkty (szary tor). AI koryguje ścieżkę z klatek wideo (żółty). Limity free tier: max 2 analizy toru / min, 10 / dzień na użytkownika."
    />

    <UAlert
      v-if="aiRefineDisabled"
      color="warning"
      variant="subtle"
      icon="i-lucide-shield-alert"
      title="Limit korekty toru AI"
      :description="refineBlockedReason ?? undefined"
    />

    <UCard
      v-if="barbellQuotaMetrics.length"
      class="rounded-2xl border-default/60"
    >
      <template #header>
        <h3 class="text-sm font-bold text-highlighted">
          Limity free tier — tor AI
        </h3>
      </template>
      <OlympicCoachQuotaStrip
        :metrics="barbellQuotaMetrics"
        :columns="2"
      />
      <p class="mt-3 border-t border-default/50 pt-3 text-[11px] text-muted">
        Korekta toru (vision) ma osobne limity od czatu Trenera AI. Interpretacja tekstowa liczy się do limitu wiadomości.
      </p>
    </UCard>

    <UCard class="rounded-2xl border-default/60">
      <div class="grid gap-4 p-4 sm:grid-cols-2">
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
        <UFormField label="Agent śledzenia toru (rysowanie)">
          <USelect
            :model-value="trackingProvider"
            :items="trackingProviders.map(p => ({ label: p.label, value: p.id }))"
            @update:model-value="onTrackingProviderChange($event as BarbellPathTrackingProviderId)"
          />
        </UFormField>
      </div>
      <p class="border-t border-default/50 px-4 pb-4 pt-2 text-[11px] leading-relaxed text-muted">
        {{ trackingProviders.find(p => p.id === trackingProvider)?.description }}
      </p>
    </UCard>

    <BarbellPathAnalyzer
      lab-embed
      :ai-refine-path="!aiRefineDisabled"
      :lift-type="liftType"
      :tracking-provider="trackingProvider"
      @analyzed="onAnalyzed"
      @playback-time="onPlaybackTime"
    />

    <div
      v-if="analyzedSamples.length >= 2"
      class="grid gap-6 lg:grid-cols-2"
    >
      <div class="space-y-4">
        <BarbellPathChart
          :samples="analyzedSamples"
          :reference-samples="pathSource === 'ai' ? rawSamples : undefined"
          :until-sec="playbackSec"
        />
        <div
          v-if="pathSource === 'ai' && refineMeta"
          class="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-xs text-muted"
        >
          <p class="font-semibold text-highlighted">
            Tor narysowany przez AI
          </p>
          <p class="mt-1 font-mono text-[10px]">
            {{ refineMeta.method }} · {{ refineMeta.provider }} · {{ refineMeta.model }}
          </p>
          <p
            v-if="refineNotes"
            class="mt-2 text-sm leading-relaxed"
          >
            {{ refineNotes }}
          </p>
        </div>
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
                Interpretacja techniczna AI
              </h3>
              <p class="mt-1 text-xs text-muted">
                Opcjonalny komentarz trenera LLM po narysowaniu toru
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
          <UFormField label="Agent interpretacji">
            <USelect
              :model-value="provider"
              :items="providers.map(p => ({ label: p.label, value: p.id }))"
              @update:model-value="onProviderChange($event as BarbellPathAiProviderId)"
            />
          </UFormField>

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
            Analiza techniczna…
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
              model: {{ lastModel }}
            </p>
            <div class="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed text-highlighted dark:prose-invert">
              {{ interpretation }}
            </div>
          </div>

          <p
            v-else
            class="text-xs text-muted"
          >
            Tor jest już korygowany przez AI przy analizie. Ten przycisk generuje dodatkowy komentarz techniczny.
          </p>
        </div>
      </UCard>
    </div>
  </div>
</template>
