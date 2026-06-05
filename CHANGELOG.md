# Changelog - Slavia Frontend

## [3.2.5] - 2026-06-05

### Kadra i formularze
- **PlayersManager**: naprawa listy po refaktorze (`ClubPlayersListPanel` / `ClubPlayersEditorForm`), filtry, profil publiczny z edycji.
- **SlaviaEditorSheet** + **SlaviaOverlaySelect**: portal selectów, strażnik niezapisanych zmian, migracja ciężkich formularzy panelowych.
- **SlaviaModal**: usuwanie zawodnika i krótkie dialogi z obsługą wstecz.

### OpenAPI i CI
- Snapshot `openapi/openapi.snapshot.json` + `pnpm openapi:check` (drift, SHA); pełne `components.schemas` — w kolejce po stronie backendu Rust.
- Smoke E2E Playwright (desktop + mobile), manifest PWA.

### Routing i panele
- `/zawodnicy` → `pages/zawodnicy/index.vue` (naprawa archiwum i porównania).
- **Nawigacja paneli** (SuperAdmin): zakładki per rola zamiast jednej długiej listy.
- **Nuxt 4**: `future.compatibilityVersion: 4`.

### Wydajność (design-2.0 / Vercel)
- **Build**: większy heap Node, preset Nitro `vercel` na CI; BFF `/api/public/*` z cache CDN.
- **Zawodnicy publiczni**: jeden request `public-board`; prefetch linków po interakcji.
- **Scroll-to-top**, marginesy publiczne, komponenty Public* bez prefiksu Panel.

## [3.2.4] - 2026-05-19

Zob. wpis v3.2.4-dev w panelu admina (changelog UI) oraz commit 4d15b5f.
