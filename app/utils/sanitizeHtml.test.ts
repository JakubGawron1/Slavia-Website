import { describe, expect, it } from 'vitest'
import { sanitizeRichHtml } from './sanitizeHtml'

describe('sanitizeRichHtml', () => {
  it('strips script tags', () => {
    const out = sanitizeRichHtml('<p>ok</p><script>alert(1)</script>')
    expect(out).not.toContain('<script')
    expect(out).toContain('ok')
  })

  it('blocks javascript: links', () => {
    const out = sanitizeRichHtml('<a href="javascript:alert(1)">x</a>')
    expect(out).not.toContain('javascript:')
  })

  it('allows safe https links and adds noopener on _blank', () => {
    const out = sanitizeRichHtml('<a href="https://slavia.pl" target="_blank">link</a>')
    expect(out).toContain('href="https://slavia.pl"')
    expect(out).toContain('noopener')
  })

  it('allows relative image src', () => {
    const out = sanitizeRichHtml('<img src="/uploads/x.jpg" alt="x">')
    expect(out).toContain('src="/uploads/x.jpg"')
  })

  it('removes data: image src', () => {
    const out = sanitizeRichHtml('<img src="data:image/png;base64,abc" alt="x">')
    expect(out).not.toContain('data:image')
  })

  it('keeps allowed inline style color', () => {
    const out = sanitizeRichHtml('<span style="color: #ff0000">red</span>')
    expect(out).toContain('color')
    expect(out).toContain('#ff0000')
  })

  it('drops dangerous style url()', () => {
    const out = sanitizeRichHtml('<span style="background-color: url(javascript:1)">x</span>')
    expect(out).not.toContain('url(')
  })
})
