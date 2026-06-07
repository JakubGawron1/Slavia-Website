import type { Athlete, CompetitionResult } from '~/types/models'
import type { ClubHallOfFameRecordCardData } from '~/components/club/ClubHallOfFameRecordCard.vue'
import type { SinclairGender } from '~/utils/sinclair'
import { sinclairTotal } from '~/utils/sinclair'
import { effectiveBodyweightKgForSinclair, parseWeightCategoryLimitKg } from '~/utils/sinclairAthlete'

export const MALE_WEIGHT_CATEGORIES = [60, 65, 70, 75, 85, 95, 110]
export const FEMALE_WEIGHT_CATEGORIES = [49, 53, 57, 61, 69, 77, 86]

export function cardGender(g: string | null | undefined): SinclairGender | null {
  return g === 'male' || g === 'female' ? g : null
}

export function resolveWeightCategoryThreshold(
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

export function formatWeightCategoryText(threshold: number, bodyweight?: number | null): string {
  if (threshold <= 0) return '—'
  if (bodyweight != null && Number.isFinite(bodyweight) && bodyweight > 0 && bodyweight < threshold) {
    return `${threshold} (${Math.round(bodyweight)})`
  }
  return String(threshold)
}

export interface PublicBoardRow {
  id: string
  athlete_id: string
  snatch: number
  clean_and_jerk: number
  total: number
  date: string
  kind?: string
  location?: string | null
  squat_kg?: number | null
  bench_kg?: number | null
  deadlift_kg?: number | null
}

export function boardRowToCompetitionResult(row: PublicBoardRow): CompetitionResult {
  return {
    id: row.id,
    athlete_id: row.athlete_id,
    snatch: row.snatch,
    clean_and_jerk: row.clean_and_jerk,
    total: row.total,
    status: 'Approved',
    date: row.date,
    kind: 'competition',
    location: row.location ?? null,
    squat_kg: row.squat_kg,
    bench_kg: row.bench_kg,
    deadlift_kg: row.deadlift_kg
  }
}

export function normalizeApprovedCompetition(rows: CompetitionResult[] | null | undefined) {
  return (rows ?? [])
    .filter(r => r && r.status === 'Approved')
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function approvedCompetitionStarts(rows: CompetitionResult[] | null | undefined) {
  return normalizeApprovedCompetition(rows).filter(r => r.kind !== 'training')
}

export function pickBestCompetitionStart(rows: CompetitionResult[]): CompetitionResult | null {
  let best: CompetitionResult | null = null
  for (const r of rows) {
    if (!best
      || r.total > best.total
      || (r.total === best.total && r.date.localeCompare(best.date) > 0)) {
      best = r
    }
  }
  return best
}

export interface ChartHistoryPoint {
  date: string
  total: number
  snatch: number
  clean_and_jerk: number
  sinclair: number | null
}

/** Serie wykresu progresu — opcjonalnie tylko starty z danego roku; fallback PB z profilu gdy brak wyników. */
export function buildCompetitionChartHistory(
  athlete: Athlete,
  rows: CompetitionResult[] | null | undefined,
  opts?: { year?: number, profileFallback?: boolean }
): ChartHistoryPoint[] {
  const effectiveWeight = effectiveBodyweightKgForSinclair(athlete)
  const sg = cardGender(athlete.gender ?? undefined)

  let compStarts = approvedCompetitionStarts(rows)
  if (opts?.year != null) {
    const prefix = String(opts.year)
    compStarts = compStarts.filter(r => r.date.startsWith(prefix))
  }

  if (compStarts.length > 0) {
    return compStarts.map((r) => {
      let sinclairPt: number | null = null
      if (effectiveWeight > 0 && sg) {
        const c = sinclairTotal(r.total, effectiveWeight, sg)
        if (!Number.isNaN(c)) sinclairPt = Number(c.toFixed(2))
      }
      const raw = r.date || ''
      const dateShort = raw.length >= 10 ? raw.slice(0, 10) : raw
      return {
        date: dateShort,
        total: r.total,
        snatch: r.snatch,
        clean_and_jerk: r.clean_and_jerk,
        sinclair: sinclairPt
      }
    })
  }

  if (opts?.profileFallback === false || opts?.year != null) {
    return []
  }

  const fallbackSnatch = Number(athlete.best_snatch_kg ?? 0)
  const fallbackCj = Number(athlete.best_clean_jerk_kg ?? 0)
  const fallbackTotal = Number(athlete.total_kg ?? 0)
  if (fallbackTotal <= 0) return []

  return [{
    date: 'PB',
    total: fallbackTotal,
    snatch: fallbackSnatch,
    clean_and_jerk: fallbackCj,
    sinclair: effectiveWeight > 0 && sg
      ? Number(sinclairTotal(fallbackTotal, effectiveWeight, sg).toFixed(2))
      : null
  }]
}

export interface ZawodnikCardData {
  id: string
  name: string
  birthYear: number
  weightCategory: number
  weightCategoryText: string
  bodyweight: number | null
  snatch: number
  cleanAndJerk: number
  total: number
  sinclair: number
  trainingStrip: {
    snatch: number
    cleanAndJerk: number
    total: number
    sinclair: number
  } | null
  membershipPaid: boolean | null
  hasStandingOrder: boolean
  isActive: boolean
  description: string
  photo?: string
  chartHistory: Array<{
    date: string
    total: number
    snatch: number
    clean_and_jerk: number
    sinclair: number | null
  }>
  maxHistory: number
}

export function mapAthleteToCard(
  p: Athlete,
  competitionByAthlete: Record<string, CompetitionResult[]>,
  trainingByAthlete: Record<string, CompetitionResult[]>,
  paidByAthleteId: Map<string, boolean>,
  isLoggedIn: boolean
): ZawodnikCardData {
  const fallbackSnatch = Number(p.best_snatch_kg ?? 0)
  const fallbackCj = Number(p.best_clean_jerk_kg ?? 0)
  const fallbackTotal = Number(p.total_kg ?? 0)

  const compStarts = approvedCompetitionStarts(competitionByAthlete[p.id])
  const bestStart = pickBestCompetitionStart(compStarts)

  const snatchKg = bestStart?.snatch ?? fallbackSnatch
  const cjKg = bestStart?.clean_and_jerk ?? fallbackCj
  const totalKg = bestStart?.total ?? fallbackTotal

  const effectiveWeight = effectiveBodyweightKgForSinclair(p)
  const weightCategoryDisplay = resolveWeightCategoryThreshold(p.gender ?? undefined, p.bodyweight ?? undefined, p.weight_category ?? undefined)
  const weightCategoryText = formatWeightCategoryText(weightCategoryDisplay, p.bodyweight ?? undefined)

  const sg = cardGender(p.gender ?? undefined)
  let sc = 0
  if (totalKg > 0 && effectiveWeight > 0 && sg) {
    const calculated = sinclairTotal(totalKg, effectiveWeight, sg)
    if (!Number.isNaN(calculated)) {
      sc = calculated
    }
  }

  const chartHistory = buildCompetitionChartHistory(p, competitionByAthlete[p.id], { profileFallback: true })

  const totals = chartHistory.map(x => x.total)
  const maxHistory = totals.length > 0 ? Math.max(...totals) * 1.15 || 300 : 300

  const trainingApproved = (trainingByAthlete[p.id] ?? []).filter(r => r.status === 'Approved')
  const bestTraining = pickBestCompetitionStart(trainingApproved)
  const trainingStrip = trainingApproved.length > 0 && bestTraining && bestTraining.total > 0
    ? (() => {
        let tsc = 0
        if (effectiveWeight > 0 && sg) {
          const calc = sinclairTotal(bestTraining.total, effectiveWeight, sg)
          if (!Number.isNaN(calc)) tsc = calc
        }
        return {
          snatch: bestTraining.snatch,
          cleanAndJerk: bestTraining.clean_and_jerk,
          total: bestTraining.total,
          sinclair: Number(tsc.toFixed(2))
        }
      })()
    : null

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
    trainingStrip,
    membershipPaid: isLoggedIn ? (paidByAthleteId.get(p.id) ?? false) : null,
    hasStandingOrder: isLoggedIn ? p.has_standing_order === true : false,
    isActive: p.is_active !== false,
    description:
      (p.public_bio && String(p.public_bio).trim())
      || (p.profile_tagline && String(p.profile_tagline).trim())
      || p.notes
      || 'Zawodnik klubu CKS Slavia Ruda Śląska.',
    photo: p.image_url || undefined,
    chartHistory,
    maxHistory
  }
}

const DEFAULT_ATHLETE_CARD_DESCRIPTION = 'Zawodnik klubu CKS Slavia Ruda Śląska.'

/** Mapowanie karty z `/zawodnicy` → wspólny komponent `ClubHallOfFameRecordCard`. */
export function zawodnikCardToHallRecordCard(player: ZawodnikCardData): ClubHallOfFameRecordCardData {
  const usesProfileFallback = player.chartHistory.length === 1 && player.chartHistory[0]?.date === 'PB'
  let resultDate: string | null = null
  if (!usesProfileFallback && player.chartHistory.length > 0) {
    const best = player.chartHistory.reduce((acc, row) => {
      if (!acc) return row
      if (row.total > acc.total) return row
      if (row.total === acc.total && row.date > acc.date) return row
      return acc
    }, player.chartHistory[0]!)
    resultDate = best.date !== 'PB' ? best.date : null
  }

  const tagline = player.description !== DEFAULT_ATHLETE_CARD_DESCRIPTION
    ? player.description
    : undefined

  return {
    athleteId: player.id,
    name: player.name,
    weightCategoryText: player.weightCategoryText,
    birthYear: player.birthYear || null,
    bodyweight: player.bodyweight,
    photo: player.photo,
    tagline,
    total: player.total,
    snatch: player.snatch,
    cleanJerk: player.cleanAndJerk,
    sinclair: player.sinclair,
    resultDate,
    chartHistory: player.chartHistory,
    usesProfileFallback,
    chartCaption: 'Progres totalu — zawody',
    chartKey: `zawodnicy-${player.id}`,
    statsTitle: 'Zawody',
    statsSubtitle: 'Oficjalne PB',
    dateLabel: 'Najlepszy start',
    trainingStrip: player.trainingStrip,
    membershipPaid: player.membershipPaid,
    hasStandingOrder: player.hasStandingOrder,
    isActive: player.isActive
  }
}
