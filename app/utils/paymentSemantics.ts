/**
 * Jedno źródło reguł statusu składki (idea #39 — parzystość komunikatów na www).
 */
import type { PaymentStatusResponse } from '~/types/models'

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
