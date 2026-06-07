# Changelog - Slavia Frontend

## [5.0.0] - 2026-06-07

### Trener AI (Groq / LLaMA)
- **Panel `/trainer/trener-ai` i `/athlete/trener-ai`**: czat, plany mikrocyklu, suplementacja i regeneracja z kontekstem profilu klubowego (PB, dziennik, wyniki, obecności).
- **Groq + LLaMA 3.1 70B** zamiast Gemini; klucz `GROQ_API_KEY` tylko na backendzie.
- **Limity klubu**: throttling per użytkownik i globalny klucz; **paski postępu** zużycia (wiadomości dziś/min, importy dla kadry).
- **Import planów AI** do modułu klubowego (kadra).
- Flaga eksperymentalna `gemini_olympic_coach` (nazwa historyczna id).

### Asystent publiczny
- **FAB** (prawy dolny róg) na stronach publicznych — pytania o klub, treningi i dwubój; kierowanie na `/kontakt` przy sprawach indywidualnych.
- BFF `/api/ai/public/*` → backend `POST /api/ai/coach/public/chat` (limit IP, bez logowania).

### CMS (edycja treści)
- **Globalny tryb edycji** treści publicznych (`CmsGlobalEditToggle`, pasek `CmsInlinePageBar`).
- Hydracja tras CMS po nawigacji klienckiej.

### OpenAPI
- Snapshot i typy dla endpointów Trenera AI (`pnpm openapi:check` w CI).

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
