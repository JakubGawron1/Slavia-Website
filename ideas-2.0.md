# Slavia — Ideas 2.0

> **Data:** 2026-06-11 (akt. 2.300) · **Zakres:** ~300 propozycji dla ekosystemu Slavia  
> **Repozytoria:** `Slavia-frontend` · `Slavia-backend` · `Slavia-mobile` · `Slavia-shared`  
> **Relacja do `ideas.md`:** ten plik to **świeży katalog** z naciskiem na opis wartości i podział repo/rola. Numery **2.001–2.300** nie kolidują z bankiem 1–10150 w `ideas.md`.

---

## Legenda

| Skrót | Znaczenie |
|-------|-----------|
| **PUB** | Strony publiczne (bez logowania) |
| **ZAW** | Zawodnik (`/athlete/**`) |
| **TRE** | Trener (`/trainer/**`) |
| **ADM** | Administrator klubu (`/admin/**`) |
| **SUP** | SuperAdmin (`/superadmin/**`) |
| **ALL** | Wszystkie role / wspólne |

Priorytety w ticketach: `[FE-2.042]` frontend, `[BE-2.087]` backend, `[MO-2.128]` mobile, `[SH-2.156]` shared, `[XR-2.180]` cross-repo.

---

## Spis treści

1. [Slavia-frontend](#1-slavia-frontend)
2. [Slavia-backend](#2-slavia-backend)
3. [Slavia-mobile](#3-slavia-mobile)
4. [Slavia-shared](#4-slavia-shared)
5. [Cross-repo i ekosystem](#5-cross-repo-i-ekosystem)  
6. [Rozszerzenie katalogu 2.201–2.300](#6-rozszerzenie-katalogu-2201300)

---

## 1. Slavia-frontend

### 1.1 Publiczne (PUB)

**2.001 — Interaktywna mapa sukcesów klubu**  
Wizualizacja na stronie głównej: mapa Polski z pinezkami startów zawodników Slavii w bieżącym sezonie. Kliknięcie w region pokazuje listę wyników i link do profili. Buduje narrację klubu bez ręcznej edycji CMS.

**2.002 — Tryb „Gość zawodów” na `/kalendarz`**  
Uproszczony widok kalendarza bez logowania: tylko nadchodzące starty klubu, filtr MP/liga, przycisk „Dodaj do kalendarza”. Przydatne dla rodziców i kibiców.

**2.003 — Porównywarka zawodników z udostępnialnym linkiem**  
Na `/zawodnicy/porownanie` generowanie krótkiego URL z wybranymi slugami. Odbiorca widzi ten sam zestaw wykresów Sinclair/total bez konieczności odtwarzania filtrów.

**2.004 — Wersja drukowana rankingu**  
Przycisk „Drukuj” na `/zawodnicy` — stylesheet `@media print` z logo klubu, datą generacji i legendą kolumn. Do zebrań zarządu bez eksportu do Excela.

**2.005 — Podgląd „jak wygląda profil” przed publikacją**  
Dla kadry edytującej zawodnika: modal pokazujący publiczną wizytówkę `/athlete/[slug]` zanim `is_public` zostanie włączone.

**2.006 — Galeria z tagami wydarzeń**  
Filtrowanie zdjęć po konkretnym zawodach lub roku. Tagi powiązane z wpisami kalendarza — mniej ręcznego opisywania albumów.

**2.007 — Sekcja FAQ dynamiczna z CMS**  
Blok accordion na stronie kontaktowej i rekrutacyjnej, edytowalny z panelu CMS. Odpowiedzi na powtarzające się pytania o składki, godziny treningów, zapisy.

**2.008 — Kalkulator „czy warto startować wyżej”**  
Rozszerzenie `/proporcje`: symulacja zmiany kategorii wagowej i wpływu na proporcje bojów. Edukacja przed ważeniem.

**2.009 — Strona „Dołącz do klubu” z formularzem lead**  
Landing z krótkim opisem sekcji, CTA do kontaktu i opcjonalnym formularzem (imię, wiek, doświadczenie). Leady trafiają do `/admin/kontakt-wiadomosci`.

**2.010 — Open Graph per wpis aktualności z szablonem**  
Automatyczne generowanie obrazka OG (tytuł + data + logo) gdy wpis nie ma zdjęcia wyróżniającego — lepsze udostępnienia na Facebooku.

---

### 1.2 Zawodnik (ZAW)

**2.011 — Centrum zadań „Do zrobienia dziś”**  
Jeden widget na dashboardzie agregujący: nieprzeczytany czat, zaległa składka, nieuzupełniony dziennik z wczoraj, zbliżający się start za 48 h. Priorytetyzacja bez przeklikiwania modułów.

**2.012 — Diff planu po aktualizacji**  
Gdy trener zmieni plan, zawodnik widzi podświetlone różnice: nowe serie, zmienione %, usunięte ćwiczenia. Mniej nieporozumień na sali.

**2.013 — Szybkie „wykonane jak w planie”**  
Przy jednostce dziennika jeden gest: zatwierdzenie wszystkich serii zgodnie z planem bez otwierania modala edycji (PATCH quick-complete).

**2.014 — Timer przerwy między seriami**  
W module dziennika opcjonalny countdown 90–180 s z wibracją i ekranem nie gaszącym się. Tryb „na pomostcie”.

**2.015 — Osobista ściana rekordów**  
Wizualizacja PB w rwaniu, wyciskaniu i totalu z datami i kontekstem (zawody vs trening). Inspiracja bez wchodzenia w publiczny ranking.

**2.016 — Notatka głosowa do wpisu dziennika**  
Nagranie 30 s komentarza po treningu (Web Audio API), opcjonalnie transkrypcja lokalna. Trener słucha zamiast czytać długi tekst.

**2.017 — Mapa progresu Sinclair — 12 miesięcy**  
Wykres liniowy z zaznaczonymi startami i PR. Tooltip z linkiem do wpisu w osi czasu.

**2.018 — Ulubione szablony mikro-jednostek**  
Zawodnik zapisuje własne szablony (np. „technika + siła”) i wstawia je do dziennika jednym kliknięciem.

**2.019 — Powiadomienie o komentarzu trenera z cytatem**  
Push/in-app z fragmentem wiadomości trenera do wpisu dziennika — od razu wiadomo, o co chodzi.

**2.020 — Karta startowa PDF**  
Eksport: imię, kategoria, data ważenia, historia ostatnich startów, kontakt klubu. Do lekarza sportowego lub organizatora.

**2.021 — Tryb „pierwszy start” — przewodnik krok po kroku**  
Checklist: dokumenty, strój, rozgrzewka, strategia prób. Widoczny tylko przy pierwszym przypisanym starcie w sezonie.

**2.022 — Integracja nastroju po treningu**  
Skala 1–5 emoji + opcjonalna notatka. Dane widoczne dla trenera w module regeneracji — wczesne sygnały przeciążenia.

**2.023 — Porównanie z własnym średnim RPE**  
Przy wpisywaniu dziennika podpowiedź: „Ten tydzień: średnie RPE 8,2 — wyżej niż zwykle”.

**2.024 — Skrót „zapytaj trenera o technikę”**  
Szablon wiadomości w czacie z załączonym linkiem do nagrania (YouTube/Drive) lub ostatniej analizy toru.

**2.025 — Widget „następne 3 jednostki planu”**  
Kompaktowa lista na mobile i desktop bez wchodzenia w pełny kalendarz planów.

**2.026 — Historia wag i kategorii**  
Oś czasu ważeń oficjalnych i samodzielnych wpisów z przewidywaną kategorią na podstawie `pzpc-weight-classes.json`.

**2.027 — Filtr osi czasu: zawody / trening / obecności**  
Jeden przełącznik na `/athlete/timeline` zamiast przełączania modułów.

**2.028 — Eksport miesiąca do CSV**  
Dziennik + starty + składki w jednym pliku do własnych analiz w Excelu.

**2.029 — Streak frekwencji z odznaką**  
Licznik kolejnych treningów z obecnością lub wpisem dziennika. Mikro-grywalizacja bez presji rankingowej.

**2.030 — Podgląd planu offline (PWA)**  
Cache ostatniego planu w Service Worker — dostęp na sali przy słabej sieci.

**2.031 — Udostępnianie odznaki jako grafika**  
Generator PNG z brandingiem klubu po odblokowaniu badge — share do Instagram Stories.

**2.032 — Przypomnienie o badaniu lekarskim**  
Jeśli data ważności w profilu — baner 30 i 7 dni przed wygaśnięciem.

**2.033 — Kalkulator „ile na sztangę dziś”**  
Suma zaplanowanych ciężarów z bieżącego tygodnia planu — pomoc przy pakowaniu talerzy.

**2.034 — Tryb dużej czcionki tylko w dzienniku**  
Ustawienie per moduł bez psucia reszty UI — ważne na sali w rękawiczkach.

**2.035 — Lista „rzeczy do zrobienia” integrująca moduły**  
Składka + nieprzeczytane + brak wpisu wczoraj + deklaracja startowa — jeden widok.

---

### 1.3 Trener (TRE)

**2.036 — Inbox dzienników „wymaga reakcji”**  
Filtr wpisów bez komentarza trenera, sortowanie po dacie i RPE. Skrót do codziennego przeglądu kadry.

**2.037 — Widok „plan vs wykonanie” tygodnia**  
Tabela: zaplanowane serie vs wpisane w dzienniku, procent realizacji per zawodnik. Bazuje na istniejącym porównaniu — rozszerzenie na całą grupę.

**2.038 — Masowe przypisanie planu szablonu**  
Wybranie szablonu tygodnia i listy zawodników — jedna operacja zamiast N kliknięć.

**2.039 — Alert „plateau” per zawodnik**  
Wizualna flaga gdy total/Sinclair nie rośnie od X tygodni (konfigurowalny próg). Sugestia deloadu, nie automatyczna zmiana planu.

**2.040 — Heatmapa obecności grupy**  
Macierz zawodnik × tydzień z kolorami frekwencji. Szybka identyfikacja osób zaniedbujących treningi.

**2.041 — Szablony wiadomości czatu**  
„Przypomnienie o składce”, „Gratulacje za PR”, „Prośba o uzupełnienie dziennika” — wklejanie jednym kliknięciem.

**2.042 — Podgląd obciążenia tygodnia (tonaż)**  
Przy budowaniu planu suma kg×powtórzenia per dzień z ostrzeżeniem przy skoku >20% vs poprzedni tydzień.

**2.043 — Karty ćwiczeń drag-and-drop w planie**  
Wizualne karty z ikoną i tagami (siła/technika) zamiast suchej listy selectów w `TrainingPlanBuilder`.

**2.044 — Command Palette wyboru zawodnika**  
Ctrl+K w module planów: szybkie przypisanie planu po wpisaniu fragmentu imienia.

**2.045 — Batch approve ćwiczeń dodatkowych**  
Zaznaczenie wielu zgłoszeń i zatwierdzenie/odrzucenie z jedną notatką zwrotną.

**2.046 — Eksport listy startowej na zawody**  
CSV/PDF: imię, kategoria, ostatni total, kontakt — do przekazania organizatorowi.

**2.047 — Notatka „poufna kadry” przy zawodniku**  
Pole widoczne tylko dla trenerów/adminów (kontuzja, sytuacja rodzinna). Nie w profilu publicznym.

**2.048 — Porównanie dwóch zawodników side-by-side**  
W module monitoring: wykresy Sinclair, frekwencja, RPE obok siebie — przy doborze składu na zawody.

**2.049 — Harmonogram „kto trenuje dziś”**  
Lista zawodników z planem na bieżący dzień i statusem wpisu dziennika (zrobione / brak).

**2.050 — Import planu z Trenera AI z podglądem diff**  
Przed zapisem planu wygenerowanego przez AI — podgląd zmian względem obecnego tygodnia.

**2.051 — Skrót „kto nie zapłacił” z akcją przypomnienia**  
Z listy składek: wysłanie szablonu czatu do zaznaczonych zawodników (z potwierdzeniem).

**2.052 — Grupowanie zawodników treningowych**  
Tagi grup (np. „seniorzy”, „młodzież U17”) do filtrowania list, planów i raportów.

**2.053 — Raport tygodniowy PDF dla zawodnika**  
Trener generuje podsumowanie: realizacja planu, komentarze, cele na następny tydzień — do wysłania lub pobrania przez zawodnika.

**2.054 — Widok gęsty (compact) listy zawodników**  
Przełącznik karty ↔ tabela na laptopie — 15–20 osób na ekranie.

**2.055 — Breadcrumbs w głębokich trasach planów**  
`Plany / Zawodnik X / Tydzień 12 / Środa` — orientacja w złożonym UI.

---

### 1.4 Administrator klubu (ADM)

**2.056 — Harmonogram publikacji aktualności**  
Ustawienie daty/godziny publikacji wpisu — widoczny dopiero po czasie (z backendem scheduled publish).

**2.057 — Wersjonowanie treści CMS z diff**  
Podgląd zmian między wersjami strony przed przywróceniem z historii.

**2.058 — Moderacja komentarzy pod aktualnościami**  
Jeśli komentarze publiczne — kolejka do zatwierdzenia przez admina.

**2.059 — Szablony ogłoszeń**  
„Odwołanie treningu”, „Zbiórka składek”, „Wyniki zawodów” — predefiniowane bloki Markdown.

**2.060 — Statystyki ruchu na stronie publicznej**  
Integracja z Plausible/Umami (privacy-friendly): top strony, źródła wejść — widget w panelu admina.

**2.061 — Zarządzanie banerem alertowym**  
Jeden globalny pasek (np. „Dziś trening przeniesiony na 18:00”) z datą wygaśnięcia i kolorem priorytetu.

**2.062 — Eksport listy członków dla PZPC**  
Formularz z polami wymaganymi przez związek — walidacja przed eksportem CSV.

**2.063 — Podgląd mobile viewport w CMS**  
Split view: edycja treści + iframe z szerokością telefonu bez wychodzenia z panelu.

**2.064 — Galeria: upload wsadowy z metadanymi**  
Przeciągnięcie wielu zdjęć z jednym tagiem wydarzenia i datą.

**2.065 — Changelog z tagami per rola**  
Wpisy oznaczone `[Zawodnik]` `[Trener]` — filtrowanie na `/admin/changelog`.

**2.066 — Inbox kontaktowy z przypisaniem**  
Delegowanie wiadomości z formularza do konkretnego trenera/admina ze statusem „w toku / zamknięte”.

**2.067 — Konfigurator sekcji strony głównej**  
Włącz/wyłącz sekcje (ranking, aktualności, wyzwania) bez edycji kodu — przez CMS lub flagi.

**2.068 — Raport miesięczny klubu jednym klikiem**  
PDF: frekwencja, składki, nowi zawodnicy, wyniki — z `DashboardMonthlySummary` rozszerzone o eksport.

**2.069 — Zarządzanie dokumentami klubowymi**  
Repozytorium PDF (regulamin, RODO, cennik) z wersjami i datą obowiązywania.

**2.070 — Powiadomienie masowe z segmentacją**  
Wysyłka do: wszyscy / tylko zaległe składki / tylko grupa U17 — z podglądem liczby odbiorców.

---

### 1.5 SuperAdmin (SUP)

**2.071 — Sandbox feature flag per użytkownik**  
Włączenie eksperymentalnej funkcji dla jednego konta testowego bez globalnego rolloutu.

**2.072 — Porównanie metryk Leapcell vs Render**  
Dashboard latency i error rate per provider — decyzja o domyślnym backendzie.

**2.073 — Dry-run importu zawodników**  
Symulacja importu CSV bez zapisu — raport błędów i duplikatów linia po linii.

**2.074 — Harmonogram maintenance mode**  
Planowana przerwa techniczna z banerem na stronie publicznej i blokadą logowania od–do.

**2.075 — Audit diff dla zmian uprawnień**  
Przy wpisie audytu roli — widok „było / jest” zamiast surowego JSON.

**2.076 — Health dashboard wszystkich workerów**  
Składki scheduler, sync wyników, FCM — status ostatniego uruchomienia i liczba błędów.

**2.077 — Konfiguracja limitów AI per rola**  
Osobne limity tokenów/dzień dla zawodnika vs trenera w panelu developera.

**2.078 — Backup bazy jednym klikiem (dev/staging)**  
Pobranie snapshotu SQLite z potwierdzeniem i logiem w audycie.

**2.079 — Generator raportu zgodności RODO**  
Lista endpointów zwracających PII, retention policy, ostatni eksport danych — checklist dla audytu.

**2.080 — A/B test copy na stronie logowania**  
Dwa warianty tekstu powitalnego z pomiarem konwersji logowania (feature flag).

---

## 2. Slavia-backend

### 2.1 API i dane (ALL)

**2.081 — Endpoint agregatów tygodniowych dla trenera**  
`GET /api/trainer/weekly-summary` — realizacja planów, frekwencja, średnie RPE per grupa. Mniej round-tripów z frontendu.

**2.082 — Webhooki wychodzące**  
Rejestracja URL dla zdarzeń: nowy wynik, zatwierdzona składka, nowy wpis dziennika. Integracja z Discord/Telegram bez custom kodu w Slavii.

**2.083 — Soft delete z okresem retencji**  
Zamiast twardego DELETE — `deleted_at` + job czyszczący po 30 dniach zgodnie z polityką retencji.

**2.084 — Idempotency-Key na krytycznych POST**  
Nagłówek `Idempotency-Key` dla składek, wyników, wpisów dziennika — bezpieczne ponowienie przy timeout.

**2.085 — Cursor-based pagination**  
Dla długich list (czat, audyt, wyniki) — `?cursor=` zamiast offsetów przy rosnących tabelach.

**2.086 — ETag na listach wyników i rankingu**  
Warunkowe GET `If-None-Match` — mniejszy transfer przy odświeżaniu mobile.

**2.087 — Walidacja PZPC z JSON shared**  
Kategoria wagowa z `pzpc-weight-classes.json` po stronie serwera przy zapisie zawodnika — jeden kontrakt z frontendem.

**2.088 — Batch endpoint zatwierdzania składek**  
`POST /api/payments/batch-approve` z listą ID i jedną notatką — transakcja SQLite.

**2.089 — Scheduled publish aktualności**  
Pole `publish_at` + worker ustawiający `is_published` o czasie.

**2.090 — Full-text search wiadomości czatu**  
Indeks FTS5 w SQLite dla treści wątków (z ACL — tylko uczestnicy).

**2.091 — Eksport danych użytkownika (RODO)**  
`GET /api/users/me/export` — ZIP z profilem, składkami, wpisami dziennika, czatem.

**2.092 — Rate limit per user, nie tylko IP**  
Dla zalogowanych — limit na `user_id` przy uploadach i AI.

**2.093 — Wersjonowanie planów treningowych**  
Historia zmian planu z możliwością przywrócenia tygodnia sprzed edycji.

**2.094 — Constraint grup treningowych**  
Tabela `athlete_groups` + many-to-many — backendowe filtrowanie list.

**2.095 — Notatki poufne kadry**  
Osobna tabela `coach_private_notes` z ACL tylko Trainer+.

**2.096 — Metryki Prometheus**  
Endpoint `/metrics` z licznikami requestów, latency histogram, queue depth workerów.

**2.097 — Health check z głębokością**  
`/health/ready` sprawdza DB + Turso + opcjonalnie Cloudinary — dla orchestratorów.

**2.098 — Argon2id z migracją z bcrypt**  
Rehash przy udanym logowaniu — wzmocnienie haseł bez resetu masowego.

**2.099 — Sliding window refresh tokenów**  
Przedłużenie sesji przy aktywności bez wyrzucania na login co godzinę.

**2.100 — Kaskadowe FK z audytem**  
Weryfikacja `ON DELETE CASCADE` + log w audycie przy usunięciu zawodnika z liczbą usuniętych rekordów potomnych.

---

### 2.2 Zawodnik — endpointy (ZAW)

**2.101 — Quick-complete wpisu dziennika**  
`PATCH /api/diary/entries/:id/quick-complete` — kopiuje serie z planu bez pełnego body.

**2.102 — Cel sezonu server-side**  
Przeniesienie celu z localStorage do DB — synchronizacja www ↔ mobile.

**2.103 — Streak frekwencji w profilu**  
Pole `attendance_streak` aktualizowane triggerem przy obecności/wpisie.

**2.104 — Powiadomienie o diff planu**  
Event przy zmianie planu generujący powiadomienie z listą zmienionych ćwiczeń.

**2.105 — Historia wag**  
`POST/GET /api/athletes/me/weight-log` — oś czasu z kategorią wyliczoną server-side.

---

### 2.3 Trener — endpointy (TRE)

**2.106 — Raport plateau**  
`GET /api/trainer/plateau-alerts` — lista zawodników bez poprawy wyniku od N tygodni.

**2.107 — Tonaż tygodnia w odpowiedzi planu**  
Pole `weekly_tonnage_kg` w JSON planu — obliczane przy zapisie.

**2.108 — Masowe przypisanie planu**  
`POST /api/training-plans/bulk-assign` — szablon + lista `athlete_id`.

**2.109 — Eksport listy startowej**  
`GET /api/trainer/roster/export?competition_id=` — CSV z kategoriami PZPC.

**2.110 — Segmentacja powiadomień**  
`POST /api/notifications/broadcast` z filtrem SQL (grupa, składka, rola).

---

### 2.4 Admin / SuperAdmin (ADM · SUP)

**2.111 — Scheduled maintenance flag**  
Tabela `system_flags` z `maintenance_until` — middleware zwraca 503 z komunikatem.

**2.112 — Feature flag per user**  
`user_feature_overrides` — sandbox dla beta testerów.

**2.113 — Dry-run import**  
`POST /api/superadmin/import/preview` — walidacja bez INSERT.

**2.114 — Audit export**  
`GET /api/system/audit-logs/export?format=csv` — dla compliance.

**2.115 — AI usage quotas**  
Tabela `ai_usage_daily` z limitami per rola — egzekwowane przed wywołaniem Groq.

---

## 3. Slavia-mobile

### 3.1 Zawodnik (ZAW)

**2.116 — Widget ekranu głównego (iOS/Android)**  
Najbliższy start, status składki, liczba nieprzeczytanych — bez otwierania apki.

**2.117 — Skróty aplikacji (App Shortcuts)**  
Długie przytrzymanie ikony: „Dodaj wpis dziennika”, „Skanuj QR obecności”, „Czat z trenerem”.

**2.118 — Offline kolejka dziennika**  
Zapis wpisu lokalnie przy braku sieci + sync z konfliktem „serwer wygrywa / zapytaj”.

**2.119 — Haptyka przy seriach**  
Lekka wibracja po dodaniu serii i po zakończeniu timera przerwy.

**2.120 — Tryb always-on podczas treningu**  
WKeepScreenOn w module dziennika — ekran nie gaśnie między seriami.

**2.121 — Nagrywanie notatki głosowej**  
30 s audio do wpisu — upload po zapisie z kompresją.

**2.122 — Pull-to-refresh wszędzie**  
Spójny gest odświeżania na dzienniku, czacie, składkach.

**2.123 — Grupowanie powiadomień**  
„Dzisiaj” / „Wczoraj” + zwijanie serii od tego samego źródła.

**2.124 — Dynamiczny App Bar (Sliver)**  
Zwijająca się belka na długich listach dziennika — więcej miejsca na treść.

**2.125 — Udostępnianie wyniku systemowym Share Sheet**  
Grafika Sinclair/PR przez `share_plus` zamiast kopiowania tekstu.

**2.126 — Biometria po 5 min nieaktywności**  
Rozmycie składek i danych wrażliwych — ponowne Face ID / odcisk.

**2.127 — Szybki wybór daty „Dzisiaj / Wczoraj”**  
Kafelki zamiast pełnego date pickera w 90% przypadków edycji dziennika.

**2.128 — Animacja mood przy RPE**  
Morph ikony twarzy przy suwaku 1–10 — feedback emocjonalny bez słów.

**2.129 — Kalendarz: ikona pucharu w dniu startu**  
Wizualne odróżnienie zawodów od treningu na kropce dnia.

**2.130 — Deep link z powiadomienia FCM**  
Tap w push → konkretny wątek czatu lub wpis dziennika (go_router).

---

### 3.2 Trener (TRE)

**2.131 — Inbox dzienników na mobile**  
Lista „do przejrzenia” z szybkim komentarzem bez wchodzenia w pełny profil zawodnika.

**2.132 — Push gdy zawodnik zgłosi wynik**  
Natychmiastowa informacja z linkiem do moderacji.

**2.133 — Zatwierdzanie składek z telefonu**  
Swipe approve/reject na liście miesiąca — jak poczta.

**2.134 — Skanowanie listy obecności**  
Widok „kto jest na sali” z odhaczaniem bez QR (trener-only).

**2.135 — Szablony odpowiedzi w czacie**  
Te same co na www — synchronizowane z backendem.

---

### 3.3 Wspólne mobile (ALL)

**2.136 — Shimmer skeletons**  
Placeholder przy ładowaniu list — eliminacja „pustego ekranu”.

**2.137 — Snackbar offline**  
Cienki pasek „Brak połączenia” bez blokowania całego UI.

**2.138 — IndexedStack w bottom nav**  
Zachowanie stanu zakładek przy przełączaniu — bez przeładowania korzenia.

**2.139 — Competition Mode z www**  
Parity wysokiego kontrastu — przełącznik w profilu (już częściowo — rozszerzyć na wszystkie ekrany).

**2.140 — Wersja minimalna przy starym API**  
Wymuszenie aktualizacji gdy backend zwraca `X-Min-App-Version`.

**2.141 — Lokalizacja PL/EN**  
`flutter_localizations` — przynajmniej kluczowe ekrany dla gości zagranicznych na zawodach.

**2.142 — Riverpod/Bloc testy widgetów**  
Pokrycie smoke flow: login → dziennik → zapis (obok jednego istniejącego testu).

**2.143 — Usunięcie legacy ekranów Admin/SA**  
Komunikat „użyj panelu w przeglądarce” zamiast `superadmin_athlete_manager_screen` itd.

**2.144 — Parity składek z www**  
Ten sam `paymentSemantics` z shared — kwoty, statusy, standing order.

**2.145 — Trener AI na mobile**  
Pełny wątek czatu z załącznikami wideo (z limitami jak BE) — parity z `/athlete/ai-coach`.

---

## 4. Slavia-shared

**2.146 — Dart: parity PZPC i proporcji**  
Port `pzpc-weight-classes.json` i logiki proporcji do `Slavia-shared/dart` — jeden test wektorowy TS ↔ Dart.

**2.147 — Design tokens JSON**  
`data/design-tokens.json` → generacja CSS variables (Nuxt) i `ThemeData` (Flutter) w CI.

**2.148 — Wspólny słownik copy UI**  
`data/ui-copy-pl.json` — klucze semantyczne składek, statusów wyników; `useSlaviaCopy` i mobile z jednego źródła.

**2.149 — Test vectors: plateaus i tonaż**  
`test-vectors/training-load.json` — przypadki brzegowe obliczeń obciążenia tygodnia.

**2.150 — OpenAPI diff w CI shared**  
Skrypt porównujący snapshot z poprzednim commitem — breaking change alert w PR.

**2.151 — Wspólny katalog ćwiczeń rozszerzony**  
`weightlifting-exercises.json` z tagami (siła/technika), linkami do wideo, grupą mięśniową.

**2.152 — Sinclair + wilks w jednym module**  
Opcjonalny Wilks dla porównań międzynarodowych — za flagą eksperymentalną.

**2.153 — Wersjonowanie schematów JSON**  
Pole `$schemaVersion` w każdym pliku `data/` — migracje przy bump.

**2.154 — Pakiet `@slavia/shared/validation`**  
Czyste funkcje: email, waga, powtórzenia, daty — używane w FE, BE (przez WASM/duplikat) i mobile.

**2.155 — Dokumentacja kontraktu w shared**  
`docs/contract.md` — które pole który endpoint; link z AGENTS.md.

---

## 5. Cross-repo i ekosystem

### 5.1 Integracje zewnętrzne (XR)

**2.156 — Google Calendar sync dwukierunkowy**  
OAuth + import/export wydarzeń klubowych (tylko odczyt dla zawodnika, pełny dla trenera).

**2.157 — Discord webhook dla ogłoszeń**  
Admin włącza URL — nowe ogłoszenie = embed na kanale klubu.

**2.158 — E-mail transakcyjny z szablonami Askama**  
Potwierdzenie składki, reset hasła, przypomnienie o zawodach — spójny HTML w BE, linki do www.

**2.159 — Integracja z LiveLift / OpenPowerlifting**  
Opcjonalny import wyników z zewnętrznych zawodów po ID zawodnika (manual match).

**2.160 — Stripe / Przelewy24 dla składek online**  
Płatność kartą z automatycznym `is_paid` — obok obecnego flow przelewu.

**2.161 — Cloudinary transformations w shared**  
Presety rozmiarów avatarów i galerii — jeden JSON, FE i BE używają tych samych nazw.

**2.162 — Sentry release tracking**  
Wersja z `package.json` / `Cargo.toml` jako release name — korelacja błędów z deployem.

---

### 5.2 AI i analityka (XR)

**2.163 — RAG nad regulaminem i FAQ**  
Trener AI odpowiada na pytania o składki i zasady z cytatem źródła CMS.

**2.164 — Podsumowanie tygodnia kadry przez AI**  
Cron + Groq: „3 zawodników z niskim RPE, 2 zaległe składki” — digest e-mail dla trenera.

**2.165 — Sugestia deloadu z reguł, nie tylko LLM**  
Reguły w shared (tonaż, RPE, streak) + opcjonalny komentarz AI — przewidywalność.

**2.166 — Anonimizacja przed wysłaniem do LLM**  
Strip PII z kontekstu AI coach — tylko metryki i ćwiczenia.

**2.167 — Feedback loop jakości AI**  
Thumbs up/down na odpowiedzi — zapis do audytu dla tuningu promptów.

---

### 5.3 DevEx, CI, jakość (XR)

**2.168 — Monorepo dispatch po push shared**  
Już częściowo — rozszerzyć o automatyczny `openapi:check` w PR wszystkich repo.

**2.169 — Contract test FE ↔ BE (Pact lub schemat)**  
Wybrane endpointy — test że odpowiedź pasuje do Zod/OpenAPI w CI frontendu.

**2.170 — Lighthouse CI na 5 trasach publicznych**  
`/`, `/zawodnicy`, `/logowanie`, `/aktualnosci`, `/kalendarz` — budżet LCP/CLS.

**2.171 — Mutacyjne testy Rust dla Sinclair/składek**  
`cargo-mutants` na modułach finansowych i punktowych.

**2.172 — Playwright: flow składka + dziennik**  
Rozszerzenie smoke o zalogowany happy path (fixture test user).

**2.173 — Preview deploy per PR**  
Vercel + Render preview z izolowaną bazą seed — QA przed merge.

**2.174 — Dokumentacja ADR**  
`docs/adr/` — decyzje architektoniczne (BFF, dual provider, CMS schema).

---

### 5.4 Społeczność i produkt (XR · role)

**2.175 — [PUB] Hall of Fame animowany**  
`/klub/rekordy` z animacją przy nowym PR — confetti + wpis do historii wersji rekordu.

**2.176 — [ZAW+TRE] Wyzwania z tonażem**  
Rozszerzenie `/klub/wyzwania` o kg×powtórzenia z dziennika, nie tylko liczba wpisów.

**2.177 — [ZAW] Rodzic/opiekun (read-only)**  
Rola `Guardian` — składki, frekwencja, kalendarz dziecka bez edycji wyników.

**2.178 — [TRE] Tablica sali (kiosk)**  
Tryb pełnoekranowy na tablecie: dzisiejszy plan grupy, QR obecności, timer.

**2.179 — [ADM] Sezon klubowy**  
Encja `season` — wyniki i rankingi filtrowane po sezonie zamiast tylko roku kalendarzowego.

**2.180 — [SUP] Multi-tenant przygotowanie**  
Kolumna `club_id` nullable + domyślny klub Slavia — fundament pod oddziały.

---

### 5.5 Bezpieczeństwo i compliance (XR)

**2.181 — CSP report-only → enforce**  
Stopniowe zaostrzanie `securityHeaders.ts` z raportowaniem naruszeń.

**2.182 — Sesje aktywne — unieważnianie**  
Lista urządzeń w profilu + „wyloguj wszędzie”.

**2.183 — 2FA TOTP dla trenerów i adminów**  
Opcjonalne wymuszenie przez flagę SuperAdmina.

**2.184 — Logowanie podejrzanych logowań**  
E-mail przy logowaniu z nowego kraju/UA (heurystyka).

**2.185 — Retencja czatu konfigurowalna**  
Admin ustawia N miesięcy — job archiwizacji zgodny z `polityka-retencji-danych.md`.

---

### 5.6 Sport-tech (XR)

**2.186 — [ZAW+TRE] VBT lite z wideo**  
Szacunek prędkości gryfu z istniejącej analizy toru — strefy %1RM.

**2.187 — [TRE] Adnotacje na klatkach wideo**  
Rysowanie linii/kątów na uploadzie — komentarz zwrotny dla zawodnika.

**2.188 — [PUB] Live scoreboard**  
Publiczny widok zawodów klubowych — aktualne podejście, światła białe/czerwone.

**2.189 — [ZAW] Porównanie toru A/B**  
Dwa nagrania zsynchronizowane po minimum trajektorii — overlay w `BarbellPathAnalyzer`.

**2.190 — [TRE] Biblioteka techniki z planem**  
Link do filmu przy ćwiczeniu w planie — jeden klik z widoku zawodnika.

---

### 5.7 UX i dostępność (XR)

**2.191 — i18n EN dla publicznego www**  
Nuxt i18n — ranking, aktualności, kalendarz; panele PL domyślnie.

**2.192 — WCAG audit checklist w developer**  
Automatyczny axe-core na wybranych stronach w `/superadmin/developer`.

**2.193 — Focus trap we wszystkich modalach**  
SlaviaModal + SlaviaEditorSheet — jeden composable `useFocusTrap`.

**2.194 — Reduced motion**  
`prefers-reduced-motion` wyłącza animacje page-transition i confetti.

**2.195 — Czytnik ekranu: tabele rankingu**  
`<caption>`, `scope="col"`, opisy dla ikon statusu.

---

### 5.8 Operacje klubu (XR · ADM · TRE)

**2.196 — Rezerwacja pomostów**  
Sloty czasowe + floor plan hali — mniej konfliktów o stanowiska.

**2.197 — Deklaracje startowe**  
Zawodnik zgłasza chęć startu — trener zbiera listę do wysłania organizatorowi.

**2.198 — Inventory sprzętu klubu**  
Rejestr sztang, klatek, platform — przypisanie rezerwacji do zasobu.

**2.199 — Wolontariat i dyżury**  
Harmonogram obsługi zawodów klubowych — zapisy zawodników na role (kawa, pomiar).

**2.200 — Raport PZPC roczny**  
Agregat licencji, wyników, kategorii — eksport zgodny ze strukturą związku (szablon konfigurowalny).

---

## 6. Rozszerzenie katalogu (2.201–2.300)

### 6.1 Frontend — publiczne i klub (PUB · ZAW)

**2.201 — [PUB] Kalendarz zawodów w formie listy „nadchodzące 30 dni”**  
Alternatywny widok obok siatki miesiąca: chronologiczna lista z dystansem do startu, miastem i linkiem do zapisów. Lepsze na mobile bez przewijania pustych tygodni.

**2.202 — [PUB] Embed rankingu na stronie partnera**  
Oficjalny widget iframe `/embed/ranking` z ograniczeniem domen (CORS + `X-Frame-Options`) — klub partnerski pokazuje aktualny top 10 bez ręcznej aktualizacji.

**2.203 — [PUB] Strona „Sponsorzy i partnerzy” z CMS**  
Logo, linki, poziomy wsparcia (złoty/srebrny). Sekcja buduje wiarygodność przy rekrutacji i na zawodach.

**2.204 — [PUB] Archiwum aktualności z filtrem roku**  
URL `/aktualnosci?rok=2024` — indeksowalne przez Google, mniej scrollowania w nieskończonej liście.

**2.205 — [PUB] Podgląd social share przed publikacją**  
W edycji wpisu admin widzi mock Facebooka/X z tytułem, opisem i obrazkiem OG — mniej rozczarowań po udostępnieniu.

**2.206 — [ZAW] „Wrapped” sezonu rozszerzony**  
Roczne podsumowanie: najcięższy boj, liczba treningów, najdłuższy streak, ulubione ćwiczenie z dziennika — grafika do share jak Spotify Wrapped.

**2.207 — [ZAW] Porównanie z poprzednim miesiącem na dashboardzie**  
Kafelki: total, Sinclair, frekwencja, RPE — strzałka ↑↓ i procent zmiany bez wchodzenia w wykresy.

**2.208 — [ZAW] Pinowanie ważnych ogłoszeń**  
Zawodnik przypina ogłoszenie na górze listy lokalnie — przypomnienie o zbiórce lub zmianie godzin.

**2.209 — [ZAW] Kalkulator prób na zawodach**  
Na karcie startu: wpisanie openera → sugestia 2. i 3. próby wg strategii procentowej (edukacyjna, bez gwarancji).

**2.210 — [ZAW] Tryb „gość na treningu próbnym”**  
Uproszczony onboarding jednorazowego użytkownika demo — checklist bez pełnej rejestracji (flaga SuperAdmin).

**2.211 — [ZAW] Śledzenie bólu (body map)**  
Interaktywny sylwetka: zaznaczenie strefy i skali 1–10. Historia widoczna dla trenera w regeneracji — wczesna interwencja.

**2.212 — [ZAW] Cele mikro: „ten tydzień 4 treningi”**  
Osobny od celu sezonu — krótkoterminowy pasek postępu z gratulacją po zaliczeniu.

**2.213 — [ZAW] Eksport osi czasu do iCal**  
Subskrypcja kalendarza osobistego: starty + przypisane jednostki planu — odświeżanie co tydzień.

**2.214 — [ZAW] Ulubieni zawodnicy (obserwowani)**  
Prywatna lista slugów — powiadomienie gdy obserwowany zrobi PR na publicznym rankingu (opt-in).

**2.215 — [ZAW] Moduł „przygotowanie do ważenia”**  
Checklist 48 h przed: nawodnienie, makro, sen — treści edytowalne przez trenera w CMS.

---

### 6.2 Frontend — trener i admin (TRE · ADM · SUP)

**2.216 — [TRE] Macierz „kto z kim trenuje”**  
Widok grup treningowych na osi czasu — unikanie konfliktów przy współdzielonym sprzęcie o tej samej godzinie.

**2.217 — [TRE] Szablon tygodnia z wariantami A/B/C**  
Jeden plan bazowy z wariantami objętości (deload / normal / peak) — przełącznik jednym kliknięciem przed kopiowaniem na zawodników.

**2.218 — [TRE] Komentarz głosowy w czacie (www)**  
Nagranie z mikrofonu w przeglądarce, max 60 s — dla szybkiej korekty technicznej po treningu.

**2.219 — [TRE] Dashboard „ryzyko kontuzji”**  
Agregat: wysokie RPE + niski sen + zgłoszenia bólu — lista zawodników do rozmowy (heurystyka, nie diagnoza).

**2.220 — [TRE] Eksport planu do PDF dla zawodnika**  
Czytelny układ tygodnia z % i notatkami — do wydruku lub wysłania na WhatsApp.

**2.221 — [TRE] Historia zmian planu per zawodnik**  
Timeline: kto (trener) zmienił co i kiedy — rozstrzyganie „nie dostałem nowego planu”.

**2.222 — [TRE] Widok „zawody za 7 dni”**  
Lista przypisanych startów z checklistą: waga, dokumenty, składka — per zawodnik status OK/brak.

**2.223 — [ADM] Workflow publikacji galerii**  
Szkic → recenzja → publikacja; drugi admin zatwierdza album przed widocznością publiczną.

**2.224 — [ADM] Harmonogram ogłoszeń ważnych**  
Ogłoszenie z `priority=high` + `visible_until` — automatyczne zejście z czerwonego banera.

**2.225 — [ADM] Statystyki formularza kontaktowego**  
Wykres: skąd leady (UTM), ile odpowiedzi w 24 h — bez Google Analytics na całej stronie.

**2.226 — [ADM] Zarządzanie banerem cookies RODO**  
Konfiguracja tekstu i kategorii zgód z panelu — zgodność bez deployu frontendu.

**2.227 — [ADM] Podgląd „jak wygląda mail”**  
Test szablonu potwierdzenia składki z danymi fikcyjnymi przed włączeniem wysyłki masowej.

**2.228 — [SUP] Porównanie wersji OpenAPI**  
W developer: diff embed vs snapshot shared — lista nowych/usuniętych tras przed release.

**2.229 — [SUP] Kill switch per moduł panelu**  
Oprócz flag nawigacji — globalne wyłączenie np. AI coach przy awarii Groq bez deployu.

~~**2.230 — [SUP] Symulator roli (impersonate read-only)**~~  
SuperAdmin podgląda panel jako zawodnik X bez logowania na jego konto — audytowany dostęp. *(wdrożone: `/superadmin/podglad-roli`, `useRolePreview`, baner read-only, audyt `role_preview_start`/`role_preview_end`; pełny panel przez `rolePreviewApiRewrite` — profil, dziennik, składki, plany, kalendarz, regeneracja, wyniki, ćwiczenia, oś czasu, Wrapped, Trener AI, **czat**, **powiadomienia**; UI read-only na formularzach zapisu.)*

**2.231 — [SUP] Metryki kosztu AI**  
Szacunek kosztu tokenów Groq per miesiąc z trendem — budżetowanie.

**2.232 — [SUP] Rejestr zmian konfiguracji**  
Każda zmiana feature flag, limitów, providera backendu — wpis w audycie z diff JSON.

**2.233 — [TRE] Drag-and-drop kolejności ćwiczeń w dniu**  
W `TrainingPlanBuilder` zmiana kolejności bloków bez usuwania i dodawania od nowa.

**2.234 — [TRE] Kopiuj dzień na inny dzień**  
„Skopiuj środę na piątek” w planie tygodnia — oszczędność czasu przy symetrycznych mikrocyklach.

**2.235 — [ADM] Moderacja zdjęć w galerii (EXIF strip)**  
Automatyczne usuwanie metadanych GPS z uploadów — prywatność zawodników na zdjęciach z sali.

---

### 6.3 Backend (BE)

**2.236 — [BE] Endpoint `GET /api/public/stats`**  
Agregaty publiczne: liczba zawodników, medale w sezonie, ostatni PR klubu — do hero strony głównej bez ujawniania PII.

**2.237 — [BE] Kolejka zadań w tle (job table)**  
Tabela `background_jobs` z retry i dead-letter — zamiast fire-and-forget przy e-mailach i eksportach.

**2.238 — [BE] Web Push subscription storage**  
Zapis endpointów VAPID per urządzenie — powiadomienia www równolegle do FCM.

**2.239 — [BE] Walidacja rozmiaru uploadu per typ**  
Różne limity: avatar 2 MB, galeria 10 MB, wideo AI 50 MB — jawne 413 z komunikatem.

**2.240 — [BE] API klucze dla integracji read-only**  
Długotrwały token dla partnera (ranking embed) z scope `public:read` i rotacją.

**2.241 — [BE] Obserwowani zawodnicy (follows)**  
Tabela `athlete_follows` — powiadomienie przy nowym wyniku obserwowanego (z limitami anty-spam).

**2.242 — [BE] Body map pain log**  
`POST /api/recovery/pain` — strefa, skala, data; agregat anonimowy dla trenera (heatmapa grupy).

**2.243 — [BE] Wersje dokumentów klubowych**  
`club_documents` z `effective_from` — frontend pokazuje aktualny regulamin z datą.

**2.244 — [BE] Deklaracje startowe**  
`competition_declarations` — zawodnik zgłasza, trener eksportuje listę do CSV.

**2.245 — [BE] Rezerwacje zasobów (pomosty)**  
`resource_bookings` ze slotami i konfliktem 409 przy podwójnej rezerwacji.

~~**2.246 — [BE] Impersonation audit**~~  
Osobny typ wpisu audytu przy podglądzie SA jako rola — kto, kogo, kiedy, jak długo. *(wdrożone wraz z #2.230 — kategoria `role_preview`, akcje start/end w `system_audit_logs`.)*

**2.247 — [BE] Partial index na aktywnych zawodnikach**  
`WHERE is_active = 1` na listach kadry — szybsze zapytania przy archiwalnych profilach.

**2.248 — [BE] Kompresja odpowiedzi Brotli**  
`tower_http::compression` z preferencją Brotli dla JSON >1 KB.

**2.249 — [BE] Structured logging correlation ID**  
Nagłówek `X-Request-Id` propagowany w logach i odpowiedzi — łatwiejszy support.

**2.250 — [BE] Seed deterministyczny dla E2E**  
Profil `E2E_SEED=1` tworzy stałych użytkowników testowych — stabilne Playwright bez losowych UUID.

**2.251 — [BE] Limit równoległych sesji**  
Maks. N aktywnych refresh tokenów per user — wylogowanie najstarszej przy przekroczeniu.

**2.252 — [BE] Export iCal subskrypcja**  
Token w URL `/api/calendar/:token.ics` — osobisty kalendarz zawodnika bez pełnego API w kliencie kalendarza.

**2.253 — [BE] Moderacja treści AI**  
Lista zablokowanych fraz przed wysłaniem do LLM; log prób naruszenia.

**2.254 — [BE] Agregat „club wrapped”**  
Endpoint generujący statystyki sezonu per zawodnik — cache 24 h, invalidacja przy nowym wyniku.

**2.255 — [BE] Geokodowanie adresów zawodów**  
Pole `lat/lng` przy wydarzeniu — mapa publiczna i „nawiguj” w mobile.

---

### 6.4 Mobile (MO)

**2.256 — [MO] Live Activity / Dynamic Island (iOS)**  
Odliczanie do startu lub timer przerwy między seriami na ekranie blokady.

**2.257 — [MO] Wear OS / Apple Watch companion**  
Szybki check-in obecności QR z nadgarstka; timer serii z haptyką.

**2.258 — [MO] Skanowanie kodu kreskowego suplementu**  
Opcjonalny moduł edukacyjny — skan EAN, notatka w dzienniku (bez rekomendacji medycznych).

**2.259 — [MO] Picture-in-picture dla wideo techniki**  
Odtwarzanie filmu instruktażowego w PiP podczas wpisywania dziennika.

**2.260 — [MO] Ciemny motyw per moduł**  
Osobno „ciemny tylko na sali” — AMOLED, wysoki kontrast, bez zmiany reszty apki.

**2.261 — [MO] Skanowanie paragonu składki**  
Zdjęcie dowodu wpłaty z OCR kwoty (on-device) — prefill formularza zgłoszenia.

**2.262 — [MO] Grupowy czat sekcji (opcjonalny)**  
Kanał „U20 mężczyźni” z moderacją trenera — ogłoszenia grupowe bez spamu 1:1.

**2.263 — [MO] Mapa dojazdu na zawody**  
Deep link Google Maps / Apple Maps z karty wydarzenia jednym tapnięciem.

**2.264 — [MO] Tryb „nie przeszkadzać” na treningu**  
Wyciszenie powiadomień niepilnych na 90 min po wejściu w moduł dziennika.

**2.265 — [MO] Synchronizacja motywu z systemem**  
`ThemeMode.system` jako domyślny — zgodność z iOS/Android dark mode.

**2.266 — [MO] Cache obrazów awatarów**  
`cached_network_image` z polityką TTL — mniej migania list przy scrollu.

**2.267 — [MO] Formularz zgłoszenia błędu ze screenshotem**  
Shake-to-report lub pozycja w menu — załącznik + logi wysyłane do endpointu support.

**2.268 — [MO] Powiadomienie o zbliżającym się treningu**  
Lokalne przypomnienie 2 h przed jednostką z planu (na podstawie ostatniego sync planu).

**2.269 — [MO] Parity: analiza toru sztangi**  
WebView lub port lite analizy — upload klipu z galerii telefonu, wynik jak na www.

**2.270 — [MO] Udostępnianie planu tygodnia**  
Share tekstu sformatowanego: pon–ndz z ćwiczeniami — do notatek lub druku.

**2.271 — [MO] Face ID przy otwarciu czatu**  
Opcjonalna dodatkowa warstwa — prywatność wiadomości na współdzielonym telefonie.

**2.272 — [MO] Landscape na tablecie trenera**  
Układ dwukolumnowy: lista zawodników + szczegóły — lepsze na iPadzie na zawodach.

**2.273 — [MO] Badge count na ikonie apki**  
Liczba nieprzeczytanych (czat + powiadomienia) — synchronizacja z FCM i lokalnym stanem.

**2.274 — [MO] Onboarding carousel po pierwszej instalacji**  
3 slajdy: składka, dziennik, QR obecności — pomijalny, raz na instalację.

**2.275 — [MO] Test integracyjny API z mock serverem**  
`integration_test` z lokalnym stubem — login i lista dziennika bez żywego backendu w CI.

---

### 6.5 Shared (SH)

**2.276 — [SH] `competition-strategy.json`**  
Szablony prób (opener 90%, 2. próba +5%) — wspólna logika kalkulatora www i mobile.

**2.277 — [SH] Wspólne enumy statusów**  
`PaymentStatus`, `ResultStatus`, `DiaryEntryStatus` — jeden plik TS + generacja do Dart `enum`.

**2.278 — [SH] Testy property-based (fast-check)**  
Sinclair, proporcje, PZPC — losowe wektory w Vitest z seedem w CI.

**2.279 — [SH] `injury-zones.json`**  
Słownik stref body map z ID stabilnymi między platformami.

**2.280 — [SH] Skrypt `pnpm shared:lint-json`**  
Walidacja schematu wszystkich `data/*.json` przed commitem w shared.

**2.281 — [SH] Wersja pakietu w odpowiedzi API**  
Nagłówek `X-Slavia-Shared-Version` — debug rozjazdu katalogów między FE a BE.

**2.282 — [SH] Dokumentacja każdego pliku data/**  
Krótki README per JSON: przeznaczenie, konsumenci (FE/BE/mobile), częstotliwość zmian.

**2.283 — [SH] Wspólny format daty w UI**  
`formatSlaviaDate()` w TS i Dart — „2 dni temu (18 czerwca)” spójnie wszędzie.

**2.284 — [SH] Katalog komunikatów błędów API**  
`error-codes.json` — kod maszynowy + domyślny tekst PL; tłumaczenia opcjonalnie.

**2.285 — [SH] Snapshot testy theme-presets**  
Regresja kolorów po edycji presetów — diff HEX w CI.

---

### 6.6 Cross-repo — produkt, AI, infra (XR)

**2.286 — [XR · ZAW] Program „ambasador klubu”**  
Punkty za polecenie nowego członka (kod referral) — ledger w BE, widok w profilu, wymiana na merch (manual admin).

**2.287 — [XR · TRE] Planowanie macrocyklu**  
Widok 12-tygodniowy z fazami (objętość/intensywność/konkuracja) — powiązanie wielu tygodni planów w jeden cykl.

**2.288 — [XR · ADM] Newsletter klubowy**  
Zbiór e-maili z zgody RODO; wysyłka digestu miesiąca z aktualnościami — integracja Resend/SendGrid.

**2.289 — [XR · PUB] Strona wyników na żywo z zewnętrznego API**  
Import wyników z platformy zawodów (jeśli dostępne API) — embed na `/zawody/[id]/live`.

**2.290 — [XR] Feature flags remote config**  
JSON z BE `/api/system/remote-config` — mobile i www bez wydania apki przy drobnych przełącznikach.

**2.291 — [XR] Chaos test dual provider**  
Skrypt przełącza Leapcell↔Render w dev i weryfikuje 10 krytycznych endpointów — runbook awarii.

**2.292 — [XR] Backup automatyczny Turso**  
Cron eksportu `.dump` do S3/R2 z retencją 30 dni — dokumentacja restore.

**2.293 — [XR] Status page publiczny**  
`status.slavia.pl` — uptime API, ostatni deploy, incydenty (Better Stack / Cachet).

**2.294 — [XR · ZAW] Integracja Strava (opcjonalna)**  
Import aktywności „other” jako uzupełnienie dziennika — tylko odczyt, wyłączalne w profilu.

**2.295 — [XR · TRE] Szablon deload week**  
Jeden klik: redukcja objętości o 40% w planie wszystkich zaznaczonych zawodników — reguły w shared.

**2.296 — [XR] Pen test checklist roczny**  
Dokument + tickboxy w SuperAdmin: OWASP top 10, dependency audit, próba IDOR na `athlete_id`.

**2.297 — [XR · ADM] Zarządzanie licencjami zawodniczymi**  
Data ważności licencji PZPC, alert przed wygaśnięciem, eksport listy do związku.

**2.298 — [XR · PUB] Schema.org dla zawodów**  
`SportsEvent` JSON-LD na stronie kalendarza — rich snippets w Google.

**2.299 — [XR] Runbook „nowy członek zarządu”**  
Checklist w docs: konta, role, szkolenie CMS, dostęp do składek — onboarding kadry bez ustnej tradycji.

**2.300 — [XR · ALL] Feedback NPS w aplikacji**  
Co kwartał jedno pytanie 0–10 + opcjonalny komentarz — agregat anonimowy dla zarządu klubu.

---

## Jak używać tego pliku

1. **Ticket:** `[FE-2.042] Tonaż tygodnia w planie` — numer + repo z prefiksu sekcji.  
2. **Priorytetyzacja:** najpierw pozycje z `improve.md` P0, potem Ideas 2.0 według roli.  
3. **Duplikaty:** przed implementacją sprawdź `ideas.md` (wyszukiwarka po słowach kluczowych).  
4. **Wdrożenie cross-repo:** zacznij od `Slavia-shared` + OpenAPI snapshot + jedna rola pilotażowa.

---

*Koniec katalogu Ideas 2.0 — 300 pozycji (2.001–2.300).*
