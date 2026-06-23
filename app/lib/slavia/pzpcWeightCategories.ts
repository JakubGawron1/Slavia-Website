/**
 * Kategorie wagowe PZPC — dane z API `GET /api/system/pzpc-weight-classes`.
 * Domyślny katalog (fallback offline / prerender) zgodny z backend embed.
 */
export type PzpcAgeGroupId = 'U15' | 'U17' | 'U20' | 'U23' | 'Senior'

export type PzpcCatalog = {
  ageGroups: { id: PzpcAgeGroupId, label: string }[]
  classesByAge: Record<PzpcAgeGroupId, { male: string[], female: string[] }>
}

const DEFAULT_PZPC_CATALOG: PzpcCatalog = {
  ageGroups: [
    { id: 'U15', label: 'U15 (młodziczki / młodzicy)' },
    { id: 'U17', label: 'U17 (juniorki mł. / juniorzy mł.)' },
    { id: 'U20', label: 'U20 (juniorki / juniorzy)' },
    { id: 'U23', label: 'U23 (młodzieżowcy)' },
    { id: 'Senior', label: 'Senior' }
  ],
  classesByAge: {
    U15: {
      male: ['51', '55', '60', '65', '70', '75', '85', '+85'],
      female: ['41', '45', '49', '53', '57', '61', '69', '+69']
    },
    U17: {
      male: ['55', '60', '65', '70', '75', '85', '95', '+95'],
      female: ['45', '49', '53', '57', '61', '69', '77', '+77']
    },
    U20: {
      male: ['60', '65', '70', '75', '85', '95', '110', '+110'],
      female: ['49', '53', '57', '61', '69', '77', '86', '+86']
    },
    U23: {
      male: ['60', '65', '70', '75', '85', '95', '110', '+110'],
      female: ['49', '53', '57', '61', '69', '77', '86', '+86']
    },
    Senior: {
      male: ['60', '65', '70', '75', '85', '95', '110', '+110'],
      female: ['49', '53', '57', '61', '69', '77', '86', '+86']
    }
  }
}

let catalog: PzpcCatalog = DEFAULT_PZPC_CATALOG

export function setPzpcCatalog(next: PzpcCatalog): void {
  catalog = next
}

export function getPzpcCatalog(): PzpcCatalog {
  return catalog
}

export const PZPC_AGE_GROUPS = DEFAULT_PZPC_CATALOG.ageGroups

export function pzpcAgeGroups(): { id: PzpcAgeGroupId, label: string }[] {
  return catalog.ageGroups
}

/** Etykiety klas wagowych do selecta (bez „kg” w wartości — dopisujemy w UI). */
export function pzpcWeightClassLabels(age: PzpcAgeGroupId, gender: 'male' | 'female'): string[] {
  const bucket = catalog.classesByAge[age]
  if (!bucket) return []
  return gender === 'male' ? bucket.male : bucket.female
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
  if (!catalog.ageGroups.some(x => x.id === ageId)) return null
  const mk = m[2]
  const tail = m[3]
  if (mk == null || tail == null) return null
  const gender = mk === 'M' ? 'male' : 'female'
  const cls = tail.replace(/\s*kg\s*$/iu, '').trim()
  if (!cls) return null
  return { age: ageId, gender, classLabel: cls }
}
