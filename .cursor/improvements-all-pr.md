# PR: `improvements/all` — Slavia Frontend + Backend

> **Branch:** `improvements/all` (oba repozytoria) · **Data:** 2026-06-21  
> **Status:** niecommitowane zmiany robocze — gotowe do review przed commitem.

---

## Checklist walidacji (D-4)

| Check | Repo | Status | Uwagi |
|-------|------|--------|-------|
| `pnpm typecheck` | Frontend | **PASS** | vue-tsc / Nuxt typecheck OK |
| `pnpm test` | Frontend | **PASS** | 6 plików, 37 testów (w tym `athleteDashboardLogic.test.ts`) |
| `pnpm lint` | Frontend | **FAIL** | `PanelSidebarNavSection.vue` — nieużywany import `DashboardModuleLink` (plik **poza** diffem tej gałęzi) |
| `cargo check` | Backend | **PASS** | dev profile, ~1.5 s |
| `pnpm test:e2e` | Frontend | **NIE URUCHOMIONO** | nowy `e2e/smoke-athlete-dashboard.spec.ts` — uruchomić przed merge |
| `pnpm openapi:check` | Frontend | **NIE URUCHOMIONO** | po commicie backend embed — zalecane przed merge |

---

## Summary

Wspólna fala ulepszeń **dashboard zawodnika**, **role preview (SuperAdmin)**, **KPI z retry**, **ACL/route cleanup** w backendzie oraz drobne poprawki UX/perf (prefetch, BFF, wyniki trenera, SCSS).

### Frontend (`Slavia-frontend`)

- **Dashboard zawodnika** — refaktor `app/pages/athlete/index.vue` → composable `useAthleteDashboard` + czysta logika `athleteDashboardLogic.ts` (KPI, checklista pre-start, cel sezonu, „Mój tydzień”).
- **KPI loading** — `useDashboardKpiLoad` + `dashboardKpiLoadLogic` (exponential backoff przy 502/503 HF cold start); rozszerzony `DashboardKpiCard`.
- **Role preview** — przepisane mapowanie URL w `rolePreviewApiRewrite.ts` (athlete bundle, dashboard, kalendarz, płatności, czat, powiadomienia).
- **E2E smoke** — `e2e/smoke-athlete-dashboard.spec.ts` + mocki w `e2e/helpers/athleteDashboardMocks.ts`.
- **Trener wyniki** — wydzielona tabela `TrainerWynikiResultsTable`, virtual scroll helper.
- **Mobile nav zawodnika** — `AthleteMobileNav.vue`, style `_panel-mobile-nav.scss`.
- **Infra/dev** — prefetch API, BFF proxy tweaks, docs preview/deploy HF, post-deploy smoke script, CI workflow tweak.
- **OpenAPI types** — regeneracja `openapi.types.ts` (z backend embed).

### Backend (`Slavia-backend`)

- **Role preview API** — rozszerzone endpointy `/api/system/role-preview/*` (athlete dashboard, profile, calendar, payment status, bundle).
- **ACL / autoryzacja** — refaktor w `admins`, `attendance`, `competition_participants`, `training_plans`, `training_log`, `payments`, `results`, `challenges`, `club_votes`, `auth`.
- **Trainer dashboard** — nowy moduł `src/routes/trainer.rs` (agregowany payload: pending results, payments, monitoring).
- **System logs** — rozszerzone zapytania + monitoring summary dla trenera.
- **DB** — addytywna migracja w `db.rs`.
- **OpenAPI embed** — zaktualizowany `src/embed/openapi.json` + trasy w `router.rs`.
- **Ops** — workflow `keep-warm.yml` (HF cold start mitigation).

---

## Pliki — Frontend

### Zmodyfikowane (vs `main`)

| Plik |
|------|
| `.github/workflows/ci.yml` |
| `AGENTS.md` |
| `app/app.vue` |
| `app/assets/scss/components/_cards.scss` |
| `app/assets/scss/components/_panel.scss` |
| `app/assets/scss/components/_public.scss` |
| `app/assets/scss/slavia.scss` |
| `app/assets/scss/themes/_presets.scss` |
| `app/components/SlaviaScrollToTop.vue` |
| `app/components/club/ClubPublicAiAssistant.client.vue` |
| `app/components/dashboard/DashboardKpiCard.vue` |
| `app/components/trainer/OlympicCoachPanel.vue` |
| `app/composables/usePrefetchApi.ts` |
| `app/config/api.ts` |
| `app/pages/athlete/[slug].vue` |
| `app/pages/athlete/index.vue` |
| `app/pages/klub/czat.vue` |
| `app/pages/trainer/wyniki.vue` |
| `app/pages/zawodnicy/index.vue` |
| `app/types/generated/openapi.types.ts` |
| `app/types/models.ts` |
| `app/utils/rolePreviewApiRewrite.ts` |
| `improve.md` |
| `package.json` |
| `playwright.config.ts` |
| `pnpm-lock.yaml` |
| `server/utils/publicBackendProxy.ts` |
| `server/utils/resolvePublicApiBase.ts` |

