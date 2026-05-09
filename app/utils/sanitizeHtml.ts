import DOMPurify from 'isomorphic-dompurify'
import type { Config } from 'isomorphic-dompurify'

/** Tagi zgodne z wyjściem TipTap (StarterKit + Link, TextAlign, Highlight, Color, Image itd.). */
const RICH_HTML_CONFIG: Config = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'span',
    'h2',
    'h3',
    'h4',
    'blockquote',
    'ul',
    'ol',
    'li',
    'a',
    'hr',
    'code',
    'pre',
    'div',
    'mark',
    'img'
  ],
  ALLOWED_ATTR: [
    'href',
    'title',
    'target',
    'rel',
    'class',
    'style',
    'src',
    'alt',
    'width',
    'height',
    'loading',
    'decoding'
  ],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false
}

const SAFE_STYLE_PROPS = new Set(['color', 'background-color', 'text-align'])

/** Zezwala na http(s), ścieżki od roota i względne bez schematu — odrzuca m.in. javascript:, data:, //host. */
function imgSrcIsSafe(raw: string): boolean {
  const v = raw.trim()
  if (!v) {
    return false
  }
  const lower = v.toLowerCase()
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:')
  ) {
    return false
  }
  if (v.startsWith('//')) {
    return false
  }
  if (/^https?:\/\//i.test(v)) {
    return true
  }
  if (v.startsWith('/')) {
    return true
  }
  if (!/^[a-z][a-z\d+.-]*:/i.test(v)) {
    return true
  }
  return false
}

function imgNumericDimensionIsSafe(raw: string): boolean {
  const v = raw.trim()
  return /^\d+(\.\d+)?(px|%)?$/i.test(v) || v.toLowerCase() === 'auto'
}

function styleDeclarationIsSafe(propRaw: string, valueRaw: string): boolean {
  const prop = propRaw.trim().toLowerCase()
  const value = valueRaw.trim()
  if (!SAFE_STYLE_PROPS.has(prop)) {
    return false
  }
  const dangerous = /(url\s*\(|expression\s*\(|javascript:|@import|<|>|\\)/i.test(value)
  if (dangerous) {
    return false
  }
  if (prop === 'text-align') {
    return /^(left|right|center|justify)$/i.test(value)
  }
  /* color / background-color — hex, rgb(a), hsl(a), oklch(), krótkie nazwy (inherit, transparent…) */
  return /^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|[a-z]{3,20})$/i.test(value)
}

let richHtmlHooksInstalled = false

function ensureRichHtmlHooks(): void {
  if (richHtmlHooksInstalled) {
    return
  }
  richHtmlHooksInstalled = true

  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (node.nodeName === 'IMG') {
      const name = data.attrName
      if (name === 'src') {
        if (!imgSrcIsSafe(String(data.attrValue ?? ''))) {
          data.keepAttr = false
        }
        return
      }
      if (name === 'width' || name === 'height') {
        if (!imgNumericDimensionIsSafe(String(data.attrValue ?? ''))) {
          data.keepAttr = false
        }
        return
      }
      if (name === 'loading') {
        if (!/^(lazy|eager)$/i.test(String(data.attrValue ?? '').trim())) {
          data.keepAttr = false
        }
        return
      }
      if (name === 'decoding') {
        if (!/^(async|auto|sync)$/i.test(String(data.attrValue ?? '').trim())) {
          data.keepAttr = false
        }
        return
      }
    }
    if (data.attrName !== 'style') {
      return
    }
    const raw = String(data.attrValue ?? '')
    const kept: string[] = []
    for (const chunk of raw.split(';')) {
      const colon = chunk.indexOf(':')
      if (colon === -1) {
        continue
      }
      const p = chunk.slice(0, colon).trim()
      const v = chunk.slice(colon + 1).trim()
      if (!p || !styleDeclarationIsSafe(p, v)) {
        continue
      }
      kept.push(`${p.trim().toLowerCase()}: ${v}`)
    }
    if (kept.length > 0) {
      data.attrValue = kept.join('; ')
    } else {
      data.keepAttr = false
    }
  })

  /* Bezpieczniejsze linki z target="_blank" */
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName !== 'A') {
      return
    }
    const el = node as HTMLAnchorElement
    const target = el.getAttribute('target')
    if (target === '_blank') {
      const rel = (el.getAttribute('rel') || '').split(/\s+/).filter(Boolean)
      if (!rel.includes('noopener')) {
        rel.push('noopener')
      }
      if (!rel.includes('noreferrer')) {
        rel.push('noreferrer')
      }
      el.setAttribute('rel', rel.join(' '))
    }
  })
}

/**
 * Sanityzuje HTML z edytora/API przed `v-html` — ochrona przed XSS przy kompromitacji konta lub API.
 */
export function sanitizeRichHtml(html: string): string {
  ensureRichHtmlHooks()
  return String(DOMPurify.sanitize(html ?? '', RICH_HTML_CONFIG))
}
