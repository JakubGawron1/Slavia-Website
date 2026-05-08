/**
 * Kategorie wagowe PZPC obowiązujące od 1 stycznia 2026 r.
 * (Regulamin Sportowy PZPC, zmiana w ślad za nowymi kategoriami IWF z 5 listopada 2025 —
 *  IWF wprowadza je od 1 sierpnia 2026, PZPC wprowadził wcześniej, wraz z nowymi
 *  standardami rekordów Polski zatwierdzonymi przez Prezydium Zarządu PZPC 31.01.2026).
 *
 * Źródło: https://www.pzpc.pl/aktualnosci/wiadomosci/8596/standardy-rekordow-polski-2026
 *
 * Zestaw klas:
 *  • Senior / U23 / U20: tożsamy z IWF Senior (M: 60–110+, K: 49–86+).
 *  • U17 (junior młodszy): IWF Youth (M: 55–95+, K: 45–77+).
 *  • U15 (młodzik): zestaw PZPC dla młodzików (M: 51–85+, K: 41–69+).
 *
 * Przy zmianie regulaminu zaktualizuj tablice i dopisz komentarz z datą.
 */
export type PzpcAgeGroupId = 'U15' | 'U17' | 'U20' | 'U23' | 'Senior'

export const PZPC_AGE_GROUPS: { id: PzpcAgeGroupId, label: string }[] = [
  { id: 'U15', label: 'U15 (młodziczki / młodzicy)' },
  { id: 'U17', label: 'U17 (juniorki mł. / juniorzy mł.)' },
  { id: 'U20', label: 'U20 (juniorki / juniorzy)' },
  { id: 'U23', label: 'U23 (młodzieżowcy)' },
  { id: 'Senior', label: 'Senior' }
]

/** Etykiety klas wagowych do selecta (bez „kg” w wartości — dopisujemy w UI). */
export function pzpcWeightClassLabels(age: PzpcAgeGroupId, gender: 'male' | 'female'): string[] {
  if (age === 'U15') {
    return gender === 'male'
      ? ['51', '55', '60', '65', '70', '75', '85', '+85']
      : ['41', '45', '49', '53', '57', '61', '69', '+69']
  }
  if (age === 'U17') {
    return gender === 'male'
      ? ['55', '60', '65', '70', '75', '85', '95', '+95']
      : ['45', '49', '53', '57', '61', '69', '77', '+77']
  }
  // U20, U23, Senior — kategorie IWF Senior 2026
  return gender === 'male'
    ? ['60', '65', '70', '75', '85', '95', '110', '+110']
    : ['49', '53', '57', '61', '69', '77', '86', '+86']
}

export function formatPzpcWeightCategory(
  age: PzpcAgeGroupId,
  gender: 'male' | 'female',
  classLabel: string
): string {
  const g = gender === 'male' ? 'M' : 'K'
  const kg = classLabel.startsWith('+') ? `${classLabel} kg` : `${classLabel} kg`
  return `${age} ${g} — ${kg}`
}

/** Odczyt wartości zapisanej przez `formatPzpcWeightCategory`. */
export function parsePzpcWeightCategoryStored(raw: string | null | undefined): {
  age: PzpcAgeGroupId
  gender: 'male' | 'female'
  classLabel: string
} | null {
  if (!raw?.trim()) return null
  const m = /^(\w+)\s+([MK])\s+—\s+(.+)$/u.exec(raw.trim())
  if (!m) return null
  const ageId = m[1] as PzpcAgeGroupId
  if (!PZPC_AGE_GROUPS.some(x => x.id === ageId)) return null
  const mk = m[2]
  const tail = m[3]
  if (mk == null || tail == null) return null
  const gender = mk === 'M' ? 'male' : 'female'
  const cls = tail.replace(/\s*kg\s*$/iu, '').trim()
  if (!cls) return null
  return { age: ageId, gender, classLabel: cls }
}
