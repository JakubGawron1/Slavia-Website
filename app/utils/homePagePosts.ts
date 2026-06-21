import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import type { HomeNewsPost } from '~/data/homePageContent'
import { stripHtmlTags } from '~/utils/html'

export function formatHomePostDate(d?: string | null) {
  if (!d) return ''
  try {
    return format(parseISO(d), 'd MMM yyyy', { locale: pl })
  } catch {
    return ''
  }
}

export function homePostExcerpt(p: HomeNewsPost, maxLen = 160) {
  const txt = stripHtmlTags(p.content ?? '').replace(/\s+/g, ' ').trim()
  if (txt.length <= maxLen) return txt
  return `${txt.slice(0, maxLen).trim()}…`
}
