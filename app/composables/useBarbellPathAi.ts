import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import type { BarbellSample, BarbellTechniqueMetrics } from '~/utils/barbellPathAnalysis'

/** Identyfikatory agentów — dodaj nowy wpis + handler w `interpret()`. */
export type BarbellPathAiProviderId = 'groq_coach'

export interface BarbellPathAiProviderMeta {
  id: BarbellPathAiProviderId
  label: string
  description: string
  /** Czy wymaga JWT / panelu (vs publiczny BFF). */
  requiresAuth: boolean
}

export const BARBELL_PATH_AI_PROVIDERS: BarbellPathAiProviderMeta[] = [
  {
    id: 'groq_coach',
    label: 'Groq LLaMA — Trener AI',
    description:
      'Klubowy backend (/api/ai/coach/chat). Domyślny agent — limity free tier Groq.',
    requiresAuth: true
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

function liftLabel(lift?: BarbellPathAiInput['liftType']) {
  if (lift === 'snatch') return 'rwanie (snatch)'
  if (lift === 'clean_jerk') return 'podrzut (clean & jerk)'
  return 'nie określono — oceń ogólnie pod dwubój'
}

export function buildBarbellPathAiMessage(input: BarbellPathAiInput): string {
  const { samples, metrics, heuristicHints, liftType } = input
  const duration =
    samples.length >= 2
      ? samples[samples.length - 1]!.t - samples[0]!.t
      : 0

  return `Analiza toru sztangi z nagrania wideo (MoveNet, profil boczny, współrzędne znormalizowane 0–1).

Typ ruchu (deklaracja użytkownika): ${liftLabel(liftType)}.
Liczba próbek w fazie aktywnej: ${samples.length}.
Czas trwania fazy: ${duration.toFixed(2)} s.

Metryki numeryczne:
- stabilność toru (0–100): ${metrics.stabilityScore}
- średnia odchyłka pozioma od linii bioder: ${metrics.meanDeviation}
- maks. odchyłka pozioma: ${metrics.maxHorizontalDeviation}
- długość trajektorii (norm.): ${metrics.trajectoryLength}
- maks. prędkość pionowa |vY|: ${metrics.maxVerticalSpeed}

Heurystyki lokalne (algorytm w przeglądarce — możesz je rozwinąć, nie powtarzaj wprost):
${heuristicHints.map(h => `- ${h}`).join('\n')}

Zadanie: podaj 3–5 konkretnych wskazówek technicznych dla zawodnika dwuboju olimpijskiego. Skup się na zbliżeniu sztangi, kontakcie z nogami, płynności toru i fazie eksplozywnej. Krótko, po polsku, listą.`
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

/**
 * Warstwa AI dla analizy toru — domyślnie Groq przez istniejący Trener AI.
 * Aby podmienić provider (np. Gemini direct), dodaj id w `BarbellPathAiProviderId`
 * i branch w `interpret()`.
 */
export function useBarbellPathAi() {
  const api = useApi()

  const provider = ref<BarbellPathAiProviderId>('groq_coach')
  const loading = ref(false)
  const interpretation = ref<string | null>(null)
  const lastModel = ref<string | null>(null)
  const error = ref<string | null>(null)

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
      let res: { reply: string; model: string }

      switch (provider.value) {
        case 'groq_coach':
          res = await interpretWithGroqCoach(api, message)
          break
        default:
          throw new Error(`Nieobsługiwany agent: ${provider.value}`)
      }

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

  return {
    provider,
    providers: BARBELL_PATH_AI_PROVIDERS,
    loading,
    interpretation,
    lastModel,
    error,
    interpret,
    reset
  }
}
