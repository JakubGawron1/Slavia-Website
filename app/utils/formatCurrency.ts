/** Format kwoty w PLN (idea #10070). */
export function formatPln(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) {
    return '—'
  }
  const frac = amount % 1 === 0 ? 0 : 2
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: frac,
    maximumFractionDigits: 2
  }).format(amount)
}
