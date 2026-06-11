# Markdown w czacie — ocena `marked` (Fala 4)

**Werdykt: bez integracji `marked`.**

| Kryterium | `renderChatMarkdown` + `@slavia/shared/markdown-inline` | `marked` |
|-----------|----------------------------------------------------------|----------|
| XSS / sanitize | Kontrolowany whitelist HTML | Wymaga DOMPurify lub `marked-safe` |
| Bundle | ~0 dodatkowych KB | +~30 KB minified |
| Parity mobile | Ten sam `markdownInline` w Dart | Brak w Flutter |
| Tabele / HR | Wystarczające dla Trenera AI | Pełny CommonMark — overkill |

Kolejne rozszerzenia parsera → shared `markdownInline.ts`, nie zewnętrzna biblioteka.
