import type { TrainingPlan, TrainingPlanItem } from '~/types/models'

export const TRAINING_PLAN_DAYS = [
  { id: 1, name: 'Poniedziałek', short: 'Pon' },
  { id: 2, name: 'Wtorek', short: 'Wt' },
  { id: 3, name: 'Środa', short: 'Śr' },
  { id: 4, name: 'Czwartek', short: 'Czw' },
  { id: 5, name: 'Piątek', short: 'Pt' },
  { id: 6, name: 'Sobota', short: 'Sob' },
  { id: 7, name: 'Niedziela', short: 'Nd' }
] as const

export function planDurationWeeks(plan: Pick<TrainingPlan, 'duration_weeks'>): number {
  const n = plan.duration_weeks ?? 1
  return Math.min(52, Math.max(1, n))
}

export function dayOfWeekMon1(d: Date): number {
  const js = d.getDay()
  return js === 0 ? 7 : js
}

function parsePlanStart(weekStart: string): Date | null {
  const start = new Date(`${weekStart.slice(0, 10)}T00:00:00`)
  return Number.isNaN(start.getTime()) ? null : start
}

export function planPeriodEnd(plan: Pick<TrainingPlan, 'week_start' | 'duration_weeks'>): Date | null {
  const start = parsePlanStart(plan.week_start)
  if (!start) return null
  const end = new Date(start)
  end.setDate(end.getDate() + planDurationWeeks(plan) * 7)
  return end
}

export function formatPlanPeriod(plan: Pick<TrainingPlan, 'week_start' | 'duration_weeks'>): string {
  const weeks = planDurationWeeks(plan)
  const start = plan.week_start.slice(0, 10)
  if (weeks <= 1) return `od ${start}`
  const end = planPeriodEnd(plan)
  if (!end) return `${start} · ${weeks} tyg.`
  const endStr = new Date(end.getTime() - 86400000).toISOString().slice(0, 10)
  return `${start} – ${endStr} · ${weeks} tyg.`
}

export function isDateInPlanRange(
  plan: Pick<TrainingPlan, 'week_start' | 'duration_weeks'>,
  date: Date = new Date()
): boolean {
  const start = parsePlanStart(plan.week_start)
  const end = planPeriodEnd(plan)
  if (!start || !end) return false
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return day >= start && day < end
}

export function weekNumberForDate(
  plan: Pick<TrainingPlan, 'week_start' | 'duration_weeks'>,
  date: Date = new Date()
): number {
  const start = parsePlanStart(plan.week_start)
  if (!start) return 1
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffMs = day.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays < 0) return 1
  const week = Math.floor(diffDays / 7) + 1
  return Math.min(planDurationWeeks(plan), Math.max(1, week))
}

export function defaultWeekAndDay(
  plan: Pick<TrainingPlan, 'week_start' | 'duration_weeks'>,
  date: Date = new Date()
): { weekNumber: number, dayId: number } {
  if (isDateInPlanRange(plan, date)) {
    return {
      weekNumber: weekNumberForDate(plan, date),
      dayId: dayOfWeekMon1(date)
    }
  }
  return { weekNumber: 1, dayId: 1 }
}

export function weekNumberForSessionDate(
  plan: Pick<TrainingPlan, 'week_start' | 'duration_weeks'>,
  sessionDate: string
): number {
  const d = new Date(`${sessionDate.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return 1
  return weekNumberForDate(plan, d)
}

export function dateForPlanSlot(
  plan: Pick<TrainingPlan, 'week_start'>,
  weekNumber: number,
  dayId: number
): string | null {
  const start = parsePlanStart(plan.week_start)
  if (!start) return null
  const target = new Date(start)
  target.setDate(target.getDate() + (weekNumber - 1) * 7 + (dayId - 1))
  return target.toISOString().slice(0, 10)
}

export function filterPlanItems(
  items: TrainingPlanItem[],
  weekNumber: number,
  dayId: number
): TrainingPlanItem[] {
  return items
    .filter(i => (i.week_number ?? 1) === weekNumber && i.day_of_week === dayId)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function weekLabels(durationWeeks: number): { id: number, label: string }[] {
  return Array.from({ length: durationWeeks }, (_, i) => ({
    id: i + 1,
    label: `Tydz. ${i + 1}`
  }))
}
