<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Panel admina — Changelog',
  robots: 'noindex, nofollow'
})

const updates = [
  {
    version: 'v2.9.8-beta',
    date: '8 Maj 2026',
    title: 'Profil zawodnika 2.0, automatyzacja czatu i składek, publiczny kalkulator proporcji',
    features: [
      'Strona zawodnika przeprojektowana w „magazynowym” stylu: hero z dużym avatarem, KPI strip, sekcja bio i pełna oś czasu startów oraz treningów.',
      'Nowy wykres łączony zawody+treningi (`AthleteCombinedChart`) z proporcjonalną osią czasu i statystykami formy (PB, trend 90 dni, średni dwubój, najlepszy Sinclair).',
      'Wyniki: wpisy treningowe automatycznie oznaczane miejscem „Slavia”, backfill istniejących rekordów i widoczność miejsca w panelach trenera/zawodnika.',
      'Czat: wątki bez aktywności od 30 dni są automatycznie usuwane (background task co 6h), z audit logiem i ręcznym endpointem `POST /api/chat/admin/prune` plus UI w panelu superadmin/developer.',
      'Składki: nowa flaga „przelew stały” na zawodniku — scheduler raz na 12h tworzy zatwierdzone wpłaty za bieżący miesiąc, idempotentnie i z podsumowaniem w panelu trenera.',
      'Kalkulator złotych proporcji: pełna publiczna dostępność (bez logowania) + skrót w głównej nawigacji obok kalkulatora Sinclair.',
      'Powiadomienia: zamiast surowych hashy z bazy pokazują ludzkie nazwy (zawodnik, klub, wątek) — niezależnie od kontekstu.',
      'Strona główna odświeżona, z większą ilością treści i lepszą hierarchią sekcji.',
      'Kategorie wagowe zaktualizowane do regulaminu PZPC 2026; wyniki zawodów publiczne, treningi widoczne tylko po zalogowaniu.',
      'Modale edycji (zawodnik, wynik, ogłoszenie, wydarzenie kalendarza, zdjęcie galerii, obecność, konto admina) poszerzone responsywnie do `xl`/`5xl`/`6xl` — wygodniejsze formularze na desktopie.',
      'Sprzątanie: usunięte strony robiące tylko redirect (`/wyniki-zawodow`, `/ranking`, `/blog/*`) — kanoniczne URL-e prowadzą wprost do docelowych widoków.',
      'Naprawiony upload zdjęć w blogu/aktualnościach i pozostałych miejscach, gdzie wcześniej zwracał błąd.'
    ],
    type: 'feature'
  },
  {
    version: 'v2.4.0-beta.1',
    date: '8 Maj 2026',
    title: 'Beta: shimmer loading, kalkulatory live, devtools iframe i ulepszona analiza sztangi',
    features: [
      'Loading UI: spójny shimmer/skeleton zamiast splasha, dopasowany do motywów i konsekwentny w stanach pobierania danych.',
      'DevTools: podgląd mobilny/desktop w iframe (prawdziwa symulacja viewportu), poprawione zamykanie overlay i porządki w narzędziach.',
      'DevTools: mapa aplikacji bez duplikatów + poprawki przełamywania długich etykiet; stabilne flagi ukryte z listy eksperymentów.',
      'Kalkulatory: proporcje (golden ratios), Sinclair i PR liczą „na żywo” w trakcie wpisywania; lepsze UX i walidacje.',
      'Analiza sztangi: poprawione rysowanie toru + nowe tryby śledzenia (referencje z ciała / talerze) pod flagami eksperymentalnymi.',
      'Kontakt: przywrócone pole e-mail w publicznym formularzu (frontend + backend + bezpieczna migracja DB).',
      'Role/ACL: Admin bez roli Trener nie widzi funkcji trenerskich; SuperAdmin zachowuje pełny dostęp (również przy kontach wielorolowych).',
      'Karty zawodników: większy, współdzielony wykres progresu (karta + profil), kolory zależne od motywu, badge opłaty i status aktywności.'
    ],
    type: 'feature'
  },
  {
    version: 'v2.3.2',
    date: '7 Maj 2026',
    title: 'Banowanie kont, ochrona backendu i poprawki wpłat',
    features: [
      'Administracja: ban/unban kont (Admin/SuperAdmin) z opcjonalnym powodem; nie da się zbanować SuperAdmina.',
      'Zbanowane konto widzi wyłącznie stronę „Konto zbanowane”; backend egzekwuje bana natychmiast (403) niezależnie od wieku tokena JWT.',
      'Wpłaty: utwardzone odczyty kwoty (SQLite INTEGER/REAL) — bez panic w libsql przy liście zgłoszeń.'
    ],
    type: 'feature'
  },
  {
    version: 'v2.3.1',
    date: '6 Maj 2026',
    title: 'Własna strona błędów (404/5xx), porządki .npmrc oraz spójny wybór zawodnika w panelu trenera',
    features: [
      'Nuxt 4: globalny `error.vue` jest w katalogu `app/` (tam samo co `app.vue` i strony) — przy nieistniejących adresach i fatalnych błędach routingu wyświetla się przygotowany widok zamiast domyślnego fallbacku.',
      '`.npmrc`: doprecyzowanie workflow pod pnpm (komentarze), bez zbędnego klucza powodującego ostrzeżenia przy wywołaniach przez npm/`npx`; zachowane `node-options` i `shamefully-hoist`.',
      'Panel trenera: wspólna stała „brak wybranego zawodnika” zamiast pustego identyfikatora — spójniejsze filtry, dropdowny i podglądy na stronach trenera.'
    ],
    type: 'bugfix'
  },
  {
    version: 'v2.3.0',
    date: '6 Maj 2026',
    title: 'Finalizacja roadmapy 1-8: moduły treningowe, monitoring, hardening i release-check',
    features: [
      'Nowe moduły dla zawodnika i trenera: oś czasu zawodnika, plany treningowe, progres planów, dziennik regeneracji oraz dedykowana skrzynka powiadomień.',
      'Panel trenerski rozszerzony o monitoring systemu i feed wydarzeń operacyjnych (wyniki, obecności, regeneracja) z szybką diagnostyką aktywności klubu.',
      'Backend: pełne API dla planów treningowych i regeneracji, nowe endpointy metryk oraz feedu zdarzeń, rozszerzony audit trail i notyfikacje deep-link.',
      'Hardening testów: poprawiona stabilność testów integracyjnych (m.in. obsługa poisoned mutex i bardziej deterministyczne dane seedowe).',
      'Release tooling: skrypty `release-check` dla backendu i frontendu (cargo check/test + typecheck + smoke), ujednolicone pod finalny przegląd wydania.',
      'Optymalizacja kodu: usunięto martwy, nieużywany moduł logiki importu federacyjnego po trwałym wyłączeniu tej funkcji w API.'
    ],
    type: 'feature'
  },
  {
    version: 'v2.2.0',
    date: '5 Maj 2026',
    title: 'Ujednolicone źródła ćwiczeń, wyłączone PWA, nowe moduły i pełniejsze motywy UI',
    features: [
      'Ćwiczenia: ekrany zawodnika i trenera korzystają ze wspólnego modelu danych (zatwierdzone wpisy siłowe + licznik pending + historia treningów), bez estymacji z dwuboju.',
      'PWA/service worker wyłączone w runtime: usunięto rejestrację i manifest z aplikacji, co eliminuje lokalne ostrzeżenia o `dev-sw.js` i upraszcza zachowanie podczas developmentu.',
      'Backend provider switch: odczyt/zapis Vercel Blob działa tylko na produkcji (`NODE_ENV=production`), więc lokalnie aplikacja nie próbuje odpytania Blob.',
      'Motywy: dodano profile `pink` i `dark` zależne od płci zawodnika oraz rozszerzono mapowanie tokenów, aby wszystkie presety wpływały globalnie na tła, karty, obramowania i tekst.',
      'Analiza sztangi: trajektoria liczona tylko w fazie aktywnego podnoszenia, z replayem zsynchronizowanym z czasem odtwarzania.',
      'Galeria: pełniejsza obsługa wideo (upload + podgląd + pełny widok), a backend upload rozróżnia zasoby image/video.',
      'Nowe moduły: obecność (statusy + historia), rozszerzone powiadomienia (read/unread) oraz chat trener–zawodnik (wątki i wiadomości 1:1).',
      'Wydanie podzielone na osobne commity per release (R1–R5) dla prostszego review.'
    ],
    type: 'feature'
  },
  {
    version: 'v2.1.1',
    date: '3 Maj 2026',
    title: 'Flagi eksperymentalne z kill switchem deployu i pełnym panelem Dev Tools',
    features: [
      'Katalog funkcji eksperymentalnych rozszerzony o PWA (service worker), analizę toru sztangi (TensorFlow) oraz dzwonek powiadomień — każda ma przełącznik na `/superadmin/developer`.',
      'Zmienna środowiskowa `NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH` (lista id rozdzielonych przecinkami) trwale wyłącza wybrane funkcje na buildzie — ratunek na produkcji bez liczenia na localStorage użytkowników.',
      'Plugin startowy: najpierw hydracja nadpisań z localStorage, potem warunkowa rejestracja Vite PWA — spójna kolejność z flagami.',
      'Profil: strony analizy sztangi pokazują komunikat, gdy wyłączono `barbell_pose_analysis`.',
      'Panel developera: ostrzeżenie przy aktywnym kill switchu, badge „deploy OFF”, zablokowane przełączniki dla wymuszonych wyłączeń.',
      'Developer tools — rozszerzone testy funkcjonalności: smoke czterech endpointów API do logów lokalnych, round-trip localStorage i sessionStorage, podsumowanie dostępności IDB/cache/share/geo/vibrate, preferencje wyświetlania i stan dokumentu, geometria ekranu, przełączanie pełnego ekranu, krótka wibracja, duplikat karty, pobranie pliku testowego z Blob.'
    ],
    type: 'feature'
  },
  {
    version: 'v2.1.0',
    date: '3 Maj 2026',
    title: 'Edytor bogaty (TipTap), analiza toru sztangi, presety kolorystyczne i rozbudowane Dev Tools',
    features: [
      'Blog i dzienniki: edycja treści HTML przez TipTap (pogrubienia, listy, cytaty) z zachowaniem spójnego stylu wyświetlania.',
      'URL wpisów bloga: ścieżki `slug--uuid` przyjazne SEO i udostępnianiu; lista bloga generuje poprawne odnośniki.',
      'Analiza toru sztangi: strony `/trainer/analiza-sztangi` i `/athlete/analiza-sztangi` z modelem pose (TensorFlow.js) i heurystykami toru na canvasie.',
      'Wygląd: sześć presetów kolorystycznych (profil) z dopasowanymi tokenami Nuxt UI na jasnym motywie — spójne obramowania, tła kart i tekst.',
      'Superadmin — Developer tools: mapa tras aplikacji, dokumentacja zewnętrzna, ping API, czyszczenie Cache Storage, zrzuty JSON środowiska, licznik wyników oczekujących.',
      'Panele: uzupełnione skróty (m.in. changelog, blog, analiza sztangi, dzienniki) na dashboardach admin / trener / superadmin oraz u zawodnika.'
    ],
    type: 'feature'
  },
  {
    version: 'v2.0.0',
    date: '3 Maj 2026',
    title: 'Nowa wersja 2.0 — PWA, slugowane URL i narzędzia developera',
    features: [
      'Aktualizacje bloga i zawodników: przyjazne URL-e w formacie `id-slug` zamiast samych identyfikatorów.',
      'Poprawione wyświetlanie zdjęć wpisów na stronie szczegółowej posta oraz og:image dla SEO.',
      'Dodano instalację PWA w profilu użytkownika i testowy ekran deweloperski dla SuperAdmina.',
      'Wprowadzono testowe powiadomienia systemowe oraz komunikaty o zgodzie na powiadomienia.',
      'Page changelog dostępny wewnątrz panelu administracyjnego zamiast zewnętrznego pliku Markdown.'
    ],
    type: 'feature'
  },
  {
    version: 'v1.10.0',
    date: '2 Maj 2026',
    title: 'Poprawki konfiguracji budowania i błędów TypeScript',
    features: [
      'Naprawiono błędy TypeScript w kalendarzu — dodano typ CalendarEvent dla wydarzeń treningowych i zawodów.',
      'Zresetowano konfigurację Nuxt do domyślnej — usunięto niestandardowe optymalizacje, zachowując niezbędne moduły i runtimeConfig.',
      'Uproszczono konfigurację Netlify — usunięto zmienne środowiskowe z pliku, przeniesiono do instrukcji deploy.txt.',
      'Dodano sprawdzenia bezpieczeństwa w kalkulatorze Sinclair — zapobieganie błędom runtime przy undefined wartościach.',
      'Wszystkie komendy pnpm (build, lint, typecheck) przechodzą bez błędów.'
    ],
    type: 'fix'
  },
  {
    version: 'v1.9.0',
    date: '2 Maj 2026',
    title: 'Porządki zależności i modularna struktura',
    features: [
      'Frontend: usunięto nieużywany pakiet `@iconify-json/simple-icons` (ikony Lucide bez zmian).',
      'Backend: przy `uuid` tylko feature `v4`; przy `chrono` bez zbędnego feature `serde` (nie używamy serializacji typów daty z chrono).',
      'Backend: składanie tras w osobnym module (`router.rs`), strona powitalna API w `embed/backend_root.html`, powiadomienia — warstwa `repos/` + DTO.',
      'Frontend: rozszerzony `config/api.ts`, typ `ClubNotification`, composable `useNotificationLinks`; dopieszczony panel dzwonka powiadomień.',
      'Dev ergonomics: profil Cargo `debug = line-tables-only` (Windows), w Nuxt m.in. `esbuild.legalComments` oraz `vite.server.warmup`.'
    ],
    type: 'feature'
  },
  {
    version: 'v1.8.0',
    date: '2 Maj 2026',
    title: 'Nawigacja, wyniki kadry i panel trenera',
    features: [
      'Nagłówek: linki bez logowania pod nagłówkiem na urządzeniach mobilnych (belka z przewijaniem); na desktopie grupa publicznych skrótów w środkowej kolumnie `UHeader` — mniej ściskania i ucinania etykiet.',
      'Nawigacja konta: spójne nazwy (m.in. Mój kalendarz, Panel admina / trenera / SuperAdmin); admin i trener to osobne role naraz.',
      'Panel trenera i panel admina: sekcja „Wyniki do zatwierdzenia” zawsze na stronie — działa kotwica z karty „Zgłoszenia wyników”; komunikat przy pustej liście; poprawiona ikona nagłówka sekcji; toasty przy błędzie lub sukcesie zatwierdzenia; skrót do listy startów.',
      'Strona `/trainer/wyniki`: przycisk „Dodaj start (zatwierdzony)” — kadra zapisuje wpis od razu jako zatwierdzony (zgodnie z API); lepszy fallback listy zawodników; polskie opisy statusów w tabeli i w edycji.'
    ],
    type: 'feature'
  },
  {
    version: 'v1.7.0',
    date: '2 Maj 2026',
    title: 'Powiadomienia w aplikacji',
    features: [
      'Ikona dzwonka w nagłówku (dla zalogowanych): lista powiadomień z API, licznik na ikonie, usuwanie pojedynczych wpisów.',
      'Frontend: odświeżanie przy otwarciu panelu oraz okresowe w tle; opcjonalne skróty po kliknięciu (kalendarz, dziennik, wyniki, panele admin/superadmin).',
      'Backend: tabela powiadomień per użytkownik, GET /api/notifications oraz DELETE /api/notifications/:id (po sukcesie odpowiedź 204 No Content).',
      'Zawodnik: m.in. zatwierdzenie wyniku, przypisanie / cofnięcie zapisu na zawody, notatka trenera w dzienniku.',
      'Kadra treningowa (Trener / Admin / SuperAdmin): m.in. wpis zawodnika w dzienniku, zmiany w kalendarzu zawodów, lista zapisów, synchronizacja zewnętrzna, nowy wynik do zatwierdzenia.',
      'Administratorzy (Admin / SuperAdmin): powiadomienia o zmianach administracyjnych (konta, zawodnicy, blog).',
      'SuperAdmin: dodatkowo osobne wpisy „kadrowe” przy wybranych zdarzeniach zawodnika (podgląd bez treści „osobistej” jak u samego zawodnika).'
    ],
    type: 'feature'
  },
  {
    version: 'v1.6.0',
    date: '2 Maj 2026',
    title: 'Kalendarz, dziennik treningów i porządki w repo',
    features: [
      'Kalendarz klubu: po zalogowaniu odświeżana jest sesja przy otwarciu modala — SuperAdmin/trener nie widzą już mylącego trybu „tylko gość” dla wydarzeń z bazy.',
      'Kalendarz klubu: osobne komunikaty w podglądzie tylko do odczytu dla importu PZPC/SLPC i stałych treningów (Pn/Śr/Pt) zamiast jednego tekstu o logowaniu.',
      'Mój kalendarz zawodnika: ta sama kolorystyka i legenda co na głównym kalendarzu; wspólny composable stylów chipów (`useCalendarEventChips`).',
      'Dziennik treningów: zawodnik może dodawać własne wpisy; edycja i usuwanie wyłącznie wpisów, które sam utworzył (backend + ukryte przyciski przy wpisach kadry).',
      'Backend: uproszczona kontrola dostępu do dziennika dla roli Athlete (jedna ścieżka weryfikacji profilu).',
      'Repozytorium: usunięto lokalne pliki z hasłami i skrypty testowe z credentialami; rozszerzono `.gitignore`.'
    ],
    type: 'feature'
  },
  {
    version: 'v1.5.0',
    date: '1 Maj 2026',
    title: 'UX, SEO i porządki kodu',
    features: [
      'Kalendarz: kliknięcie pustego dnia otwiera dodawanie wydarzenia (tylko Admin/SuperAdmin).',
      'Blog: dodawanie wpisów i usuwanie wpisów zabezpieczone dla ról Admin/SuperAdmin.',
      'Naprawiono wykrywanie roli na froncie (zgodność z rolami "Admin" i "SuperAdmin").',
      'Przeprojektowano karty zawodników, aby tekst i wartości nie rozjeżdżały się w ramkach.',
      'Rozszerzono SEO dla strony głównej, bloga i kalendarza (Open Graph/Twitter/meta).',
      'Porządki: usunięcie zbędnych importów i drobne poprawki stabilności UI.'
    ],
    type: 'feature'
  },
  {
    version: 'v1.4.0',
    date: '1 Maj 2026',
    title: 'Zabezpieczenia i Uprawnienia',
    features: [
      'Kalendarz — dodawanie/edytowanie wydarzeń tylko dla zalogowanych (roli Admin/SuperAdmin).',
      'Blog — dodawanie/usuwanie wpisów tylko dla zalogowanych (roli Admin/SuperAdmin).',
      'Dodano middleware auth do stron kalendarza i blogu — niezalogowani są przekierowywani do logowania.',
      'Wszystkie endpointy API wymagają odpowiedniej roli (Admin/SuperAdmin) dla operacji CRUD.',
      'Panel admina (/admin/*) chroniony przez middleware admin.',
      'Panel superadmina (/superadmin/*) chroniony przez middleware superadmin.'
    ],
    type: 'feature'
  },
  {
    version: 'v1.3.0',
    date: '1 Maj 2026',
    title: 'Ulepszenia Kart Zawodników i Systemu Wyników',
    features: [
      'Naprawiono wyświetlanie etykiety "pkt" w karcie zawodnika — teraz mieści się w ramce.',
      'Przeprojektowano sekcję statystyk w kartach zawodników — gradienty, hover effects, większe czcionki.',
      'System dodawania wyników z zawodów — admin może dodawać wyniki, które automatycznie aktualizują wykres progresji zawodnika.',
      'Wyniki z statusem "Approved" są widoczne w publicznym API i wpływają na ranking zawodników.',
      'Zawodnicy mogą zgłaszać własne wyniki (status "Pending" do zatwierdzenia przez admina).'
    ],
    type: 'feature'
  },
  {
    version: 'v1.2.0',
    date: '1 Maj 2026',
    title: 'Kalendarz, Konta Zawodników i Ulepszenia Panelu',
    features: [
      'Nowy wizualny Kalendarz — siatka miesięczna z nawigacją i kolorowymi kategoriami wydarzeń.',
      'Kategorie wydarzeń: Mistrzostwa (czerwone), Liga (żółte), Klubowe (zielone), Treningi (niebieskie).',
      'Treningi klubowe (Pn, Śr, Pt 15-18) wyświetlane automatycznie w kalendarzu.',
      'Kliknięcie na każdy wpis w kalendarzu otwiera formularz dodawania/edycji wydarzenia.',
      'System wiązania zawodnika z kontem użytkownika — admin może założyć konto bezpośrednio z karty zawodnika.',
      'Automatyczne obliczanie sumy dwuboju (rwanie + podrzut) w czasie rzeczywistym.',
      'Ikona konta przy nazwisku zawodnika posiadającego powiązane konto.',
      'SuperAdmin widzi w Panelu Admina przycisk przejścia do Panelu SuperAdmin.',
      'Nawigacja dostosowana do roli — SuperAdmin, Admin i Zawodnik widzą własne skróty.',
      'Adres klubu (ul. Konopnickiej 13) i godziny treningów widoczne w stopce i na stronie głównej.',
      'Przekierowanie /ranking → /zawodnicy (strony zostały połączone).'
    ],
    type: 'feature'
  },
  {
    version: 'v1.1.0',
    date: '30 Kwi 2026',
    title: 'Wielka Aktualizacja Funkcjonalności',
    features: [
      'Dodano zupełnie nowe Dashboardy dla Administratorów i Superadministratorów.',
      'Dodano globalny Changelog wewnątrz panelu, aby informować o nowościach.',
      'Utworzono systemowy Kalendarz Wydarzeń i Zawodów.',
      'Zaimplementowano publiczny Blog klubu z wpisami informacyjnymi.',
      'Dodano nowy publiczny Ranking wszystkich zawodników na podstawie wyników.',
      'Wdrożono zaawansowane zarządzanie autoryzacją i prawami w API i Frontendzie.'
    ],
    type: 'feature'
  },
  {
    version: 'v1.0.1',
    date: '17 Kwi 2026',
    title: 'Poprawki stabilności logowania',
    features: [
      'Rozwiązano problemy z przekierowaniami przy logowaniu.',
      'Zaktualizowano JWT Tokens aby unikać przypadkowego wylogowania po czasie.',
      'Ulepszono UI formularza logowania - wprowadzono responsywne błędy i powiadomienia toast.'
    ],
    type: 'bugfix'
  },
  {
    version: 'v1.0.0',
    date: '10 Kwi 2026',
    title: 'Uruchomienie Systemu',
    features: [
      'Stworzenie i migracja bazy danych Turso.',
      'Podstawowe zarządzanie wynikami i zawodnikami.',
      'Backend gotowy pod hostowanie na platformie Shuttle.'
    ],
    type: 'release'
  }
]
</script>

