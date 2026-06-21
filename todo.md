# TODO — gałąź `improvements/all`

> **Ostatnia aktualizacja:** 2026-06-21 · fale **K–N** zsynchronizowane ze stanem git (3 repo).  
> **Architektura:** Frontend Vercel ↔ Backend Hugging Face Spaces (`koliber-cks-slavia.hf.space`)

---

## Status ogólny

| Element | Stan |
|---------|------|
| **Gałąź** | `improvements/all` we wszystkich repo (frontend, backend, shared) |
| **PR shared** | [#1](https://github.com/JakubGawron1/Slavia-shared/pull/1) |
| **PR backend** | [#2](https://github.com/JakubGawron1/Slavia-backend/pull/2) |
| **PR frontend** | [#5](https://github.com/JakubGawron1/Slavia-Website/pull/5) |
| **Kolejność merge** | **shared → backend → frontend** |
| **Deploy** | **HF backend przed Vercel frontend** (`docs/deploy-hf-vercel.md`) |
| **Agenci** | fale **K–N** w większości **commitowane lokalnie**; pozostało: **K-2**, **N-3** (+ push/rebase) |

### Stan git (2026-06-21)

| Repo | vs `origin/improvements/all` | Ostatnie commity lokalne | Niecommitowane |
|------|------------------------------|--------------------------|----------------|
| **Frontend** | **ahead ~17**, behind 1 | m.in. `7db4908`, `e240c41`, `5d73fa1`, `be04437`, `9acdef7` | **K-2** — `usePublicCalendarPage.ts`, `kalendarz.vue`, `PublicCalendarEventSheet.vue`; lint `PanelSidebarNavSection.vue` |
| **Backend** | **ahead 5** | `875bf39`, `eaf6fca`, `efa6c90`, `eedca01`, `b938d11` | **N-3** — `athlete_dashboard_acl_integration_test.rs` `??`; drobne `M` w `lib.rs` / `middleware/mod.rs` |
| **Shared** | **ahead 1** | `130d560` chore(openapi): sync health route | brak |

**Co-authored-by:** wiele commitów lokalnych ma trailer `Co-authored-by: Cursor` — do usunięcia przed merge (AGENTS.md).

---

## ✅ Ukończone (Fala 0 — Top 10)

| # | Opis | Status |
|---|------|--------|
| 1 | Równoległe fetchowanie dashboardu → potem bundle `/me/dashboard` | ✅ `useAthleteDashboard`, backend `GET /api/athletes/me/dashboard` |
| 2 | Lazy wykresy profilu publicznego | ✅ `defineAsyncComponent` na `/athlete/[slug]` |
| 3 | `GET /api/athletes/me/dashboard` (backend) | ✅ `ca35616` backend |
| 4 | Stany błędu KPI (`useDashboardKpiLoad`) | ✅ retry 502/503, exponential backoff |
| 5 | Composable `useAthleteDashboard` + testy | ✅ `athleteDashboardLogic.ts` + Vitest |
| 6 | `sinclairTotal` w celu sezonu | ✅ poprawna kalkulacja z `@slavia/shared` |
| 7 | Glass bez blur na mobile (SCSS) | ✅ `_cards.scss` / tokeny mobile |
| 8 | Skeletony KPI składka/frekwencja | ✅ `DashboardKpiCard` |
| 9 | E2E smoke dashboardu zawodnika | ✅ `e2e/smoke-athlete-dashboard.spec.ts` + CI |
| 10 | Cleanup `unwrap`/`expect` w backend routes | ✅ ~47+10 napraw w `src/routes/*` |

---

## ✅ Ukończone — Fale D–I (27 punktów)

### Fala D — deploy / integracja

| ID | Opis | Status |
|----|------|--------|
| D-1 | Przełączenie composable na 1× `GET /me/dashboard` | ✅ |
| D-2 | Docs kolejności deploy HF → Vercel | ✅ `docs/deploy-hf-vercel.md` |
| D-3 | OpenAPI snapshot sync (shared + typy) | ✅ snapshoty w shared |
| D-4 | Checklist PR readiness + draft body | ✅ `.cursor/improvements-all-pr.md` |

### Fala E — sieć / HF cold start

| ID | Opis | Status |
|----|------|--------|
| E-1 | BFF cache panel GET (`private max-age=10`) | ✅ `panelBackendProxy.ts` |
| E-2 | Timeout 30s dla panelu (cold start HF) | ✅ `useApi.ts` |
| E-3 | GitHub Action keep-warm co 5 min | ✅ `.github/workflows/keep-warm.yml` (backend) |
| E-4 | Stagger loading — shell first, reszta idle | ✅ `scheduleIdleWork` / composable |
| E-5 | Exponential backoff KPI przy 502/503 | ✅ `useDashboardKpiLoad` |

### Fala F — wydajność strony

| ID | Opis | Status |
|----|------|--------|
| F-11 | Lazy `OlympicCoachPanel`, dynamic AdminsManager | ✅ |
| F-12 | Wirtualizacja listy wyników trenera | ✅ `TrainerWynikiResultsTable` |
| F-13 | Bundle size report w CI | ✅ `scripts/bundle-report.mjs` |
| F-14 | Prefetch ranking `/zawodnicy` (ISR) | ✅ `usePrefetchApi` |
| F-15 | Lazy sekcje homepage poniżej hero | ✅ `index.vue` |

### Fala G — UX

| ID | Opis | Status |
|----|------|--------|
| G-1 | Banner „Serwer się uruchamia…” przy 502/503 | ✅ `useApi.ts` / plugin |
| G-2 | Cache offline dashboardu (localStorage SWR) | ✅ `athleteDashboardCache.ts` |
| G-3 | Mobile bottom nav zawodnika | ✅ `AthleteMobileNav.vue` |
| G-4 | `aria-live` dla czatu i Trenera AI | ✅ `useChatLiveRegion` |

### Fala H — backend HF

| ID | Opis | Status |
|----|------|--------|
| H-1 | `GET /api/trainer/dashboard` bundle | ✅ `src/routes/trainer.rs` |
| H-2 | Indeksy SQLite pod ranking | ✅ `db.rs` |
| H-3 | Dalszy cleanup `unwrap`/`expect` w routes | ✅ 0 w handlerach |
| H-4 | Prometheus `/metrics` stub | ✅ backend |
| H-5 | Gzip/brotli compression (tower-http) | ✅ `lib.rs` |

### Fala I — CI/CD

| ID | Opis | Status |
|----|------|--------|
| I-1 | E2E dashboard w CI | ✅ `.github/workflows/ci.yml` |
| I-2 | Naprawa flaky BFF E2E (porównanie, kontakt) | ✅ mocki Playwright |
| I-3 | Docs preview env (Vercel → osobny HF Space) | ✅ `docs/preview-environments.md` |
| I-4 | Post-deploy smoke script | ✅ `pnpm smoke:post-deploy` |

---

## ✅ Ukończone — Fala J (5/5)

| ID | Opis | Commit / PR |
|----|------|-------------|
| J-1 | Alias `GET /api/health` → ping | backend `ab62227` |
| J-2 | BFF cache `/api/trainer/dashboard` | frontend `26f6f9c` |
| J-3 | Docs preview HF Space + Vercel checklist | `docs/preview-environments.md`, `docs/deploy-hf-vercel.md` |
| J-4 | Bundle baseline CI 5500 KiB | `b6cb973` |
| J-5 | Push gałęzi + otwarcie PR-ów | PR #1 (shared), #2 (backend), #5 (frontend) |

---

## ✅ Ukończone — Fale K–N (17/19)

| ID | Opis | Commit / stan git |
|----|------|-------------------|
| K-1 | `useTrainerDashboard` composable | ✅ `3619134`, `3132729` |
| K-3 | Lazy `ClubPlayersManager` w `TeamManagementHub` | ✅ `90f24b2` |
| K-4 | `TrainerMobileNav.vue` (mobile bottom nav trenera) | ✅ `ad12e95` |
| K-5 | Rozszerzyć whitelist panel BFF (`panelBffPaths.ts`) | ✅ `229d2a3`, `ee9c64d` |
| L-1 | Docs scrape Prometheus `/metrics` | ✅ `835d976` (FE), `efa6c90` (BE) |
| L-2 | Vercel Analytics event `hf_cold_start` | ✅ `be04437` |
| L-3 | `request_id` w structured logs (backend) | ✅ `875bf39` |
| L-4 | GitHub Action alert error rate | ✅ `b938d11`, `eaf6fca` (BE) |
| M-2 | Moduł `/klub/dokumenty` (Google Drive proxy) | ✅ `9acdef7`, `ee9c64d` (scaffold + BFF) |
| M-3 | PWA offline shell panelu zawodnika | ✅ `e240c41` |
| M-4 | Sticky mini-header profilu publicznego | ✅ `9dec7da`, `229d2a3` |
| M-5 | Wirtualizacja siatki `/zawodnicy` (>50 kart) | ✅ `5d73fa1` |
| N-1 | Helper `apiFetchOrEmpty` (dashboard scope) | ✅ `c6ff3b1` + testy |
| N-2 | E2E role preview SuperAdmin | ✅ `7db4908` |
| N-4 | Semver sync 5.1.0 (FE + BE + CHANGELOG) | ✅ `94e9fc9` (FE), `eedca01` (BE) |

### Pozostałe (K–N)

| ID | Opis | Stan w git |
|----|------|------------|
| K-2 | `usePublicCalendarPage` + lazy `kalendarz.vue` | 🟡 pliki `??` / `M` — **do commita** |
| M-1 | Mobile Flutter: `/api/athletes/me/dashboard` | 🔴 **Slavia-mobile** — poza scope gałęzi |
| N-3 | Testy ACL `/me/dashboard` (backend) | 🟡 `athlete_dashboard_acl_integration_test.rs` `??` — **do commita** |

**Legenda:** ✅ ukończone · 🟡 częściowo (commit lub WIP) · 🔴 brak / niezweryfikowane

---

## 📋 Do zrobienia przed merge

- [ ] **Usunąć `Co-authored-by: Cursor`** ze wszystkich commitów (rebase / filter-branch) → `git push --force-with-lease` jeśli potrzeba
- [ ] **Commit** pozostałe: **K-2**, **N-3**, fix lint `PanelSidebarNavSection.vue`
- [ ] **Push** niezsynchronizowanych commitów:
  - Frontend: ~17 commitów lokalnych (m.in. `7db4908` … `9acdef7`)
  - Shared: `130d560`
  - Backend: `875bf39`, `eaf6fca`, `efa6c90`, `eedca01`, `b938d11`
- [ ] **Rebase/pull** frontend (behind 1 względem origin) — rozwiązać divergencję
- [ ] **`pnpm openapi:check`** po merge shared snapshot
- [ ] **`pnpm typecheck`** + **`pnpm test`** + **`pnpm lint`**
- [ ] **Fix lint** `PanelSidebarNavSection.vue` — nieużywany import `DashboardModuleLink`
- [ ] **Merge PR** w kolejności: shared #1 → backend #2 → frontend #5
- [ ] **Deploy HF backend** przed Vercel frontend
- [ ] **`pnpm smoke:post-deploy`** (`SLAVIA_HF_API_URL`, `SLAVIA_SITE_URL`)
- [ ] **GitHub secret** `HF_API_BASE_URL` dla workflow keep-warm (backend)

---

## 🚀 Proponowana Fala O+ (backlog na później)

| ID | Opis |
|----|------|
| O-1 | Pełny moduł dokumentów zarządu — GDrive prod credentials, OpenAPI final, E2E ACL |
| O-2 | FCM push zamiast pollingu powiadomień (mobile + `docs/fcm-go-router-roadmap.md`) |
| O-3 | SSE/streaming Trenera AI (pełny LLM stream; dziś stub) |
| O-4 | Refaktor monolitów: `kalendarz.vue`, `AdminsManager`, `OlympicCoachPanel` |
| O-5 | Centralizacja `.catch(() => [])` w całym frontendzie (~50 plików) |
| O-6 | Grafana Cloud + alerty prod (rozszerzenie L-1/L-4) |
| O-7 | Osobny HF Preview Space (checklist I-3) |
| O-8 | Mobile parity: bottom nav trenera, dashboard bundle (M-1) |
| O-9 | i18n prep (`config/i18n.ts`, `docs/i18n-deferred.md`) |
| O-10 | Turso backup automation + RPO/RTO docs |
| O-11 | Refaktor `athlete/[slug].vue` (~1300 ln) — lazy charts, schema.org |
| O-12 | Distributed throttle + rate limit login/contact (backend BE-G7) |

---

## Komendy pomocnicze (PowerShell)

```powershell
# Status gałęzi (wszystkie repo)
cd C:\Users\jakub\Desktop\Slavia-frontend; git status -sb; git log -5 --oneline
cd C:\Users\jakub\Desktop\Slavia-backend;  git status -sb; git log -5 --oneline
cd C:\Users\jakub\Desktop\Slavia-shared;   git status -sb; git log -5 --oneline

# Niepushowane commity
cd C:\Users\jakub\Desktop\Slavia-frontend; git log origin/improvements/all..HEAD --oneline
cd C:\Users\jakub\Desktop\Slavia-backend;  git log origin/improvements/all..HEAD --oneline
cd C:\Users\jakub\Desktop\Slavia-shared;   git log origin/improvements/all..HEAD --oneline

# Szukaj Co-authored-by w lokalnych commitach
cd C:\Users\jakub\Desktop\Slavia-frontend
git log origin/improvements/all..HEAD --format="%h %s" | ForEach-Object { $_ }
git log -15 --format="%B---" | Select-String "Co-authored-by"

# Walidacja frontend
cd C:\Users\jakub\Desktop\Slavia-frontend
pnpm typecheck
pnpm test
pnpm lint
pnpm openapi:check

# Backend
cd C:\Users\jakub\Desktop\Slavia-backend
cargo check

# Smoke po deployu
cd C:\Users\jakub\Desktop\Slavia-frontend
$env:SLAVIA_HF_API_URL = "https://koliber-cks-slavia.hf.space"
$env:SLAVIA_SITE_URL = "https://cksslavia.vercel.app"
pnpm smoke:post-deploy

# Push (po rebase bez Co-authored-by)
cd C:\Users\jakub\Desktop\Slavia-shared;   git push -u origin improvements/all
cd C:\Users\jakub\Desktop\Slavia-backend;  git push -u origin improvements/all
cd C:\Users\jakub\Desktop\Slavia-frontend; git push --force-with-lease origin improvements/all
```

---

## Notatki

- Draft PR body: `.cursor/improvements-all-pr.md`
- Plan dokumentów zarządu: `.cursor/plans/zarzad-dokumenty_a5bb3b64.plan.md` (**nie commitować** `.cursor/`)
- Docs deploy: `docs/deploy-hf-vercel.md` · observability: `docs/observability.md`
- Wersja release: **5.1.0** (FE `package.json`, BE `Cargo.toml`)
- **Nie commitować:** `.cursor/`, sekrety, `.env`, `todo.md` (chyba że świadomie)
