import type { Athlete, MyCalendarEntry } from '~/types/models'

export type GoalMode = 'total' | 'sinclair'

export interface SeasonGoalData {
  mode: GoalMode
  target: number
}

export interface PrestartChecklistItem {
  id: string
  label: string
  checked: boolean
}

export const DEFAULT_PRESTART_CHECKLIST: PrestartChecklistItem[] = [
  { id: 'singlet', label: 'Strjój startowy (singlet)', checked: false },
  { id: 'shoes', label: 'Buty ciężarowe', checked: false },
  { id: 'belt', label: 'Pas dźwigniowy', checked: false },
  { id: 'wraps', label: 'Opaski / kolanka', checked: false },
  { id: 'id_card', label: 'Dowód tożsamości', checked: false },
  { id: 'license', label: 'Licencja zawodnicza', checked: false },
  { id: 'weight', label: 'Sprawdzona waga (kategoria wagowa)', checked: false },
  { id: 'nutrition', label: 'Posiłki i nawodnienie na dzień', checked: false }
]

// ─── [2001] "Mój Tydzień" widget ─────────────────────────────────────────

/** Nearest upcoming calendar entry (competition or event). */
export function findNearestCalendarEntry(
  entries: MyCalendarEntry[],
  todayStr: string
): MyCalendarEntry | null {
  const future = entries
    .filter((e) => {
      const d = e.competition?.date ?? ''
      return d >= todayStr
    })
    .sort((a, b) => (a.competition?.date ?? '').localeCompare(b.competition?.date ?? ''))
  return future[0] ?? null
}

/** Days until target date (0 = same day). */
export function daysUntilDate(targetDate: string, todayStr: string): number {
  return Math.ceil((new Date(targetDate).getTime() - new Date(todayStr).getTime()) / 86_400_000)
}

// ─── [2013] Pre-start checklist ────────────────────────────────────────────

/** Next competition within 48 hours (today or tomorrow), excluding training. */
export function resolvePreStartEntry(
  nearestEntry: MyCalendarEntry | null,
  daysUntil: number | null
): MyCalendarEntry | null {
  if (!nearestEntry) return null
  if (daysUntil === null || daysUntil > 1) return null
  const cat = (nearestEntry.competition?.category ?? '').toLowerCase()
  if (cat === 'training') return null
  return nearestEntry
}

export function mergeChecklistWithSaved(
  defaultItems: PrestartChecklistItem[],
  saved: { id: string; checked: boolean }[]
): PrestartChecklistItem[] {
  return defaultItems.map((item) => ({
    ...item,
    checked: saved.find((s) => s.id === item.id)?.checked ?? false
  }))
}

export function cloneDefaultChecklist(): PrestartChecklistItem[] {
  return DEFAULT_PRESTART_CHECKLIST.map((i) => ({ ...i }))
}

// ─── [2005] Season Goal ────────────────────────────────────────────────────

/** Current best relevant to the goal mode. */
export function goalCurrentValueFromAthlete(
  athlete: Pick<Athlete, 'total_kg' | 'bodyweight'> | null | undefined,
  mode: GoalMode
): number {
  if (!athlete) return 0
  if (mode === 'total') {
    return athlete.total_kg ?? 0
  }
  const bw = athlete.bodyweight ?? 0
  const total = athlete.total_kg ?? 0
  if (bw <= 0 || total <= 0) return 0
  return total
}

export function seasonGoalProgressPercent(currentValue: number, target: number): number {
  if (target <= 0) return 0
  const pct = Math.round((currentValue / target) * 100)
  return Math.min(pct, 100)
}

// ─── [2024] Overdue payment alert ──────────────────────────────────────────

export function shouldShowOverduePaymentAlert(
  isAthlete: boolean,
  paymentStatus: { is_overdue?: boolean; is_paid?: boolean } | null | undefined
): boolean {
  if (!isAthlete) return false
  if (!paymentStatus) return false
  return !!(paymentStatus.is_overdue && !paymentStatus.is_paid)
}