<template>
  <UContainer class="py-8 md:py-14 lg:py-16">
    <div class="mb-8">
      <div class="flex items-center gap-2 mb-2">
        <UIcon
          name="i-lucide-file-text"
          class="size-5 text-primary"
        />
        <p class="text-sm font-medium uppercase tracking-wider text-primary">
          Administracja
        </p>
      </div>
      <h1 class="text-3xl font-bold tracking-tight text-highlighted">
        Changelog (Dziennik Zmian)
      </h1>
      <p class="mt-2 max-w-2xl text-muted">
        Bądź na bieżąco z najnowszymi aktualizacjami w systemie zarządzania klubem CKS Slavia.
      </p>
    </div>

    <div class="space-y-8 max-w-4xl">
      <UCard
        v-for="(update, index) in updates"
        :key="index"
        class="relative overflow-hidden border-l-4"
        :class="{
          'border-l-primary': update.type === 'feature',
          'border-l-yellow-500': update.type === 'bugfix',
          'border-l-blue-500': update.type === 'release'
        }"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
              {{ update.version }}
            </span>
            <h3 class="text-xl font-bold text-highlighted">
              {{ update.title }}
            </h3>
          </div>
          <p class="text-sm text-muted mt-2 sm:mt-0 font-medium">
            {{ update.date }}
          </p>
        </div>

        <ul class="space-y-2 text-muted">
          <li
            v-for="(feature, fIndex) in update.features"
            :key="fIndex"
            class="flex items-start gap-2"
          >
            <UIcon
              name="i-lucide-check-circle-2"
              class="size-5 text-emerald-500 shrink-0 mt-0.5"
            />
            <span>{{ feature }}</span>
          </li>
        </ul>
      </UCard>
    </div>
  </UContainer>
</template>
