/**
 * Jedno źródło reguł statusu składki (idea #39 — parzystość komunikatów na www).
 */
import type { PaymentMonthStatusRow, PaymentStatusResponse } from '~/types/models'

/** Zgodne z `MONTHLY_FEE_PLN` w backendzie (`routes/payments.rs`). */
export const MONTHLY_FEE_PLN = 50

const MONTH_NAMES_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
] as const

const MONTH_NAMES_SHORT_PL = [
  'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
  'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'
] as const

export function monthLabelPl(yyyyMm: string, short = false): string {
  const mm = Number.parseInt(String(yyyyMm || '').slice(5, 7), 10)
  const names = short ? MONTH_NAMES_SHORT_PL : MONTH_NAMES_PL
  return names[(mm - 1)] || yyyyMm
}

export type PaymentMonthRowTone = 'success' | 'error' | 'warning' | 'neutral'

export function paymentMonthRowMeta(r: PaymentMonthStatusRow): {
  label: string
  tone: PaymentMonthRowTone
  icon: string
} {
  if (r.is_paid) {
    return { label: 'Opłacone', tone: 'success', icon: 'i-lucide-check-circle-2' }
  }
  if (r.has_pending) {
    return { label: 'Oczekuje', tone: 'warning', icon: 'i-lucide-clock' }
  }
  if (r.is_overdue) {
    return { label: 'Nieopłacone', tone: 'error', icon: 'i-lucide-alert-circle' }
  }
  return { label: 'Brak', tone: 'neutral', icon: 'i-lucide-minus' }
}

export function membershipYearStats(rows: PaymentMonthStatusRow[]) {
  let paid = 0
  let pending = 0
  let overdue = 0
  for (const r of rows) {
    if (r.is_paid) paid += 1
    else if (r.has_pending) pending += 1
    else if (r.is_overdue) overdue += 1
  }
  return { paid, pending, overdue, total: rows.length }
}

/** Dni do terminu (due_date w formacie YYYY-MM-DD). Ujemne = po terminie. */
export function daysUntilDueDate(dueDate: string): number | null {
  const parts = String(dueDate || '').split('-').map(Number)
  if (parts.length < 3 || parts.some(n => !Number.isFinite(n))) return null
  const due = new Date(parts[0]!, parts[1]! - 1, parts[2]!)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

export function suggestedTransferTitle(month: string, athleteName?: string | null): string {
  const label = monthLabelPl(month, true)
  const year = month.slice(0, 4)
  const who = athleteName?.trim() || 'zawodnik'
  return `Składka klubowa ${who} ${label} ${year}`
}

export function hasStandingOrder(ps: PaymentStatusResponse | null | undefined): boolean {
  return ps?.has_standing_order === true
}

export type PaymentMonthBadge =
  | { color: 'success'; label: 'Opłacona' }
  | { color: 'error'; label: 'Nieopłacona' }
  | { color: 'info'; label: string }
  | { color: 'warning'; label: 'Niepotwierdzona' }

export function membershipMonthBadgeFromStatus(
  ps: PaymentStatusResponse,
  standingOrderLabel: string,
): PaymentMonthBadge {
  if (ps.is_paid) {
    return { color: 'success', label: 'Opłacona' }
  }
  if (ps.is_overdue) {
    return { color: 'error', label: 'Nieopłacona' }
  }
  if (hasStandingOrder(ps)) {
    return { color: 'info', label: standingOrderLabel }
  }
  return { color: 'warning', label: 'Niepotwierdzona' }
}

export type AthletePaymentKpiTone = 'success' | 'error' | 'warning' | 'info'

export function athletePaymentKpiFromStatus(
  ps: PaymentStatusResponse,
  standingOrderLabel: string,
): { value: string; tone: AthletePaymentKpiTone; hint: string } {
  if (ps.is_paid) {
    return { value: 'Opłacona', tone: 'success', hint: ps.month }
  }
  if (ps.is_overdue) {
    return { value: 'Nieopłacona', tone: 'error', hint: ps.month }
  }
  if (hasStandingOrder(ps)) {
    return {
      value: standingOrderLabel,
      tone: 'info',
      hint: `Auto-składka · ${ps.month}`,
    }
  }
  return { value: 'Oczekuje', tone: 'warning', hint: ps.month }
}

/** Przypomnienie przed 10. dnikiem miesiąca — tylko przy braku opłaty i bez przelewu stałego. */
export function showPre10PaymentAthleteReminder(opts: {
  isAthlete: boolean
  hiddenInBrowserStorage: boolean
  paymentStatus: PaymentStatusResponse | null
}): boolean {
  if (!opts.isAthlete || opts.hiddenInBrowserStorage) {
    return false
  }
  const day = new Date().getDate()
  if (day >= 10) {
    return false
  }
  const ps = opts.paymentStatus
  if (!ps || ps.is_paid) {
    return false
  }
  if (hasStandingOrder(ps)) {
    return false
  }
  return true
}
