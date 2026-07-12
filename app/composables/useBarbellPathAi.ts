import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import {
  barbellPathRefineBlockedReason,
  type OlympicCoachStatus
} from '~/composables/useOlympicCoachAi'
import type { BarbellSample, BarbellTechniqueMetrics } from '~/utils/barbellPathAnalysis'
import {
  compactSamplesForApi,
  normalizeRefinedSamples,
  type BarbellPathRefineProvider,
  type BarbellPathRefineResponse
} from '~/utils/barbellPathRefine'
import type { BarbellVideoFrame } from '~/utils/barbellVideoFrames'

/** Agenci interpretacji tekstowej (po narysowaniu toru). */
export type BarbellPathAiProviderId = 'groq_coach'

/** Agenci korekty / rysowania toru. */
export type BarbellPathTrackingProviderId = BarbellPathRefineProvider

export interface BarbellPathAiProviderMeta {
  id: BarbellPathAiProviderId
  label: string
  description: string
  requiresAuth: boolean
}

export interface BarbellPathTrackingProviderMeta {
  id: BarbellPathTrackingProviderId
  label: string
  description: string
}

export const BARBELL_PATH_AI_PROVIDERS: BarbellPathAiProviderMeta[] = [
  {
    id: 'groq_coach',
    label: 'Groq LLaMA — Trener AI',
    description:
      'Klubowy backend (/api/ai/coach/chat). Interpretacja techniczna po narysowaniu toru.',
    requiresAuth: true
  }
]

export const BARBELL_PATH_TRACKING_PROVIDERS: BarbellPathTrackingProviderMeta[] = [
  {
    id: 'auto',
    label: 'Auto (vision → numeric)',
    description:
      'Groq vision z klatek wideo, gdy są dostępne — w przeciwnym razie korekta numeryczna.'
  },
  {
    id: 'groq_vision',
    label: 'Groq Vision',
    description: 'Llama vision na klatkach wideo + korekta toru (GROQ_VISION_MODEL).'
  },
  {
    id: 'groq_numeric',
    label: 'Groq numeric',
    description: 'Korekta samego wektora współrzędnych bez vision (szybsze, słabsze).'
  }
]

export interface BarbellPathAiInput {
  samples: BarbellSample[]
  metrics: BarbellTechniqueMetrics
  heuristicHints: string[]
  liftType?: 'snatch' | 'clean_jerk' | 'unknown'
}

export interface BarbellPathAiResult {
  reply: string
  model: string
  provider: BarbellPathAiProviderId
}

export interface BarbellPathRefineInput {
  rawSamples: BarbellSample[]
  frames?: BarbellVideoFrame[]
  liftType?: 'snatch' | 'clean_jerk' | 'unknown'
}

export interface BarbellPathRefineResult {
  samples: BarbellSample[]
  model: string
  provider: string
  method: string
  notes?: string | null
}

function liftLabel(lift?: BarbellPathRefineInput['liftType']) {
  if (lift === 'snatch') return 'rwanie (snatch)'
  if (lift === 'clean_jerk') return 'podrzut (clean & jerk)'
  return 'nie określono'
}

export function buildBarbellPathAiMessage(input: BarbellPathAiInput): string {
  const { samples, metrics, heuristicHints, liftType } = input
  const duration =
    samples.length >= 2
      ? samples[samples.length - 1]!.t - samples[0]!.t
      : 0

  return `Analiza toru sztangi (AI-skorygowany tor, profil boczny, współrzędne 0–1).

Typ ruchu: ${liftLabel(liftType)}.
Próbek: ${samples.length}, czas fazy: ${duration.toFixed(2)} s.

Metryki:
- stabilność: ${metrics.stabilityScore}%
- średnia odchyłka X: ${metrics.meanDeviation}
- max odchyłka X: ${metrics.maxHorizontalDeviation}
- długość trajektorii: ${metrics.trajectoryLength}
- max |vY|: ${metrics.maxVerticalSpeed}

Heurystyki lokalne:
${heuristicHints.map(h => `- ${h}`).join('\n')}

Podaj 3–5 konkretnych wskazówek technicznych (lista, po polsku).`
}

function mapRefineResponse(res: BarbellPathRefineResponse): BarbellSample[] {
  return res.samples.map(s => ({
    t: s.t,
    barX: s.barX,
    barY: s.barY,
    hipMidX: s.hipMidX,
    shoulderMidX: s.shoulderMidX
  }))
}

async function interpretWithGroqCoach(
  api: ReturnType<typeof useApi>,
  message: string
): Promise<{ reply: string; model: string }> {
  return api<{ reply: string; model: string }>(apiRoutes.aiCoach.chat, {
    method: 'POST',
    body: {
      message,
      mode: 'barbell_path',
      history: []
    },
    timeout: 120_000
  })
}

