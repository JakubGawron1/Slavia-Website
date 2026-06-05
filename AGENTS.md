# Slavia Frontend — przewodnik dla agentów i deweloperów

Aplikacja Nuxt 4 dla klubu CKS Slavia Ruda Śląska. Frontend współpracuje z backendem Rust (`../Slavia-backend`) i opcjonalnie z aplikacją mobilną (`../Slavia-mobile`).

## Szybki start

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm lint         # ESLint
pnpm typecheck    # vue-tsc przez Nuxt
pnpm build        # produkcja (wymaga ~8 GB RAM — skrypt ustawia max-old-space-size)
pnpm test:e2e     # Playwright (lokalnie: PLAYWRIGHT_START_SERVER=1)
pnpm release:check  # pełna walidacja przed release (PowerShell)
```

**Env:** `.env` → `NUXT_PUBLIC_API_BASE_URL` (bez końcowego slasha). Opcjonalnie `NUXT_PUBLIC_API_BASE_URL_LEAPCELL` / `_RENDER` dla dual-provider.

**Backend lokalny:** `pnpm smoke:backend` — szybki ping API przed pracą z panelami.

---

## Architektura — trzy warstwy danych

```
┌─────────────────────────────────────────────────────────────┐
│  Strony publiczne (SSG/ISR)                                 │
│  usePublicLazyFetch('athletes') → /api/public/* → Rust GET  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Panele po logowaniu (CSR, no-store)                        │
│  useApi() → auth.apiBase (Leapcell/Render) + Bearer JWT     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Server routes Nuxt (BFF, bez tokenu użytkownika)           │
│  /api/public/*, /api/system/backend-provider, mobile release│
└─────────────────────────────────────────────────────────────┘
```

| Warstwa | Composable / URL | Kiedy |
|---------|------------------|-------|
| Publiczne GET (cache CDN) | `usePublicLazyFetch`, `publicApiUrl()` | Ranking, galeria, aktualności, kalendarz publiczny |
| Autoryzowane mutacje/GET | `useApi()` | Panele admin/trener/zawodnik, czat, dziennik |
| Wyszukiwarka w belce | `publicApiUrl()` | Zawsze BFF — nigdy `config.public.apiBase` z klienta |
| Provider backendu | `useBackendProvider()` | Hydracja w `plugins/00.auth.ts`; przełącznik Leapcell ↔ Render |

**Błędy API:** `getApiErrorMessage(e)` / `getApiDetailedErrorMessage(e)` z `useApi.ts`. Uploady `FormData` mają timeout 120 s (domyślnie 20 s).

---

## Role i trasy

| Rola | Prefix | Middleware | Dashboard |
|------|--------|------------|-----------|
| SuperAdmin | `/superadmin/**` | `superadmin` | `/superadmin` |
| Admin | `/admin/**` | `admin` | `/admin` |
| Trener | `/trainer/**` | `trainer` | `/trainer` |
| Zawodnik | `/athlete/**` | `athlete-or-trainer` (zależnie od trasy) | `/athlete` |

**Auth:** `useAuth()` — token w cookie + fallback localStorage (Brave). Po 401 → logout. Po 403 + flaga `ban_redirect_on_403` → `/banned` (poza SuperAdmin).

**Middleware globalne:**
- `ban.global.ts` — blokada kont
- `panel-nav.global.ts` — feature flagi modułów panelu (klient)
- `dev-iframe.global.ts` — podgląd w iframe dev

**Named middleware:** `auth`, `guest`, `admin`, `trainer`, `superadmin`, `athlete-or-trainer`, `athlete-calendar`, `athlete-dziennik`, `diary-redirect`.

Przykład ochrony strony:
```vue
definePageMeta({ middleware: ['auth', 'trainer'] })
```

---

## Design system — kiedy czego używać

### @nuxt/ui (domyślnie)
- `UButton`, `UCard`, `UInput`, `UFormField`, `UBadge`, `USelect` — standardowe formularze i listy
- `UCommandPalette` — wyszukiwarka kontekstowa (`ClubGlobalSearch`)
- Layouty: `PanelPageLayout`, `PanelPageHeader`, `PublicPageLayout`

Globalne nadpisania slotów UI: `app/app.config.ts` (kolory primary=green, z-index selectów w modalach).

### Własne komponenty Slavia

| Komponent | Kiedy |
|-----------|--------|
| `SlaviaModal` | Krótkie dialogi, potwierdzenia, wyszukiwarka — gdy wystarczy prosty modal |
| `SlaviaEditorSheet` | Długie formularze edycji (zawodnik, wpisy) — Teleport, gest wstecz, `scroll-restore-key` |
| `SlaviaSheetSelect` | Alias `SlaviaOverlaySelect` w editor sheet |
| `SlaviaOverlaySelect` | USelect z portalem (sheet → body) — sheety i modale |
| `SlaviaFormNativeSelect` | Natywny `<select>` gdy Nuxt UI select zawodzi na mobile |

**Nie używaj `UModal`** dla ciężkich formularzy — historyczne problemy z focusem i z-index.

**Editor sheet:** ustaw `scroll-restore-key` + `data-form-field` na polach → `useFormFieldScrollRestore` przywraca pozycję scrolla po zamknięciu selecta/modala.

### Pliki `.client.vue`
TensorFlow, kamera, QR, edytor WYSIWYG, podgląd viewportu — wszystko co wymaga `window` / WebGL / `navigator`.

### Style SCSS
- Tailwind + Nuxt UI: `app/assets/css/main.css`
- Własne style: `app/assets/scss/slavia.scss` (importowany z main.css)
- Nowe komponenty UI → `_components/`; tokeny → `abstracts/_tokens.scss`
- Style specyficzne dla sheeta → `_editor-sheet.scss`
- **Nie** importuj `@use tailwindcss` w plikach SCSS — to warstwa CSS w main.css

---

## Typy API i kontrakt z backendem

1. **Snapshot (po zmianie backendu):** `pnpm openapi:snapshot` → commit `openapi/` + generated
2. **Generuj:** `pnpm openapi:types` (backend lokalnie lub `openapi/openapi.snapshot.json` w CI)
3. **Sprawdź drift:** `pnpm openapi:check` (fail w CI przy braku snapshotu lub rozjechanych typach)
4. **Most typów:** `app/types/api.ts` — aliasy domenowe; stopniowa migracja z `models.ts` do OpenAPI
5. **Ścieżki REST:** `app/config/api.ts` — trzymaj spójnie z `router.rs` w backendzie

**Nowy endpoint backendu → frontend:**
1. Rust route + wpis w OpenAPI embed
2. `pnpm openapi:snapshot` + `pnpm openapi:types` + ewentualny alias w `api.ts`
3. Wpis w `apiRoutes` jeśli to stała trasa aplikacji
4. Jeśli publiczny GET → whitelist w `server/utils/publicBackendProxy.ts`

---

## Checklisty

### Nowa trasa publiczna (SSG/ISR)

1. `config/prerender.ts` — jeśli SSG (`prerenderRoutes` / `prerenderIgnore`)
2. `config/routeRules.ts` — ISR TTL (`isr: N`, `prerender: true`)
3. `nuxt.config.ts` → `robots` / `sitemap` exclude (panele już wykluczone)
4. `server/utils/publicBackendProxy.ts` — whitelist BFF (jeśli publiczny GET)
5. Strona: `usePublicLazyFetch('…')` z sensownym `default` dla prerenderu offline
6. Smoke E2E w `e2e/smoke.spec.ts` (+ `smoke-mobile.spec.ts` dla viewportu mobile)

### Nowy moduł panelu (admin / trener / zawodnik)

1. `app/data/panelNavigationCatalog.ts` — wpis w `PANEL_NAV_MODULES` (id: `panel_nav_{role}_{slug}`)
2. Strona z odpowiednim middleware roli
3. `config/routeRules.ts` → `panelNoStore` (CSR, brak cache)
4. Jeśli moduł ma być wyłączalny z URL → `gateRoute: true` w katalogu
5. SuperAdmin zarządza flagami: `/superadmin/nawigacja-paneli`

### Nowa funkcja eksperymentalna

1. Wpis w `app/data/experimentalFeaturesCatalog.ts`
2. Użycie: `useExperimentalFlag('feature_id')` lub `useExperimentalFeatures()`
3. Kill switch deploy: env `NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH` (lista id oddzielonych przecinkiem)

---

## Nawigacja panelu i feature flagi

- **Katalog modułów:** `app/data/panelNavigationCatalog.ts`
- **Runtime:** `usePanelNavigationFlags()` — hydracja z API, override per flaga
- **Middleware:** `panel-nav.global.ts` blokuje bezpośredni URL gdy `gateRoute: true` i moduł wyłączony
- **SuperAdmin bypass:** SA zawsze widzi wszystkie kafelki i omija gate

---

## Strona `/superadmin/developer`

- **Logika:** `app/composables/useDeveloperPage.ts` + typ `app/composables/developer/types.ts`
- **Sekcje UI:** `app/components/dev/sections/Developer{Overview,Tools,Map,Ops}Section.vue`
- **Nawigacja zakładek:** `DeveloperSectionNav.vue`
- **Regeneracja sekcji (rzadko):** `node scripts/split-developer-page.mjs` + `node scripts/prefix-developer-sections.mjs`

---

## Composables współdzielone między rolami

| Composable | Zastosowanie |
|------------|--------------|
| `useRecoveryLogs` | athlete + trainer regeneracja |
| `useZawodnicyPage` | ranking publiczny `/zawodnicy` |
| `useFormFieldScrollRestore` | długie formularze (`data-form-field`) |
| `useDashboardAccountView` | widok konta na dashboardach |
| `useRoleDashboardNav` | linki modułów na dashboardzie roli |
| `useSlaviaSeo` | meta/OG publicznych stron |
| `useSlaviaBackNavigation` | spójny „wstecz" na mobile |
| `useOverlayDismiss` | zamykanie overlayów (ESC, klik w tło) |
| `useOverlaySelectPortal` | portal selectów (sheet / modal / body) |
| `useFormDirtyGuard` | ostrzeżenie przed zamknięciem z niezapisanymi zmianami |
| `useClubContentAdmin` | aktualności, ogłoszenia, galeria (admin) |
| `useNotifications` / `useNotificationLinks` | powiadomienia in-app |

---

## Konfiguracja projektu

| Plik | Odpowiedzialność |
|------|------------------|
| `nuxt.config.ts` | moduły, runtimeConfig, import reguł z `config/` |
| `config/routeRules.ts` | ISR vs CSR, cache-control paneli i BFF |
| `config/prerender.ts` | trasy SSG, ignore |
| `config/site.ts` | URL produkcyjny, wersja z package.json |
| `config/pwa.ts` | manifest PWA |
| `app/config/api.ts` | kanoniczne ścieżki REST |

**Windows dev:** ISR na `/` wyłączone poza prod (`devDisableRootIsr`) — unika `EISDIR` z payloadCache/unstorage.

---

## CI i release

Kolejność w `.github/workflows/ci.yml`:

`openapi:check` → `lint` → `typecheck` → `build` → Playwright smoke

Lokalnie pełny check: `pnpm release:check`.

E2E smoke: publiczne trasy (w tym `/zawodnicy/archiwum`), manifest PWA, ochrona tras, projekt `mobile-pixel5` (Pixel 5). Serwer: `PLAYWRIGHT_START_SERVER=1`.

---

## Współpraca z backendem (Rust)

- Repozytorium: `../Slavia-backend`
- Router: `src/router.rs` — źródło prawdy dla ścieżek
- OpenAPI embed: `src/embed/openapi.json` — generuj typy przed PR z nowymi endpointami
- CORS: backend musi zezwalać na origin frontendu
- Dual provider: Leapcell (domyślny) / Render — przełączany przez `/api/system/backend-provider`

**Zmiana API:** najpierw backend + OpenAPI, potem `openapi:types` i frontend. Nie zgaduj kształtu JSON.

---

## Antywzorce — czego unikać

| ❌ Unikaj | ✅ Zamiast tego |
|----------|----------------|
| `$fetch(config.public.apiBase + '/api/…')` z klienta na publiczne dane | `usePublicLazyFetch` / `publicApiUrl()` |
| `UModal` z 20+ polami formularza | `SlaviaEditorSheet` |
| `USelect` w sheecie bez portalu | `SlaviaSheetSelect` lub `SlaviaFormNativeSelect` |
| Hardcoded URL backendu | `apiRoutes` + `useApi()` |
| Nowy publiczny GET bez whitelist BFF | Proxy odrzuci 404 lub ominie cache |
| Logika biznesowa w `.vue` >200 linii | composable w `app/composables/` |
| Style inline zamiast tokenów | SCSS + Tailwind utility classes |
| Commit `openapi.types.ts` bez regeneracji | `pnpm openapi:types` po zmianie backendu |

---

## Struktura katalogów (skrót)

```
app/
  components/     # UI — club/, panel/, athlete/, trainer/, dev/
  composables/    # logika współdzielona
  data/           # katalogi statyczne (nawigacja, kategorie wagowe, flagi)
  middleware/     # ochrona tras
  pages/          # file-based routing Nuxt
  plugins/        # 00.auth (hydracja), panel-nav-bootstrap, error-reporting
  types/          # api.ts, models.ts, generated/openapi.types.ts
  utils/          # funkcje czyste (ranking, SEO, kalkulatory)
config/           # routeRules, prerender, pwa, site
server/           # BFF routes, public proxy, backend-provider store
e2e/              # Playwright smoke
scripts/          # openapi check, release-check, split developer page
```

---

## Wersjonowanie

Wersja aplikacji: `package.json` → `version` (obecnie `3.x-dev`). Publiczna wersja buildu: `config/site.ts` → `formatPublicAppVersion`.
