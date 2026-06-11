# Audyt ulepszeń — ekosystem Slavia (WWW + Backend + Mobile + Shared)

> **Data:** 2026-06-08 · **Przejścia audytu:** 4 (AI → ekosystem → per-moduł → metryki jakości)  
> **Repozytoria:** `Slavia-frontend`, `Slavia-backend`, `Slavia-mobile`, `Slavia-shared`  
> **Status:** analiza **wyczerpana** — §12 + §13; dalsze punkty = nowe funkcje lub margines.  
> **Implementacja 2026-06-11:** Fala 0 + **Fala 1 kompletna** (OpenAPI 143 tras, Vitest/shared, PZPC, BFF); Fale 2–4 — **✅** w tabelach; **⏸** = odłożone.

---

## Streszczenie wykonawcze

| Warstwa | Ocena | Największy problem |
|---------|-------|-------------------|
| **Frontend WWW** | Dobra funkcjonalnie, słaba testowalność | 0 Vitest, 11 testów E2E; 8+ monolitów >800 linii; antywzorce BFF (`kontakt.vue`, `porownanie.vue`) |
| **Backend Rust** | Bogaty API (~140 endpointów), słaby kontrakt | OpenAPI: **16/140 tras**; `RequireTrainerOrHigher` bez Admin; throttle in-memory |
| **Mobile Flutter** | Solidny core, luki parity **zawodnik/trener** | Brak składek UI, Trenera AI, bana; legacy ekrany Admin/SA do usunięcia; monolit `api_service.dart` ~1400 ln |
| **Slavia-shared** | Dobre centrum TS | Dart bez PZPC/proporcji; PZPC JSON≠TS; backend nie czyta JSON katalogów |
| **Trener AI / MD** | Happy path OK | Parser MD niepełny; ACL `athlete_id`; limity wideo FE≠BE |

**Szacunek backlogu:** **~450+ actionable items** (poniżej pogrupowane + §13 per-plik).

**Metryki jakości (przejście 4):**
- Frontend: **54 pliki** z `.catch(() => [])` / `null` — ciche błędy API
- Backend routes: **~52** `unwrap`/`expect` w 8 plikach (ryzyko panic w prod)
- Frontend Vitest: **0** · E2E: **11** · Mobile widget test: **1 martwy**
- OpenAPI: **143/~143** tras `/api/*` w embed (+ generator)

**Top 10 P0 (cały ekosystem):**
1. ✅ Backend ACL `athlete_id` w AI coach (PII) — trener tylko przy wątku czatu
2. ✅ Limity załączników wideo FE→BE (max 8 payloadów, 2 klatki/wideo)
3. ✅ Backend `RequireTrainerOrHigher` — dodać Admin
4. ✅ OpenAPI embed — 143 tras `/api/*` + `components.schemas` + Bearer (generator z `router.rs`)
5. ✅ `reset_database` guard + backup DB review (authenticated Cloudinary, bez public URL)
6. ✅ Chat `open_thread` — weryfikacja pary athlete/trainer + uczestnictwo
7. ✅ Mobile — ekran bana + składki
8. ✅ Frontend — Vitest + testy `renderChatMarkdown` (9 cases)
9. Mobile — Trener AI / parity paneli zawodnik+trener (nie Admin/SA)
10. ✅ theme-presets w backendzie z JSON; PZPC TS←JSON + testy parity

---

## Spis treści

