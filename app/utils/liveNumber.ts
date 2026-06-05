export function parseLiveNumber(value: string): number | undefined {
  const v = String(value ?? '')
  const trimmed = v.trim()
  if (trimmed === '') return undefined

  // pozwól pisać "120." / "120," bez skakania (liczymy dopiero po dopisaniu cyfr)
  if (trimmed.endsWith('.') || trimmed.endsWith(',')) return undefined

  const normalized = trimmed.replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  if (!Number.isFinite(parsed)) return undefined
  return parsed
}

export function parseLiveInt(value: string): number | undefined {
  const v = String(value ?? '')
  const trimmed = v.trim()
  if (trimmed === '') return undefined

  // tylko cyfry; przyklejone znaki (np. "10x") traktujemy jako niepoprawne
  if (!/^\d+$/.test(trimmed)) return undefined

  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed)) return undefined
  return parsed
}
