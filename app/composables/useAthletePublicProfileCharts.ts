import type { Ref } from 'vue'
import type { AthletePublicProfile, CompetitionResult } from '~/types/models'
import type { SinclairGender } from '~/utils/sinclair'
import { sinclairTotal } from '~/utils/sinclair'
import { effectiveBodyweightKgForSinclair } from '~/utils/sinclairAthlete'
import type { AthleteChartPoint } from '~/components/AthleteProgressChart.vue'
import type { CombinedChartPoint } from '~/components/AthleteCombinedChart.vue'

export interface AthleteCombinedStats {
  competitions: number
  trainings: number
  bestCompetitionTotal: number | null
  bestTrainingTotal: number | null
  bestCombinedTotal: number | null
  bestSnatch: number | null
  bestCleanJerk: number | null
  avgCompetitionTotal: number | null
  avgTrainingTotal: number | null
  bestSinclairCompetition: number | null
  bestSinclairTraining: number | null
  formRealisationPct: number | null
  trendKgLast90Days: number | null
  pbCount: number
  daysSinceLastEntry: number | null
  lastEntryKind: 'competition' | 'training' | null
}

function cardGender(g: string | null | undefined): SinclairGender | null {
  return g === 'male' || g === 'female' ? g : null
}

function isCompetitionResultRow(r: CompetitionResult): boolean {
  return r.kind !== 'training'
}

function pickBestCompetitionRow(rows: CompetitionResult[]): CompetitionResult | null {
  let best: CompetitionResult | null = null
  for (const r of rows) {
    if (
      !best
      || r.total > best.total
      || (r.total === best.total && r.date.localeCompare(best.date) > 0)
    ) {
      best = r
    }
  }
  return best
}

function safeMax(arr: number[]): number | null {
  return arr.length === 0 ? null : Math.max(...arr)
}

function safeAvg(arr: number[]): number | null {
  if (arr.length === 0) return null
  return Number((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1))
}

