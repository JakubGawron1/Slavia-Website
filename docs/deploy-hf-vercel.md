# Deploy: Hugging Face (backend) + Vercel (frontend)

Produkcja: **backend Rust** na [Hugging Face Space](https://huggingface.co/spaces) (Docker), **frontend Nuxt** na Vercel. Szczegóły HF po stronie backendu: `Slavia-backend/docs/DEPLOY_HUGGINGFACE.md`. Metryki Prometheus i canary scrape: [`observability.md`](observability.md).

## Kolejność wdrożenia

| Zmiana | Kolejność |
|--------|-----------|
| **Kontrakt API** (nowa/zmieniona trasa, payload, migracja DB) | **1. HF backend** → **2. Vercel frontend** |
| Tylko UI / copy / style (bez zmian API) | Wystarczy deploy Vercel |
| Tylko backend (fix serwerowy, bez nowych pól w JSON) | Wystarczy deploy HF |

**Reguła:** frontend nie może trafić na produkcję wcześniej niż backend obsłuży nowe endpointy — inaczej panele (np. dashboard zawodnika) dostaną 404/500 albo puste KPI.

Typowy flow przy zmianie API:

1. Merge + deploy **Slavia-backend** (`main` → GitHub Actions → HF Space).
2. Smoke backendu: `pnpm smoke:post-deploy` (patrz [Post-deploy smoke](#post-deploy-smoke)) albo ręcznie `curl` na `/api/health`.
3. W repo frontendu: `pnpm openapi:snapshot` + `pnpm openapi:types` + `pnpm openapi:check` (lokalnie lub w CI PR).
4. Merge + deploy **Slavia-frontend** (push `main` → Vercel).

---

## Zmienne Vercel (`NUXT_PUBLIC_*`)

Bez końcowego slasha w URL.

| Zmienna | Kiedy | Przykład |
|---------|-------|----------|
| `NUXT_PUBLIC_API_BASE_URL` | Fallback / lokalny dev; na Vercel często = HF | `https://koliber-cks-slavia.hf.space` |
| `NUXT_PUBLIC_API_BASE_URL_HUGGINGFACE` | Build-time BFF (`/api/public/*`) i domyślny provider HF | `https://koliber-cks-slavia.hf.space` |
| `NUXT_PUBLIC_API_BASE_URL_RENDER` | Opcjonalnie — deprecated dual-provider | — |
| `DEFAULT_BACKEND_PROVIDER` | Gdy storage pusty: `huggingface` | `huggingface` |

Na **Vercel Preview** provider jest wymuszony na Hugging Face. Po deployu sprawdź w `/superadmin/developer`, że aktywny backend wskazuje na właściwy Space.

Lokalnie: skopiuj `.env.example` → `.env` i ustaw `NUXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080`.

---

## Vercel Preview + osobny HF Space (nie prod)

Deploy **Preview** (PR na Vercel) **nie** może używać produkcyjnego Space ani Turso prod. Pełna checklista krok po kroku — osobny Space dev, tabele env (Vercel + HF), CORS i Production Deploy Hook:

→ **[preview-environments.md](preview-environments.md#checklist-krok-po-kroku-jednorazowy-setup)**

Skrót: scope **Preview** w Vercel → `NUXT_PUBLIC_API_BASE_URL` i `NUXT_PUBLIC_API_BASE_URL_HUGGINGFACE` wskazują na preview Space; na HF osobne `JWT_SECRET`, Turso dev i `CORS_ALLOWED_ORIGINS` z `https://*.vercel.app`. Przy zmianie API najpierw backend na preview Space, potem test PR.

---

## Checklist OpenAPI (przed merge frontendu z zmianą API)

- [ ] Backend: trasa w `router.rs` + wpis w `src/embed/openapi.json`
- [ ] Backend wdrożony na HF (endpoint live)
- [ ] `pnpm openapi:snapshot` → `Slavia-shared/openapi/`
- [ ] `pnpm openapi:types` → `app/types/generated/openapi.types.ts`
- [ ] `pnpm openapi:check` przechodzi w CI
- [ ] Nowa trasa w `app/config/api.ts` (`apiRoutes`) jeśli używana w panelu
- [ ] Publiczny GET → whitelist w `server/utils/publicBackendProxy.ts`

---

## Checklist `/api/athletes/me/dashboard`

Agregowany payload dashboardu zawodnika — wrażliwy na rozjazd wersji FE/BE.

- [ ] OpenAPI zawiera `GET /api/athletes/me/dashboard` (embed backendu = snapshot shared)
- [ ] Typ w `app/types/models.ts` / generated zgadza się z odpowiedzią HF
- [ ] `apiRoutes.athletes.meDashboard` → `/api/athletes/me/dashboard`
- [ ] Po deployu HF: zalogowany zawodnik → `/athlete` — hero, sekcje i KPI bez błędów sieciowych
- [ ] Opcjonalnie: `pnpm test:e2e` — `e2e/smoke-athlete-dashboard.spec.ts` (mocki lub `PLAYWRIGHT_START_SERVER=1`)

Przy podglądzie roli (SuperAdmin): rewrite w `rolePreviewApiRewrite.ts` kieruje `/api/athletes/me/dashboard` na endpoint preview — nie dotyczy zwykłego deployu prod.

---

## Post-deploy smoke

Skrypt `scripts/post-deploy-smoke.mjs` (`pnpm smoke:post-deploy`) — szybki ping **po** wdrożeniu HF i/lub Vercel. Exit code `1` przy błędzie (GitHub Actions, ręczny release check).

| Check | URL | Oczekiwanie |
|-------|-----|-------------|
| Backend HF | `GET {HF}/api/health` | HTTP 200; opcjonalnie JSON z `ok !== false` |
| Frontend Vercel | `GET {SITE}/api/system/backend-provider` | HTTP 200 + `active_provider` ∈ `huggingface` \| `render` |

Alternatywa dla frontendu: `--site-path=/` (strona główna, bez walidacji JSON).

### Zmienne środowiskowe

| Zmienna | Opis |
|---------|------|
| `SLAVIA_HF_API_URL` | Base URL Space (bez slasha) — preferowane w CI |
| `SLAVIA_SITE_URL` | Origin Vercel produkcji lub preview |
| `SLAVIA_HF_HEALTH_PATH` | Domyślnie `/api/health`; tymczasowo np. `/api/system/ping` |
| `SLAVIA_SITE_SMOKE_PATH` | Domyślnie `/api/system/backend-provider`; alternatywa `/` |

Fallbacki: `SLAVIA_API_BASE_URL` / `NUXT_PUBLIC_API_BASE_URL_HUGGINGFACE` (HF), `SLAVIA_BFF_URL` / `NUXT_PUBLIC_SITE_URL` (Vercel).

### Przykłady

**Produkcja (PowerShell):**

```powershell
$env:SLAVIA_HF_API_URL = "https://koliber-cks-slavia.hf.space"
$env:SLAVIA_SITE_URL = "https://cksslavia.vercel.app"
pnpm smoke:post-deploy
```

**Bash / CI:**

```bash
SLAVIA_HF_API_URL=https://koliber-cks-slavia.hf.space \
SLAVIA_SITE_URL=https://cksslavia.vercel.app \
pnpm smoke:post-deploy
```

**Preview Vercel + flagi CLI:**

```bash
node scripts/post-deploy-smoke.mjs \
  --hf-url=https://koliber-cks-slavia.hf.space \
  --site-url=https://twoj-preview.vercel.app \
  --site-path=/
```

**Kolejność w release:** uruchom po deployu backendu (HF), potem ponownie po deployu frontendu (Vercel) — oba checki muszą przejść przed uznaniem release za gotowy.

---

## Szybka weryfikacja po deployu

1. `pnpm smoke:post-deploy` — HF health + Vercel BFF provider.
2. Publiczne GET: `/zawodnicy`, `/aktualnosci` (BFF → HF).
3. Panel: logowanie → `/athlete` (dashboard + `/me/dashboard`).
4. SuperAdmin → developer: provider = Hugging Face, URL Space zgodny z env.
