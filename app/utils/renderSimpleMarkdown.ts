import DOMPurify from 'isomorphic-dompurify'

/** Lekki podgląd MD w ogłoszeniach — bez pełnego parsera. */
export function renderSimpleMarkdown(source: string): string {
  let html = (source || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/\n/g, '<br>')
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['a', 'strong', 'em', 'br'], ALLOWED_ATTR: ['href', 'target', 'rel', 'class'] })
}
