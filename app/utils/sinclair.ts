/**
 * Sinclair — okres **2025–2028** (wzór IWF).
 *
 * Stałe **A** i **b** (kg) zestawione tak, aby wyniki były zgodne z kalkulatorem
 * [PodnoszenieCiężarów.pl](https://podnoszenieciezarow.pl/kalkulator/sinclair)
 * (ten sam model: dla masy x ≥ b współczynnik = 1).
 *
 * Wzór (masa ciała x w kg):
 * - jeśli x ≥ b → współczynnik = 1
 * - jeśli x < b → współczynnik = 10^(A × (log₁₀(x/b))²)
 *
 * Total Sinclair = dwubój (kg) × współczynnik
 */
export type SinclairGender = 'male' | 'female'

/** Kalibracja: b z progu „przelicznik = 1”; A z wierszy 2025–2028 na PC.pl */
export const sinclair2025_2028 = {
  male: {
    /** dopasowanie m.in. do wiersza 100 kg / okres 2025–2028 */
    A: 0.7023570715147177,
    b: 201
  },
  female: {
    /** dopasowanie m.in. do wiersza 63 kg / okres 2025–2028 */
    A: 0.6734030019259942,
    b: 164
  }
} as const

export function sinclairCoefficient(bodyweightKg: number, gender: SinclairGender): number {
  if (!Number.isFinite(bodyweightKg) || bodyweightKg <= 0) {
    return Number.NaN
  }
  const { A, b } = sinclair2025_2028[gender]
  if (bodyweightKg >= b) {
    return 1
  }
  const logRatio = Math.log10(bodyweightKg / b)
  return 10 ** (A * logRatio * logRatio)
}

export function sinclairTotal(
  competitionTotalKg: number,
  bodyweightKg: number,
  gender: SinclairGender
): number {
  if (!Number.isFinite(competitionTotalKg) || competitionTotalKg <= 0) {
    return Number.NaN
  }
  const c = sinclairCoefficient(bodyweightKg, gender)
  if (Number.isNaN(c)) {
    return Number.NaN
  }
  return competitionTotalKg * c
}
