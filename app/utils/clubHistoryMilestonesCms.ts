import {
  clubHistoryMilestones,
  type ClubHistoryMilestone,
  type ClubHistoryMilestoneCategory
} from '~/data/clubHistoryMilestones'

export const CLUB_HISTORY_TIMELINE_FIELD = 'timeline_milestones'

const VALID_CATEGORIES = new Set<ClubHistoryMilestoneCategory>([
  'founding',
  'sport',
  'facility',
  'community',
  'digital'
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseMilestone(raw: unknown, index: number): ClubHistoryMilestone | null {
  if (!isRecord(raw)) return null
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `milestone-${index}`
  const year = typeof raw.year === 'number' ? raw.year : Number(raw.year)
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  const description = typeof raw.description === 'string' ? raw.description.trim() : ''
  const category = typeof raw.category === 'string' ? raw.category : ''
  const icon = typeof raw.icon === 'string' && raw.icon.trim() ? raw.icon.trim() : 'i-lucide-circle'
  if (!Number.isFinite(year) || !title || !VALID_CATEGORIES.has(category as ClubHistoryMilestoneCategory)) {
    return null
  }
  return {
    id,
    year: Math.round(year),
    title,
    description,
    category: category as ClubHistoryMilestoneCategory,
    icon
  }
}

export function parseClubHistoryMilestones(raw: unknown): ClubHistoryMilestone[] | null {
  if (raw == null || raw === '') return null
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (!Array.isArray(parsed)) return null
  const out: ClubHistoryMilestone[] = []
  for (let i = 0; i < parsed.length; i++) {
    const item = parseMilestone(parsed[i], i)
    if (item) out.push(item)
  }
  return out.length ? out : null
}

export function serializeClubHistoryMilestones(list: ClubHistoryMilestone[]): string {
  return JSON.stringify(list)
}

export function defaultClubHistoryMilestones(): ClubHistoryMilestone[] {
  return clubHistoryMilestones.map(m => ({ ...m }))
}

export function newClubHistoryMilestone(year = new Date().getFullYear()): ClubHistoryMilestone {
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : String(Date.now())
  return {
    id: `milestone-${suffix}`,
    year,
    title: 'Nowy kamień milowy',
    description: 'Opis wydarzenia w historii klubu.',
    category: 'sport',
    icon: 'i-lucide-flag'
  }
}