function trimFramesForApi(frames?: BarbellVideoFrame[]): BarbellVideoFrame[] | undefined {
  if (!frames?.length) return undefined
  const maxTotalB64 = 1_800_000
  const out: BarbellVideoFrame[] = []
  let total = 0
  for (const f of frames) {
    const len = f.jpegBase64.length
    if (total + len > maxTotalB64) break
    out.push(f)
    total += len
  }
  return out.length ? out : undefined
}

export function useBarbellPathAi() {
  const api = useApi()

  const provider = ref<BarbellPathAiProviderId>('groq_coach')
  const trackingProvider = ref<BarbellPathTrackingProviderId>('auto')
  const aiStatus = ref<OlympicCoachStatus | null>(null)
  const statusLoading = ref(false)
  const loading = ref(false)
  const refining = ref(false)
  const interpretation = ref<string | null>(null)
  const refineNotes = ref<string | null>(null)
  const lastModel = ref<string | null>(null)
  const lastRefineMeta = ref<{ model: string; provider: string; method: string } | null>(null)
  const error = ref<string | null>(null)
  const refineError = ref<string | null>(null)

  const refineBlockedReason = computed(() => barbellPathRefineBlockedReason(aiStatus.value))

  async function refreshAiStatus() {
    statusLoading.value = true
    try {
      aiStatus.value = await api<OlympicCoachStatus>(apiRoutes.aiCoach.status)
    } catch {
      aiStatus.value = null
    } finally {
      statusLoading.value = false
    }
  }

  async function refinePath(input: BarbellPathRefineInput): Promise<BarbellPathRefineResult | null> {
    if (refining.value) return null
    if (input.rawSamples.length < 4) {
      refineError.value = 'Za mało punktów do korekty AI (min. 4).'
      return null
    }

    const blocked = refineBlockedReason.value
    if (blocked) {
      refineError.value = blocked
      return null
    }

    refining.value = true
    refineError.value = null
    refineNotes.value = null
    lastRefineMeta.value = null

    try {
      const apiFrames = trimFramesForApi(input.frames)
      const res = await api<BarbellPathRefineResponse>(apiRoutes.aiCoach.barbellPathRefine, {
        method: 'POST',
        body: {
          rawSamples: compactSamplesForApi(input.rawSamples),
          frames: apiFrames?.map(f => ({ t: f.t, jpegBase64: f.jpegBase64 })),
          liftType: input.liftType ?? 'unknown',
          provider: trackingProvider.value
        },
        timeout: 90_000
      })

      const mapped = mapRefineResponse(res)
      const sanitized = normalizeRefinedSamples(input.rawSamples, mapped)
      if (!sanitized) {
        refineError.value = 'AI zwróciło nieprawidłowy tor — użyto detekcji MoveNet.'
        return null
      }

      lastRefineMeta.value = {
        model: res.model,
        provider: res.provider,
        method: res.method
      }
      refineNotes.value = res.notes ?? null

      await refreshAiStatus().catch(() => {})

      return {
        samples: sanitized,
        model: res.model,
        provider: res.provider,
        method: res.method,
        notes: res.notes
      }
    } catch (e) {
      refineError.value = getApiErrorMessage(e, 'AI nie poprawiło toru — użyto detekcji algorytmicznej.')
      await refreshAiStatus().catch(() => {})
      return null
    } finally {
      refining.value = false
    }
  }

  async function interpret(input: BarbellPathAiInput): Promise<BarbellPathAiResult | null> {
    if (loading.value) return null
    if (input.samples.length < 6) {
      error.value = 'Za mało punktów toru do interpretacji AI (min. 6).'
      return null
    }

    loading.value = true
    error.value = null
    interpretation.value = null
    lastModel.value = null

    const message = buildBarbellPathAiMessage(input)

    try {
      const res = await interpretWithGroqCoach(api, message)
      interpretation.value = res.reply
      lastModel.value = res.model
      return { reply: res.reply, model: res.model, provider: provider.value }
    } catch (e) {
      error.value = getApiErrorMessage(e, 'Nie udało się uzyskać interpretacji AI.')
      return null
    } finally {
      loading.value = false
    }
  }

  function reset() {
    interpretation.value = null
    lastModel.value = null
    error.value = null
  }

  function resetRefine() {
    refineNotes.value = null
    lastRefineMeta.value = null
    refineError.value = null
  }

  if (import.meta.client) {
    void refreshAiStatus()
  }

  return {
    provider,
    trackingProvider,
    aiStatus,
    statusLoading,
    refineBlockedReason,
    providers: BARBELL_PATH_AI_PROVIDERS,
    trackingProviders: BARBELL_PATH_TRACKING_PROVIDERS,
    loading,
    refining,
    interpretation,
    refineNotes,
    lastModel,
    lastRefineMeta,
    error,
    refineError,
    refreshAiStatus,
    refinePath,
    interpret,
    reset,
    resetRefine
  }
}
