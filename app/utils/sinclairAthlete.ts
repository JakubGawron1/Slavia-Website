/**
 * Wspólna masa (kg) do Sinclaira: najpierw `bodyweight`, inaczej sensowny parse limitu z `weight_category`
 * (np. „U20 M — 75 kg”, „+110 kg”) — bez `replace(/\D/g)`, które psuje wartości typu „U20”.
 */
export function parseWeightCategoryLimitKg(raw: string | null | undefined): number {
  if (!raw?.trim()) return 0
  const segment = raw.split(/[—–-]/).pop()?.trim() ?? raw
  const m = segment.match(/(\+?\d+(?:\.\d+)?)\s*kg/i)
  if (m?.[1]) return Number.parseFloat(m[1].replace('+', ''))
  return 0
}

export function effectiveBodyweightKgForSinclair(a: {
  bodyweight?: number | null
  weight_category?: string | null
}): number {
  const bw = a.bodyweight
  if (bw != null && Number.isFinite(bw) && bw > 0) return bw
  const fromCat = parseWeightCategoryLimitKg(a.weight_category ?? undefined)
  return fromCat > 0 ? fromCat : 0
}
