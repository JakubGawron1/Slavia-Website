import DOMPurify from 'isomorphic-dompurify'

function escapeHtml(source: string): string {
  return source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderInlineMarkdown(line: string): string {
  let html = line
  html = html.replace(/`([^`]+)`/g, '<code class="oc-md-code">$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="oc-md-link">$1</a>'
  )
  return html
}

function isTableRow(line: string): boolean {
  const t = line.trim()
  return t.startsWith('|') && t.endsWith('|') && t.includes('|')
}

function isTableSeparator(line: string): boolean {
  return /^\|?[\s|:-]+\|?$/.test(line.trim())
}

function renderTableRow(line: string, tag: 'th' | 'td'): string {
  const cells = line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(c => c.trim())
  const scope = tag === 'th' ? ' scope="col"' : ''
  const inner = cells
    .map(c => `<${tag}${scope}>${renderInlineMarkdown(escapeHtml(c))}</${tag}>`)
    .join('')
  return `<tr>${inner}</tr>`
}

function renderBlocks(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const parts: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i] ?? ''
    const trimmed = line.trim()

    if (!trimmed) {
      i += 1
      continue
    }

    if (isTableRow(trimmed) && i + 1 < lines.length && isTableSeparator(lines[i + 1] ?? '')) {
      const header = renderTableRow(trimmed, 'th')
      i += 2
      const bodyRows: string[] = []
      while (i < lines.length && isTableRow(lines[i] ?? '')) {
        bodyRows.push(renderTableRow(lines[i] ?? '', 'td'))
        i += 1
      }
      parts.push(`<table class="oc-md-table"><thead>${header}</thead><tbody>${bodyRows.join('')}</tbody></table>`)
      continue
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      const level = trimmed.match(/^#+/)?.[0].length ?? 1
      const tag = (['h2', 'h3', 'h4', 'h5', 'h6'] as const)[Math.min(level, 6) - 1] ?? 'h2'
      const text = trimmed.replace(/^#+\s+/, '')
      parts.push(`<${tag} class="oc-md-${tag}">${renderInlineMarkdown(escapeHtml(text))}</${tag}>`)
      i += 1
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test((lines[i] ?? '').trim())) {
        const item = (lines[i] ?? '').trim().replace(/^[-*]\s+/, '')
        items.push(`<li>${renderInlineMarkdown(escapeHtml(item))}</li>`)
        i += 1
      }
      parts.push(`<ul class="oc-md-ul">${items.join('')}</ul>`)
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test((lines[i] ?? '').trim())) {
        const item = (lines[i] ?? '').trim().replace(/^\d+\.\s+/, '')
        items.push(`<li>${renderInlineMarkdown(escapeHtml(item))}</li>`)
        i += 1
      }
      parts.push(`<ol class="oc-md-ol">${items.join('')}</ol>`)
      continue
    }

    if (/^>\s+/.test(trimmed)) {
      const quoteLines: string[] = []
      while (i < lines.length && /^>\s?/.test((lines[i] ?? '').trim())) {
        quoteLines.push((lines[i] ?? '').trim().replace(/^>\s?/, ''))
        i += 1
      }
      const inner = quoteLines.map(l => renderInlineMarkdown(escapeHtml(l))).join('<br>')
      parts.push(`<blockquote class="oc-md-quote">${inner}</blockquote>`)
      continue
    }

    const paraLines: string[] = [trimmed]
    i += 1
    while (i < lines.length) {
      const next = (lines[i] ?? '').trim()
      if (
        !next
        || /^#{1,6}\s+/.test(next)
        || /^[-*]\s+/.test(next)
        || /^\d+\.\s+/.test(next)
        || isTableRow(next)
        || /^>\s+/.test(next)
      ) {
        break
      }
      paraLines.push(next)
      i += 1
    }
    const paraHtml = paraLines.map(l => renderInlineMarkdown(escapeHtml(l))).join('<br>')
    parts.push(`<p class="oc-md-p">${paraHtml}</p>`)
  }

  return parts.join('')
}

/** Markdown dla odpowiedzi Trenera AI — nagłówki, listy, tabele, kod (DOMPurify). */
export function renderChatMarkdown(source: string): string {
  const src = (source || '').trim()
  if (!src) return ''

  const codeBlocks: string[] = []
  const withPlaceholders = src.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, _lang, code) => {
    const idx = codeBlocks.length
    const escaped = escapeHtml(String(code).trim())
    codeBlocks.push(`<pre class="oc-md-pre"><code>${escaped}</code></pre>`)
    return `@@CODEBLOCK${idx}@@`
  })

  let html = renderBlocks(withPlaceholders)
  html = html.replace(/@@CODEBLOCK(\d+)@@/g, (_m, idx) => codeBlocks[Number(idx)] ?? '')

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'a', 'strong', 'em', 'br', 'p', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'scope']
  })
}
