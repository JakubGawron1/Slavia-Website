/** UUID wpisu bloga (segment po ostatnim `--` w ścieżce „slug--uuid”). */
export const BLOG_POST_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const UUID_RE = BLOG_POST_UUID_RE

export function slugify(text: string, maxLen = 72) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen)
}

/** Ścieżka wpisu aktualności: czytelny slug na początku, UUID po `--`. */
export function blogPostPath(slugPart: string, id: string) {
  const s = slugPart.trim() || 'wpis'
  return `/aktualnosci/${s}--${id}`
}

/** Edycja wpisu — ten sam segment co w URL szczegółów. */
export function blogEditPath(slugPart: string, id: string) {
  const s = slugPart.trim() || 'wpis'
  return `/aktualnosci/redaguj/${s}--${id}`
}

/** Profil zawodnika: `imię-nazwisko--uuid` (bez UUID na początku adresu). */
export function athleteProfilePath(fullName: string, id: string) {
  const s = slugify(fullName) || 'zawodnik'
  return `/athlete/${s}--${id}`
}

/** Dziennik trenera dla wybranego zawodnika — ten sam schemat segmentu co profil. */
export function trainerDiaryAthletePath(fullName: string, id: string) {
  const s = slugify(fullName) || 'zawodnik'
  return `/trainer/dziennik/${s}--${id}`
}

export function parseBlogPostId(raw: string) {
  const value = String(raw ?? '').trim()
  const sep = value.lastIndexOf('--')
  if (sep !== -1) {
    const tail = value.slice(sep + 2)
    if (UUID_RE.test(tail)) {
      return tail
    }
  }
  const legacyPrefix = value.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-/i)
  if (legacyPrefix) {
    return legacyPrefix[1]
  }
  if (UUID_RE.test(value)) {
    return value
  }
  return value
}

/**
 * ID zawodnika z segmentu trasy: `jan-kowalski--uuid`, legacy `uuid-jan-kowalski` lub sam UUID.
 */
export function parseSlugId(raw: string) {
  const value = String(raw || '').trim()
  const sep = value.lastIndexOf('--')
  if (sep !== -1) {
    const tail = value.slice(sep + 2)
    if (UUID_RE.test(tail)) {
      return tail
    }
  }
  const legacyPrefix = value.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-/i
  )
  if (legacyPrefix) {
    return legacyPrefix[1]!
  }
  const match = value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  if (match) {
    return match[0]
  }
  if (UUID_RE.test(value)) {
    return value
  }
  return value
}
