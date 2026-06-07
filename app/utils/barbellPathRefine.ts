import type { BarbellSample } from '~/utils/barbellPathAnalysis'
import type { BarbellVideoFrame } from '~/utils/barbellVideoFrames'

export type BarbellPathRefineProvider = 'auto' | 'groq_numeric' | 'groq_vision' | 'gemini_vision'

export interface BarbellPathRefineRequest {
  rawSamples: BarbellSample[]
  frames?: BarbellVideoFrame[]
  liftType?: 'snatch' | 'clean_jerk' | 'unknown'
  provider?: BarbellPathRefineProvider
}

export interface BarbellPathRefineResponse {
  samples: Array<{
    t: number
    barX: number
    barY: number
    hipMidX: number
    shoulderMidX: number
  }>
  model: string
  provider: string
  method: string
  notes?: string | null
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

/** Walidacja i normalizacja odpowiedzi AI — odrzuca uszkodzone punkty. */
export function sanitizeRefinedSamples(
  raw: BarbellSample[],
  refined: unknown
): BarbellSample[] | null {
  if (!Array.isArray(refined) || refined.length < 4) return null

  const out: BarbellSample[] = []
  for (let i = 0; i < refined.length; i++) {
    const p = refined[i] as Record<string, unknown>
    const src = raw[Math.min(i, raw.length - 1)]!
    const t = typeof p.t === 'number' && Number.isFinite(p.t) ? p.t : src.t
    const barX = typeof p.barX === 'number' ? clamp01(p.barX) : src.barX
    const barY = typeof p.barY === 'number' ? clamp01(p.barY) : src.barY
    const hipMidX =
      typeof p.hipMidX === 'number' ? clamp01(p.hipMidX) : src.hipMidX
    const shoulderMidX =
      typeof p.shoulderMidX === 'number'
        ? clamp01(p.shoulderMidX)
        : src.shoulderMidX
    out.push({ t, barX, barY, hipMidX, shoulderMidX })
  }
  return out.length >= 4 ? out : null
}

export function compactSamplesForApi(samples: BarbellSample[]) {
  return samples.map(s => ({
    t: Number(s.t.toFixed(3)),
    barX: Number(s.barX.toFixed(4)),
    barY: Number(s.barY.toFixed(4)),
    hipMidX: Number(s.hipMidX.toFixed(4)),
    shoulderMidX: Number(s.shoulderMidX.toFixed(4))
  }))
}