### Nowe (untracked — do stage przed commitem)

| Plik | Uwaga |
|------|-------|
| `app/assets/scss/abstracts/_mixins.scss` | |
| `app/assets/scss/components/_panel-mobile-nav.scss` | |
| `app/components/athlete/AthleteMobileNav.vue` | |
| `app/components/trainer/TrainerWynikiResultsTable.vue` | |
| `app/composables/useAthleteDashboard.ts` | |
| `app/composables/useAthletePublicProfilePrefetch.ts` | |
| `app/composables/useChatLiveRegion.ts` | |
| `app/composables/useDashboardKpiLoad.ts` | |
| `app/composables/useVirtualScrollRows.ts` | |
| `app/utils/athleteDashboardLogic.ts` | |
| `app/utils/athleteDashboardLogic.test.ts` | |
| `app/utils/athletePanelRoutes.ts` | |
| `app/utils/chatPlainText.ts` | |
| `app/utils/dashboardKpiLoadLogic.ts` | |
| `app/utils/dashboardKpiLoadLogic.test.ts` | |
| `app/utils/scheduleIdleWork.ts` | |
| `docs/deploy-hf-vercel.md` | |
| `docs/preview-environments.md` | |
| `e2e/helpers/athleteDashboardMocks.ts` | |
| `e2e/smoke-athlete-dashboard.spec.ts` | |
| `scripts/post-deploy-smoke.mjs` | |
| `.cursor/plans/zarzad-dokumenty_a5bb3b64.plan.md` | **nie commitować** (plan agenta) |
| `_f15_extract.txt` | **nie commitować** (tymczasowy extract) |

---

## Pliki — Backend

### Zmodyfikowane (vs `main`)

| Plik |
|------|
| `Cargo.lock` |
| `Cargo.toml` |
| `src/db.rs` |
| `src/embed/openapi.json` |
| `src/router.rs` |
| `src/routes/admins.rs` |
| `src/routes/athletes.rs` |
| `src/routes/attendance.rs` |
| `src/routes/auth.rs` |
| `src/routes/challenges.rs` |
| `src/routes/club_votes.rs` |
| `src/routes/competition_participants.rs` |
| `src/routes/mod.rs` |
| `src/routes/payments.rs` |
| `src/routes/results.rs` |
| `src/routes/role_preview.rs` |
| `src/routes/system_logs.rs` |
| `src/routes/training_log.rs` |
| `src/routes/training_plans.rs` |
| `src/sql/queries/system_logs.rs` |

### Nowe (untracked)

| Plik |
|------|
| `.github/workflows/keep-warm.yml` |
| `src/routes/trainer.rs` |

---

## Proponowany tytuł PR (GitHub)

**Frontend:** `feat(dashboard): athlete dashboard refactor, role preview KPI retry, E2E smoke`

**Backend:** `feat(api): role preview athlete routes, trainer dashboard aggregate, ACL cleanup`

---

## Opis PR (body — wklej do obu PR)

### Summary

- Refaktoryzacja panelu zawodnika (`/athlete`) — logika w composable + pure utils, KPI z retry przy cold start HF.
- SuperAdmin role preview — spójne przepisywanie API (frontend) + dedykowane endpointy read-only (backend).
- Backend: agregowany dashboard trenera, poprawki ACL w wielu modułach, OpenAPI embed.
- Smoke E2E dashboardu zawodnika (mocki API, bez live backendu).

### Test plan

- [x] `pnpm typecheck` (frontend)
- [x] `pnpm test` (frontend)
- [ ] `pnpm lint` — naprawić pre-existing `PanelSidebarNavSection.vue` lub osobny fix
- [x] `cargo check` (backend)
- [ ] `PLAYWRIGHT_START_SERVER=1 pnpm test:e2e e2e/smoke-athlete-dashboard.spec.ts`
- [ ] `pnpm openapi:check` po zsynchronizowaniu embed backend → frontend
- [ ] Ręcznie: `/athlete` jako zawodnik — hero, KPI składka/frekwencja/wyniki
- [ ] Ręcznie: SuperAdmin role preview → dane docelowego zawodnika (read-only)
- [ ] Ręcznie: `/trainer/wyniki` — tabela wyników po refaktorze

### Breaking changes

Brak — addytywne endpointy role preview i trainer dashboard; istniejące trasy zachowane.

### Kolejność merge

1. **Backend** (embed OpenAPI + route)
2. **Frontend** (`openapi:types` / snapshot jeśli wymagane przez CI)

---

## Uwagi przed commitem

1. Usunąć z stage: `_f15_extract.txt`, `.cursor/plans/*`.
2. Naprawić lint (`PanelSidebarNavSection.vue` — usunąć nieużywany import) lub osobny commit fix.
3. Brak commitów na gałęzi — wszystkie zmiany są **uncommitted**; wymagany `git add` + commit w obu repo.
4. **Slavia-shared:** brak zmian w tym scope — `openapi:check` może wymagać snapshotu w submodule jeśli CI to egzekwuje.