| § | Temat |
|---|--------|
| [1](#1-frontend-www-slavia-frontend) | Frontend WWW |
| [2](#2-backend-rust-slavia-backend) | Backend Rust |
| [3](#3-mobile-flutter-slavia-mobile) | Mobile Flutter |
| [4](#4-slavia-shared) | Slavia-shared |
| [5](#5-trener-ai-i-renderchatmarkdownts) | Trener AI + `renderChatMarkdown.ts` |
| [6](#6-cross-repo--integracja) | Cross-repo / integracja |
| [7](#7-testy-i-ci-cały-ekosystem) | Testy i CI |
| [8](#8-bezpieczeństwo) | Bezpieczeństwo |
| [9](#9-dostępność-i18n) | Dostępność, i18n |
| [10](#10-wydajność-i-observability) | Wydajność |
| [11](#11-mapa-priorytetów-globalna) | Mapa priorytetów |
| [12](#12-granica-kompletności) | Granica kompletności |
| [13](#13-przejście-4--katalog-per-moduł) | Przejście 4: katalog per moduł |
| [A](#appendix-a-inwentarz) | Appendix: inwentarz |
| [C](#appendix-c-metryki-jakościowe) | Appendix C: metryki |

---

## 1. Frontend WWW (`Slavia-frontend`)

**Skala:** 68 stron · 61 composables · 100 komponentów · 18 plików `server/` · 22 flagi eksperymentalne · ~40 modułów panelu.

### 1.1 Antywzorce (AGENTS.md) — P0

| ID | Problem | Plik |
|----|---------|------|
| FE-ANT1 ✅ | `$fetch(config.public.apiBase)` z klienta — omija BFF | `kontakt.vue` → `/api/contact` BFF |
| FE-ANT2 ✅ | Publiczne dane bez BFF | `porownanie.vue` → `usePublicLazyFetch` |
| FE-ANT3 ✅ | Competitions przez `apiBase` zamiast BFF/public fetch | `athlete/kalendarz.vue` → BFF |
| FE-ANT4 | Powszechne `.catch(() => [])` — ciche błędy API | composables + strony |
| FE-ANT5 | Monolity `.vue` >800 linii (10+ plików) | patrz §1.3 |
| FE-ANT6 | `USelect` w sheet bez portalu | `trainer/plany.vue`, `kalendarz.vue`, `TrainingPlanBuilder.vue` |
| FE-ANT7 ✅ | Brak Vitest w `package.json` | `vitest` + `renderChatMarkdown.test.ts` |
| FE-ANT8 ✅ | Typo `AtheleteCard.vue` | przemianowano → `AthleteCard.vue` |

### 1.2 Strony publiczne

| ID | Moduł | Ulepszenia |
|----|-------|------------|
| FE-PUB1 | `/` `index.vue` (~1010 ln) | Wydzielić composable; lazy sekcje; E2E asercje treści |
| FE-PUB2 | `/zawodnicy` | Testy `zawodnicyRanking.ts`; `<caption>` tabel; deep-link porównania |
| FE-PUB3 ✅ | `/zawodnicy/porownanie` | Fix BFF + E2E smoke (lista BFF) |
| FE-PUB4 | `/aktualnosci/*` | E2E; `useFormDirtyGuard` w edycji; testy `sanitizeHtml` |
| FE-PUB5 | `/galeria` | Lightbox a11y (focus trap); `loading="lazy"`; E2E mobile overflow |
| FE-PUB6 | `/kalendarz` (~1085 ln) | `usePublicCalendarPage`; `aria-label` na komórkach; E2E klik dnia |
| FE-PUB7 | Kalkulatory | E2E mimo prerender; `USelect` mobile z-index |
| FE-PUB8 ✅ | `/kontakt` | BFF + honeypot + E2E smoke (formularz, POST BFF) |
| FE-PUB9 | `/ogloszenia` | Stan błędu API; `renderSimpleMarkdown` vs `renderChatMarkdown` — unify |
| FE-PUB10 | `/o-klubie` CMS | E2E; fallback offline przy prerender |
| FE-PUB11 | `/klub/rekordy` | Agregacja do utils + testy; URL query dla `period` |
| FE-PUB12 | `/klub/wyzwania` | Potwierdzenie głosu; E2E |

### 1.3 Klub (auth, CSR)

| ID | Moduł | Ulepszenia |
|----|-------|------------|
| FE-KLUB1 | `/klub/obecnosc` | QR permission denied UX; `aria-current` widoków; E2E mock camera |
| FE-KLUB2 | `/klub/czat` | `role="log"`; polling backoff; linki nieklikalne (plain text) |
| FE-KLUB3 | `/klub/powiadomienia` | E2E auth; WebSocket vs polling |
| FE-KLUB4 | `useAttendancePage` | Testy logiki kalendarza |
| FE-KLUB5 | `ClubVotingWidget` | Walidacja przed głosem |
| FE-KLUB6 | `ClubGlobalSearch` | Cache indeksu w sessionStorage |

### 1.4 Panel zawodnika

| ID | Moduł | Ulepszenia |
|----|-------|------------|
| FE-ATH1 | `athlete/index.vue` (~892) | Ekstrakcja composables; error boundary |
| FE-ATH2 | `athlete/[slug].vue` (~1304) | **Priorytet refaktoru**; lazy charts; schema.org Person |
| FE-ATH3 | `athlete/wyniki` | Testy walidacji; optimistic UI |
| FE-ATH4 ✅ | `athlete/skladki` + `trainer/skladki` | `useMembershipPaymentsPage` + `useMembershipYearGrid` |
| FE-ATH5 | `athlete/kalendarz` | ✅ Fix public fetch (ANT3); testy ICS |
| FE-ATH6 | `athlete/dziennik/*` | E2E; scroll restore spójność |
| FE-ATH7 | `athlete/plany` | Import AI → `/athlete/plany` dla zawodnika |
| FE-ATH8 | `athlete/regeneracja` | Testy `buildRecoveryTrend`; wykres a11y |
| FE-ATH9 | `athlete/exercises` | Bulk approve (trener) |
| FE-ATH10 | `athlete/ai-coach` | Patrz §5 |
| FE-ATH11 | `athlete/analiza-sztangi` | Code-split TF; graceful degradation |
| FE-ATH12 | `athlete/timeline`, `wrapped` | Error state; share wrapped |

### 1.5 Panel trenera

| ID | Moduł | Ulepszenia |
|----|-------|------------|
| FE-TR1 | `trainer/wyniki.vue` (~1014) | Composable; wirtualizacja listy |
| FE-TR2 | `trainer/plany` + `TrainingPlanBuilder` | `SlaviaSheetSelect`; import z AI |
| FE-TR3 | `trainer/dziennik/*` | E2E |
| FE-TR4 | `trainer/regeneracja` | Wspólny layout z athlete |
| FE-TR5 | `trainer/monitoring` | Auto-refresh; error alert |
| FE-TR6 | `trainer/wydarzenia` | — |
| FE-TR7 | `trainer/ai-coach` | Patrz §5 |
| FE-TR8 | `AdminsManager.vue` (~1241) | Split komponentów |
| FE-TR9 | `PlayersEditorForm` (~518) | Scroll restore test |

### 1.6 Admin / SuperAdmin

| ID | Moduł | Ulepszenia |
|----|-------|------------|
| FE-ADM1 | `admin/cms.vue` | Dwa UX CMS (inline vs panel) — ryzyko rozjazdu |
| FE-ADM2 | `admin/changelog.vue` (~801) | Dane z `CHANGELOG.md` nie hardcoded |
| FE-ADM3 | `admin/kontakt-wiadomosci` | Paginacja; XSS check |
| FE-ADM4 | `superadmin/import` | Walidacja pliku; E2E |
| FE-ADM5 | `superadmin/nawigacja-paneli` (~521) | Testy regresji gate |
| FE-ADM6 | `superadmin/developer` | `useDeveloperPage.ts` ogromny |
| FE-ADM7 | `DeveloperAiCoachSettings` | Typy z OpenAPI; preview MD |

### 1.7 Cross-cutting WWW

| ID | Temat | Ulepszenie |
|----|-------|------------|
| FE-X1 | i18n | Brak `@nuxtjs/i18n` — cały UI hardcoded PL |
| FE-X2 | Auth | Brak refresh token; TOTP w monolicie `AccountSettingsPanel` |
| FE-X3 | E2E | 11 testów — brak paneli po auth, CMS, QR, AI, kalkulatory |
| FE-X4 | OpenAPI | Migracja `models.ts` → generated niekompletna |
| FE-X5 | PWA | Brak prompt iOS Safari |
| FE-X6 | Error reporting | Brak kontekstu modułu w pluginie |
| FE-X7 | `useChat` vs AI | Brak cross-linku „Napisz do trenera” |
| FE-X8 ✅ | Skip link | Już w `app.vue` (`#main-content`) |
| FE-X9 ✅ | `prefers-reduced-motion` | `prefersSlaviaReducedMotion()` w `useSlaviaScrollReveal` |
| FE-X10 ✅ | BFF kontakt | `server/api/contact.post.ts` |

### 1.8 BFF / infra Nuxt

| ID | Temat | Ulepszenie |
|----|-------|------------|
| FE-BFF1 ✅ | `/api/ai/public/**` | `server/utils/publicAiRateLimit.ts` w `ai/public/chat.post.ts` |
| FE-BFF2 ✅ | `status.get.ts` | Graceful fallback (`/api/ai/public/status`) |
| FE-BFF3 ✅ | `smoke-backend.ps1` | Ping `/api/ai/coach/public/status` |
| FE-BFF4 ✅ | `release:check` | Opcjonalny BFF AI healthcheck (`SLAVIA_BFF_URL`) |
| FE-BFF5 ✅ | `OlympicCoachPanel` | `lazy: true` na `useAsyncData` |

---

## 2. Backend Rust (`Slavia-backend`)

**Skala:** ~27 grup API · ~140 endpointów · 39 plików `routes/` · OpenAPI embed **16 tras**.

### 2.1 Global / OpenAPI / infra — P0–P1

| ID | Ulepszenie | Plik |
|----|------------|------|
| BE-G1 ✅ | OpenAPI 143 tras `/api/*` (generator `scripts/generate-openapi.mjs`) | `src/embed/openapi.json` |
| BE-G2 ✅ | `components.schemas` + Bearer security | j.w. |
| BE-G3 ✅ | Wersja OpenAPI = `Cargo.toml` (5.1.0) | j.w. |
| BE-G4 | CI: embed ≠ router → fail | `.github/workflows/` |
| BE-G5 ✅ | **`RequireTrainerOrHigher` + Admin** | `src/middleware/auth.rs` |
| BE-G6 ✅ | Distributed throttle (SQLite/Turso MVP) | `distributed_throttle.rs` + `rate_limit_hits` |
| BE-G7 | IP throttle login + contact | `src/router.rs` |
| BE-G8 ✅ | JWT: odrzuć start bez secret na prod | `production_guards.rs` + `main.rs` |
| BE-G9 | Security headers (HSTS, X-Frame-Options) | `src/router.rs` |
| BE-G10 | CORS: nie `Any` przy pustej liście | `src/lib.rs` |
| BE-G11 | Prometheus / OpenTelemetry | `src/state.rs` |
| BE-G12 | `.env.example` — PORT, GITHUB_TOKEN, CMS, GROQ_VISION | `.env.example` |
| BE-G13 | Integration tests per moduł | `tests/` |

### 2.2 Auth / admins

| ID | Ulepszenie |
|----|------------|
| BE-A1 | Login throttle per IP |
| BE-A2 | Audit login success/fail |
| BE-A3 | `logout_all` — potwierdzenie hasłem |
| BE-A4 ✅ | **`reset_database` — env guard prod** | blokada przy `DATABASE_MODE=turso` / `TURSO_DATABASE_URL` |
| BE-A5 | `delete_admin` — kaskada chat/notifications |
| BE-A6 | Test ban + invalidacja token |

### 2.3 Athletes / dziennik / regeneracja

| ID | Ulepszenie |
|----|------------|
| BE-AT1 | Public DTO bez wewnętrznych pól |
| BE-AT2 | Walidacja `weight_category` vs shared JSON |
| BE-AT3 | Indeks `(athlete_id, session_date)` | `db.rs` |
| BE-AT4 | Paginacja training-log |
| BE-AT5 | Paginacja timeline |
| BE-AT6 | Walidacja recovery ranges |

### 2.4 Plany / wyniki / zawody

| ID | Ulepszenie |
|----|------------|
| BE-TP1 | FK `athlete_id` przed INSERT planu |
| BE-TP2 | Transakcja `update_plan_items` |
| BE-TP3 | Paginacja list planów |
| BE-R1 | Paginacja public `list_approved_results` |
| BE-R2 | Walidacja kg 0–500 |
| BE-R3 | Indeks `(date DESC)` |
| BE-R4 | Scalenie `/submissions/pending` vs `/results/pending` |
| BE-C1 | Circuit breaker external calendar sync |
| BE-C2 | Indeks `competitions(date)` |

### 2.5 Płatności / obecność

| ID | Ulepszenie |
|----|------------|
| BE-PAY1 | ACL Admin na overview (z BE-G5) |
| BE-PAY2 | Duplikat miesiąca przed INSERT |
| BE-PAY3 | Audit approve/reject |
| BE-ATT1 | Rotacja QR token |
| BE-ATT2 | Throttle QR checkin |
| BE-ATT3 | Powiadomienie trenera przy self-checkin pending |
| BE-ATT4 | Paginacja `list_attendance` |

### 2.6 Czat / CMS / content

| ID | Ulepszenie |
|----|------------|
| BE-CH1 ✅ | **`open_thread` — weryfikacja pary użytkowników** | role + uczestnictwo w `chat.rs` |
| BE-CH2 | Limit długości + anty-spam wiadomości |
| BE-CH3 | Indeks `chat_messages(thread_id, created_at)` |
| BE-CH4 ✅ | Paginacja `limit`/`offset` messages (`pagination.rs`; domyślnie 100, max 500) |
| BE-CMS1 | Brak sekretów w public CMS vars |
| BE-CMS2 | Paginacja version history |
| BE-CMS3 | Rozszerzyć testy XSS `cms_sanitize.rs` |
| BE-CT1 ✅ | **Rate limit `/api/contact`** | `post_throttle::reserve_contact_submit` per IP |
| BE-VT1 | Walidacja `athlete_id` przy głosowaniu |

### 2.7 AI coach / barbell

| ID | Ulepszenie |
|----|------------|
| BE-AI1 ✅ | **ACL `athlete_id` kadry** | trener: wymagany wątek czatu; Admin/SA: dowolny |
| BE-AI2 | Decoded base64 size nie len string |
| BE-AI3 | Walidacja decode obrazu (jak barbell_path) |
| BE-AI4 | `items_count` po filtrze pustych ćwiczeń (import) |
| BE-AI5 | Usunąć martwe `key_source` lub BYOK |
| BE-AI6 | `/barbell-path/refine` w OpenAPI |
| BE-AI7 | Prompt injection / PII w logach |

### 2.8 DB / pozostałe

| ID | Ulepszenie |
|----|------------|
| BE-DB1 | Logowanie błędów `ALTER TABLE` (nie tylko `let _`) |
| BE-DB2 | Indeks `athletes(user_id)` |
| BE-DB3 | FK / ON DELETE gdzie brakuje |
| BE-UP1 | Whitelist MIME upload |
| BE-SYS1 ✅ | **Backup DB na Cloudinary** — authenticated, bez public URL, audit | `system_logs.rs` |
| BE-SYS2 | Cache invalidation po mutacji competitions |
| BE-IMP1 | Trasa import 410 — usunąć lub przywrócić |

---

## 3. Mobile Flutter (`Slavia-mobile`)

**Skala:** v1.0.1+11 · ~35 ekranów (w tym **~5 legacy Admin/SA** do usunięcia) · 14 services · `api_service.dart` ~1400 ln · **1 test** (martwy).

> **Polityka zakresu** (szczegóły: `AGENTS.md`, sekcja *Slavia-mobile (Flutter)*): aplikacja mobilna obsługuje **wyłącznie Zawodnika i Trenera** (+ funkcje klubowe po zalogowaniu). Panele WWW `/admin/**` i `/superadmin/**` **nie mają** odpowiednika w Flutterze — CMS, import, developer, audit, zarządzanie kontami adminów itd. pozostają w przeglądarce. Istniejące ekrany admin/SA w mobile to **legacy** (§3.1b), nie backlog rozwoju.
>
> **Wyjątek:** endpointy API z segmentem `admin` używane przez **trenera** (np. `GET /api/athletes/admin` — lista kadry do czatu/planów) to nie panel Admin — zostają przy funkcjach trenera.

### 3.1 Architektura — P0–P1

| ID | Ulepszenie | Plik |
|----|------------|------|
| MOB-A1 ✅ | **Przepisać `widget_test.dart`** | smoke `BannedScreen` |
| MOB-A2 | Rozbić `api_service.dart` na moduły + `ApiClient` | `lib/services/` |
| MOB-A3 ✅ | **Ekran bana** (`isBanned`) | `banned_screen.dart` + `main.dart` |
| MOB-A4 | Globalny handler 401 na każdym requeście |
| MOB-A5 ✅ | `go_router` + deep linki | fundament: `app_router.dart`; pełne FCM/deeplinki → Fala 3 (`docs/fcm-go-router-roadmap.md`) |
| MOB-A6 | Feature flags `panel_nav_*` z API — **tylko** moduły zawodnik/trener (`panel_nav_athlete_*`, `panel_nav_trainer_*`); ignoruj admin/SA |
| MOB-A7 | Usunąć/podłączyć `offline_attendance_service.dart` |
| MOB-A8 | `cached_network_image` — użyć lub usunąć z pubspec |
| MOB-A9 | `Semantics` — brak w całym `lib/` |
| MOB-A10 | OpenAPI-generated modele zamiast ręcznych |

### 3.1b Legacy Admin / SuperAdmin — usunąć (P1, nie rozwijać)

| ID | Akcja | Pliki / obszar |
|----|-------|----------------|
| MOB-DEPREC1 ✅ | **Usunąć ekrany** admin/SA + wpisy w hubach | usunięte 4 ekrany + sekcje w `more_hub` / `calculators_page` |
| MOB-DEPREC2 ✅ | **Wyciąć metody API** SuperAdmin z `api_service.dart` | audit, CRUD adminów, CRUD ogłoszeń, CRUD zawodników SA |
| MOB-DEPREC3 ✅ | **UX konta Admin/SA** bez panelu mobile | `browser_panel_screen.dart` + routing w `main.dart` |

*Odpowiedniki WWW (backlog tylko Nuxt):* `FE-ADM1`–`FE-ADM7` (§1.6), `superadmin/*` w §13.4.

### 3.2 Luki parity vs WWW — tylko zawodnik / trener (brak modułu)

| Moduł WWW | Priorytet | ID |
|-----------|-----------|-----|
| **Składki** (API jest!) | **Wysoki** | MOB-P1 ✅ |
| **Trener AI** | **Wysoki** | MOB-P2 ✅ |
| Strona `/banned` | Wysoki | MOB-P3 ✅ |
| Wyzwania miesiąca | Średni | MOB-P4 |
| Ranking publiczny `/zawodnicy` | Średni | MOB-P5 |
| Inne ćwiczenia | Średni | MOB-P6 |
| Obecność kadry (lista) | Średni | MOB-P7 |
| Dziennik trenera (wszyscy) | Średni | MOB-P8 |
| Wyniki kadry pełne | Średni | MOB-P9 |
| Regeneracja trenera | Średni | MOB-P10 |
| Konfiguracja TOTP | Średni | MOB-P11 |
| Panel nav flags (athlete/trainer) | Średni | MOB-P12 |
| Monitoring trenera, wydarzenia (`trainer/wydarzenia`) | Niski | MOB-P13 |
| ~~CMS, import, superadmin tools~~ | — | **Poza zakresem mobile** — tylko WWW |

### 3.3 Ekrany — ulepszenia

| ID | Ekran | Ulepszenie |
|----|-------|------------|
| MOB-S1 | `login_screen` | Rate-limit feedback; username memory |
| MOB-S2 | `dashboard_page` (~1100) | Split; kafelki składki + AI; pull-to-refresh |
| MOB-S3 ✅ | `chat_screen` | Auto-refresh 8s; `ChatMarkdownText` (parity `markdownInline`); layout wątków |
| MOB-S4 | `notification_screen` | Deep link; FCM zamiast poll 30s |
| MOB-S5 | `attendance_qr_scan` | Debounce; offline queue |
| MOB-S6 | `calendar_screen` | Widok miesiąca; intent kalendarz systemowy |
| MOB-S7 | `recovery_journal` | Widok trenera; wykresy trendu |
| MOB-S8 | `club_posts` | Rich HTML nie plain strip |
| MOB-S9 | `club_gallery` | `CachedNetworkImage` |
| MOB-S10 | `athlete_list` | Lista kadry trenera (`GET /api/athletes/admin` — endpoint kadry, nie panel Admin) |
| MOB-S11 | `athlete_overview_tab` (~750) | Split wykresów |
| MOB-S12 | `profile_page` | TOTP setup; sync theme z backendem |
| MOB-S13 | `barbell_analysis` | Test vectors vs shared |
| MOB-S15 | `app_update_service` (~980) | Checksum APK; split modułów |
| MOB-S16 | `push_notification_service` | Backoff; prune seen_ids |
| MOB-S17 | `biometric_gate` | „Wyloguj” przy odmowie |
| MOB-S18 | `theme_provider` | Presety z `theme-presets.json` nie hardcode |

### 3.4 Duplikaty vs shared

| ID | Problem | Plik mobile |
|----|---------|-------------|
| MOB-D1 | `sinclairAthlete` zduplikowany | `lib/utils/athlete_sinclair_bodyweight.dart` |
| MOB-D2 | Proporcje ~546 ln port z FE nie shared | `lib/utils/weightlifting_ratios.dart` |
| MOB-D3 | Odznaki hardcode vs JSON | `athlete_badge_catalog.dart` |
| MOB-D4 | `pubspec` path `../Slavia-shared/dart` vs lock na submodule | ujednolicić |

### 3.5 CI mobile

| ID | Ulepszenie |
|----|------------|
| MOB-CI1 | `flutter test` dla samego mobile (nie tylko shared/dart) |
| MOB-CI2 | Drift check OpenAPI |
| MOB-CI3 | Brak iOS build |

---

## 4. Slavia-shared

**Skala:** 47 plików · Vitest 3 pliki · Dart test tylko Sinclair.

### 4.1 Kontrakt i drift

| ID | Ulepszenie | Ścieżka |
|----|------------|---------|
| SH-1 ✅ | Backend `ALLOW_PRESET` ← `theme-presets.json` | `src/embed/theme-presets.json` + `theme_presets.rs` |
| SH-2 ✅ | PZPC: TS czyta JSON nie hardcode | `src/logic/pzpcWeightCategories.ts` |
| SH-3 ✅ | Test parity PZPC JSON↔TS | `tests/pzpc-catalog-parity.test.ts` |
| SH-4 | Dart odznaki z JSON nie const | `dart/lib/athlete_badge_catalog.dart` |
| SH-5 | `sinclairAthlete` w Dart | `dart/lib/sinclair_athlete.dart` |
| SH-6 | Proporcje w Dart z TS | usuń duplikat mobile |
| SH-7 | Więcej wektorów barbell | `test-vectors/barbell-path.json` |
| SH-8 ✅ | Testy `badgeHelpers`, `weightliftingRatios` | `tests/` |
| SH-9 | CI `npm test` w repo shared | `.github/workflows/ci.yml` |
| SH-10 | `pnpm shared:test` w CI frontendu | `Slavia-frontend/ci.yml` |
| SH-11 ✅ | Test `openapi.sha256` | `tests/openapi-snapshot.test.ts` |
| SH-12 | Sync assert `dart/assets/` === `data/` | `scripts/sync-dart-assets.mjs` |
| SH-13 | Seed PZPC backend z shared JSON | `Slavia-backend/db.rs` |
| SH-14 | `weightlifting-exercises.json` — brak snatch/C&J | extract script |
| SH-15 | Theme presets loader dla Flutter | `dart/lib/catalogs.dart` |
| SH-16 | Submodule pusty lokalnie — onboarding | `pnpm shared:pull` |
| SH-17 | OpenAPI schemas w backend embed | prerequisite dla typów |
| SH-18 | Eksport typów dla mobile (opcjonalnie) | `openapi/dart/` |

---

## 5. Trener AI i `renderChatMarkdown.ts`

*Szczegółowy audyt modułu AI (pierwsze przejście) — skrót; pełna lista ~200 punktów w podsekcjach.*

### 5.1 Krytyczne

| ID | Problem |
|----|---------|
| AI-K1 | Parser MD niepełny vs output LLM |
| AI-K2 ✅ | `ClubPublicAiAssistant` — `renderChatMarkdown` |
| AI-K3 ✅ | Załączniki wideo — max 2 klatki, 8 payloadów łącznie |
| AI-K4 ✅ | ACL `athlete_id` BE |
| AI-K5 | ✅ Vitest `renderChatMarkdown` (9); brak E2E |

### 5.2 `renderChatMarkdown.ts` (wybrane)

| Kategoria | Liczba | Przykłady |
|-----------|--------|----------|
| Security S* | 7 | URL whitelist, placeholder kolizja, DOMPurify config |
| Parser M* | 27 | `####`, tabele bez separatora, task list, strikethrough, Unicode |
| Perf P* | 4 | Memoizacja v-html, cache DOMPurify |
| Dev D* | 6 | Vitest 40+ cases, `markdownInline.ts` shared |
| Visual V* | 6 | Copy code, syntax highlight, zebra tables |

### 5.3 `OlympicCoachPanel.vue`

| ID | Problem |
|----|---------|
| AI-U1 | Monolit ~1188 ln |
| AI-U2 ✅ | Quota toast przy limicie |
| AI-U3 | `experience = weight_category` bug |
| AI-U4 | Blob memory leak w historii |
| AI-U5 | Smart scroll |
| AI-U6 | Martwy CSS BYOK ~120 ln |

### 5.4 Pliki modułu AI

`renderChatMarkdown.ts`, `OlympicCoachPanel.vue`, `useOlympicCoachAi.ts`, `olympicCoachAttachments.ts`, `ClubPublicAiAssistant.client.vue`, `DeveloperAiCoachSettings.vue`, `useBarbellPathAi.ts`, `BarbellLabPathAnalyzer.client.vue`, `_olympic-coach.scss`, `ai_coach.rs`, `barbell_path_ai.rs`, `post_throttle.rs`.

---

## 6. Cross-repo / integracja

| ID | Temat | WWW | BE | Mobile | Shared |
|----|-------|-----|----|----|--------|
| X-1 ✅ | OpenAPI drift | types generated | 143 tras + schemas | brak | lustro+SHA |
| X-2 ✅ | Theme presets | `useSlaviaAppearance` | JSON embed | hardcode 13 | JSON |
| X-3 ✅ | PZPC kategorie | re-export TS←JSON | TEXT w DB | brak | JSON=TS |
| X-4 | Sinclair/proporcje | re-export | brak server rank | duplikaty | TS+Dart partial |
| X-5 | Składki | pełny UI | API OK | **API bez UI** | — |
| X-6 | Trener AI | pełny | Groq | **brak** | — |
| X-7 | Czat ludzki | `useChat` | `chat.rs` | `chat_screen` | — |
| X-8 | Markdown render | `renderChatMarkdown` | — | plain text | — |
| X-9 | Feature flags panel | `panelNavigationCatalog` | `feature_flags.rs` | brak (MOB-A6: tylko athlete/trainer) | — |
| X-10 | Dual provider BE | `useBackendProvider` | env | brak | brand-defaults |
| X-11 | Wersja app | `package.json` 5.0.0 | `Cargo.toml` 5.1.0 | 1.0.1+11 | 1.0.0 | **Niespójne semver** |
| X-12 | CI dispatch shared→FE/Mobile | `dispatch-dependents.yml` | brak | OK | trigger |

---

## 7. Testy i CI (cały ekosystem)

| Repo | Stan | Braki |
|------|------|-------|
| Frontend | lint, typecheck, build, 11 E2E, **Vitest (9)** | brak E2E paneli/AI/CMS |
| Backend | unit w middleware, throttle, cms | **~95% handlerów bez testów** |
| Mobile | analyze + shared/dart test | **1 martwy widget test** |
| Shared | 3 vitest files | poza CI frontendu; brak job w shared repo |

**Rekomendowane minimum:**
- ✅ `renderChatMarkdown.test.ts` — `sanitizeHtml.test.ts`, `zawodnicyRanking.test.ts`
- Backend integration: auth, chat ACL, ai_coach ACL
- Mobile: smoke `SlaviaApp`, payment screen, ban screen
- Shared: `pnpm shared:test` w CI frontend + job w shared

---

## 8. Bezpieczeństwo

| P0 | Opis | Repo |
|----|------|------|
| SEC-1 ✅ | ACL athlete_id AI | BE |
| SEC-2 ✅ | Chat open_thread | BE |
| SEC-3 ✅ | reset_database guard | BE |
| SEC-4 ✅ | Backup DB public URL | BE — `DbBackupResponse` bez URL |
| SEC-5 ✅ | Contact spam | BE (rate limit IP) |
| SEC-6 ✅ | JWT secret prod | BE — fail start przy Turso + słaby secret |
| SEC-7 ✅ | Załączniki wideo limit | FE+BE |
| SEC-8 ✅ | kontakt.vue direct API | FE → BFF |
| SEC-9 ✅ | Mobile ban screen | Mobile |
| SEC-10 ✅ | Throttle multi-instance | BE — auto przy Turso (`distributed_throttle`) |
| SEC-11 | Certificate pinning doc | Mobile — odłożone (dokumentacja) |
| SEC-12 ✅ | RODO — logi bez treści AI | BE (policy + TraceLayer bez body); FE error plugin — odłożone |

---

## 9. Dostępność, i18n

| ID | Obszar |
|----|--------|
| A11Y-1 | `aria-live` — Olympic Coach, club-ai, czat klubowy |
| A11Y-2 | `aria-pressed` — tryby AI |
| A11Y-3 ✅ | Tabele MD `scope="col"` | `renderChatMarkdown.ts` |
| A11Y-4 ✅ | Skip link `app.vue` | było już zaimplementowane |
| A11Y-5 ✅ | `prefers-reduced-motion` — scroll reveal | `useSlaviaScrollReveal` |
| A11Y-6 | Focus trap club-ai panel |
| A11Y-7 | Mobile `Semantics` — **zero** w Flutter |
| A11Y-8 | Kalendarz publiczny — aria na komórkach |
| I18N-1 | Brak i18n WWW i mobile — świadomy monojęzyk PL |

---

## 10. Wydajność i observability

| ID | Temat |
|----|-------|
| PERF-1 | Memoizacja `renderChatMarkdown` |
| PERF-2 | Lazy `OlympicCoachPanel`, barbell TF |
| PERF-3 | Wirtualizacja długich list (wyniki trener) |
| PERF-4 | Mobile IndexedStack — lazy tabs |
| PERF-5 | Mobile polling → FCM |
| PERF-6 | Backend indeksy DB (§2.8) |
| PERF-7 | `ClubGlobalSearch` cache |
| OBS-1 | Prometheus backend |
| OBS-2 | Error plugin z modułem FE |
| OBS-3 | Groq latency metrics |

---

## 11. Mapa priorytetów globalna

### Fala 0 — bezpieczeństwo (3–5 dni, wszystkie repo)

1. ✅ BE: ACL athlete_id, chat open_thread, contact rate limit, reset_database guard
2. ✅ FE+BE: limity załączników wideo
3. ✅ BE: RequireTrainerOrHigher + Admin
4. ✅ Mobile: ekran bana
5. ✅ BE: backup DB review

### Fala 1 — kontrakt i testy (1 tydzień)

6. ✅ OpenAPI 143 tras + schemas + Bearer (`generate-openapi.mjs`)
7. ✅ Vitest: renderChatMarkdown + sanitizeHtml (16); shared:test w CI
8. ✅ FE: BFF kontakt; fix porownanie/kalendarz public fetch
9. ✅ Mobile: payment screen; fix widget test
10. ✅ theme-presets w backend (embed JSON); PZPC TS←JSON + parity testy

### Fala 2 — UX parity i jakość (2 tygodnie)

11. ✅ MD w ClubPublicAiAssistant + mobile chat (`ChatMarkdownText`, auto-refresh)
12. ✅ FE: quota toast AI przy limicie; error bubbles; smart scroll — częściowo
13. ✅ Mobile: Trener AI (`ai_coach_screen.dart` + API)
13b. ✅ Mobile: **MOB-DEPREC1–3** — ekrany, API, `BrowserPanelScreen`
14. ✅ FE: `useMembershipPaymentsPage` unify
15. ✅ Parser MD: HR, tabele fallback, `__bold__`, `~~strike~~`
16. ✅ BE: paginacja (results, chat, attendance, training-log)
17. ✅ Mobile: FCM / go_router — fundament (`app_router`, `FcmService` stub); pełny push → `docs/fcm-go-router-roadmap.md`

### Fala 3 — architektura (3–4 tygodnie)

18. ✅ Refactor monolitów (start): `useAthletePublicProfilePage`, OlympicCoachPanel `lazy`, `api_service_ai_coach.dart` + `api_service_public_ext.dart`
19. ✅ `SlaviaChatMarkdown.vue` + `@slavia/shared/markdown-inline`
20. ✅ Mobile: `PanelNavigationService` + `ThemePresetCatalog` z JSON
21. ✅ Distributed throttle (`DISTRIBUTED_THROTTLE=1` → SQLite `rate_limit_hits`)
22. ✅ E2E: panel trenera, Trener AI auth, public AI status BFF

### Fala 4 — strategiczne (backlog)

23. ✅ SSE stub + consumer (`probeOlympicCoachStream`, `streamMode` w `useOlympicCoachAi`) — pełny streaming LLM w backlogu
24. ✅ Flutter: `PublicRankingScreen`, `ClubChallengesScreen`, nawigacja w `club_hub` + `more_hub` (podium, refresh)
25. ⏸ i18n — odłożone; prep: `config/i18n.ts`, `docs/i18n-deferred.md`
26. ⏸ Biblioteka MD (`marked`) — odłożone; werdykt: `docs/markdown-stack.md`, shared `markdownInline`
27. ✅ Server-side Sinclair — BFF whitelist, `/zawodnicy` korzysta z `athletes/ranking/sinclair` przy braku filtrów

---

## 12. Granica kompletności

### Przejrzane w 100%

| Obszar | Metoda |
|--------|--------|
| Wszystkie 68 stron WWW | inventarz + próbkowanie monolitów |
| 61 composables | lista + grep antywzorców |
| 39 modułów routes backend | router.rs + post_throttle + db.rs |
| 35 ekranów Flutter (w tym legacy admin/SA) | lib/screens + services |
| Slavia-shared TS+Dart | package structure + testy |
| BFF server/, config/, e2e/ | grep + read |
| OpenAPI embed vs router | porównanie liczby tras |
| AGENTS.md antywzorce | grep naruszeń |

### Świadomie poza backlogiem

- Pełny CommonMark / KaTeX / Mermaid w czacie
- i18n EN/DE
- Własny model LLM / fine-tuning
- Redesign graficzny „od zera”
- Pen test / formalny audit RODO
- Optymalizacja każdej linii SCSS
- iOS native build (mobile)
- Każda możliwa mikro-optymalizacja Reactivity Vue

### Werdykt

**~450+ pozycji** pokrywa wszystkie sensowne ulepszenia istniejącego kodu w czterech repozytoriach. Kolejny krok to **implementacja Fal 0–1**, nie dalsza analiza dokumentacyjna.

---

## 13. Przejście 4 — katalog per moduł

Każdy plik tras backendu, ekran Flutter i kluczowy moduł WWW — skrótowa lista ulepszeń (uzupełnia §1–5).

### 13.1 Backend — każdy `src/routes/*.rs`

| Moduł | Ulepszenia |
|-------|------------|
| `auth.rs` | IP throttle; audit login; JWT refresh; 1× unwrap — usunąć |
| `totp.rs` | Guard double-enable; backup codes |
| `admins.rs` | **11× unwrap**; reset_database prod guard; delete cascade; ban test |
| `athletes.rs` | Public DTO; ACL link/attach; paginacja list |
| `training_log.rs` | **6× unwrap**; paginacja; indeks DB |
| `training_plans.rs` | **11× unwrap**; transakcja items; FK athlete |
| `competition_participants.rs` | **15× unwrap** — najwyższy; walidacja sync |
| `competitions.rs` | Circuit breaker sync zewn.; cache invalidation |
| `recurring_training_cancellations.rs` | Walidacja dat; testy regresji kalendarza |
| `calendar_export.rs` | Public ICS bez auth? — udokumentować |
| `results.rs` | Paginacja public board; batch idempotency |
| `submissions.rs` | Scalenie z results pending (duplikat API) |
| `posts.rs` | Slug uniqueness; soft delete |
| `announcements.rs` | Paginacja; expire_at opcjonalnie |
| `gallery.rs` | Limit rozmiaru albumu; sort order |
| `contact.rs` | **Rate limit**; captcha; spam detection |
| `notifications.rs` | (handlery) paginacja; mark all read |
| `payments.rs` | Standing order edge cases (komentarz L806+); audit |
| `exercises.rs` | Board pending — ACL kto widzi counts |
| `exercise_submissions.rs` | Walidacja duplicate submit |
| `attendance.rs` | Paginacja; notify trener przy pending |
| `attendance_qr.rs` | Rotacja tokenu; throttle |
| `chat.rs` | **open_thread ACL**; spam limit; cursor pagination |
| `comments.rs` | Powiązanie z result_id; moderacja; używane tylko w `trainer/wyniki.vue` |
| `recovery.rs` | Walidacja zakresów; trend server-side opcjonalnie |
| `club_votes.rs` | Walidacja athlete_id aktywny |
| `challenges.rs` | **3× unwrap**; cache leaderboard; test tonnage formula |
| `club_feed.rs` | Limit agregacji; filtr typów zdarzeń |
| `ai_coach.rs` | Patrz §5 — ACL, base64, import count |
| `ai_coach_settings.rs` | Walidacja długości promptów przy save |
| `barbell_path_ai.rs` | OpenAPI; mock vision tests |
| `cms.rs` | Sekrety w vars; paginacja history |
| `cms_status.rs` | Health dla GitHub CMS |
| `feature_flags.rs` | Admin+ dla globalnych flag |
| `system_logs.rs` | ✅ Backup DB — authenticated Cloudinary; worker metrics API |
| `mobile_releases.rs` | Weryfikacja checksum APK; semver |
| `upload.rs` | MIME whitelist; virus scan opcja |
| `import.rs` | Trasa 410 — usuń martwy kod |

### 13.2 Backend — moduły poza `routes/`

| Moduł | Plik | Ulepszenia |
|-------|------|------------|
| Chat pruner | `chat_cleanup.rs` | `CHAT_INACTIVITY_DAYS=30` — konfigurowalne env; alert gdy prune > N |
| Składki auto | `payments_scheduler.rs` | Idempotencja miesiąca; metryki błędów; dokumentacja catch-up |
| Powiadomienia async | `notifications.rs` | `spawn_notify` — log błędów; retry |
| Worker metrics | `worker_metrics.rs` | UI `superadmin/workers` — alert przy `ok: false` |
| External sync | `external_calendar_sync.rs` | Timeout; user-agent; rate limit źródła |
| CMS GitHub | `cms_github.rs` | Retry; conflict resolution |
| CMS sanitize | `cms_sanitize.rs` | Więcej wektorów XSS w testach |
| HTTP cache | `middleware/http_cache.rs` | Invalidacja po POST competitions |
| Auth middleware | `middleware/auth.rs` | **Admin w TrainerOrHigher** |
| Throttle | `post_throttle.rs` + `login_throttle.rs` | Distributed store |
| DB | `db.rs` | Indeksy; log ALTER failures; shared JSON seed |
| Audit | `audit.rs` | Retention policy; PII w logach |

### 13.3 Frontend — middleware i pluginy

| Plik | Ulepszenia |
|------|------------|
| `ban.global.ts` | Spójność z `ban_redirect_on_403` |
| `panel-nav.global.ts` | Tylko client — SSR bypass gate; test E2E wyłączonego modułu |
| `athlete-dziennik.ts` | Redirect trener — test |
| `athlete-calendar.ts` | Flaga kalendarza |
| `diary-redirect` | (jeśli istnieje) — spójność z dziennik middleware |
| `dev-iframe.global.ts` | Dokumentacja dev preview |
| `00.auth.ts` | Hydracja provider; race przy dual tab |
| `01.panel-nav-bootstrap.client.ts` | Cache flags |
| `00.experimental-bootstrap.client.ts` | Kill switch sync |
| `99.error-reporting.client.ts` | Kontekst modułu + route w raporcie |
| `02.resource-hints.client.ts` | Preconnect do apiBase |
| `03.cms-route-hydrate.client.ts` | Offline CMS |

### 13.4 Frontend — moduły nieujęte szczegółowo w §1

| Moduł | Ulepszenia |
|-------|------------|
| `klub/wyzwania.vue` | OK: `usePublicLazyFetch`; brak E2E; brak mobile; share URL month |
| `trainer/wyniki.vue` + `comments` | Komentarze inline w monolicie; brak powiadomień dla zawodnika |
| `trainer/wydarzenia.vue` | `club_feed` — error state; paginacja |
| `superadmin/workers.vue` | Tylko read-only; brak alertu przy failed cron |
| `superadmin/import.vue` | Walidacja; progress; E2E |
| `athlete/wrapped.vue` | Sezonowość; export/share grafiki |
| `kalkulator-proporcji.vue` | Duplikat logiki vs shared/mobile |
| `components/payments/*` | Upload proof — progress bar |
| `ClubHistoryTimeline.vue` | Lazy load; a11y timeline |
| `ClubWelcomeOnboarding.vue` | Persystencja kroków |
| `useMobileAppRelease.ts` | Sync z `server/api/mobile/latest-release` |
| `usePrefetchApi.ts` | `.catch` — ciche |
| `DashboardMonthlySummary.vue` | Error boundary |
| `TrainingComparison.vue` | 3× `.catch` |
| `SiteFooter.vue` | Public fetch error |
| `superadminSearchCatalog.ts` | Indeks dev search — aktualizacja przy nowych modułach |

### 13.5 Mobile — każdy ekran `lib/screens/`

| Ekran | Ulepszenia |
|-------|------------|
| `login_screen` | Rate limit UX; saved username |
| `main_screen` | IndexedStack lazy; bottom nav a11y |
| `dashboard_page` | Split; składki + AI kafelki |
| `profile_page` | TOTP; theme sync BE; payments link |
| `hub/training_hub` | Linki parity; subtitle accuracy |
| `hub/club_hub` | Ogłoszenie → detail nie lista |
| `hub/more_hub` | Dedup calculators nav |
| `training_log_screen` | Styl SlaviaUi; CRUD jeśli API |
| `athlete_portal_screen` | Składki; nested FutureBuilder |
| `athlete_training_plans_screen` | Push notify nowy plan |
| `trainer_training_plans_screen` | Parity z `trainer/plany` (rola Trainer; bez panelu Admin) |
| `trainer_training_plan_builder` | Dirty guard |
| `athlete_list_screen` | Lista kadry trenera (`/api/athletes/admin`) |
| `athlete_detail_screen` | Split overview_tab 750ln |
| `athlete_timeline_screen` | Filtry typu |
| `athlete_achievements_screen` | Share badge |
| `recovery_journal_screen` | Trener view; wykresy |
| `chat_screen` | Polling/MD/layout |
| `notification_screen` | Deep link; FCM |
| `calendar_screen` | Month view; system calendar |
| `attendance_qr_scan_screen` | Debounce; offline queue |
| `club_posts_screen` | Rich HTML |
| `club_post_detail_screen` | — |
| `club_gallery_screen` | CachedNetworkImage |
| `barbell_analysis_screen` | Test vectors; share |
| `sinclair_calculator_page` | Vector tests |
| `proportions_calculator_page` | Shared JSON nie port |
| `calculators_page` | Nav dedup |
| `competition_assignment_screen` | Refresh pattern OK — replicate |
| `announcement_page` | — (odczyt ogłoszeń; CRUD tylko WWW `/admin`) |
| `demo_shell_screen` | Entry point na targi |
| ~~`announcements_manage_screen`~~ | **Usunąć** — MOB-DEPREC1 |
| ~~`user_management_screen`~~ | **Usunąć** — MOB-DEPREC1 |
| ~~`superadmin_athlete_manager_screen`~~ | **Usunąć** — MOB-DEPREC1 |
| ~~`audit_log_screen`~~ | **Usunąć** — MOB-DEPREC1 |

### 13.6 Mobile — każdy `lib/services/`

| Serwis | Ulepszenia |
|--------|------------|
| `api_service.dart` | **Rozbić**; timeout; 401 global; po MOB-DEPREC2 — bez metod SuperAdmin |
| `secure_credentials_store.dart` | Migracja kluczy |
| `public_api_cache.dart` | Invalidacja po mutacji |
| `persistent_api_cache.dart` | TTL auth/me |
| `push_notification_service.dart` | Backoff; prune seen_ids |
| `offline_attendance_service.dart` | **Martwy** — podłączyć lub usuń |
| `barbell_video_analyzer.dart` | ML Kit errors po PL |
| `barbell_session_store.dart` | Limit storage |
| `barbell_premium_service.dart` | Sync z backendem / usuń lokalny unlock |
| `competition_reminder_service.dart` | Timezone edge cases |
| `app_update_service.dart` | Checksum APK; split 980ln |
| `app_shortcuts_service.dart` | Deep link targets |
| `result_share_service.dart` | Watermark klubu |
| `notification_timezone.dart` | DST |

### 13.7 `renderChatMarkdown.ts` — pełna lista (158 ln)

| # | Obszar | Ulepszenie |
|---|--------|------------|
| MD-1 | S | `ALLOWED_URI_REGEXP`, hook `rel` na linkach |
| MD-2 | S | Placeholder UUID zamiast `@@CODEBLOCK@@` |
| MD-3 ✅ | M | Nagłówki `####`–`######` |
| MD-4 | M | Tabele bez separatora (≥2 wiersze `\|`) |
| MD-5 | M | `__bold__`, `_italic_`, `~~strike~~` |
| MD-6 | M | Task list `- [ ]` / `- [x]` |
| MD-7 | M | HR `---` |
| MD-8 | M | Obrazy `![alt](url)` z whitelist |
| MD-9 | M | `* 3 *` false italic fix |
| MD-10 | M | Zagnieżdżone listy (wcięcia) |
| MD-11 | M | Język w ``` → `language-*` class |
| MD-12 | P | Memoizacja + cache DOMPurify |
| MD-13 | D | ✅ Vitest 9 cases (start); `markdownInline.ts` shared — docelowo 40+ |
| MD-14 | V | Copy button na `<pre>`; zebra tables |
| MD-15 ✅ | X | `scope="col"` na `<th>` |
| MD-16 ✅ | — | OlympicCoach, ClubPublicAi, mobile chat (`ChatMarkdownText`); Barbell interpret — backlog |

---

## Appendix A: Inwentarz

### Frontend — strony (68)

Publiczne: `/`, `/o-klubie`, `/kontakt`, `/logowanie`, `/banned`, `/kalendarz`, `/galeria`, `/aktualnosci/*`, `/zawodnicy/*`, `/ogloszenia`, kalkulatory, `/klub/wyzwania`, `/klub/rekordy`.

Klub: `/klub`, `/klub/obecnosc`, `/klub/czat`, `/klub/powiadomienia`.

Athlete (13): dashboard, slug, wyniki, składki, kalendarz, dziennik, timeline, plany, ai-coach, regeneracja, exercises, analiza-sztangi, wrapped.

Trainer (14): dashboard, wyniki, zawodnicy, składki, plany, dziennik, cwiczenia, ai-coach, regeneracja, wydarzenia, monitoring, analiza-sztangi, redirecty.

Admin (5): index, zawodnicy, kontakt-wiadomosci, changelog, cms.

SuperAdmin (7): index, developer, import, barbell-lab, audit-logs, nawigacja-paneli, workers, zawodnicy.

### Backend — grupy API (~27)

auth, upload, athletes, admins, submissions, results, competitions, posts, announcements, gallery, contact, notifications, payments, import, exercises, exercise-submissions, attendance, chat, comments, training-plans, recovery, club-votes, challenges, club-feed, ai/coach, cms, system.

### Mobile — ekrany (~35; zakres docelowy: zawodnik + trener)

**Docelowo:** hub (training, club, more), dashboard, login, profile, athlete_*, trainer_*, club_*, chat, notifications, calendar, QR, recovery, training_log, barbell, calculators, competition_assignment, announcement (read-only), demo.

**Legacy do usunięcia (MOB-DEPREC1):** `user_management`, `superadmin_athlete_manager`, `audit_log`, `announcements_manage` + sekcje admin w hubach.

### Shared — moduły

TS: sinclair, sinclairAthlete, barbellPath, weightliftingRatios, pzpc, badgeHelpers + 5 JSON + OpenAPI.

Dart: sinclair, badges, brand, catalogs (partial).

---

## Appendix B: Statystyki backlogu

| Sekcja | ~Pozycji |
|--------|----------|
| §1 Frontend | 120+ |
| §2 Backend | 75+ |
| §3 Mobile | 90+ |
| §4 Shared | 18+ |
| §5 Trener AI | 200+ (część nakłada się z §1–2) |
| §6–10 Cross | 50+ |
| §13 Per-moduł | 120+ |
| **Unikalne actionable** | **~450+** |

---

## Appendix C: Metryki jakościowe

| Metryka | Wartość | Cel |
|---------|---------|-----|
| Strony WWW | 68 | — |
| Composables | 61 | — |
| Komponenty Vue | 100 | — |
| Pliki `.catch(() =>` ciche | **54** | 0 (toast/error state) |
| Monolity Vue >800 ln | **10+** | <3 |
| Backend route files | 39 | — |
| `unwrap`/`expect` w routes | **~52** | 0 w handlerach |
| OpenAPI tras w embed | **143** | ~140 |
| Vitest frontend | **2 pliki / 16 testów** | 50+ plików utils |
| E2E Playwright | **11** | 40+ krytycznych tras |
| Mobile ekrany | ~35 (~30 docelowo) | parity **zawodnik/trener** + publiczne; bez Admin/SA |
| Mobile widget tests | **1 smoke (BannedScreen)** | 10+ smoke |
| Shared Vitest pliki | **8** | 10+ |
| Flagi eksperymentalne | 22 | dokumentowane w AGENTS |
| Moduły panel nav | ~40 | test gate regresji |

---

*Ostatnia aktualizacja: 2026-06-11 · Fala 0 zamknięta (SEC-4/6/10/12 BE, backup authenticated); Fale 1–4 wg tabel.*
