# Środowiska Preview — Vercel → osobny Hugging Face Space

Każdy deploy **Vercel Preview** (PR, branch ≠ `main`) musi rozmawiać z **osobnym backendem HF** (preview/dev Space), **nie** z produkcyjnym Space `koliber-cks-slavia.hf.space`.

Izolacja chroni dane klubu (Turso prod), migracje DB i testy paneli przed przypadkowym zapisem na produkcję.

Powiązane: [deploy-hf-vercel.md](deploy-hf-vercel.md) (kolejność wdrożeń prod), `Slavia-backend/docs/DEPLOY_HUGGINGFACE.md` (setup Space).

---

## Checklist krok po kroku (jednorazowy setup)

Wykonaj raz przed pierwszym PR z panelem / zmianą API. Kolejność: **najpierw HF preview Space**, potem **Vercel Preview env**.

### Krok 1 — Hugging Face: preview / dev Space

| # | Akcja | Gdzie |
|---|--------|-------|
| 1.1 | **New Space** → SDK **Docker** (np. `cks-slavia-dev`, repo `koliber/cks-slavia-dev`) | [huggingface.co/new-space](https://huggingface.co/new-space) |
| 1.2 | Utwórz **osobną** bazę Turso (branch dev lub osobna instancja) — **nie** prod | [turso.tech](https://turso.tech) |
| 1.3 | Ustaw sekrety runtime (tabela [HF Space — sekrety](#hf-space--sekrety-preview)) | Space → **Settings → Variables and secrets** |
| 1.4 | Ustaw `CORS_ALLOWED_ORIGINS` (localhost + prod + preview Vercel) — [szczegóły CORS](#cors-na-preview-space) | ten sam panel HF |
| 1.5 | Wdróż kod backendu na preview Space | GitHub Actions z osobnym `HF_SPACE_REPO` **albo** ręczny deploy — patrz [Sync backendu](#sync-backendu-na-preview-space) |
| 1.6 | Smoke: `curl -s "https://<user>-<space>.hf.space/api/system/ping"` → HTTP 200 | terminal |

### Krok 2 — Vercel: zmienne tylko dla Preview

| # | Akcja | Gdzie |
|---|--------|-------|
| 2.1 | Otwórz **Environment Variables** projektu | Vercel → Project → **Settings → Environment Variables** |
| 2.2 | Dodaj `NUXT_PUBLIC_API_BASE_URL` = URL preview Space (bez slasha) | scope: **Preview** only |
| 2.3 | Dodaj `NUXT_PUBLIC_API_BASE_URL_HUGGINGFACE` = **ten sam** URL co 2.2 | scope: **Preview** only |
| 2.4 | Opcjonalnie `NUXT_PUBLIC_SITE_URL` — zwykle wystarczy auto z `VERCEL_URL` | scope: Preview |
| 2.5 | **Nie** kopiuj wartości prod do Preview — Production ma osobny scope | porównaj z [tabelą Vercel](#vercel--zmienne-środowiskowe-preview-vs-production) |
| 2.6 | Otwórz PR lub **Redeploy** istniejącego Preview, żeby nowe env weszły w życie | Vercel → Deployments |

### Krok 3 — Weryfikacja po pierwszym deployu Preview

| # | Check | Oczekiwanie |
|---|-------|-------------|
| 3.1 | `curl` na preview Space `/api/system/ping` | 200 |
| 3.2 | `curl` na `<preview>.vercel.app/api/public/athletes` | JSON z preview backendu |
| 3.3 | Logowanie z URL Preview (konto **dev**) | brak CORS w konsoli |
| 3.4 | `/athlete` po logowaniu | KPI bez 404 na `/api/athletes/me/dashboard` |
| 3.5 | DevTools → Network: host API | `*-dev.hf.space`, **nie** `koliber-cks-slavia.hf.space` |

Pełna lista QA przed merge: [Checklist przed merge PR](#checklist-przed-merge-pr-preview-qa).

---

## Mapowanie środowisk

| Warstwa | Production | Preview (Vercel PR) | Lokalny dev |
|---------|------------|---------------------|-------------|
| Frontend | `https://cksslavia.vercel.app` (lub custom) | `https://<projekt>-<hash>.vercel.app` | `http://localhost:3000` |
| Backend API | `https://koliber-cks-slavia.hf.space` | **Osobny Space preview/dev** (patrz poniżej) | `http://127.0.0.1:8080` |
| Baza | Turso prod | **Osobna** baza Turso (dev/staging) | SQLite lokalnie |
| `VERCEL_ENV` | `production` | `preview` | — |

**Reguła:** URL produkcyjnego Space **nigdy** nie trafia do zmiennych środowiska Vercel w scope **Preview**.

---

## Tabele zmiennych środowiskowych

### Vercel — zmienne środowiskowe (Preview vs Production)

W panelu Vercel → Project → Settings → Environment Variables. **Bez końcowego slasha** w URL.

| Zmienna | Scope Preview | Scope Production | Uwagi |
|---------|---------------|------------------|-------|
| `NUXT_PUBLIC_API_BASE_URL` | URL **preview** Space, np. `https://koliber-cks-slavia-dev.hf.space` | `https://koliber-cks-slavia.hf.space` | Fallback `config.public.apiBase`; BFF i panele |
| `NUXT_PUBLIC_API_BASE_URL_HUGGINGFACE` | **Ten sam** URL co preview powyżej | URL prod Space | Build-time BFF `/api/public/*` |
| `NUXT_PUBLIC_API_BASE_URL_RENDER` | — (puste / nie ustawiaj) | opcjonalnie deprecated | Preview wymusza HF w kodzie |
| `NUXT_PUBLIC_SITE_URL` | opcjonalnie | jawny URL prod | Preview: zwykle wystarczy `VERCEL_URL` |
| `DEFAULT_BACKEND_PROVIDER` | opcjonalnie `huggingface` | `huggingface` | Na Preview i tak wymuszony w kodzie |

Przykład **błędny** (Preview wskazuje prod):

```env
# ❌ Preview — NIE ustawiaj tak
NUXT_PUBLIC_API_BASE_URL=https://koliber-cks-slavia.hf.space
NUXT_PUBLIC_API_BASE_URL_HUGGINGFACE=https://koliber-cks-slavia.hf.space
```

Przykład **poprawny**:

```env
# ✅ Preview — osobny Space + baza
NUXT_PUBLIC_API_BASE_URL=https://koliber-cks-slavia-dev.hf.space
NUXT_PUBLIC_API_BASE_URL_HUGGINGFACE=https://koliber-cks-slavia-dev.hf.space
```

> Nazwa `koliber-cks-slavia-dev` to konwencja — utwórz własny Docker Space (np. `koliber/cks-slavia-dev`) i użyj publicznego URL `https://{user}-{space}.hf.space`.

`NUXT_PUBLIC_API_BASE_URL` jest fallbackiem i źródłem dla `config.public.apiBase`; na Preview musi wskazywać **preview Space**, bo BFF (`/api/public/*`) i panele (`useApi()` → `activeApiBase`) korzystają z tego samego łańcucha env co HF provider.

### HF Space — sekrety (preview)

**Settings → Variables and secrets** w **preview** Space (nie w GitHubie — sekrety aplikacji):

| Sekret | Wymagany | Przykład / uwagi |
|--------|----------|------------------|
| `JWT_SECRET` | tak | ≥ 32 znaki, **inny** niż prod |
| `TURSO_DATABASE_URL` | tak | `libsql://…` — **osobna** baza dev/staging |
| `TURSO_AUTH_TOKEN` | tak | token do bazy z wiersza powyżej |
| `CORS_ALLOWED_ORIGINS` | tak | lista originów rozdzielona przecinkami — [CORS](#cors-na-preview-space) |
| `GROQ_API_KEY` | opcjonalnie | AI coach — jak na prod, jeśli testujesz |
| `CLOUDINARY_*` | opcjonalnie | uploady w panelu |

### GitHub — deploy preview Space (opcjonalnie)

Jeśli preview backend synchronizujesz przez CI (osobny workflow lub branch):

| Typ | Nazwa | Wartość (preview) |
|-----|-------|-------------------|
| Secret | `HF_TOKEN` | Token HF z **write** do preview Space |
| Secret lub Variable | `HF_SPACE_REPO` | np. `koliber/cks-slavia-dev` |

Prod używa `koliber/cks-slavia`; preview **musi** mieć osobny `HF_SPACE_REPO`. Szczegóły workflow: `Slavia-backend/docs/DEPLOY_HUGGINGFACE.md`.

---

## Sync backendu na preview Space

1. **Osobny Space + osobny `HF_SPACE_REPO`** — zalecane; prod i preview nie dzielą Turso ani sekretów.
2. **Deploy kodu:** push na gałąź podpiętą pod preview HF, ręczny **Actions → Deploy Hugging Face Space**, albo `hf upload` (patrz backend docs).
3. **Gdy PR zmienia kontrakt API:** wdróż backend na preview Space **przed** testem Vercel Preview tego PR — inaczej panele dostaną 404/500 (np. brak `/api/athletes/me/dashboard`).
4. Po deployu HF: `pnpm smoke:post-deploy` z `--hf-url` preview i `--site-url` URL Preview Vercel (patrz [deploy-hf-vercel.md#post-deploy-smoke](deploy-hf-vercel.md#post-deploy-smoke)).

---

## CORS na preview Space

Backend musi akceptować origin deployu Vercel Preview. W `CORS_ALLOWED_ORIGINS` preview Space ustaw **jedną linię**, originy rozdzielone przecinkami (bez spacji po przecinku lub ze spacją — zgodnie z parsowaniem w backendzie; bezpieczniej bez):

```text
http://localhost:3000,https://cksslavia.vercel.app,https://*.vercel.app
```

| Origin | Po co |
|--------|-------|
| `http://localhost:3000` | lokalny `pnpm dev` → preview Space |
| `https://cksslavia.vercel.app` | produkcja Vercel (smoke, ewentualny dual-test) |
| `https://*.vercel.app` | wszystkie deploye Preview (`<projekt>-<hash>.vercel.app`) |

**Jeśli wildcard `*.vercel.app` nie działa** w Twojej wersji backendu: dodaj konkretny URL z komentarza PR (Vercel podaje go w logu deployu) albo utrzymuj listę znanych preview hostów, np.:

```text
http://localhost:3000,https://cksslavia.vercel.app,https://slavia-frontend-git-improvements-all-koliber.vercel.app
```

**Objawy złego CORS:** logowanie z Preview kończy się błędem w konsoli (`blocked by CORS policy`), POST/PATCH do API nie dochodzą mimo że `curl` na Space działa.

---

## Vercel Deploy Hook (prod vs Preview)

| Hook | Cel | Kiedy |
|------|-----|-------|
| **Production Deploy Hook** | Wymusza redeploy **produkcji** Vercel | Po `repository_dispatch` ze Slavia-shared (CI: `VERCEL_DEPLOY_HOOK` w sekretach repo frontendu) |
| **Preview (PR)** | Automatyczny przy pushu / otwarciu PR | **Nie** wymaga osobnego hooka — Vercel buduje Preview z env scope **Preview** |

### Production Deploy Hook — konfiguracja

1. Vercel → Project → **Settings → Git → Deploy Hooks**.
2. **Create Hook** — nazwa np. `shared-dispatch-prod`, branch **`main`**.
3. Skopiuj URL hooka → GitHub repo **Slavia-frontend** → **Settings → Secrets → Actions** → `VERCEL_DEPLOY_HOOK`.
4. Workflow `.github/workflows/ci.yml` (`vercel-deploy` po `repository_dispatch`) wywołuje `curl -X POST` na ten URL.

> Hook na `main` odpala **produkcję**, nie Preview PR. Preview dostaje env z scope **Preview** przy każdym buildzie PR — upewnij się, że krok 2 checklisty jest zrobiony **zanim** oceniasz PR na żywo.

**Test hooka (opcjonalnie):**

```bash
curl -fsS -X POST "https://api.vercel.com/v1/integrations/deploy/..."
```

---

## Zachowanie frontendu (Preview)

Kod już zakłada izolację Preview od globalnego przełącznika prod:

| Mechanizm | Plik | Zachowanie na `VERCEL_ENV=preview` |
|-----------|------|-------------------------------------|
| Provider wymuszony na HF | `app/utils/backendProviderTypes.ts` | `backendProviderFromEnv()` → `huggingface` |
| Brak odczytu Vercel Blob provider | `server/utils/backendProviderStore.ts` | `getGlobalBackendProvider()` → `huggingface` (ignoruje Blob prod) |
| BFF (SSR) | `server/utils/resolvePublicApiBase.ts` | `apiBaseForBackendProvider('huggingface', …)` → `NUXT_PUBLIC_API_BASE_URL_HUGGINGFACE` |
| Build-time base | `config/site.ts` → `resolveBuildTimeApiBase()` | Na Vercel pomija localhost; bierze HF z env |

**Wniosek:** sam kod **nie** rozdziela prod vs preview Space — rozdzielasz je **wyłącznie** zmiennymi Vercel w scope Preview. Jeśli Preview dziedziczy prod URL, cały ruch PR idzie na Turso prod.

---

## Checklist przed merge PR (Preview QA)

- [ ] Vercel Preview ma `NUXT_PUBLIC_API_BASE_URL` i `NUXT_PUBLIC_API_BASE_URL_HUGGINGFACE` → **preview Space**, nie prod
- [ ] Preview Space odpowiada: `curl -s "https://<preview-space>.hf.space/api/system/ping"`
- [ ] CORS: logowanie z URL Preview działa (brak błędu CORS w konsoli)
- [ ] Publiczne strony (`/zawodnicy`, `/aktualnosci`) — BFF zwraca dane z preview backendu
- [ ] Panel po logowaniu (`/athlete`, `/trainer`) — bez 404 na nowe endpointy
- [ ] SuperAdmin → developer: provider = Hugging Face, URL = preview Space (nie prod)

---

## Antywzorce

| ❌ Nie rób | ✅ Zamiast tego |
|----------|----------------|
| Ten sam `NUXT_PUBLIC_API_BASE_URL_*` dla Production i Preview | Osobne wartości w scope Vercel |
| Test migracji DB na prod przez Vercel Preview | Preview Space + osobna baza Turso |
| Ręczne „Zapisz globalnie” provider w developer na Preview (i tak ignorowane) | Popraw env Preview w Vercel |
| Zakładanie, że `VERCEL_ENV=preview` sam izoluje backend | Ustaw preview URL w env |
| Production Deploy Hook zamiast poprawnych env Preview | Hook tylko dla prod; Preview = scope env + osobny HF Space |

---

## Szybka weryfikacja po deployu Preview

```bash
# Backend preview
curl -s "https://koliber-cks-slavia-dev.hf.space/api/system/ping"

# Frontend Preview (BFF)
curl -s "https://<twoj-preview>.vercel.app/api/public/athletes" | head

# Smoke łączony (opcjonalnie)
node scripts/post-deploy-smoke.mjs \
  --hf-url=https://koliber-cks-slavia-dev.hf.space \
  --site-url=https://<twoj-preview>.vercel.app
```

W przeglądarce (zalogowany użytkownik testowy **na bazie dev**): DevTools → Network → żądania do `/api/…` lub bezpośrednio do HF — host musi być preview Space, nie `koliber-cks-slavia.hf.space`.
