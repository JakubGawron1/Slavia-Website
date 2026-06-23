/** Inline Markdown subset shared by WWW (`renderChatMarkdown`) and mobile (`plainChatMarkdown`). */

export function escapeMarkdownHtml(source: string): string {
  return source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function renderMarkdownInline(line: string): string {
  let html = line
  html = html.replace(/`([^`]+)`/g, '<code class="oc-md-code">$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  html = html.replace(/~~([^~]+)~~/g, '<s>$1</s>')
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  html = html.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="oc-md-link">$1</a>'
  )
  return html
}
