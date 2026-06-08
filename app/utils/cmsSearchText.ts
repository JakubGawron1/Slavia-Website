import type { CmsPage, CmsPageField } from '~/types/cms'
import { stripHtmlTags } from '~/utils/html'

function fieldToPlain(field: CmsPageField | undefined): string {
  if (!field || field.value == null || field.value === '') return ''
  const raw = String(field.value).trim()
  if (!raw) return ''
  return field.type === 'html' ? stripHtmlTags(raw) : raw
}

/** Tekst z pól CMS do indeksu wyszukiwarki (bez obrazków). */
export function extractCmsPageSearchText(page: CmsPage | null | undefined): string {
  if (!page?.fields) return ''
  const parts: string[] = []
  for (const [key, field] of Object.entries(page.fields)) {
    if (!field || field.type === 'image') continue
    if (field.label) parts.push(field.label)
    parts.push(key.replace(/_/g, ' '))
    const plain = fieldToPlain(field)
    if (plain) parts.push(plain)
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}
