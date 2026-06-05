/** Tekst widoczny z HTML (bez tagów) — walidacja treści, excerpt itp. */
export function stripHtmlTags(html: string): string {
  return String(html ?? '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isProbablyRichHtml(content: string): boolean {
  const t = String(content ?? '').trim()
  return t.startsWith('<') && /<\/[a-z][a-z0-9]*>/i.test(t)
}
