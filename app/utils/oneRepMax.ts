/** Wzory szacowania 1RM z ciężaru i liczby powtórzeń (pomocnicze ćwiczenia siłowe). */

export type OneRepMaxFormulaId = 'epley' | 'brzycki' | 'lombardi'

export interface OneRepMaxFormula {
  id: OneRepMaxFormulaId
  label: string
  short: string
}

export const ONE_REP_MAX_FORMULAS: OneRepMaxFormula[] = [
  { id: 'epley', label: 'Epley', short: '1 + reps/30' },
  { id: 'brzycki', label: 'Brzycki', short: '36 / (37 − reps)' },
  { id: 'lombardi', label: 'Lombardi', short: 'reps^0,10' }
]

export type AuxiliaryLiftId = 'squat' | 'bench' | 'deadlift' | 'other'

export const AUXILIARY_LIFTS: Record<AuxiliaryLiftId, string> = {
  squat: 'Przysiad',
  bench: 'Wyciskanie',
  deadlift: 'Martwy ciąg',
  other: 'Inne ćwiczenie'
}

/** Zaokrąglenie do 0,5 kg — jak na platformie startowej. */
export function roundHalfKg(n: number): number {
  return Math.round(n * 2) / 2
}

export function estimateOneRepMax(
  weightKg: number,
  reps: number,
  formula: OneRepMaxFormulaId = 'epley'
): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps)) return null
  if (weightKg <= 0 || reps <= 0) return null

  if (reps === 1) return roundHalfKg(weightKg)

  let raw: number
  switch (formula) {
    case 'brzycki':
      if (reps >= 37) return null
      raw = weightKg * (36 / (37 - reps))
      break
    case 'lombardi':
      raw = weightKg * reps ** 0.1
      break
    case 'epley':
    default:
      raw = weightKg * (1 + reps / 30)
      break
  }

  if (!Number.isFinite(raw) || raw <= 0) return null
  return roundHalfKg(raw)
}

/** Typowe procenty treningowe od szacowanego 1RM. */
export const TRAINING_PERCENTAGES = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50] as const

export function weightAtPercent(oneRmKg: number, percent: number): number {
  return roundHalfKg(oneRmKg * (percent / 100))
}
