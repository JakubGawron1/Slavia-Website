import { describe, expect, it } from 'vitest'
import { renderChatMarkdown } from './renderChatMarkdown'

describe('renderChatMarkdown', () => {
  it('returns empty string for blank input', () => {
    expect(renderChatMarkdown('')).toBe('')
    expect(renderChatMarkdown('   ')).toBe('')
  })

  it('renders bold, italic and inline code', () => {
    const html = renderChatMarkdown('**bold** and *italic* with `code`')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
    expect(html).toContain('<code class="oc-md-code">code</code>')
  })

  it('renders markdown links with rel noopener', () => {
    const html = renderChatMarkdown('[Slavia](https://slavia.example.com)')
    expect(html).toContain('href="https://slavia.example.com"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('strips script tags via DOMPurify', () => {
    const html = renderChatMarkdown('<script>alert(1)</script>hello')
    expect(html).not.toContain('<script')
    expect(html).toContain('hello')
  })

  it('renders h2–h4 headings', () => {
    expect(renderChatMarkdown('# Title')).toContain('<h2')
    expect(renderChatMarkdown('## Sub')).toContain('<h3')
    expect(renderChatMarkdown('### Subsub')).toContain('<h4')
    expect(renderChatMarkdown('#### Deep')).toContain('<h5')
  })

  it('renders unordered and ordered lists', () => {
    const ul = renderChatMarkdown('- one\n- two')
    expect(ul).toContain('<ul class="oc-md-ul">')
    expect(ul).toContain('<li>one</li>')

    const ol = renderChatMarkdown('1. first\n2. second')
    expect(ol).toContain('<ol class="oc-md-ol">')
    expect(ol).toContain('<li>second</li>')
  })

  it('renders GFM table with scope on header cells', () => {
    const html = renderChatMarkdown('| A | B |\n| --- | --- |\n| 1 | 2 |')
    expect(html).toContain('<table class="oc-md-table">')
    expect(html).toContain('scope="col"')
    expect(html).toContain('<td>2</td>')
  })

  it('renders fenced code blocks', () => {
    const html = renderChatMarkdown('```js\nconst x = 1\n```')
    expect(html).toContain('<pre class="oc-md-pre">')
    expect(html).toContain('const x = 1')
  })

  it('renders blockquotes', () => {
    const html = renderChatMarkdown('> quote line')
    expect(html).toContain('<blockquote class="oc-md-quote">')
    expect(html).toContain('quote line')
  })
})
