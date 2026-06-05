import type { Athlete as AthleteCard } from '~/components/AtheleteCard.vue'
import type { Athlete as AthleteModel } from '~/types/models'
import type { SinclairGender } from '~/utils/sinclair'
import { sinclairTotal } from '~/utils/sinclair'
import { effectiveBodyweightKgForSinclair, parseWeightCategoryLimitKg } from '~/utils/sinclairAthlete'

const MALE_WEIGHT_CATEGORIES = [60, 65, 70, 75, 85, 95, 110]
const FEMALE_WEIGHT_CATEGORIES = [49, 53, 57, 61, 69, 77, 86]

function cardGender(g: string | null | undefined): SinclairGender | null {
  return g === 'male' || g === 'female' ? g : null
}

function resolveWeightCategoryThreshold(
  gender: string | null | undefined,
  bodyweight?: number | null,
  rawCategory?: string | null
): number {
  const cats = gender === 'female' ? FEMALE_WEIGHT_CATEGORIES : MALE_WEIGHT_CATEGORIES
  const weight = bodyweight != null && Number.isFinite(bodyweight) && bodyweight > 0
    ? bodyweight
    : parseWeightCategoryLimitKg(rawCategory ?? undefined)
  if (weight <= 0) return 0
  const fallback = cats[cats.length - 1] ?? 0
  return cats.find(c => weight <= c) ?? fallback
}

function formatWeightCategoryText(threshold: number, bodyweight?: number | null): string {
  if (threshold <= 0) return '—'
  if (bodyweight != null && Number.isFinite(bodyweight) && bodyweight > 0 && bodyweight < threshold) {
    return `${threshold} (${Math.round(bodyweight)})`
  }
  return String(threshold)
}

/** Karta archiwalna — PB z profilu, bez rankingu ani wykresu startów. */
export function mapArchivedAthleteToCard(p: AthleteModel): AthleteCard {
  const snatchKg = Number(p.best_snatch_kg ?? 0)
  const cjKg = Number(p.best_clean_jerk_kg ?? 0)
  const totalKg = Number(p.total_kg ?? 0)
  const effectiveWeight = effectiveBodyweightKgForSinclair(p)
  const weightCategoryDisplay = resolveWeightCategoryThreshold(
    p.gender ?? undefined,
    p.bodyweight ?? undefined,
    p.weight_category ?? undefined
  )
  const weightCategoryText = formatWeightCategoryText(weightCategoryDisplay, p.bodyweight ?? undefined)
  const sg = cardGender(p.gender ?? undefined)
  let sc = 0
  if (totalKg > 0 && effectiveWeight > 0 && sg) {
    const calculated = sinclairTotal(totalKg, effectiveWeight, sg)
    if (!Number.isNaN(calculated)) sc = calculated
  }

  const chartHistory = totalKg > 0
    ? [{
        date: 'PB',
        total: totalKg,
        snatch: snatchKg,
        clean_and_jerk: cjKg,
        sinclair: effectiveWeight > 0 && sg ? Number(sinclairTotal(totalKg, effectiveWeight, sg).toFixed(2)) : null
      }]
    : []

  return {
    id: p.id,
    name: p.full_name,
    birthYear: p.birth_year || 0,
    weightCategory: weightCategoryDisplay,
    weightCategoryText,
    bodyweight: p.bodyweight ?? null,
    snatch: snatchKg,
    cleanAndJerk: cjKg,
    total: totalKg,
    sinclair: Number(sc.toFixed(2)),
    isActive: false,
    membershipPaid: null,
    hasStandingOrder: null,
    trainingStrip: null,
    description:
      (p.public_bio && String(p.public_bio).trim())
      || (p.profile_tagline && String(p.profile_tagline).trim())
      || p.notes
      || 'Były zawodnik CKS Slavia Ruda Śląska.',
    photo: p.image_url || undefined,
    chartHistory,
    maxHistory: totalKg > 0 ? totalKg * 1.15 : 300
  }
}
