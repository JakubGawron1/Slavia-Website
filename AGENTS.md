# Slavia Frontend — przewodnik dla agentów i deweloperów

> **Język dokumentu:** polski. Wyjątek — sekcja [Commity Git](#commity-git): szablony wiadomości commitów i przykłady **muszą być po angielsku** (wymóg repozytorium).

Aplikacja Nuxt 4 dla klubu CKS Slavia Ruda Śląska. Frontend współpracuje z backendem Rust (`../Slavia-backend`), paczką współdzieloną (`../Slavia-shared` → `@slavia/shared`) i z aplikacją mobilną (`../Slavia-mobile` — **tylko zawodnik/trener**, bez paneli Admin/SuperAdmin; szczegóły w [Slavia-mobile](#slavia-mobile-flutter)).

## Szybki start

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm lint         # ESLint (m.in. zakaz v-html poza komponentami safe-html)
pnpm test         # Vitest (sanitizeHtml, renderChatMarkdown, ranking)
pnpm typecheck    # vue-tsc przez Nuxt
pnpm build        # produkcja (wymaga ~8 GB RAM — skrypt ustawia max-old-space-size)
pnpm bundle:report  # F-13: raport chunków JS po buildzie (wymaga .output/public/_nuxt)
pnpm test:e2e     # Playwright (lokalnie: PLAYWRIGHT_START_SERVER=1)
pnpm release:check  # pełna walidacja przed release (PowerShell)
```

**Env:** `.env` → `NUXT_PUBLIC_API_BASE_URL` (bez końcowego slasha). Opcjonalnie `NUXT_PUBLIC_API_BASE_URL_HUGGINGFACE` / `_RENDER` (deprecated) dla dual-provider.

**Backend lokalny:** `pnpm smoke:backend` — szybki ping API przed pracą z panelami.

**Po deployu (HF + Vercel):** `pnpm smoke:post-deploy` — patrz `docs/deploy-hf-vercel.md` (`SLAVIA_HF_API_URL`, `SLAVIA_SITE_URL`).

**Submodule shared:** po klonie: `git submodule update --init --recursive --remote` (Vercel/CI/ci.yml zawsze ściągają **latest `main`** z `Slavia-shared`). Lokalnie: `pnpm shared:pull`.

---

## Slavia-shared (`@slavia/shared`)

Wspólny kontrakt API, katalogi JSON i czysta logika (Sinclair, tor sztangi, PZPC, proporcje, odznaki) dla **WWW** i **Flutter**.

| Gdzie | Ścieżka |
|-------|---------|
| **Lokalny dev** | `../Slavia-shared/` — osobny klon repo (pełny folder projektu) |
| **CI / Vercel** | `Slavia-frontend/Slavia-shared/` — submodule, zawsze **latest `main`** (`--remote`) |
| Paczka npm (`package.json`) | `"@slavia/shared": "file:./Slavia-shared"` |
| Import w runtime (`nuxt dev`) | alias → `../Slavia-shared` gdy istnieje (latest z Twojego klonu), inaczej submodule |
| Mobile (Flutter) | `path: ../Slavia-shared/dart` (CI: shallow clone `main`) |

**Lokalny układ na dysku:**

```
Desktop/
  Slavia-shared/          ← tu edytujesz shared; push na main = źródło dla CI
  Slavia-frontend/
    Slavia-shared/        ← submodule; pnpm install / shared:pull → latest main
  Slavia-mobile/
  Slavia-backend/
```

Po zmianie w shared: **push na `main` w repo Slavia-shared** — workflow `dispatch-dependents` uruchamia CI w Website i Mobile (`repository_dispatch`). Vercel: sekret `VERCEL_DEPLOY_HOOK` w repo frontendu (Deploy Hook z panelu Vercel).

**Import w Nuxt** (preferuj re-eksporty w `app/utils/` dla stabilnych aliasów `~/utils/…`):

```ts
import { sinclairTotal } from '@slavia/shared/sinclair'
import themePresets from '@slavia/shared/data/theme-presets.json'
```

**Skrypty:**

```bash
pnpm shared:test          # vitest w Slavia-shared
pnpm openapi:snapshot       # backend → Slavia-shared/openapi/
pnpm openapi:types        # generuje app/types/generated/openapi.types.ts
pnpm openapi:check        # CI: drift + SHA w submodule
```

**Zmiana logiki współdzielonej:** edytuj `../Slavia-shared` (lub submodule), push na **`main`** w repo Slavia-shared. Nie trzeba commitować wskaźnika submodule w frontendzie — CI/Vercel używają `--remote`.

**Nie przenoś do shared:** composables Nuxt, BFF `server/`, UI, auth, cache — to warstwa platformowa.

### Backend (Rust) — co może korzystać ze shared

Backend **nie importuje** TypeScript — tylko pliki neutralne (JSON). Źródło OpenAPI pozostaje w Rust (`src/embed/openapi.json`); shared jest **lustrem** dla klientów.

| Zasób w shared | Zastosowanie w backendzie | Priorytet |
|----------------|---------------------------|-----------|
| `data/theme-presets.json` | Walidacja `ui_theme_preset` (dziś hardcoded `ALLOW_PRESET` w `admins.rs`) | Wysoki |
| `data/pzpc-weight-classes.json` | Format `weight_category`, seed, ewentualna walidacja przy zapisie zawodnika | Wysoki |
| `data/athlete-badges.json` | Progi odznak, gdyby API zwracało poziomy server-side | Średni |
| `test-vectors/sinclair.json` + stałe w JSON | Sinclair po stronie serwera (ranking, walidacja) — dziś tylko klienci | Średni |
| `data/brand-defaults.json` | CORS / redirect URL w dev — opcjonalnie | Niski |
| `data/weightlifting-exercises.json` | Tylko kalkulatory UI — **nie** dla API | Nie |

Integracja Rust: `include_str!` / `build.rs` czytający `../Slavia-shared/data/*.json` przy `cargo build`, albo skrypt sync przed CI backendu.

---

## Slavia-mobile (Flutter)

Repozytorium: `../Slavia-mobile`. Współdzieli `@slavia/shared` (Dart) i ten sam backend Rust co WWW.

### Zakres ról — tylko zawodnik i trener

Aplikacja mobilna obsługuje **wyłącznie** role **Zawodnik** (`Athlete`) i **Trener** (`Trainer`) oraz wspólne funkcje klubowe po zalogowaniu (czat, obecność, kalendarz itd.). **Nie** implementujemy paneli WWW `/admin/**` ani `/superadmin/**` — CMS, import danych, nawigacja paneli, developer tools, audit logi, zarządzanie kontami adminów itp. pozostają **tylko w przeglądarce**.

| Rola WWW | Mobile |
|----------|--------|
| Zawodnik (`/athlete/**`) | Tak — parity tam, gdzie ma sens na telefonie |
| Trener (`/trainer/**`) | Tak — parity tam, gdzie ma sens na telefonie |
| Admin (`/admin/**`) | **Nie** — użyj WWW |
| SuperAdmin (`/superadmin/**`) | **Nie** — użyj WWW |

**Dla agentów:** nowe moduły panelu admin/superadmin we frontendzie Nuxt **nie wymagają** odpowiednika w Flutterze. W backlogu mobile nie planuj „parity” z `/admin` ani `/superadmin`.

### Mobile — stan po deprecacji admin/SA (2026)

Ekrany administracyjne **usunięte** z Fluttera (`MOB-DEPREC1–2`). Konto **tylko** Admin/SuperAdmin (bez roli Athlete/Trainer) → `BrowserPanelScreen` („użyj panelu WWW”). Parity zawodnik/trener: m.in. `AiCoachScreen`, `MembershipPaymentsScreen`, `BannedScreen`, ranking/wyzwania publiczne, `go_router` + roadmap FCM w `docs/fcm-go-router-roadmap.md`.

**Nie dodawaj** z powrotem ekranów `/admin/**` / `/superadmin/**` na mobile.

### Wyjątek: endpointy „admin” używane przez trenera

Nie mylić **panelu Admin** z endpointami API nazwanymi `admin`, które kadra używa w codziennej pracy:

- `GET /api/athletes/admin` — lista zawodników dla trenera (czat, plany, lista kadry), **nie** ekran `SuperAdminAthleteManagerScreen`
- Trener z rolą `Trainer` (bez Admin) nadal może korzystać z tych tras — ACL po stronie backendu

Nowe funkcje trenera/zawodnika w mobile: tak. Nowe funkcje admin/superadmin: tylko WWW.

---

## Architektura — trzy warstwy danych

```
┌─────────────────────────────────────────────────────────────┐
│  Strony publiczne (SSG/ISR)                                 │
│  usePublicLazyFetch('athletes') → /api/public/* → Rust GET  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Panele po logowaniu (CSR, no-store)                        │
│  useApi() → auth.apiBase (Hugging Face / Render) + Bearer JWT │
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
| Provider backendu | `useBackendProvider()` | Hydracja w `plugins/00.auth.ts`; przełącznik Hugging Face ↔ Render (deprecated) |

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
| `SlaviaSafeHtml` | **Jedyny** sposób na rich HTML z API/CMS/edytora (TipTap) — wewnętrznie `sanitizeRichHtml` |
| `SlaviaSimpleMarkdown` | Lekki MD (ogłoszenia) — `renderSimpleMarkdown` + DOMPurify |
| `SlaviaChatMarkdown` | Odpowiedzi Trenera AI / publiczny asystent — `renderChatMarkdown` + DOMPurify |

Komponenty w `app/components/ui/` rejestrują się **bez** prefiksu `Ui` — wpis `pathPrefix: false` w `nuxt.config.ts` (po zmianie configu: restart `pnpm dev`).

**Nie używaj `UModal`** dla ciężkich formularzy — historyczne problemy z focusem i z-index.

**Editor sheet:** ustaw `scroll-restore-key` + `data-form-field` na polach → `useFormFieldScrollRestore` przywraca pozycję scrolla po zamknięciu selecta/modala.

### Bezpieczeństwo XSS i HTML

**Zasada:** w szablonach **nigdy** nie używaj `v-html` bezpośrednio — ESLint (`vue/no-v-html: error`) blokuje to w CI. Dozwolone wyłącznie trzy komponenty w `app/components/ui/` (whitelist w `eslint.config.js`).

| Komponent | Util / sanityzacja | Typ treści |
|-----------|-------------------|------------|
| `SlaviaSafeHtml` | `~/utils/sanitizeRichHtml.ts` (DOMPurify, hooki img/style/link) | CMS, aktualności, dziennik, plany |
| `SlaviaSimpleMarkdown` | `~/utils/renderSimpleMarkdown.ts` | Ogłoszenia klubowe |
| `SlaviaChatMarkdown` | `~/utils/renderChatMarkdown.ts` + `@slavia/shared/markdown-inline` | Trener AI, czat publiczny |

Przy **zapisie** do API (formularze) nadal wywołuj `sanitizeRichHtml` przed POST/PATCH — komponenty sanityzują tylko **wyświetlanie** (defense in depth przy podwójnej sanityzacji jest OK).

Testy regresji: `app/utils/sanitizeHtml.test.ts`, `renderChatMarkdown.test.ts` — uruchamiane przez `pnpm test`.

**Nagłówki HTTP** (clickjacking, MIME sniffing): `config/securityHeaders.ts` — dołączane do wszystkich tras w `config/routeRules.ts` (`/**` + `panelNoStore` / `publicBffCache` przez `withSecurityHeaders`).

**BFF:** formularz kontaktu → `server/api/contact.post.ts` (honeypot); publiczny czat AI → rate limit w `server/utils/publicAiRateLimit.ts`.

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

1. **Generuj embed (backend):** `cd ../Slavia-backend && node scripts/generate-openapi.mjs` → `src/embed/openapi.json` (~140 tras z `router.rs`)
2. **Snapshot (po zmianie backendu):** `pnpm openapi:snapshot` → commit `Slavia-shared/openapi/` + generated
3. **Generuj typy:** `pnpm openapi:types` (backend lokalnie lub `Slavia-shared/openapi/openapi.json` w CI)
4. **Sprawdź drift:** `pnpm openapi:check` (fail w CI przy braku snapshotu lub rozjechanych typach)
5. **Most typów:** `app/types/api.ts` — aliasy domenowe; stopniowa migracja z `models.ts` do OpenAPI
6. **Ścieżki REST:** `app/config/api.ts` — trzymaj spójnie z `router.rs` w backendzie

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
| `useMembershipPaymentsPage` | wspólna logika `athlete/skladki` + `trainer/skladki` |
| `useAthletePublicProfilePage` / `useAthletePublicProfileCharts` | refaktor `athlete/[slug].vue` |
| `useNotifications` / `useNotificationLinks` | powiadomienia in-app |

---

## Konfiguracja projektu

| Plik | Odpowiedzialność |
|------|------------------|
| `nuxt.config.ts` | moduły, runtimeConfig, import reguł z `config/` |
| `config/routeRules.ts` | ISR vs CSR, cache-control paneli i BFF, nagłówki bezpieczeństwa |
| `config/securityHeaders.ts` | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` |
| `config/prerender.ts` | trasy SSG, ignore |
| `improve.md` | audyt techniczny i backlog fal 0–4 (✅ = zrobione) |
| `config/site.ts` | URL produkcyjny, wersja z package.json |
| `config/pwa.ts` | manifest PWA |
| `app/config/api.ts` | kanoniczne ścieżki REST |

**Windows dev:** ISR na `/` wyłączone poza prod (`devDisableRootIsr`) — unika `EISDIR` z payloadCache/unstorage.

---

## CI i release

Kolejność w `.github/workflows/ci.yml`:

`openapi:check` → `lint` → `pnpm test` (Vitest) → `shared:test` → `typecheck` → `build` → `bundle:report` → Playwright smoke

Lokalnie pełny check: `pnpm release:check` (zawiera `bundle:report` po buildzie).

**Bundle size (F-13):** `scripts/bundle-report.mjs` — po `pnpm build` skanuje rekurencyjnie `.output/public/_nuxt` (pliki `.js`), wypisuje top chunków i ostrzega gdy suma JS > progu. Próg domyślny: `DEFAULT_MAX_JS_KB` w skrypcie (TODO: baseline po pierwszym pomiarze na CI); override: `SLAVIA_BUNDLE_JS_MAX_KB`. Flagi: `--fail` (exit 1 przy przekroczeniu), `--json`, `--top=N`, `--dir=…`. CI i `release:check` uruchamiają `pnpm bundle:report` bez `--fail` — tylko ostrzeżenie w logu.

E2E smoke: publiczne trasy (w tym `/zawodnicy/archiwum`), manifest PWA, ochrona tras, projekt `mobile-pixel5` (Pixel 5). Serwer: `PLAYWRIGHT_START_SERVER=1`.

**Deploy prod (HF + Vercel):** przy zmianach API najpierw backend na Hugging Face, potem frontend na Vercel. Checklist OpenAPI, `/api/athletes/me/dashboard` i env `NUXT_PUBLIC_API_BASE_URL` — [`docs/deploy-hf-vercel.md`](docs/deploy-hf-vercel.md).

---

## Współpraca z backendem (Rust)

- Repozytorium: `../Slavia-backend`
- Router: `src/router.rs` — źródło prawdy dla ścieżek
- OpenAPI embed: `src/embed/openapi.json` — generuj typy przed PR z nowymi endpointami
- CORS: backend musi zezwalać na origin frontendu
- Dual provider: Hugging Face (domyślnie, Preview Vercel) / Render (deprecated) — przełączany przez `/api/system/backend-provider`

**Zmiana API:** najpierw backend + OpenAPI, potem `openapi:types` i frontend. Nie zgaduj kształtu JSON.

---

## Migracje bazy danych (backend)

Schemat bazy **nie żyje we frontendzie** — wszystkie tabele i migracje są w `../Slavia-backend/src/db.rs`. Frontend nie ma folderu `migrations/` ani własnego ORM.

### Stack i gdzie szukać

| Element | Lokalizacja |
|---------|-------------|
| Driver | **libsql** — SQLite lokalnie (`.local/slavia.db` lub `slavia.db`), Turso zdalnie (`TURSO_DATABASE_URL`) |
| Inicjalizacja | `init_db()` przy starcie `create_app()` w `lib.rs` |
| Nowe tabele / kolumny | `db.rs` → tablica `create_tables` + bloki `ALTER TABLE` po pętli |
| Migracje złożone | osobne funkcje `migrate_*` w `db.rs` (np. `migrate_cms_schema`, `migrate_attendance_unique_index`) |
| Modele Rust | `src/models.rs` — pola JSON/API muszą zgadzać się z kolumnami |

**Brak SQLx / SeaORM** — nie dodawaj `migrations/*.sql`; wzorzec projektu to inline DDL w `db.rs`.

### Jak dodawać zmiany schematu

1. **Nowa tabela** — wpis `CREATE TABLE IF NOT EXISTS …` w `create_tables` (+ indeksy w tej samej tablicy lub osobna funkcja `create_*_tables`).
2. **Nowa kolumna** — po pętli `create_tables`:
   ```rust
   let _ = conn.execute("ALTER TABLE athletes ADD COLUMN nowa_kolumna TEXT", ()).await;
   ```
   Powtórny start ignoruje błąd „duplicate column” (`let _ =`).
3. **Zmiana niedodatnia** (rename kolumny, inny typ, usunięcie) — dedykowana `migrate_*`:
   - wykryj stary schemat (`PRAGMA table_info`, `sqlite_master`),
   - `PRAGMA foreign_keys = OFF` jeśli są tabele potomne z FK,
   - `DROP` w kolejności od liści do korzenia,
   - `CREATE` nowego schematu,
   - przed DDL zamknij kursory (`drop(rows)` po `PRAGMA` — inaczej SQLite może zablokować tabelę).
4. **Endpoint + frontend** — po zmianie backendu: `pnpm openapi:snapshot` + `openapi:types`; publiczne GET → whitelist w `publicBackendProxy.ts`.

### CMS — uwaga na stary schemat `dev-cms`

Gałąź `dev-cms` zostawiła inne tabele (`cms_fields`, `cms_sections`, `cms_navigation`, `cms_pages.page_key`). Aktualny moduł używa `cms_pages.page_name`, `cms_variables`, `cms_navigation_items`, `cms_version_history`.

Przy starcie `migrate_cms_schema()` wykrywa legacy i odtwarza tabele CMS. Jeśli backend **wisi na migracji CMS**:

1. Zamknij wszystkie instancje `Slavia-backend.exe` (drugi proces trzyma blokadę `slavia.db`).
2. Lokalnie możesz wyczyścić ręcznie (PowerShell, w katalogu backendu):
   ```powershell
   sqlite3 slavia.db "PRAGMA foreign_keys=OFF; DROP TABLE IF EXISTS cms_fields; DROP TABLE IF EXISTS cms_sections; DROP TABLE IF EXISTS cms_navigation; DROP TABLE IF EXISTS cms_pages; DROP TABLE IF EXISTS cms_variables; DROP TABLE IF EXISTS cms_navigation_items; DROP TABLE IF EXISTS cms_version_history; PRAGMA foreign_keys=ON;"
   ```
3. Uruchom ponownie `cargo run` — tabele CMS powstaną od zera.

### Dev reset vs produkcja

| Środowisko | Zachowanie |
|------------|------------|
| Lokalne | `REBUILD_DB=true` → `reset_database()` + `seed_data()` — **tylko dev**, kasuje całą bazę |
| Turso / prod | wyłącznie migracje addytywne i `migrate_*`; **nigdy** `REBUILD_DB` na deployu |
| Backup prod | panel Turso lub `turso db shell … .dump` |

Po zwykłym starcie (bez `REBUILD_DB`) backend uruchamia też `sync_all_athletes_bests_from_results` — to synchronizacja danych, nie DDL.

### Checklist dla agenta (nowa tabela / moduł z DB)

1. `db.rs` — `CREATE TABLE` + ewentualna `migrate_*` przy konflikcie ze starym schematem
2. `models.rs` + `routes/*.rs` — handlery
3. `router.rs` — nest tras
4. `embed/openapi.json` — ścieżki dla CI
5. Frontend: `apiRoutes`, typy, BFF whitelist (publiczne GET)
6. Lokalnie: jedna instancja backendu, `cargo run` — logi `🔄 Migracja …` przy pierwszym uruchomieniu po zmianie

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
| `v-html` w `.vue` / surowy HTML z API | `SlaviaSafeHtml` / `SlaviaChatMarkdown` / `SlaviaSimpleMarkdown` |
| `$fetch` na `/api/contact` z klienta | BFF `server/api/contact.post.ts` + honeypot w formularzu |

---

## Struktura katalogów (skrót)

```
app/
  components/     # UI — club/, panel/, ui/ (safe-html), trainer/, dev/
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
scripts/          # openapi check, release-check, bundle-report, split developer page
```

---

## Commity Git

**Twórz commity tylko wtedy, gdy użytkownik o to poprosi.** Nie commituj proaktywnie po zakończeniu zadania.

### Język i format wiadomości *(wymagany angielski)*

Treść commitów w repozytorium jest **wyłącznie po angielsku** — zarówno subject, jak i body.

- **Bez współautorów** — nigdy nie dodawaj `Co-authored-by`, `Signed-off-by` ani podobnych trailerów.
- **Conventional Commits** — szablon:

  `type(scope): short imperative subject`

  | Element | Zasady |
  |--------|--------|
  | `type` | `feat`, `fix`, `refactor`, `perf`, `docs`, `chore` |
  | `scope` | moduł lub obszar (`klub`, `dashboard`, `openapi`, `cms`, …) — pomiń, jeśli niejasne |
  | subject | jedna linia, ≤72 znaki, bez kropki na końcu; opisuj **po co** / wpływ na użytkownika |
  | body | opcjonalnie (drugi `-m`): 1–2 zdania kontekstu; zawijaj ~72 znaki |

**Przykłady (commit message — English only):**

```
feat(dashboard): add collapsible sections with localStorage persistence
fix(cms): preserve full role nav when reordering from /klub hub
refactor(klub): extract KlubPageShell and useAttendancePage composable
chore(openapi): regenerate types after backend snapshot
```

### Co commitować

- Jeden logiczny zestaw zmian na commit (funkcja, poprawka lub refaktor — nie mix niepowiązanych plików).
- Stage tylko pliki z tej zmiany; nigdy `.env`, kluczy ani credentiali.
- Po zmianie API backendu: najpierw commit embed OpenAPI w backendzie, potem snapshot w **Slavia-shared** + `openapi.types.ts` we frontendzie.
- Przed commitem nietrywialnych zmian: `pnpm typecheck` (lub odpowiedni check dla zakresu).

### Bezpieczeństwo (agenci)

- **Nie** zmieniaj `git config`, **nie** używaj `--no-verify` ani force-push, chyba że użytkownik wyraźnie poprosi.
- **Nie** rób `git commit --amend`, chyba że użytkownik chce amend **oraz** ostatni commit jest Twój i nie był pushowany.
- **Nie** pushuj na remote bez wyraźnej prośby użytkownika.

### Windows (PowerShell)

Heredoc `$(cat <<'EOF' …)` nie działa w PowerShell. Użyj:

```powershell
git commit -m "feat(scope): subject in English" -m "Optional body in English."
```

### Workflow po prośbie o commit

1. `git status` + `git diff` — przejrzyj staged i unstaged.
2. Sformułuj wiadomość **po angielsku**; rozdziel na kilka commitów, jeśli zmiany są niezależne.
3. `git add` tylko właściwe ścieżki → `git commit` → `git status` (potwierdź czyste drzewo lub oczekiwany remainder).

---

## Wersjonowanie

Wersja aplikacji: `package.json` → `version` (obecnie `5.0.0`). Publiczna wersja buildu: `config/site.ts` → `formatPublicAppVersion`.

Po **większych zmianach** (nowy moduł panelu, publiczny endpoint, przełom API) podbij wersję **minor** lub **major** (semver) i zaktualizuj oba repozytoria:

| Krok | Frontend | Backend |
|------|----------|---------|
| Wersja | `package.json` → `version` | `Cargo.toml` → `version` |
| Historia | `CHANGELOG.md` (sekcja `[X.Y.Z]`) | `CHANGELOG.md` |
| UI admina | `app/pages/admin/changelog.vue` — wpis na górze listy | — |
| Kontrakt API | `pnpm openapi:snapshot` → `Slavia-shared/openapi/` + `pnpm openapi:types` | `src/embed/openapi.json` (commit w backendzie **przed** snapshotem) |

**Checklist przed merge / release:**

1. Backend: route w `router.rs`, OpenAPI embed, migracja w `db.rs` jeśli dotyczy.
2. Frontend: `apiRoutes`, BFF (`server/api/…`) lub whitelist `publicBackendProxy.ts` dla publicznych GET.
3. Bump wersji + changelog w obu repo (ta sama liczba wersji przy wspólnym wydaniu, np. `5.0.0`).
4. `pnpm openapi:check` i `pnpm typecheck` lokalnie; opcjonalnie `pnpm release:check`.
5. Zaktualizuj linię „obecnie X.Y.Z” w tej sekcji.

Wersje **patch** (np. `5.0.1`) — drobne poprawki bez nowych modułów: wystarczy bump w `package.json` / `Cargo.toml` + krótki wpis w `CHANGELOG.md`.