/** Wykresy, KPI i statystyki profilu publicznego zawodnika (`/athlete/[slug]`). */
export function useAthletePublicProfileCharts(options: {
  athlete: Ref<AthletePublicProfile | null | undefined>
  results: Ref<CompetitionResult[] | null | undefined>
  trainingResults: Ref<CompetitionResult[] | null | undefined>
  canViewAthleteTraining: Ref<boolean>
  isLoggedIn: Ref<boolean>
  shareLite: Ref<boolean>
}) {
  const { athlete, results, trainingResults, canViewAthleteTraining, isLoggedIn, shareLite } = options

  const approvedResults = computed(() =>
    (results.value || []).filter(r => r.status === 'Approved' && isCompetitionResultRow(r))
  )
  const approvedTraining = computed(() =>
    (trainingResults.value || []).filter(r => r.status === 'Approved')
  )
  const approvedTrainingSorted = computed(() =>
    [...approvedTraining.value].sort((a, b) => b.date.localeCompare(a.date))
  )

  const competitionPbDisplay = computed(() => {
    const rows = approvedResults.value
    const p = athlete.value
    if (!p) {
      return { snatch: null as number | null, cleanJerk: null as number | null, total: null as number | null }
    }
    const best = pickBestCompetitionRow(rows)
    if (!best) {
      return {
        snatch: p.best_snatch_kg ?? null,
        cleanJerk: p.best_clean_jerk_kg ?? null,
        total: p.total_kg ?? null
      }
    }
    return {
      snatch: best.snatch,
      cleanJerk: best.clean_and_jerk,
      total: best.total
    }
  })

  const trainingStripKpi = computed(() => {
    if (!canViewAthleteTraining.value) return null
    const rows = approvedTraining.value
    const p = athlete.value
    if (!p || rows.length === 0) return null
    const best = pickBestCompetitionRow(rows)
    if (!best || best.total <= 0) return null
    const sg = cardGender(p.gender ?? undefined)
    const eff = effectiveBodyweightKgForSinclair(p)
    let sinclairVal: number | null = null
    if (eff > 0 && sg) {
      const c = sinclairTotal(best.total, eff, sg)
      if (!Number.isNaN(c)) sinclairVal = Number(c.toFixed(2))
    }
    return {
      snatch: best.snatch,
      cleanJerk: best.clean_and_jerk,
      total: best.total,
      sinclair: sinclairVal
    }
  })

  const progressSeries = computed<AthleteChartPoint[]>(() => {
    const p = athlete.value
    if (!p) return []
    const effectiveWeight = effectiveBodyweightKgForSinclair(p)
    const sg = cardGender(p.gender ?? undefined)
    return approvedResults.value
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => {
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
  })

  const combinedSeries = computed<CombinedChartPoint[]>(() => {
    const p = athlete.value
    if (!p) return []
    const sg = cardGender(p.gender ?? undefined)
    const eff = effectiveBodyweightKgForSinclair(p)
    const toPoint = (r: CompetitionResult, kind: 'competition' | 'training'): CombinedChartPoint => {
      let sinclairPt: number | null = null
      if (eff > 0 && sg) {
        const c = sinclairTotal(r.total, eff, sg)
        if (!Number.isNaN(c)) sinclairPt = Number(c.toFixed(2))
      }
      const raw = r.date || ''
      const dateShort = raw.length >= 10 ? raw.slice(0, 10) : raw
      return {
        date: dateShort,
        total: r.total,
        snatch: r.snatch,
        clean_and_jerk: r.clean_and_jerk,
        sinclair: sinclairPt,
        kind
      }
    }
    const trainPts = canViewAthleteTraining.value
      ? approvedTraining.value.map(r => toPoint(r, 'training'))
      : []
    return [
      ...approvedResults.value.map(r => toPoint(r, 'competition')),
      ...trainPts
    ].sort((a, b) => a.date.localeCompare(b.date))
  })

  function bestSinclairOf(rows: CompetitionResult[]): number | null {
    const p = athlete.value
    if (!p || rows.length === 0) return null
    const sg = cardGender(p.gender ?? undefined)
    const eff = effectiveBodyweightKgForSinclair(p)
    if (!sg || eff <= 0) return null
    let best = 0
    for (const r of rows) {
      const c = sinclairTotal(r.total, eff, sg)
      if (Number.isFinite(c) && c > best) best = c
    }
    return best > 0 ? Number(best.toFixed(2)) : null
  }

  const combinedStats = computed<AthleteCombinedStats>(() => {
    const comp = approvedResults.value
    const train = canViewAthleteTraining.value ? approvedTraining.value : []
    const all = combinedSeries.value

    const compTotals = comp.map(r => r.total).filter(v => Number.isFinite(v) && v > 0)
    const trainTotals = train.map(r => r.total).filter(v => Number.isFinite(v) && v > 0)
    const allRows = [...comp, ...train]
    const allSnatch = allRows.map(r => r.snatch).filter(v => Number.isFinite(v) && v > 0)
    const allCJ = allRows.map(r => r.clean_and_jerk).filter(v => Number.isFinite(v) && v > 0)

    const bestComp = safeMax(compTotals)
    const bestTrain = safeMax(trainTotals)
    const bestCombined = safeMax([...compTotals, ...trainTotals])

    let pbCount = 0
    let runningMax = 0
    for (const pt of all) {
      if (pt.total > runningMax) {
        if (runningMax > 0) pbCount++
        runningMax = pt.total
      }
    }

    let trendKgLast90Days: number | null = null
    if (all.length >= 4) {
      const lastDate = new Date(all[all.length - 1]!.date + 'T00:00:00').getTime()
      if (Number.isFinite(lastDate)) {
        const cutoff = lastDate - 90 * 24 * 3600 * 1000
        const prev = lastDate - 180 * 24 * 3600 * 1000
        const recent = all.filter((p) => {
          const t = new Date(p.date + 'T00:00:00').getTime()
          return t >= cutoff
        })
        const earlier = all.filter((p) => {
          const t = new Date(p.date + 'T00:00:00').getTime()
          return t >= prev && t < cutoff
        })
        if (recent.length > 0 && earlier.length > 0) {
          const a = recent.reduce((s, x) => s + x.total, 0) / recent.length
          const b = earlier.reduce((s, x) => s + x.total, 0) / earlier.length
          trendKgLast90Days = Number((a - b).toFixed(1))
        }
      }
    }

    let daysSinceLastEntry: number | null = null
    let lastEntryKind: 'competition' | 'training' | null = null
    const lastPoint = all[all.length - 1]
    if (lastPoint) {
      const t = new Date(lastPoint.date + 'T00:00:00').getTime()
      if (Number.isFinite(t)) {
        const days = Math.floor((Date.now() - t) / (24 * 3600 * 1000))
        daysSinceLastEntry = Math.max(0, days)
        lastEntryKind = lastPoint.kind
      }
    }

    const formRealisationPct = (bestComp != null && bestTrain != null && bestTrain > 0)
      ? Number(((bestComp / bestTrain) * 100).toFixed(1))
      : null

    return {
      competitions: comp.length,
      trainings: train.length,
      bestCompetitionTotal: bestComp,
      bestTrainingTotal: bestTrain,
      bestCombinedTotal: bestCombined,
      bestSnatch: safeMax(allSnatch),
      bestCleanJerk: safeMax(allCJ),
      avgCompetitionTotal: safeAvg(compTotals),
      avgTrainingTotal: safeAvg(trainTotals),
      bestSinclairCompetition: bestSinclairOf(comp),
      bestSinclairTraining: bestSinclairOf(train),
      formRealisationPct,
      trendKgLast90Days,
      pbCount,
      daysSinceLastEntry,
      lastEntryKind
    }
  })

  const showCombinedSection = computed(
    () => isLoggedIn.value && !shareLite.value && combinedSeries.value.length > 0
  )

  const publicStats = computed(() => {
    const comp = approvedResults.value
    if (comp.length === 0) {
      return {
        totalStarts: 0,
        bestTotal: null as number | null,
        avgTotal: null as number | null,
        lastDate: null as string | null,
        lastLocation: null as string | null,
        daysSinceLast: null as number | null
      }
    }
    const sorted = comp.slice().sort((a, b) => a.date.localeCompare(b.date))
    const last = sorted[sorted.length - 1]!
    const totals = comp.map(r => r.total).filter(v => Number.isFinite(v) && v > 0)
    let daysSinceLast: number | null = null
    const t = new Date(last.date.slice(0, 10) + 'T00:00:00').getTime()
    if (Number.isFinite(t)) {
      daysSinceLast = Math.max(0, Math.floor((Date.now() - t) / (24 * 3600 * 1000)))
    }
    return {
      totalStarts: comp.length,
      bestTotal: totals.length ? Math.max(...totals) : null,
      avgTotal: totals.length ? Number((totals.reduce((s, v) => s + v, 0) / totals.length).toFixed(1)) : null,
      lastDate: last.date,
      lastLocation: last.location ?? null,
      daysSinceLast
    }
  })

  const approvedSinclair = computed(() => {
    const p = athlete.value
    if (!p) return null
    const sg = cardGender(p.gender ?? undefined)
    const bestRow = pickBestCompetitionRow(approvedResults.value)
    const totalKg = bestRow?.total ?? p.total_kg ?? 0
    const effectiveWeight = effectiveBodyweightKgForSinclair(p)
    if (totalKg <= 0 || effectiveWeight <= 0 || !sg) return null
    const calculated = sinclairTotal(totalKg, effectiveWeight, sg)
    if (Number.isNaN(calculated)) return null
    return Number(calculated.toFixed(2))
  })

  return {
    approvedResults,
    approvedTraining,
    approvedTrainingSorted,
    competitionPbDisplay,
    trainingStripKpi,
    progressSeries,
    combinedSeries,
    combinedStats,
    showCombinedSection,
    publicStats,
    approvedSinclair
  }
}
