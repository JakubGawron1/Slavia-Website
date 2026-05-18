# Slavia — pomysły na rozwój (frontend + ekosystem)

Zbiór propozycji po przeglądzie kodu (`Slavia-frontend`, typy tras z `api.ts`, narzędzia eksperymentalne, backend w repozytorium Rust, aplikacja mobilna Flutter). Kolejność i realizacja według Waszej kadry. Numery **1–2300** są jednolite w całym pliku (banki **211–1000**, **1001–2000**, blok **2001–2300** wg ról z prefiksami **ZAW / TRE / ADM / SUP**). ~~Przekreślenie~~ oznacza pomysł uznany za zrealizowany (historycznie). Prefiksy **ZAW / TRE / ADM / SUP** = zawodnik / trener / admin klubu / SuperAdmin. Powoływanie się na numery w ticketach i changelogu.

---

## Produkt i doświadczenie użytkownika

1. **Onboarding po pierwszym logowaniu** — krótki checklist (profil, rola, pierwszy moduł) z możliwością pominięcia; szczególnie dla roli Athlete przy pierwszym wejściu w panel.
2. **Eksport rankingu na zebrania / SM** — CSV lub PDF z pozycją, imieniem, Sinclairem, totalem — osobno zawody vs trening jeśli dane są rozróżnialne (`kind`), z nagłówkiem wyjaśniającym kolumny.
3. **Jedna wyszukiwarka kontekstowa** — skrót z belki: zawodnik, konkurs z kalendarza, wpis aktualności; ograniczona do ról mających dostęp (bez wycieków tras admin-only).
4. **Spójne „ostatnie miejsce” w długich formularzach** — przy powrocie do modala edycji (np. zawodnik) opcjonalny scroll do pola, którym user się zajmował (localStorage lub hash).
5. **Publiczny /athlete/[slug]** — wizytówki SEO: strukturalne `JSON-LD` „Person”, automatyczny `og:image` z avatara zawodnika (gdy dostępny).

---

## Analiza toru sztangi (MoveNet, `BarbellPathAnalyzer`)

6. **Stabilniejszy „domyślny” onboarding w narzędziu** — krótka nakładka kroków: ustawienie kadru, dobór trybu śledzenia, przykład „idealnego” klipu 5–10 s (bez przeciążania pierwszego wejścia).
7. **Porównanie dwóch nagrań (A/B)** — ten sam lifting w dwóch plikach: nałożenie metryk (`barbellPathAnalysis`) obok siebie lub tryb synchroniczny po wyrównaniu czasu fazy najniżej.
8. **Eksport wyniku** — PNG lub krótki MP4/WebM z nakreślonym tor + listą komunikatów (do wysłania zawodnikowi lub social); opcjonalnie bez oryginału nagrania.
9. **Zapis analizy tylko lokalnie („sesje”)** — `IndexedDB` / localStorage: metryki + miniatura klatki dla trenera (bez backendu na start); przydatne do treningów tygodnia.
10. **Segmentacja faz (snatch / clean / jerk lub pull)** — uproszczony wykrywacz faz na bazie trajektorii (minima/maxima predkości lub wysokości), żeby metryki były „per faza”, nie dla całego klipu.
11. **Drugi pipeline modelu (A/B jakość)** — np. BlazePose/MediaPipe przy wysokiej rozdzielczości lub lekki model przy urządzeniach mobilnych; feature flag jak przy `barbell_plate_tracking`.
12. **Tryb „prywatność”** — opcjonalne rozmycie twarzy przed eksportem (Canvas 2D) przy udostępnianiu materiałów.
13. **Kalibracja skali „na sztangę”** — jeśli znany jest przybliżony średnica talerza lub długość gryfu, dopasowanie pikseli → metry przybliżone (edu, nie konkursowy pomiar).
14. **Lepszy UX przy długim przetwarzaniu** — szacowany czas, przycisk anuluj (już częściowo przez `analysisRunId` — rozważyć jawny przycisk i cleanup pamięci WebGL/tf).
15. **Dokumentacja techniczna dla kadry** — jedna podstrona / PDF: jakie są ograniczenia MoveNet (okluzje, kąty, FPS), jak nagrywać, co oznacza każdy komunikat z `buildBiomechanicalFeedback`.

---

## Składki i płatności

16. **Historia „przelewu stałego” w UI** — oś czasu: „auto-składka za 2026-04” z odnośnikiem lub opisem spójnym z `membership_payments`, widoczna dla zawodnika i zsynchronizowana z panelem trenera.
17. **Nadpłata / saldo** — przejrzysty widżet „przeniesione na kolejny miesiąc” przy obecnym flow zatwierdzania wpłat (jeśli logika lub notatki to obsługują — spięcie z UX).
18. **Powiadomienie przed „10.”** — spójność między `/profil` (lokalnie) a e-mailem / push (jeśli kiedykolwiek dodany centralny dispatcher).
19. **Panel trenera: skrót „kto bez wpłaty za bieżący miesiąc”** — jedna lista filtrowana z `/api/payments/overview` lub statusów (minimalny widok na dashboard lub składkach).

---

## Wyniki, zawody i trening

20. **Walidacja przy zgłaszaniu wyniku** — ostrzeżenie (bez twardej blokady) przy zerowym total lub nietypowych różnicach między rwaniem a podrzutem / ćwiczeniami dodatkowymi; przycisk „potwierdzam”.
21. ~~**Powiązanie wpisu konkursowego ze zgłoszeniem** — przy pending flow — czytelny status w timeline zawodnika (`/api/results/…`, submissions).~~ *(wdrożone: status w tytule osi czasu + lista „Ostatnie zgłoszenia” na panelu zawodnika.)*
22. ~~**Kalkulator Sinclair** (`/kalkulator-sinclair`) — przyciski „wpisz jako scenariusz rankingowy” przy edycji wyniku (tylko podgląd, bez auto-zapisu jeśli to ryzykowne prawnie).~~ *(wdrożone: link z kalkulatora do formularza zawodnika, zapis scenariusza z formularza, query `sinclair_bw`/`sinclair_total`.)*

---

## Kalendarz, obecności, integracje

23. ~~**Eksport wydarzenia do kalendarza** — ICS dla pojedynczego zawodów oraz — jeśli sensownie — dla serii jednostek treningowych.~~ *(wdrożone: eksport ICS w `/athlete/kalendarz` — bez eksportu w kalendarzu klubowym `/kalendarz`.)*
24. ~~**Check-in QR / kiosk** — stały kod QR dla kadry (druk, bez wygaśnięcia); zalogowany zawodnik skanuje w aplikacji mobilnej — obecność od razu `verified`.~~ *(wdrożone: `/api/attendance/qr-config`, skaner w menu mobile, panel QR na `/attendance`.)*

---

## Czat, powiadomienia, aktualności

25. **Wyszukiwarka po treści czatu** — po stronie wątku (filtrowanie lokalnie załadowanych wiadomości lub endpoint z zapytaniem, jeśli backend rozszerzony).
26. **Szablony komunikatów powtarzalnych** — dla kadry („przypominam składki do 10.”) wklejana do czatu lub powiadomień klubowych.
27. ~~**Changelog przyjazny użytkownikowi** — krótka struktura „dla zawodnika / trenera” (`/admin/changelog` lub publiczny fragment strony www).~~ *(wdrożone: `/admin/changelog`, skrót na profilu przy APK + link dla adminów.)*

---

## Wydajność i dostępność frontendu

28. **Dalszy podział kodu przy analizie sztangi** — już jest `defineAsyncComponent` dla `BarbellPathAnalyzer`; rozważyć osobny chunk dla `@tensorflow/tfjs` + modeli i dokument „pierwsze pobranie ~X MB”.
29. ~~**Przegląd `routeRules`** — ISR/SWR wyłączone przy trasach chronionych (już dobrze opisane w `nuxt.config`); cykliczny audyt nowych tras `noindex`.~~ *(wdrożone: checklista audytu w `/superadmin/developer` → sekcja Wydajność i SEO.)*
30. **Obrazy LCP na stronie głównej i galerii** — jawne rozmiary, `loading="lazy"` tam gdzie nie above-the-fold; opcjonalnie integracja ze zewnętrznym CDN obrazów.
31. ~~**Core Web Vitals** — prostą stronę superadmin/developer lub CI krok Lighthouse (tylko na `/`, `/logowanie` publicznych) jako regresyjny smoke.~~ *(wdrożone: PSI + wskazówki CWV w `/superadmin/developer`; CI Lighthouse — opcjonalnie dalej.)*

---

## Backend, dane, DevEx

32. **Indeksy pod listy** — m.in. `(athlete_id, status, …)` dla wyników i płatności miesiąc/status; potwierdzenie przez `EXPLAIN QUERY PLAN`.
33. **Idempotencja schedulerów** — jawny constraint lub jednoznaczny „UPSERT” przy auto-składce (`standing_order`), metryki w logach („ile pominięto duplikatów”).
34. ~~**Kontrakt API** — OpenAPI z Axum (lub utrzymywane ręcznie) → generacja typów TypeScript w CI (`PaymentStatusResponse` itd.).~~ *(skrypt `pnpm run openapi:types` + plik `app/types/generated/openapi.types.ts` ze `src/embed/openapi.json` backendu; przy rozłącznych repozytoriach regeneracja lokalnie / w monorepo CI.)*
35. **E2E krytycznych ścieżek** — Playwright: logowanie, zgłoszenie składki, przegląd profilu; rozszerzenie o 2FA i batch approve gdy są już w UI.
36. **Rate limiting** — domknięcie na kolejnych POST (zagłoszenia, upload, masa operacji kadry) dokumentowane przy endpointach.

---

## Bezpieczeństwo i zgodność

37. **Eksport danych na żądanie** — uproszczony self-service dla użytkownika (zakres: profil + składki + komunikacja), spójny z `docs/polityka-retencji-danych.md`.
38. ~~**Audit log dla admina** — czytelna lista z `/api/system/audit-logs` z filtrami (aktor, typ, data) bez wchodzenia tylko w dev tools.~~ *(pokrywa wdrożony widok audytu — patrz #51.)*

---

## Aplikacja mobilna i spójność kanałów

39. ~~**Parzystość ze stroną www** — ten sam semantyczny model składki (`has_standing_order`, `is_paid`, komunikaty), żeby uniknąć zgłoszeń „w apce inaczej niż na web”.~~ *(www: wspólny `app/utils/paymentSemantics.ts` + `useSlaviaCopy` na `/athlete` i `/athlete/skladki`; mobile — osobno.)*
40. **Offline-first przy obecnościach** — kolejka zapisu przy braku sieci i synchronizacja po powrocie (jeśli mobile ma moduł obecności).

---

## Inne warto rozważyć

41. ~~**Plany treningowe vs dziennik** — automatyczny podgląd „co było zaplanowane vs co wpisano” w jednym widoku dla trenera.~~ *(WWW: zakładka „Porównaj z planem” w dzienniku zawodnika + szybki link „Plan vs dziennik” na `/trainer/plany`.)*
42. **Regeneracja** — agregaty tygodniowe / alerty przy zaniżonym śnie kilka dni z rzędu (etycznie jako sugestie, bez „karać” UI).
43. **Import zawodników** (`/superadmin/import`) — rozszerzenie o walidację duplikatów imion + raport częściowego powodzenia linia po linii.
44. **Międzynarodowy język UI** — i18n (Nuxt `i18n`) na start EN dla publicznego www, PL pozostaje domyślne dla kadry — decyzja produktowa.
45. ~~**Powtarzalne zestawienia KPI klubu** — miesięczny e-mail/podsumowanie (frekwencja, składki pending, aktywni vs nieaktywni) generowane z istniejących endpointów.~~ *(wdrożone: `DashboardMonthlySummary` z API na dashboardach admin/trener/superadmin; e-mail — opcjonalnie dalej.)*

---

## Sekcja 46–70

46. **Porównanie A/B toru sztangi** — tryb side-by-side lub nałożenie dwóch analiz (np. rekord życiowy vs ostatnie podejście) z automatyczną synchronizacją momentu startu (przekroczenie progu $v_y$).
47. **IndexedDB dla analiz wideo** — zapisywanie samych metryk i miniatur analiz lokalnie w przeglądarce, aby zawodnik miał dostęp do historii swoich „torów” bez przesyłania plików na serwer.
48. **Eksport toru jako „Story/Post”** — generator grafiki/krótkiego klipu z naniesioną trajektorią i kluczowymi statystykami (V-max, wychylenie w poziomie) gotowy do udostępnienia w mediach społecznościowych.
49. ~~**Integracja Sinclair w formularzu wyników** — przycisk „Oblicz i wstaw” w formularzu zgłaszania wyniku; automatyczne pobranie wagi z profilu i przeliczenie punktów Sinclair na żywo.~~ *(wdrożone: podgląd na żywo + przycisk „Oblicz i wstaw” na `/athlete`.)*
50. **Walidacja PB (Personal Best)** — ostrzeżenie (soft-block) przy próbie zgłoszenia wyniku nierealistycznie wyższego (np. o 30%) od obecnego rekordu życiowego zapisanego w systemie.
51. ~~**[ZAKOŃCZONE] Audit Log UI dla Superadmina** — dedykowany widok w panelu administracyjnym Nuxt dla `/api/system/audit-logs` — kto, co i kiedy zmienił. Wyświetla przyjazne nazwy użytkowników zamiast UUID.~~
52. **Saldo i automatyczne przypomnienia** — widget z bieżącym stanem konta zawodnika w dashboardzie i automatyczne powiadomienie push/e-mail 8. dnia miesiąca dla osób z zaległościami.
53. ~~**Generowanie kontraktu API (OpenAPI)** — wdrożenie `utoipa` po stronie Rusta, aby automatycznie generować typy TypeScript i unikać błędów synchronizacji modeli danych między frontendem a backendem.~~ *(wdrożone: `/api/system/openapi.json` + embed w backendzie; generacja typów TS w CI — opcjonalnie dalej.)*
54. ~~**Idempotentne składki (Database level)** — unikalny constraint na parze `athlete_id + period` w tabeli płatności, zapobiegający duplikatom przy błędach sieciowych lub wielokrotnym uruchomieniu schedulera.~~ *(wdrożone: `UNIQUE INDEX idx_membership_payments_unique ON (athlete_id, month)`.)*
55. ~~**[ZAKOŃCZONE] System osiągnięć (Badges)** — wirtualne odznaki za staż, frekwencję oraz kamienie milowe Sinclaira i wyniki w bojach. Zawiera interaktywny modal z listą poziomów.~~
56. **Wsparcie dla klubów partnerskich (Multi-tenancy)** — przygotowanie architektury bazy danych pod obsługę wielu oddziałów Slavia lub innych klubów w ramach jednej instancji systemu.
57. **Personalizowane plany suplementacyjne** — prosty moduł w profilu zawodnika z zaleceniami od trenera, zintegrowany z powiadomieniami o porze przyjmowania suplementów.
58. **Integracja z Apple Health / Google Fit** — pobieranie danych o śnie i krokach do modułu regeneracji (Idea #42), aby lepiej szacować gotowość zawodnika do treningu (RPE vs dane obiektywne).
59. **Interaktywna tablica rekordów (Hall of Fame)** — dynamicznie aktualizowana lista rekordów klubu w podziale na kategorie wagowe, wiekowe i płeć, z filtrowaniem „Wszech czasów” vs „Bieżący rok”.
60. **Wideo-analiza z adnotacjami dla trenera** — narzędzie pozwalające trenerowi na rysowanie po klatkach wideo (linie, kąty, trajektorie) i przesyłania takich instruktaży zwrotnych do zawodnika przez system komentarzy.
61. **Moduł zawodów na żywo (Live Scoreboard)** — publiczny widok „na telebim” podczas lokalnych zawodów, pokazujący aktualne podejście, ciężar oraz wirtualną sygnalizację sędziowską (białe/czerwone światła).
62. **Automatyczne wykrywanie plateau** — algorytm ostrzegający trenera, jeśli zawodnik nie poprawił wyników w głównych bojach przez określony czas, sugerując potrzebę deloadu lub zmiany objętości.
63. **Klubowy Marketplace (Merch)** — prosty moduł do zamawiania odzieży klubowej, suplementów i akcesoriów, zintegrowany z systemem płatności i saldem zawodnika.
64. **Biblioteka wideo techniki** — baza krótkich filmów instruktażowych dla każdego ćwiczenia (np. *Snatch Pull*, *Power Jerk*), podpięta bezpośrednio pod nazwy ćwiczeń w planach treningowych.
65. **System rezerwacji pomostów** — grafik pozwalający uniknąć tłoku na sali treningowej; zawodnicy rezerwują konkretne sloty czasowe i stanowiska (pomosty) w kalendarzu.
66. ~~**Grupowe wyzwania (Community Challenges)** — grywalizacja dla całej społeczności, np. „Total Tonnage Challenge” — kto w danym miesiącu przerzuci łącznie najwięcej ton na treningach.~~ *(MVP www: `/klub/wyzwania` + `GET /api/challenges/monthly-training-sessions` — ranking wg **liczby wpisów dziennika** w miesiącu; tonnage po rozszerzeniu wpisów o objętość.)*
67. **Szybkie ankiety po-treningowe (RPE)** — wyskakujący widżet po zakończeniu sesji: „Jak oceniasz trudność (1–10)?” oraz „Czy odczuwasz ból?”, dla lepszej kontroli obciążeń przez trenera.
68. **Raporty dla Związku (PZPC)** — automatyczne generowanie dokumentacji, zestawień wyników i licencji w formatach wymaganych przez krajowy związek podnoszenia ciężarów.
69. ~~**Tryb „Competition Mode” (High Contrast)** — specjalny motyw graficzny o bardzo wysokim kontraście, zoptymalizowany pod ekrany mobilne używane w ostrym świetle na pomostach zewnętrznych.~~ *(mobile: przełącznik w profilu — lokalny preset wysokiego kontrastu na ciemnym tle.)*
70. **Bot powiadomień Telegram/Discord** — opcjonalna integracja wysyłająca najważniejsze ogłoszenia klubowe i przypomnienia o startach bezpośrednio na komunikatory zawodników.

---

## Nowe propozycje (Sport-Tech 2.0: 71–90)

71. **VBT (Velocity Based Training) Lite** — rozszerzenie analizy wideo o pomiar prędkości sztangi (m/s) w czasie rzeczywistym, pozwalające trenować na konkretnych strefach intensywności.
72. **Inteligentny Asystent Obciążeń** — algorytm sugerujący ciężary na dany trening na podstawie RPE, jakości snu i zmęczenia z ostatnich dni (Idea #42/67).
73. **Multi-cam Video Analysis** — synchronizacja dwóch nagrań z różnych kątów (np. przód i bok) w jednym widoku analizy dla pełnej diagnostyki techniki.
74. **Automatyczne faktury/potwierdzenia** — generowanie PDF z potwierdzeniem opłacenia składki członkowskiej natychmiast po zatwierdzeniu przez administratora.
75. **Integracja z wagami Smart** — automatyczny import masy ciała i % tkanki tłuszczowej (np. Withings, Garmin Connect) do profilu zawodnika.
76. **Mapa kontuzji i fizjoterapii** — interaktywny model ciała do zgłaszania dolegliwości i przesyłania zaleceń od klubowego fizjoterapeuty.
77. **Ranking „Progressor of the Month”** — automatyczne wyróżnianie osoby z największym przyrostem punktowym w Sinclairze w danym miesiącu.
78. **System lojalnościowy (Slavia Points)** — zbieranie punktów za frekwencję i pomoc w klubie, wymienialnych na zniżki w Marketplace (#63).
79. **Generator dyplomów i certyfikatów** — automatyczne tworzenie PDF za osiągnięcia, rekordy klubu lub udział w zawodach.
80. **Archiwum „Legendy Slavii”** — wirtualne muzeum klubu: stare zdjęcia, historyczne rekordy i sylwetki zasłużonych zawodników.
81. **Dostęp „Rodzic”** — ograniczony panel dla opiekunów niepełnoletnich zawodników (płatności, frekwencja, kalendarz).
82. **Analiza „Barbell Path Deviation”** — procentowe wyliczenie odchylenia toru sztangi od idealnej krzywej „S-curve” dla danej próby.
83. **Weight-cut Planner** — kalkulator bezpiecznego zbijania wagi przed zawodami (nawodnienie, dieta, progi wagowe).
84. **Analityka „Weak Link”** — analiza statystyczna wskazująca bój pomocniczy, który najbardziej ogranicza progres w rwaniu/podrzucie.
85. **Kiosk Mode (Tablet na sali)** — uproszczony interfejs na tablet ścienny do błyskawicznego check-in i wpisywania wyników.
86. **Bot Rekordów (Discord/Telegram)** — automatyczne powiadomienie na klubowy kanał, gdy zawodnik pobije swój PB w systemie.
87. **Integracja RFID/NFC** — oznaczanie obecności na treningu za pomocą zbliżeniowej karty klubowej lub breloka.
88. **Ankiety Mindset Tracker** — krótkie kwestionariusze dotyczące poziomu stresu przedstartowego i pewności siebie.
89. **Repozytorium badań lekarskich** — bezpieczne miejsce na dokumentację medyczną z systemem alertów o wygasających zaświadczeniach.
90. **Moduł „Sparing Partner”** — funkcja pozwalająca na wirtualne śledzenie postępów wybranego kolegi z klubu (motywacyjna rywalizacja).
91. **Rekonstrukcja 3D toru sztangi** — eksperymentalna funkcja wykorzystująca dwa nagrania (przód + bok) do stworzenia trójwymiarowego modelu ruchu w przestrzeni.
92. **Sinclair Live-Rank** — tablica wyników na żywo dla zawodów wewnętrznych, która przelicza punkty i pozycję w rankingu natychmiast po zatwierdzeniu podejścia.
93. **Radar Kontuzji (AI Predictive)** — analiza trendów (sen/regeneracja vs objętość) alarmująca trenera o wysokim ryzyku przetrenowania u danego zawodnika.
94. **Automatyczny Video Clipping** — narzędzie wykrywające start i koniec boju w długim nagraniu z treningu i automatycznie wycinające krótki klip do analizy.
95. **Notatki Głosowe Trenera** — możliwość nagrywania szybkich wskazówek audio zamiast pisania tekstu w dzienniku treningowym zawodnika.
96. **Centrum Edukacji Media Hub** — wewnętrzna sekcja z autorskimi filmami klubu, wywiadami i materiałami szkoleniowymi dotyczącymi techniki i suplementacji.
97. **System Banerów Sponsorskich** — zarządzanie logotypami sponsorów wyświetlanymi na publicznych rankingach i tablicach zawodów (wsparcie finansowania klubu).
98. **Attendance Streaks** — system nagradzający "pasma" regularnych treningów (np. 12 treningów z rzędu bez opuszczenia jednostki).
99. **Log Serwisowy Sprzętu** — monitorowanie zużycia i przeglądów gryfów, talerzy oraz pomostów (np. "Gryf nr 4 wymaga smarowania po 1000 seriach").
100. **Personalizowane Przypomnienia Suplementacyjne** — powiadomienia push dla zawodników o porze przyjęcia suplementów zgodnie z planem od trenera (#57).
101. **Lift Pose Comparison (Ghost Mode)** — nakładanie półprzezroczystego wideo "wzorcowej" techniki (lub własnego rekordu) na bieżącą analizę w celach porównawczych.
102. **Dynamiczny Generator Rozgrzewki** — automatycznie generowany zestaw ćwiczeń aktywacyjnych na podstawie planowanego treningu i zgłoszonych bólów (#76).
103. ~~**System Głosowań Klubowych** — demokratyczne ankiety dla członków klubu w sprawach organizacyjnych (np. wybór nowego sprzętu czy miejsca integracji).~~ *(wdrożone: API `/api/club-votes`, widget na panelu zawodnika, podsumowanie na dashboardach kadry.)*
104. ~~**Athlete Resume / Media Kit** — automatycznie generowany profil publiczny dla zawodników kadry (osiągnięcia, trendy PB, Sinclair) do wysyłki dla sponsorów.~~ *(WWW: profil `/athlete/...` — przyciski „Link (media / sponsor)” kopiują `?share=1`, w tym widoku także „Drukuj”; KPI z zawodów już publiczne.)*
105. **Wirtualne Zawody Międzyklubowe** — współdzielona tablica wyników z innymi klubami korzystającymi z platformy Slavia w celu zdalnej rywalizacji.
106. **Barbell Acceleration Profile** — szczegółowy wykres przyspieszenia sztangi w poszczególnych fazach ciągu i podrzutu (identyfikacja martwych punktów).
107. **QR Equipment Guide** — skanowanie kodu QR na maszynie lub gryfie, aby zobaczyć jego historię, wagę oraz wideo z instrukcją techniczną.
108. ~~**Automatyczne Podsumowanie Roku (Slavia Wrapped)** — generowana na koniec roku interaktywna statystyka dla każdego zawodnika (łączny tonaż, liczba PR-ów, frekwencja).~~ *(wdrożone: `/athlete/wrapped` — starty, tonaż, najlepszy total; frekwencja w rozszerzeniu.)*
109. **Multi-library Barbell Lab (Superadmin)** — [W REALIZACJI] Zaawansowany poligon do porównywania MediaPipe, TF.js i OpenCV w warunkach rzeczywistych.
110. **Auto-Calibration OpenCV** — automatyczne skalowanie pikseli na metry poprzez wykrywanie standardowej średnicy talerza (450mm) bez udziału użytkownika.

---

## Aplikacja mobilna (Flutter) — pomysły rozszerzeń (111–210)

111. ~~**Widget iOS / Android z najbliższym startem** — data, miasto, kategoria z `Moje starty` bez otwierania apki.~~ *(MVP: **Quick Actions** — podtytuł skrótu „Moje starty” aktualizowany o najbliższy / ostatni start po zalogowaniu; pełne widżety pulpitu — osobno natywnie.)*
112. ~~**Skróty Siri / Asystent Google** — „pokaż moje treningi w Slavia”, „otwórz czat z trenerem”.~~ *(wdrożone częściowo: `quick_actions` — czat, dziennik, kalendarz startów; pełna integracja Siri Shortcuts — dalej.)*
113. **Live Activities (iOS)** — odliczanie do ważenia lub rozpoczęcia zawodów z kalendarza.
114. **Tiles Wear OS** — skrót do dziennika treningów lub listy powiadomień na zegarku.
115. **Pełna parzystość motywów z WWW** — te same presety i tryb jasny/ciemny co `profil` na stronie.
116. **Deep linki uniwersalne** — `https://…/athlete/…` otwiera profil w aplikacji, jeśli zainstalowana (Android App Links / iOS Universal Links).
117. ~~**Udostępnianie wyniku jako grafika** — PNG z totalem i Sinclarem do Stories (jak pomysły www, ale natywny share sheet).~~ *(mobile: `ResultShareService` + przycisk na osi czasu zawodnika.)*
118. **Tryb „trening” (Focus / DND)** — jednym przyciskiem wyciszenie powiadomień poza alarmami i czatem klubowym.
119. **Lokalne szkice wpisów dziennika** — zapis offline przed synchronizacją przy słabej sieci na sali.
120. **Kolejka żądań offline** — ponawianie nieudanych PATCH/POST przy odzyskaniu sieci (obecności, dziennik).
121. ~~**Biometryczne odblokowanie** — Face ID / odcisk po wygaśnięciu sesji zamiast ponownego hasła przy każdym powrocie.~~ *(wdrożone: `BiometricGate` + `local_auth` w aplikacji mobilnej.)*
122. **PIN klubowy** — szybkie logowanie dla współdzielonego tabletu rodzinnego (dziecko zawodnika).
123. **Tryb kontrastu i rozmiaru czcionki** — osobno od systemu, dla treningu w pełnym słońcu.
124. **Wibracje i dźwięki UX** — konfigurowalne: wyłączenie haptyki przy każdym tapie.
125. **Zdjęcie z aparatu → załącznik do czatu** — kompresja i limit rozmiaru przed wysłaniem.
126. **Nagrywanie notatek głosowych** — plik audio do wątku z trenerem (jeśli backend/dysk pozwoli).
127. **Podgląd PDF z zawodów** — wbudowany viewer dla regulaminów z linków w ogłoszeniach.
128. **Mapy i nawigacja** — otwarcie miejsca zawodów w Google Maps / Apple Maps z karty startu.
129. ~~**Dodawanie startu do kalendarza urządzenia** — eksport ICS z ekranu szczegółów zawodów.~~ *(WWW: modal szczegółów na `/kalendarz` + istniejący eksport w `/athlete/kalendarz`; mobile: „Dodaj do kalendarza (.ics)” na liście „Moje starty” + `GET /api/system/calendar/export/{id}`.)*
130. ~~**Powiadomienia grupowane po typie** — „Slavia: czat”, „Slavia: klub” dla mniejszego szumu.~~ *(mobile: kanały Android `slavia_club` / `slavia_chat` wg `kind` w push.)*
131. **Ciche godziny powiadomień push** — nie budzić po 22:00 oprócz wiadomości oznaczonych pilnymi.
132. **Badge z liczbą nieprzeczytanych** — synchronizacja z API powiadomień i czatu.
133. **Szybki filtr zawodników** — po kategorii wagowej, płci, roku — rozszerzenie listy kadry.
134. **Porównanie dwóch zawodników (mobile)** — uproszczony widok jak `/zawodnicy/porównanie` na małym ekranie.
135. **Eksport listy startowej do CSV** — z ekranu przydziału zawodów (trener).
136. **Skan QR z zaproszenia** — jeśli klub generuje kody do wydarzeń lub profili.
137. **Tryb „gość” na demonstracji** — demo bez logowania z mockowanymi danymi na targach.
138. **Język aplikacji** — i18n: PL domyślnie, EN dla zawodników dwujęzycznych.
139. ~~**Duży przycisk „Zgłoś problem”** — zbiera wersję apki, model telefonu, ostatni błąd sieci (bez danych medycznych).~~ *(mobile: wielki przycisk w profilu → schowek z diagnostyką + otwarcie **szablonu GitHub** `mobile_bug.yml` — patrz #209; ostatni błąd zapisuje się m.in. przy błędzie listy startów / zapisu profilu.)*
140. **Log diagnostyczny (opcjonalny)** — eksport dla devów po zgodzie użytkownika.
141. ~~**Bezpieczne wylogowanie ze wszystkich urządzeń** — jeśli backend udostępni endpoint revokacji tokenów.~~ *(wdrożone: `POST /api/auth/logout-all`, `token_version` w JWT, przycisk na `/profil`; mobile wylogowuje się przy następnym żądaniu — bez osobnego przycisku w apce.)*
142. **Tryb oszczędzania danych** — mniejsze obrazy awatarów, wyłączone autopodglądy wideo w czacie.
143. **Automatyczne czyszczenie cache obrazów** — limit MB dla urządzeń z małą pamięcią.
144. **Android split APK / App Bundle** — optymalizacja rozmiaru pobrania per ABI (już częściowo przez Flutter).
145. ~~**Obsługa foldables** — układ dwukolumnowy na tablecie / składanym telefonie dla listy + szczegółów.~~ *(mobile: `ResponsiveTwoPane` + istniejący układ 2-kolumnowy w czacie; dalsze ekrany — stopniowo.)*
146. **Stylus / rysik** — adnotacje na zrzucie wykresu (eksport do PNG).
147. **Integracja ze schowkiem** — inteligentne wklejanie wagi/czasu z SMS od federacji (heurystyka).
148. **Powiadomienie lokalne „jutro start”** — zaplanowane na urządzeniu bez serwera, jeśli użytkownik włączy przypomnienie.
149. **Backup ustawień motywu** — eksport/import JSON dla przeniesienia na nowy telefon.
150. **Onboarding karuzela** — 3 ekrany: start, role, powiadomienia po pierwszej instalacji.
151. **Tooltipi i coach marks** — jednorazowe podpowiedzi przy nowych funkcjach (feature flags).
152. **Tryb jednej ręki** — przesunięcie FAB i dolnej nawigacji wyżej na dużych telefonach.
153. **Gest powrotu (Android predictive back)** — poprawne stosy routingu bez gubienia stanu formularzy.
154. **Obsługa odświeżenia tokenu** — bez wylogowania przy rotacji JWT, jeśli backend wystawi refresh.
155. **Certificate pinning (opcjonalnie)** — dla organizacji wymagających wyższego poziomu zaufania API.
156. **Szczegóły sesji treningowej w karcie** — rozwijana karta w dzienniku z metadanymi (czas trwania, RPE).
157. **Szablony wiadomości w czacie** — „Jestem spóźniony”, „Potrzebuję konsultacji” jednym tapnięciem.
158. ~~**Status „online” w czacie** — jeśli backend wyśle presence (bez naruszania prywatności — wyłączalne).~~ *(BE + WWW + mobile: `last_seen_at`, ping co 60s, badge „Na żywo”; flaga `chat_online_presence`.)*
159. ~~**Reakcje na wiadomości** — emoji potwierdzenia jak w Messengerze (wymaga API).~~ *(BE + WWW + mobile: `chat_message_reactions`, emoji 👍 ✅ 🔥 💪.)*
160. **Wątki przypięte** — stały dostęp do najważniejszego kontaktu trenera.
161. **Harmonogram powiadomień o składce** — lokalny reminder zsynchronizowany z datą z profilu WWW.
162. **Wykresy: eksport jako SVG/PNG** — udostępnienie postępu Sinclair z ekranu profilu.
163. **Tryb „tylko odczyt” dla kont rodzica** — osobna rola lub widok (parzysty z www gdy powstanie).
164. **Integracja z Apple Wallet / Google Wallet** — karta członkowska z QR identyfikatorem zawodnika.
165. **NFC tap-to-check-in** — jeśli klub wdroży tokeny przy wejściu na halę.
166. **Podgląd planu treningowego offline** — cache ostatnio pobranego planu na tydzień.
167. **Synchronizacja dwukierunkowa dziennika** — rozwiązywanie konfliktów przy edycji na dwóch urządzeniach.
168. **Mini gra „codzienna seria”** — delikatna grywalizacja frekwencji (etycznie, bez karania).
169. **Powiadomienie o nowym ogłoszeniu** — kategoria push dla ważnych ogłoszeń klubowych.
170. **Filtrowanie powiadomień w aplikacji** — tylko nieprzeczytane, tylko typ „wynik”.
171. **Masowe oznaczanie przeczytanych** — już częściowo; rozważyć undo przez snackbar.
172. **Powiązanie z Health Connect / HealthKit** — zapis treningu jako aktywność ogólna (bez fałszywych kalorii).
173. **Skrót „Zadzwoń do klubu”** — jeśli numer w konfiguracji marki / API.
174. **Tryb jasny w nocy na sali** — przełącznik „tymczasowy” bez zmiany ustawień konta.
175. **Animacje oszczędne** — redukcja motion zgodnie z `MediaQuery.disableAnimations`.
176. **Testy widżetów złotych proporcji** — snapshoty golden dla regresji UI kalkulatora.
177. **CI: `flutter analyze` + testy** — obowiązkowy krok dla gałęzi mobile.
178. **Wersjonowanie widoczne w „O aplikacji”** — semver + numer commita zgodnie z build.gradle.
179. **Kanał beta (Firebase App Distribution / Play Internal)** — dla kadry przed produkcją.
180. **Symulator tabletu w dokumentacji** — zrzuty ekranu 7″ i 10″ do sklepu.
181. **Dostępność VoiceOver / TalkBack** — opisy semantyczne dla wykresów (tekst alternatywny).
182. **Powiększenie dynamiczne** — `textScaleFactor` bez łamania layoutu kalkulatorów.
183. **Przypomnienie o aktualizacji** — już częściowo (`AppUpdateService`); ujednolicić copy z WWW.
184. **Tryb „screenshot block”** — opcjonalnie ukrycie wrażliwych danych medycznych przy zrzucie ekranu.
185. ~~**Szyfrowanie lokalnej bazy** — jeśli kiedyś przechowywane będą dane wrażliwe offline.~~ *(mobile: token i dane logowania w `flutter_secure_storage` — `SecureCredentialsStore`.)*
186. **Migracja SharedPreferences** — wersjonowany schemat przy zmianie kluczy motywu.
187. **Obsługa wielu kont** — przełącznik kont (trener rodzic + zawodnik) na jednym urządzeniu.
188. **Importer kontaktu z książki adresowej** — wklejenie telefonu trenera do notatek (tylko lokalnie).
189. **Integracja z kalendarzem systemowym — dwukierunkowo** — oznaczanie treningów jako „ukończone” po wpisie w apce.
190. **Limit rozmiaru załącznika** — komunikat przy przekroczeniu zanim wyśle się do API czatu.
191. **Transkrypcja głosowa** — lokalna (on-device) dla notatek po treningu.
192. **Tryb „podróż”** — wyłączenie automatycznego odtwarzania wideo w aktualnościach (data saver).
193. **Powiadomienie o nieprzeczytanej wiadomości po 24h** — lokalne przypomnienie (zgoda użytkownika).
194. **Porównanie tygodni treningowych** — prosty wykres słupkowy objętości z dziennika.
195. **Szablon wiadomości do administratora** — zgłoszenie błędu z preformatowanym szablonem.
196. **Obsługa Safe Area i notch** — audyt wszystkich ekranów na iPhone 14+/Dynamic Island.
197. **Podgląd markdown w ogłoszeniach** — jeśli treść z API zawiera MD (spójnie z WWW).
198. **Lint dla tłumaczeń** — brak twardych stringów PL w kodzie produkcyjnym przed release.
199. ~~**Flutter isolates dla ciężkich kalkulacji** — proporcje / Sinclair bez blokowania UI przy dużych zbiorach.~~ *(mobile: batch Sinclair przez `compute()` w `sinclair_compute.dart`.)*
200. **Crashlytics / Sentry** — produkcyjne zbieranie wyjątków z wersją builda.
201. ~~**Feature flags z backendu** — włączanie eksperymentalnych ekranów bez nowego APK.~~ *(wdrożone: API `/api/feature-flags`, flaga eksperymentalna `mobile_feature_flags_api` w katalogu superadmin.)*
202. ~~**Minimum SDK policy** — dokument: wspierane wersje Android/iOS vs funkcje (np. Live Activities).~~ *(wdrożone: `Slavia-mobile/docs/mobile-sdk-policy.md`.)*
203. **Polityka prywatności in-app** — link do dokumentu klubu i zgody na analitykę.
204. **Edukacja RODO** — krótki modal przy pierwszym logowaniu o celach przetwarzania.
205. **Szczegóły sesji sieciowej** — dev menu: czas odpowiedzi API (tylko build debug).
206. **Automatyczne logowanie po resetcie hasła** — deep link z maila do ustawienia hasła w WebView lub przeglądarce.
207. ~~**Obsługa split-screen Android** — resize bez crashy przy obracaniu i zmianie szerokości.~~ *(wdrożone: `resizeableActivity` + `configChanges` w `AndroidManifest`; testy manualne zalecane.)*
208. **Testy integracyjne login flow** — `integration_test` na emulatorze CI.
209. ~~**Szablon issue GitHub** — „Mobile bug” z polami: wersja, urządzenie, krok reprodukcji.~~ *(wdrożone: `.github/ISSUE_TEMPLATE/mobile_bug.yml` — powiązanie z UI zgłaszania w aplikacji: #139.)*
210. **Roadmapa publiczna** — synchronizacja wybranych numerów z tego pliku z changelogiem apki w sklepie.


## Bank pomysłów 211–1000 (frontend · backend · mobilka · platforma)

Uzupełnienie listy 1–210. Numery **211–1000** są ciągłe; kontynuacja w sekcji **## Bank pomysłów 1001–2000** poniżej (numery 1001–2000). Podział sekcji pomaga filtrować backlog.

### Frontend (Nuxt — www, panele ról, DevTools)

211. **FE — Skeleton / shimmer dopasowany do `wyników` — mniej layout shift przy hydracji.**
212. **FE — Prefetch tras powiązanych z `panelu trenera` po `IntersectionObserver` kart na liście.**
213. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `ustawień konta` (>300 wierszy).**
214. **FE — Tryb kompaktowy tabletkowy dla `kalendarza` — wyższa densyjność bez utraty dotykowych celów.**
215. **FE — Skróty klawiszowe (⌘/Ctrl) w `planu treningowego` — udokumentowane w `?` help overlay.**
216. **FE — Eksport widoku `wykresów` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
217. **FE — Porównanie „przed/po zapisem” w formularzu `obecności` — podświetlenie zmienionych pól.**
218. **FE — Story / Histoire dla izolowanego komponentu `płatności` — regresje wizualne.**
219. **FE — Test a11y (axe) dla ścieżki krytycznej `panelu admina` — brak krytycznych violations.**
220. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `importu danych` — LCP, INP.**
221. **FE — Skeleton / shimmer dopasowany do `rankingu` — mniej layout shift przy hydracji.**
222. **FE — Prefetch tras powiązanych z `galerii` po `IntersectionObserver` kart na liście.**
223. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `raportów PDF` (>300 wierszy).**
224. **FE — Tryb kompaktowy tabletkowy dla `zgłoszeń ćwiczeń dodatkowych` — wyższa densyjność bez utraty dotykowych celów.**
225. **FE — Skróty klawiszowe (⌘/Ctrl) w `czatu` — udokumentowane w `?` help overlay.**
226. **FE — Eksport widoku `powiadomień` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
227. **FE — Porównanie „przed/po zapisem” w formularzu `eksportu CSV` — podświetlenie zmienionych pól.**
228. **FE — Story / Histoire dla izolowanego komponentu `aktualności klubu` — regresje wizualne.**
229. **FE — Test a11y (axe) dla ścieżki krytycznej `bloga` — brak krytycznych violations.**
230. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `superadmina` — LCP, INP.**
231. **FE — Skeleton / shimmer dopasowany do `osi czasu` — mniej layout shift przy hydracji.**
232. **FE — Prefetch tras powiązanych z `profilu zawodnika` po `IntersectionObserver` kart na liście.**
233. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `dziennika` (>300 wierszy).**
234. **FE — Tryb kompaktowy tabletkowy dla `filtrów globalnych` — wyższa densyjność bez utraty dotykowych celów.**
235. **FE — Skróty klawiszowe (⌘/Ctrl) w `regeneracji` — udokumentowane w `?` help overlay.**
236. **FE — Eksport widoku `wyników` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
237. **FE — Porównanie „przed/po zapisem” w formularzu `panelu trenera` — podświetlenie zmienionych pól.**
238. **FE — Story / Histoire dla izolowanego komponentu `ustawień konta` — regresje wizualne.**
239. **FE — Test a11y (axe) dla ścieżki krytycznej `kalendarza` — brak krytycznych violations.**
240. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `planu treningowego` — LCP, INP.**
241. **FE — Skeleton / shimmer dopasowany do `wykresów` — mniej layout shift przy hydracji.**
242. **FE — Prefetch tras powiązanych z `obecności` po `IntersectionObserver` kart na liście.**
243. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `płatności` (>300 wierszy).**
244. **FE — Tryb kompaktowy tabletkowy dla `panelu admina` — wyższa densyjność bez utraty dotykowych celów.**
245. **FE — Skróty klawiszowe (⌘/Ctrl) w `importu danych` — udokumentowane w `?` help overlay.**
246. **FE — Eksport widoku `rankingu` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
247. **FE — Porównanie „przed/po zapisem” w formularzu `galerii` — podświetlenie zmienionych pól.**
248. **FE — Story / Histoire dla izolowanego komponentu `raportów PDF` — regresje wizualne.**
249. **FE — Test a11y (axe) dla ścieżki krytycznej `zgłoszeń ćwiczeń dodatkowych` — brak krytycznych violations.**
250. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `czatu` — LCP, INP.**
251. **FE — Skeleton / shimmer dopasowany do `powiadomień` — mniej layout shift przy hydracji.**
252. **FE — Prefetch tras powiązanych z `eksportu CSV` po `IntersectionObserver` kart na liście.**
253. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `aktualności klubu` (>300 wierszy).**
254. **FE — Tryb kompaktowy tabletkowy dla `bloga` — wyższa densyjność bez utraty dotykowych celów.**
255. **FE — Skróty klawiszowe (⌘/Ctrl) w `superadmina` — udokumentowane w `?` help overlay.**
256. **FE — Eksport widoku `osi czasu` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
257. **FE — Porównanie „przed/po zapisem” w formularzu `profilu zawodnika` — podświetlenie zmienionych pól.**
258. **FE — Story / Histoire dla izolowanego komponentu `dziennika` — regresje wizualne.**
259. **FE — Test a11y (axe) dla ścieżki krytycznej `filtrów globalnych` — brak krytycznych violations.**
260. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `regeneracji` — LCP, INP.**
261. **FE — Skeleton / shimmer dopasowany do `wyników` — mniej layout shift przy hydracji.**
262. **FE — Prefetch tras powiązanych z `panelu trenera` po `IntersectionObserver` kart na liście.**
263. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `ustawień konta` (>300 wierszy).**
264. **FE — Tryb kompaktowy tabletkowy dla `kalendarza` — wyższa densyjność bez utraty dotykowych celów.**
265. **FE — Skróty klawiszowe (⌘/Ctrl) w `planu treningowego` — udokumentowane w `?` help overlay.**
266. **FE — Eksport widoku `wykresów` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
267. **FE — Porównanie „przed/po zapisem” w formularzu `obecności` — podświetlenie zmienionych pól.**
268. **FE — Story / Histoire dla izolowanego komponentu `płatności` — regresje wizualne.**
269. **FE — Test a11y (axe) dla ścieżki krytycznej `panelu admina` — brak krytycznych violations.**
270. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `importu danych` — LCP, INP.**
271. **FE — Skeleton / shimmer dopasowany do `rankingu` — mniej layout shift przy hydracji.**
272. **FE — Prefetch tras powiązanych z `galerii` po `IntersectionObserver` kart na liście.**
273. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `raportów PDF` (>300 wierszy).**
274. **FE — Tryb kompaktowy tabletkowy dla `zgłoszeń ćwiczeń dodatkowych` — wyższa densyjność bez utraty dotykowych celów.**
275. **FE — Skróty klawiszowe (⌘/Ctrl) w `czatu` — udokumentowane w `?` help overlay.**
276. **FE — Eksport widoku `powiadomień` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
277. **FE — Porównanie „przed/po zapisem” w formularzu `eksportu CSV` — podświetlenie zmienionych pól.**
278. **FE — Story / Histoire dla izolowanego komponentu `aktualności klubu` — regresje wizualne.**
279. **FE — Test a11y (axe) dla ścieżki krytycznej `bloga` — brak krytycznych violations.**
280. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `superadmina` — LCP, INP.**
281. **FE — Skeleton / shimmer dopasowany do `osi czasu` — mniej layout shift przy hydracji.**
282. **FE — Prefetch tras powiązanych z `profilu zawodnika` po `IntersectionObserver` kart na liście.**
283. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `dziennika` (>300 wierszy).**
284. **FE — Tryb kompaktowy tabletkowy dla `filtrów globalnych` — wyższa densyjność bez utraty dotykowych celów.**
285. **FE — Skróty klawiszowe (⌘/Ctrl) w `regeneracji` — udokumentowane w `?` help overlay.**
286. **FE — Eksport widoku `wyników` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
287. **FE — Porównanie „przed/po zapisem” w formularzu `panelu trenera` — podświetlenie zmienionych pól.**
288. **FE — Story / Histoire dla izolowanego komponentu `ustawień konta` — regresje wizualne.**
289. **FE — Test a11y (axe) dla ścieżki krytycznej `kalendarza` — brak krytycznych violations.**
290. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `planu treningowego` — LCP, INP.**
291. **FE — Skeleton / shimmer dopasowany do `wykresów` — mniej layout shift przy hydracji.**
292. **FE — Prefetch tras powiązanych z `obecności` po `IntersectionObserver` kart na liście.**
293. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `płatności` (>300 wierszy).**
294. **FE — Tryb kompaktowy tabletkowy dla `panelu admina` — wyższa densyjność bez utraty dotykowych celów.**
295. **FE — Skróty klawiszowe (⌘/Ctrl) w `importu danych` — udokumentowane w `?` help overlay.**
296. **FE — Eksport widoku `rankingu` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
297. **FE — Porównanie „przed/po zapisem” w formularzu `galerii` — podświetlenie zmienionych pól.**
298. **FE — Story / Histoire dla izolowanego komponentu `raportów PDF` — regresje wizualne.**
299. **FE — Test a11y (axe) dla ścieżki krytycznej `zgłoszeń ćwiczeń dodatkowych` — brak krytycznych violations.**
300. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `czatu` — LCP, INP.**
301. **FE — Skeleton / shimmer dopasowany do `powiadomień` — mniej layout shift przy hydracji.**
302. **FE — Prefetch tras powiązanych z `eksportu CSV` po `IntersectionObserver` kart na liście.**
303. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `aktualności klubu` (>300 wierszy).**
304. **FE — Tryb kompaktowy tabletkowy dla `bloga` — wyższa densyjność bez utraty dotykowych celów.**
305. **FE — Skróty klawiszowe (⌘/Ctrl) w `superadmina` — udokumentowane w `?` help overlay.**
306. **FE — Eksport widoku `osi czasu` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
307. **FE — Porównanie „przed/po zapisem” w formularzu `profilu zawodnika` — podświetlenie zmienionych pól.**
308. **FE — Story / Histoire dla izolowanego komponentu `dziennika` — regresje wizualne.**
309. **FE — Test a11y (axe) dla ścieżki krytycznej `filtrów globalnych` — brak krytycznych violations.**
310. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `regeneracji` — LCP, INP.**
311. **FE — Skeleton / shimmer dopasowany do `wyników` — mniej layout shift przy hydracji.**
312. **FE — Prefetch tras powiązanych z `panelu trenera` po `IntersectionObserver` kart na liście.**
313. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `ustawień konta` (>300 wierszy).**
314. **FE — Tryb kompaktowy tabletkowy dla `kalendarza` — wyższa densyjność bez utraty dotykowych celów.**
315. **FE — Skróty klawiszowe (⌘/Ctrl) w `planu treningowego` — udokumentowane w `?` help overlay.**
316. **FE — Eksport widoku `wykresów` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
317. **FE — Porównanie „przed/po zapisem” w formularzu `obecności` — podświetlenie zmienionych pól.**
318. **FE — Story / Histoire dla izolowanego komponentu `płatności` — regresje wizualne.**
319. **FE — Test a11y (axe) dla ścieżki krytycznej `panelu admina` — brak krytycznych violations.**
320. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `importu danych` — LCP, INP.**
321. **FE — Skeleton / shimmer dopasowany do `rankingu` — mniej layout shift przy hydracji.**
322. **FE — Prefetch tras powiązanych z `galerii` po `IntersectionObserver` kart na liście.**
323. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `raportów PDF` (>300 wierszy).**
324. **FE — Tryb kompaktowy tabletkowy dla `zgłoszeń ćwiczeń dodatkowych` — wyższa densyjność bez utraty dotykowych celów.**
325. **FE — Skróty klawiszowe (⌘/Ctrl) w `czatu` — udokumentowane w `?` help overlay.**
326. **FE — Eksport widoku `powiadomień` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
327. **FE — Porównanie „przed/po zapisem” w formularzu `eksportu CSV` — podświetlenie zmienionych pól.**
328. **FE — Story / Histoire dla izolowanego komponentu `aktualności klubu` — regresje wizualne.**
329. **FE — Test a11y (axe) dla ścieżki krytycznej `bloga` — brak krytycznych violations.**
330. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `superadmina` — LCP, INP.**
331. **FE — Skeleton / shimmer dopasowany do `osi czasu` — mniej layout shift przy hydracji.**
332. **FE — Prefetch tras powiązanych z `profilu zawodnika` po `IntersectionObserver` kart na liście.**
333. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `dziennika` (>300 wierszy).**
334. **FE — Tryb kompaktowy tabletkowy dla `filtrów globalnych` — wyższa densyjność bez utraty dotykowych celów.**
335. **FE — Skróty klawiszowe (⌘/Ctrl) w `regeneracji` — udokumentowane w `?` help overlay.**
336. **FE — Eksport widoku `wyników` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
337. **FE — Porównanie „przed/po zapisem” w formularzu `panelu trenera` — podświetlenie zmienionych pól.**
338. **FE — Story / Histoire dla izolowanego komponentu `ustawień konta` — regresje wizualne.**
339. **FE — Test a11y (axe) dla ścieżki krytycznej `kalendarza` — brak krytycznych violations.**
340. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `planu treningowego` — LCP, INP.**
341. **FE — Skeleton / shimmer dopasowany do `wykresów` — mniej layout shift przy hydracji.**
342. **FE — Prefetch tras powiązanych z `obecności` po `IntersectionObserver` kart na liście.**
343. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `płatności` (>300 wierszy).**
344. **FE — Tryb kompaktowy tabletkowy dla `panelu admina` — wyższa densyjność bez utraty dotykowych celów.**
345. **FE — Skróty klawiszowe (⌘/Ctrl) w `importu danych` — udokumentowane w `?` help overlay.**
346. **FE — Eksport widoku `rankingu` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
347. **FE — Porównanie „przed/po zapisem” w formularzu `galerii` — podświetlenie zmienionych pól.**
348. **FE — Story / Histoire dla izolowanego komponentu `raportów PDF` — regresje wizualne.**
349. **FE — Test a11y (axe) dla ścieżki krytycznej `zgłoszeń ćwiczeń dodatkowych` — brak krytycznych violations.**
350. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `czatu` — LCP, INP.**
351. **FE — Skeleton / shimmer dopasowany do `powiadomień` — mniej layout shift przy hydracji.**
352. **FE — Prefetch tras powiązanych z `eksportu CSV` po `IntersectionObserver` kart na liście.**
353. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `aktualności klubu` (>300 wierszy).**
354. **FE — Tryb kompaktowy tabletkowy dla `bloga` — wyższa densyjność bez utraty dotykowych celów.**
355. **FE — Skróty klawiszowe (⌘/Ctrl) w `superadmina` — udokumentowane w `?` help overlay.**
356. **FE — Eksport widoku `osi czasu` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
357. **FE — Porównanie „przed/po zapisem” w formularzu `profilu zawodnika` — podświetlenie zmienionych pól.**
358. **FE — Story / Histoire dla izolowanego komponentu `dziennika` — regresje wizualne.**
359. **FE — Test a11y (axe) dla ścieżki krytycznej `filtrów globalnych` — brak krytycznych violations.**
360. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `regeneracji` — LCP, INP.**
361. **FE — Skeleton / shimmer dopasowany do `wyników` — mniej layout shift przy hydracji.**
362. **FE — Prefetch tras powiązanych z `panelu trenera` po `IntersectionObserver` kart na liście.**
363. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `ustawień konta` (>300 wierszy).**
364. ~~**FE — Tryb kompaktowy tabletkowy dla `kalendarza` — wyższa densyjność bez utraty dotykowych celów.**~~ *(flaga `calendar_tablet_compact` na `/kalendarz` od 768px.)*
365. **FE — Skróty klawiszowe (⌘/Ctrl) w `planu treningowego` — udokumentowane w `?` help overlay.**
366. **FE — Eksport widoku `wykresów` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
367. **FE — Porównanie „przed/po zapisem” w formularzu `obecności` — podświetlenie zmienionych pól.**
368. **FE — Story / Histoire dla izolowanego komponentu `płatności` — regresje wizualne.**
369. **FE — Test a11y (axe) dla ścieżki krytycznej `panelu admina` — brak krytycznych violations.**
370. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `importu danych` — LCP, INP.**
371. **FE — Skeleton / shimmer dopasowany do `rankingu` — mniej layout shift przy hydracji.**
372. **FE — Prefetch tras powiązanych z `galerii` po `IntersectionObserver` kart na liście.**
373. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `raportów PDF` (>300 wierszy).**
374. **FE — Tryb kompaktowy tabletkowy dla `zgłoszeń ćwiczeń dodatkowych` — wyższa densyjność bez utraty dotykowych celów.**
375. **FE — Skróty klawiszowe (⌘/Ctrl) w `czatu` — udokumentowane w `?` help overlay.**
376. **FE — Eksport widoku `powiadomień` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
377. **FE — Porównanie „przed/po zapisem” w formularzu `eksportu CSV` — podświetlenie zmienionych pól.**
378. **FE — Story / Histoire dla izolowanego komponentu `aktualności klubu` — regresje wizualne.**
379. **FE — Test a11y (axe) dla ścieżki krytycznej `bloga` — brak krytycznych violations.**
380. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `superadmina` — LCP, INP.**
381. **FE — Skeleton / shimmer dopasowany do `osi czasu` — mniej layout shift przy hydracji.**
382. **FE — Prefetch tras powiązanych z `profilu zawodnika` po `IntersectionObserver` kart na liście.**
383. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `dziennika` (>300 wierszy).**
384. **FE — Tryb kompaktowy tabletkowy dla `filtrów globalnych` — wyższa densyjność bez utraty dotykowych celów.**
385. **FE — Skróty klawiszowe (⌘/Ctrl) w `regeneracji` — udokumentowane w `?` help overlay.**
386. **FE — Eksport widoku `wyników` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
387. **FE — Porównanie „przed/po zapisem” w formularzu `panelu trenera` — podświetlenie zmienionych pól.**
388. **FE — Story / Histoire dla izolowanego komponentu `ustawień konta` — regresje wizualne.**
389. **FE — Test a11y (axe) dla ścieżki krytycznej `kalendarza` — brak krytycznych violations.**
390. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `planu treningowego` — LCP, INP.**
391. **FE — Skeleton / shimmer dopasowany do `wykresów` — mniej layout shift przy hydracji.**
392. **FE — Prefetch tras powiązanych z `obecności` po `IntersectionObserver` kart na liście.**
393. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `płatności` (>300 wierszy).**
394. **FE — Tryb kompaktowy tabletkowy dla `panelu admina` — wyższa densyjność bez utraty dotykowych celów.**
395. **FE — Skróty klawiszowe (⌘/Ctrl) w `importu danych` — udokumentowane w `?` help overlay.**
396. **FE — Eksport widoku `rankingu` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
397. **FE — Porównanie „przed/po zapisem” w formularzu `galerii` — podświetlenie zmienionych pól.**
398. **FE — Story / Histoire dla izolowanego komponentu `raportów PDF` — regresje wizualne.**
399. **FE — Test a11y (axe) dla ścieżki krytycznej `zgłoszeń ćwiczeń dodatkowych` — brak krytycznych violations.**
400. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `czatu` — LCP, INP.**
401. **FE — Skeleton / shimmer dopasowany do `powiadomień` — mniej layout shift przy hydracji.**
402. **FE — Prefetch tras powiązanych z `eksportu CSV` po `IntersectionObserver` kart na liście.**
403. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `aktualności klubu` (>300 wierszy).**
404. **FE — Tryb kompaktowy tabletkowy dla `bloga` — wyższa densyjność bez utraty dotykowych celów.**
405. **FE — Skróty klawiszowe (⌘/Ctrl) w `superadmina` — udokumentowane w `?` help overlay.**
406. **FE — Eksport widoku `osi czasu` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
407. **FE — Porównanie „przed/po zapisem” w formularzu `profilu zawodnika` — podświetlenie zmienionych pól.**
408. **FE — Story / Histoire dla izolowanego komponentu `dziennika` — regresje wizualne.**
409. **FE — Test a11y (axe) dla ścieżki krytycznej `filtrów globalnych` — brak krytycznych violations.**
410. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `regeneracji` — LCP, INP.**
411. **FE — Skeleton / shimmer dopasowany do `wyników` — mniej layout shift przy hydracji.**
412. **FE — Prefetch tras powiązanych z `panelu trenera` po `IntersectionObserver` kart na liście.**
413. **FE — Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `ustawień konta` (>300 wierszy).**
414. **FE — Tryb kompaktowy tabletkowy dla `kalendarza` — wyższa densyjność bez utraty dotykowych celów.**
415. **FE — Skróty klawiszowe (⌘/Ctrl) w `planu treningowego` — udokumentowane w `?` help overlay.**
416. **FE — Eksport widoku `wykresów` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.**
417. **FE — Porównanie „przed/po zapisem” w formularzu `obecności` — podświetlenie zmienionych pól.**
418. **FE — Story / Histoire dla izolowanego komponentu `płatności` — regresje wizualne.**
419. **FE — Test a11y (axe) dla ścieżki krytycznej `panelu admina` — brak krytycznych violations.**
420. **FE — Telemetria Web Vitals (opcjonalnie) dla strony z `importu danych` — LCP, INP.**

### Backend (Rust, API, SQLite, worker, bezpieczeństwo)

421. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
422. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
423. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
424. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
425. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
426. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
427. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
428. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
429. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
430. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
431. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
432. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
433. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
434. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
435. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
436. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
437. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
438. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
439. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
440. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
441. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
442. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
443. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
444. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
445. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
446. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
447. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
448. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
449. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
450. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
451. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
452. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
453. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
454. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
455. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
456. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
457. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
458. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
459. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
460. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
461. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
462. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
463. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
464. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
465. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
466. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
467. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
468. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
469. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
470. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
471. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
472. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
473. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
474. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
475. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
476. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
477. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
478. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
479. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
480. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
481. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
482. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
483. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
484. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
485. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
486. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
487. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
488. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
489. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
490. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
491. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
492. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
493. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
494. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
495. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
496. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
497. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
498. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
499. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
500. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
501. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
502. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
503. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
504. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
505. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
506. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
507. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
508. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
509. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
510. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
511. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
512. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
513. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
514. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
515. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
516. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
517. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
518. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
519. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
520. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
521. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
522. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
523. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
524. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
525. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
526. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
527. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
528. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
529. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
530. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
531. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
532. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
533. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
534. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
535. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
536. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
537. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
538. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
539. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
540. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
541. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
542. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
543. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
544. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
545. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
546. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
547. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
548. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
549. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
550. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
551. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
552. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
553. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
554. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
555. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
556. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
557. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
558. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
559. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
560. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
561. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
562. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
563. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
564. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
565. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
566. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
567. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
568. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
569. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
570. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
571. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
572. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
573. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
574. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
575. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
576. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
577. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
578. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
579. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
580. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
581. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
582. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
583. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
584. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
585. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
586. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
587. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
588. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
589. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
590. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
591. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
592. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
593. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
594. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
595. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
596. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
597. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
598. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
599. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
600. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
601. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
602. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
603. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
604. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
605. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
606. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
607. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
608. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
609. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
610. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
611. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
612. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
613. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
614. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
615. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
616. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
617. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
618. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
619. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
620. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**
621. **BE — Indeks złożony pod zapytanie `wyników` — zweryfikować `EXPLAIN QUERY PLAN`.**
622. **BE — Idempotentny POST dla `powiadomień` — nagłówek `Idempotency-Key` + unikalny constraint.**
623. **BE — Paginacja kursorowa dla listy `wykresów` — stabilna przy równoległych zapisach.**
624. **BE — Webhook outbox dla zdarzeń `osi czasu` — retry z backoff, dead-letter queue.**
625. **BE — Cron job: agregaty dzienne dla `rankingu` — tabela podsumowań + cronometr w logach.**
626. **BE — Soft-delete z TTL dla `wyników` — archiwizacja po 90 dniach (konfigurowalnie).**
627. **BE — Rate limit per IP i per user dla endpointów `powiadomień` — osobne kubełki.**
628. **BE — Walidacja schema JSON (serde) dla payloadów `wykresów` — testy negatywne.**
629. **BE — Audit log wpisu dla mutacji `osi czasu` — kto, kiedy, stary vs nowy snapshot.**
630. **BE — Feature flag serwerowy dla `rankingu` — odczyt z env / tabeli konfiguracji.**

### Mobilka (Flutter) i kanały powiązane

631. **MOB — Parzystość ekranu `filtrów globalnych` z www — ten sam porządek pól i walidacji.**
632. **MOB — Offline queue dla akcji `profilu zawodnika` — retry z exponential backoff.**
633. **MOB — Deep link (`slavia://…`) do `superadmina` — mapowanie w `go_router`.**
634. **MOB — Widget startowy pokazujący skrót do `aktualności klubu` (Android/iOS).**
635. **MOB — Duży tekst / scaling dla `powiadomień` — test przy `textScaleFactor` 1.3.**
636. **MOB — Screenshot-ready layout dla `zgłoszeń ćwiczeń dodatkowych` — ukrycie danych wrażliwych opcjonalnie.**
637. **MOB — Powiadomienie lokalne zsynchronizowane z `galerii` — harmonogram `timezone`.**
638. **MOB — Integracja Share Sheet eksportu z `importu danych` — PNG/CSV z metadanymi klubu.**
639. **MOB — Golden test UI fragmentu `płatności` — regresja przy zmianie motywu.**
640. **MOB — Battery-aware sync dla `wykresów` — rzadsze odświeżanie przy <15% baterii.**
641. **MOB — Parzystość ekranu `kalendarza` z www — ten sam porządek pól i walidacji.**
642. **MOB — Offline queue dla akcji `panelu trenera` — retry z exponential backoff.**
643. **MOB — Deep link (`slavia://…`) do `regeneracji` — mapowanie w `go_router`.**
644. **MOB — Widget startowy pokazujący skrót do `dziennika` (Android/iOS).**
645. **MOB — Duży tekst / scaling dla `osi czasu` — test przy `textScaleFactor` 1.3.**
646. **MOB — Screenshot-ready layout dla `bloga` — ukrycie danych wrażliwych opcjonalnie.**
647. **MOB — Powiadomienie lokalne zsynchronizowane z `eksportu CSV` — harmonogram `timezone`.**
648. **MOB — Integracja Share Sheet eksportu z `czatu` — PNG/CSV z metadanymi klubu.**
649. **MOB — Golden test UI fragmentu `raportów PDF` — regresja przy zmianie motywu.**
650. **MOB — Battery-aware sync dla `rankingu` — rzadsze odświeżanie przy <15% baterii.**
651. **MOB — Parzystość ekranu `panelu admina` z www — ten sam porządek pól i walidacji.**
652. **MOB — Offline queue dla akcji `obecności` — retry z exponential backoff.**
653. **MOB — Deep link (`slavia://…`) do `planu treningowego` — mapowanie w `go_router`.**
654. **MOB — Widget startowy pokazujący skrót do `ustawień konta` (Android/iOS).**
655. **MOB — Duży tekst / scaling dla `wyników` — test przy `textScaleFactor` 1.3.**
656. **MOB — Screenshot-ready layout dla `filtrów globalnych` — ukrycie danych wrażliwych opcjonalnie.**
657. **MOB — Powiadomienie lokalne zsynchronizowane z `profilu zawodnika` — harmonogram `timezone`.**
658. **MOB — Integracja Share Sheet eksportu z `superadmina` — PNG/CSV z metadanymi klubu.**
659. **MOB — Golden test UI fragmentu `aktualności klubu` — regresja przy zmianie motywu.**
660. **MOB — Battery-aware sync dla `powiadomień` — rzadsze odświeżanie przy <15% baterii.**
661. **MOB — Parzystość ekranu `zgłoszeń ćwiczeń dodatkowych` z www — ten sam porządek pól i walidacji.**
662. **MOB — Offline queue dla akcji `galerii` — retry z exponential backoff.**
663. **MOB — Deep link (`slavia://…`) do `importu danych` — mapowanie w `go_router`.**
664. **MOB — Widget startowy pokazujący skrót do `płatności` (Android/iOS).**
665. **MOB — Duży tekst / scaling dla `wykresów` — test przy `textScaleFactor` 1.3.**
666. **MOB — Screenshot-ready layout dla `kalendarza` — ukrycie danych wrażliwych opcjonalnie.**
667. **MOB — Powiadomienie lokalne zsynchronizowane z `panelu trenera` — harmonogram `timezone`.**
668. **MOB — Integracja Share Sheet eksportu z `regeneracji` — PNG/CSV z metadanymi klubu.**
669. **MOB — Golden test UI fragmentu `dziennika` — regresja przy zmianie motywu.**
670. **MOB — Battery-aware sync dla `osi czasu` — rzadsze odświeżanie przy <15% baterii.**
671. **MOB — Parzystość ekranu `bloga` z www — ten sam porządek pól i walidacji.**
672. **MOB — Offline queue dla akcji `eksportu CSV` — retry z exponential backoff.**
673. **MOB — Deep link (`slavia://…`) do `czatu` — mapowanie w `go_router`.**
674. **MOB — Widget startowy pokazujący skrót do `raportów PDF` (Android/iOS).**
675. **MOB — Duży tekst / scaling dla `rankingu` — test przy `textScaleFactor` 1.3.**
676. **MOB — Screenshot-ready layout dla `panelu admina` — ukrycie danych wrażliwych opcjonalnie.**
677. **MOB — Powiadomienie lokalne zsynchronizowane z `obecności` — harmonogram `timezone`.**
678. **MOB — Integracja Share Sheet eksportu z `planu treningowego` — PNG/CSV z metadanymi klubu.**
679. **MOB — Golden test UI fragmentu `ustawień konta` — regresja przy zmianie motywu.**
680. **MOB — Battery-aware sync dla `wyników` — rzadsze odświeżanie przy <15% baterii.**
681. **MOB — Parzystość ekranu `filtrów globalnych` z www — ten sam porządek pól i walidacji.**
682. **MOB — Offline queue dla akcji `profilu zawodnika` — retry z exponential backoff.**
683. **MOB — Deep link (`slavia://…`) do `superadmina` — mapowanie w `go_router`.**
684. **MOB — Widget startowy pokazujący skrót do `aktualności klubu` (Android/iOS).**
685. **MOB — Duży tekst / scaling dla `powiadomień` — test przy `textScaleFactor` 1.3.**
686. **MOB — Screenshot-ready layout dla `zgłoszeń ćwiczeń dodatkowych` — ukrycie danych wrażliwych opcjonalnie.**
687. **MOB — Powiadomienie lokalne zsynchronizowane z `galerii` — harmonogram `timezone`.**
688. **MOB — Integracja Share Sheet eksportu z `importu danych` — PNG/CSV z metadanymi klubu.**
689. **MOB — Golden test UI fragmentu `płatności` — regresja przy zmianie motywu.**
690. **MOB — Battery-aware sync dla `wykresów` — rzadsze odświeżanie przy <15% baterii.**
691. **MOB — Parzystość ekranu `kalendarza` z www — ten sam porządek pól i walidacji.**
692. **MOB — Offline queue dla akcji `panelu trenera` — retry z exponential backoff.**
693. **MOB — Deep link (`slavia://…`) do `regeneracji` — mapowanie w `go_router`.**
694. **MOB — Widget startowy pokazujący skrót do `dziennika` (Android/iOS).**
695. **MOB — Duży tekst / scaling dla `osi czasu` — test przy `textScaleFactor` 1.3.**
696. **MOB — Screenshot-ready layout dla `bloga` — ukrycie danych wrażliwych opcjonalnie.**
697. **MOB — Powiadomienie lokalne zsynchronizowane z `eksportu CSV` — harmonogram `timezone`.**
698. **MOB — Integracja Share Sheet eksportu z `czatu` — PNG/CSV z metadanymi klubu.**
699. **MOB — Golden test UI fragmentu `raportów PDF` — regresja przy zmianie motywu.**
700. **MOB — Battery-aware sync dla `rankingu` — rzadsze odświeżanie przy <15% baterii.**
701. **MOB — Parzystość ekranu `panelu admina` z www — ten sam porządek pól i walidacji.**
702. **MOB — Offline queue dla akcji `obecności` — retry z exponential backoff.**
703. **MOB — Deep link (`slavia://…`) do `planu treningowego` — mapowanie w `go_router`.**
704. **MOB — Widget startowy pokazujący skrót do `ustawień konta` (Android/iOS).**
705. **MOB — Duży tekst / scaling dla `wyników` — test przy `textScaleFactor` 1.3.**
706. **MOB — Screenshot-ready layout dla `filtrów globalnych` — ukrycie danych wrażliwych opcjonalnie.**
707. **MOB — Powiadomienie lokalne zsynchronizowane z `profilu zawodnika` — harmonogram `timezone`.**
708. **MOB — Integracja Share Sheet eksportu z `superadmina` — PNG/CSV z metadanymi klubu.**
709. **MOB — Golden test UI fragmentu `aktualności klubu` — regresja przy zmianie motywu.**
710. **MOB — Battery-aware sync dla `powiadomień` — rzadsze odświeżanie przy <15% baterii.**
711. **MOB — Parzystość ekranu `zgłoszeń ćwiczeń dodatkowych` z www — ten sam porządek pól i walidacji.**
712. **MOB — Offline queue dla akcji `galerii` — retry z exponential backoff.**
713. **MOB — Deep link (`slavia://…`) do `importu danych` — mapowanie w `go_router`.**
714. **MOB — Widget startowy pokazujący skrót do `płatności` (Android/iOS).**
715. **MOB — Duży tekst / scaling dla `wykresów` — test przy `textScaleFactor` 1.3.**
716. **MOB — Screenshot-ready layout dla `kalendarza` — ukrycie danych wrażliwych opcjonalnie.**
717. **MOB — Powiadomienie lokalne zsynchronizowane z `panelu trenera` — harmonogram `timezone`.**
718. **MOB — Integracja Share Sheet eksportu z `regeneracji` — PNG/CSV z metadanymi klubu.**
719. **MOB — Golden test UI fragmentu `dziennika` — regresja przy zmianie motywu.**
720. **MOB — Battery-aware sync dla `osi czasu` — rzadsze odświeżanie przy <15% baterii.**
721. **MOB — Parzystość ekranu `bloga` z www — ten sam porządek pól i walidacji.**
722. **MOB — Offline queue dla akcji `eksportu CSV` — retry z exponential backoff.**
723. **MOB — Deep link (`slavia://…`) do `czatu` — mapowanie w `go_router`.**
724. **MOB — Widget startowy pokazujący skrót do `raportów PDF` (Android/iOS).**
725. **MOB — Duży tekst / scaling dla `rankingu` — test przy `textScaleFactor` 1.3.**
726. **MOB — Screenshot-ready layout dla `panelu admina` — ukrycie danych wrażliwych opcjonalnie.**
727. **MOB — Powiadomienie lokalne zsynchronizowane z `obecności` — harmonogram `timezone`.**
728. **MOB — Integracja Share Sheet eksportu z `planu treningowego` — PNG/CSV z metadanymi klubu.**
729. **MOB — Golden test UI fragmentu `ustawień konta` — regresja przy zmianie motywu.**
730. **MOB — Battery-aware sync dla `wyników` — rzadsze odświeżanie przy <15% baterii.**
731. **MOB — Parzystość ekranu `filtrów globalnych` z www — ten sam porządek pól i walidacji.**
732. **MOB — Offline queue dla akcji `profilu zawodnika` — retry z exponential backoff.**
733. **MOB — Deep link (`slavia://…`) do `superadmina` — mapowanie w `go_router`.**
734. **MOB — Widget startowy pokazujący skrót do `aktualności klubu` (Android/iOS).**
735. **MOB — Duży tekst / scaling dla `powiadomień` — test przy `textScaleFactor` 1.3.**
736. **MOB — Screenshot-ready layout dla `zgłoszeń ćwiczeń dodatkowych` — ukrycie danych wrażliwych opcjonalnie.**
737. **MOB — Powiadomienie lokalne zsynchronizowane z `galerii` — harmonogram `timezone`.**
738. **MOB — Integracja Share Sheet eksportu z `importu danych` — PNG/CSV z metadanymi klubu.**
739. **MOB — Golden test UI fragmentu `płatności` — regresja przy zmianie motywu.**
740. **MOB — Battery-aware sync dla `wykresów` — rzadsze odświeżanie przy <15% baterii.**
741. **MOB — Parzystość ekranu `kalendarza` z www — ten sam porządek pól i walidacji.**
742. **MOB — Offline queue dla akcji `panelu trenera` — retry z exponential backoff.**
743. **MOB — Deep link (`slavia://…`) do `regeneracji` — mapowanie w `go_router`.**
744. **MOB — Widget startowy pokazujący skrót do `dziennika` (Android/iOS).**
745. **MOB — Duży tekst / scaling dla `osi czasu` — test przy `textScaleFactor` 1.3.**
746. **MOB — Screenshot-ready layout dla `bloga` — ukrycie danych wrażliwych opcjonalnie.**
747. **MOB — Powiadomienie lokalne zsynchronizowane z `eksportu CSV` — harmonogram `timezone`.**
748. **MOB — Integracja Share Sheet eksportu z `czatu` — PNG/CSV z metadanymi klubu.**
749. **MOB — Golden test UI fragmentu `raportów PDF` — regresja przy zmianie motywu.**
750. **MOB — Battery-aware sync dla `rankingu` — rzadsze odświeżanie przy <15% baterii.**
751. **MOB — Parzystość ekranu `panelu admina` z www — ten sam porządek pól i walidacji.**
752. **MOB — Offline queue dla akcji `obecności` — retry z exponential backoff.**
753. **MOB — Deep link (`slavia://…`) do `planu treningowego` — mapowanie w `go_router`.**
754. **MOB — Widget startowy pokazujący skrót do `ustawień konta` (Android/iOS).**
755. **MOB — Duży tekst / scaling dla `wyników` — test przy `textScaleFactor` 1.3.**
756. **MOB — Screenshot-ready layout dla `filtrów globalnych` — ukrycie danych wrażliwych opcjonalnie.**
757. **MOB — Powiadomienie lokalne zsynchronizowane z `profilu zawodnika` — harmonogram `timezone`.**
758. **MOB — Integracja Share Sheet eksportu z `superadmina` — PNG/CSV z metadanymi klubu.**
759. **MOB — Golden test UI fragmentu `aktualności klubu` — regresja przy zmianie motywu.**
760. **MOB — Battery-aware sync dla `powiadomień` — rzadsze odświeżanie przy <15% baterii.**
761. **MOB — Parzystość ekranu `zgłoszeń ćwiczeń dodatkowych` z www — ten sam porządek pól i walidacji.**
762. **MOB — Offline queue dla akcji `galerii` — retry z exponential backoff.**
763. **MOB — Deep link (`slavia://…`) do `importu danych` — mapowanie w `go_router`.**
764. **MOB — Widget startowy pokazujący skrót do `płatności` (Android/iOS).**
765. **MOB — Duży tekst / scaling dla `wykresów` — test przy `textScaleFactor` 1.3.**
766. **MOB — Screenshot-ready layout dla `kalendarza` — ukrycie danych wrażliwych opcjonalnie.**
767. **MOB — Powiadomienie lokalne zsynchronizowane z `panelu trenera` — harmonogram `timezone`.**
768. **MOB — Integracja Share Sheet eksportu z `regeneracji` — PNG/CSV z metadanymi klubu.**
769. **MOB — Golden test UI fragmentu `dziennika` — regresja przy zmianie motywu.**
770. **MOB — Battery-aware sync dla `osi czasu` — rzadsze odświeżanie przy <15% baterii.**
771. **MOB — Parzystość ekranu `bloga` z www — ten sam porządek pól i walidacji.**
772. **MOB — Offline queue dla akcji `eksportu CSV` — retry z exponential backoff.**
773. **MOB — Deep link (`slavia://…`) do `czatu` — mapowanie w `go_router`.**
774. **MOB — Widget startowy pokazujący skrót do `raportów PDF` (Android/iOS).**
775. **MOB — Duży tekst / scaling dla `rankingu` — test przy `textScaleFactor` 1.3.**
776. **MOB — Screenshot-ready layout dla `panelu admina` — ukrycie danych wrażliwych opcjonalnie.**
777. **MOB — Powiadomienie lokalne zsynchronizowane z `obecności` — harmonogram `timezone`.**
778. **MOB — Integracja Share Sheet eksportu z `planu treningowego` — PNG/CSV z metadanymi klubu.**
779. **MOB — Golden test UI fragmentu `ustawień konta` — regresja przy zmianie motywu.**
780. **MOB — Battery-aware sync dla `wyników` — rzadsze odświeżanie przy <15% baterii.**
781. **MOB — Parzystość ekranu `filtrów globalnych` z www — ten sam porządek pól i walidacji.**
782. **MOB — Offline queue dla akcji `profilu zawodnika` — retry z exponential backoff.**
783. **MOB — Deep link (`slavia://…`) do `superadmina` — mapowanie w `go_router`.**
784. **MOB — Widget startowy pokazujący skrót do `aktualności klubu` (Android/iOS).**
785. **MOB — Duży tekst / scaling dla `powiadomień` — test przy `textScaleFactor` 1.3.**
786. **MOB — Screenshot-ready layout dla `zgłoszeń ćwiczeń dodatkowych` — ukrycie danych wrażliwych opcjonalnie.**
787. **MOB — Powiadomienie lokalne zsynchronizowane z `galerii` — harmonogram `timezone`.**
788. **MOB — Integracja Share Sheet eksportu z `importu danych` — PNG/CSV z metadanymi klubu.**
789. **MOB — Golden test UI fragmentu `płatności` — regresja przy zmianie motywu.**
790. **MOB — Battery-aware sync dla `wykresów` — rzadsze odświeżanie przy <15% baterii.**
791. **MOB — Parzystość ekranu `kalendarza` z www — ten sam porządek pól i walidacji.**
792. **MOB — Offline queue dla akcji `panelu trenera` — retry z exponential backoff.**
793. **MOB — Deep link (`slavia://…`) do `regeneracji` — mapowanie w `go_router`.**
794. **MOB — Widget startowy pokazujący skrót do `dziennika` (Android/iOS).**
795. **MOB — Duży tekst / scaling dla `osi czasu` — test przy `textScaleFactor` 1.3.**
796. **MOB — Screenshot-ready layout dla `bloga` — ukrycie danych wrażliwych opcjonalnie.**
797. **MOB — Powiadomienie lokalne zsynchronizowane z `eksportu CSV` — harmonogram `timezone`.**
798. **MOB — Integracja Share Sheet eksportu z `czatu` — PNG/CSV z metadanymi klubu.**
799. **MOB — Golden test UI fragmentu `raportów PDF` — regresja przy zmianie motywu.**
800. **MOB — Battery-aware sync dla `rankingu` — rzadsze odświeżanie przy <15% baterii.**
801. **MOB — Parzystość ekranu `panelu admina` z www — ten sam porządek pól i walidacji.**
802. **MOB — Offline queue dla akcji `obecności` — retry z exponential backoff.**
803. **MOB — Deep link (`slavia://…`) do `planu treningowego` — mapowanie w `go_router`.**
804. **MOB — Widget startowy pokazujący skrót do `ustawień konta` (Android/iOS).**
805. **MOB — Duży tekst / scaling dla `wyników` — test przy `textScaleFactor` 1.3.**
806. **MOB — Screenshot-ready layout dla `filtrów globalnych` — ukrycie danych wrażliwych opcjonalnie.**
807. **MOB — Powiadomienie lokalne zsynchronizowane z `profilu zawodnika` — harmonogram `timezone`.**
808. **MOB — Integracja Share Sheet eksportu z `superadmina` — PNG/CSV z metadanymi klubu.**
809. **MOB — Golden test UI fragmentu `aktualności klubu` — regresja przy zmianie motywu.**
810. **MOB — Battery-aware sync dla `powiadomień` — rzadsze odświeżanie przy <15% baterii.**
811. **MOB — Parzystość ekranu `zgłoszeń ćwiczeń dodatkowych` z www — ten sam porządek pól i walidacji.**
812. **MOB — Offline queue dla akcji `galerii` — retry z exponential backoff.**
813. **MOB — Deep link (`slavia://…`) do `importu danych` — mapowanie w `go_router`.**
814. **MOB — Widget startowy pokazujący skrót do `płatności` (Android/iOS).**
815. **MOB — Duży tekst / scaling dla `wykresów` — test przy `textScaleFactor` 1.3.**
816. **MOB — Screenshot-ready layout dla `kalendarza` — ukrycie danych wrażliwych opcjonalnie.**
817. **MOB — Powiadomienie lokalne zsynchronizowane z `panelu trenera` — harmonogram `timezone`.**
818. **MOB — Integracja Share Sheet eksportu z `regeneracji` — PNG/CSV z metadanymi klubu.**
819. **MOB — Golden test UI fragmentu `dziennika` — regresja przy zmianie motywu.**
820. **MOB — Battery-aware sync dla `osi czasu` — rzadsze odświeżanie przy <15% baterii.**

### Platforma, multi-klub, partnerzy, DevOps, produkt

821. **PL — multi-tenant schema (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
822. **PL — partner API SLA (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
823. **PL — white-label motywów (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
824. **PL — rozliczenia per aktywny zawodnik (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
825. **PL — region EU-only dla danych (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
826. **PL — backup point-in-time (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
827. **PL — disaster recovery drill (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
828. **PL — status page publiczny (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
829. **PL — program partnerski dla klubów (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
830. **PL — certyfikat klubu (trust badge) (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
831. **PL — SDK JavaScript dla widgetów osadzanych (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
832. **PL — konkurs federacji na read-only API (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
833. **PL — sandbox API dla developerów (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
834. **PL — quota i fair-use policy (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
835. **PL — RODO — DPIA template (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
836. **PL — szkolenie kadry z produktu (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
837. **PL — template umowy B2B klub–platforma (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
838. **PL — referral program klubów (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
839. **PL — integracja księgowa (eksport FK) (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
840. **PL — analityka produktowa (bez PII) (wariant #1)** — backlog biznesowy; estimacja i owner przed sprintem.
841. **PL — multi-tenant schema (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
842. **PL — partner API SLA (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
843. **PL — white-label motywów (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
844. **PL — rozliczenia per aktywny zawodnik (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
845. **PL — region EU-only dla danych (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
846. **PL — backup point-in-time (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
847. **PL — disaster recovery drill (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
848. **PL — status page publiczny (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
849. **PL — program partnerski dla klubów (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
850. **PL — certyfikat klubu (trust badge) (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
851. **PL — SDK JavaScript dla widgetów osadzanych (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
852. **PL — konkurs federacji na read-only API (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
853. **PL — sandbox API dla developerów (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
854. **PL — quota i fair-use policy (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
855. **PL — RODO — DPIA template (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
856. **PL — szkolenie kadry z produktu (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
857. **PL — template umowy B2B klub–platforma (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
858. **PL — referral program klubów (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
859. **PL — integracja księgowa (eksport FK) (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
860. **PL — analityka produktowa (bez PII) (wariant #2)** — backlog biznesowy; estimacja i owner przed sprintem.
861. **PL — multi-tenant schema (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
862. **PL — partner API SLA (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
863. **PL — white-label motywów (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
864. **PL — rozliczenia per aktywny zawodnik (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
865. **PL — region EU-only dla danych (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
866. **PL — backup point-in-time (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
867. **PL — disaster recovery drill (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
868. **PL — status page publiczny (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
869. **PL — program partnerski dla klubów (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
870. **PL — certyfikat klubu (trust badge) (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
871. **PL — SDK JavaScript dla widgetów osadzanych (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
872. **PL — konkurs federacji na read-only API (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
873. **PL — sandbox API dla developerów (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
874. **PL — quota i fair-use policy (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
875. **PL — RODO — DPIA template (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
876. **PL — szkolenie kadry z produktu (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
877. **PL — template umowy B2B klub–platforma (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
878. **PL — referral program klubów (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
879. **PL — integracja księgowa (eksport FK) (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
880. **PL — analityka produktowa (bez PII) (wariant #3)** — backlog biznesowy; estimacja i owner przed sprintem.
881. **PL — multi-tenant schema (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
882. **PL — partner API SLA (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
883. **PL — white-label motywów (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
884. **PL — rozliczenia per aktywny zawodnik (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
885. **PL — region EU-only dla danych (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
886. **PL — backup point-in-time (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
887. **PL — disaster recovery drill (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
888. **PL — status page publiczny (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
889. **PL — program partnerski dla klubów (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
890. **PL — certyfikat klubu (trust badge) (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
891. **PL — SDK JavaScript dla widgetów osadzanych (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
892. **PL — konkurs federacji na read-only API (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
893. **PL — sandbox API dla developerów (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
894. **PL — quota i fair-use policy (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
895. **PL — RODO — DPIA template (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
896. **PL — szkolenie kadry z produktu (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
897. **PL — template umowy B2B klub–platforma (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
898. **PL — referral program klubów (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
899. **PL — integracja księgowa (eksport FK) (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
900. **PL — analityka produktowa (bez PII) (wariant #4)** — backlog biznesowy; estimacja i owner przed sprintem.
901. **PL — multi-tenant schema (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
902. **PL — partner API SLA (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
903. **PL — white-label motywów (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
904. **PL — rozliczenia per aktywny zawodnik (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
905. **PL — region EU-only dla danych (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
906. **PL — backup point-in-time (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
907. **PL — disaster recovery drill (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
908. **PL — status page publiczny (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
909. **PL — program partnerski dla klubów (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
910. **PL — certyfikat klubu (trust badge) (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
911. **PL — SDK JavaScript dla widgetów osadzanych (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
912. **PL — konkurs federacji na read-only API (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
913. **PL — sandbox API dla developerów (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
914. **PL — quota i fair-use policy (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
915. **PL — RODO — DPIA template (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
916. **PL — szkolenie kadry z produktu (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
917. **PL — template umowy B2B klub–platforma (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
918. **PL — referral program klubów (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
919. **PL — integracja księgowa (eksport FK) (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
920. **PL — analityka produktowa (bez PII) (wariant #5)** — backlog biznesowy; estimacja i owner przed sprintem.
921. **PL — multi-tenant schema (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
922. **PL — partner API SLA (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
923. **PL — white-label motywów (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
924. **PL — rozliczenia per aktywny zawodnik (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
925. **PL — region EU-only dla danych (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
926. **PL — backup point-in-time (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
927. **PL — disaster recovery drill (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
928. **PL — status page publiczny (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
929. **PL — program partnerski dla klubów (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
930. **PL — certyfikat klubu (trust badge) (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
931. **PL — SDK JavaScript dla widgetów osadzanych (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
932. **PL — konkurs federacji na read-only API (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
933. **PL — sandbox API dla developerów (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
934. **PL — quota i fair-use policy (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
935. **PL — RODO — DPIA template (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
936. **PL — szkolenie kadry z produktu (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
937. **PL — template umowy B2B klub–platforma (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
938. **PL — referral program klubów (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
939. **PL — integracja księgowa (eksport FK) (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
940. **PL — analityka produktowa (bez PII) (wariant #6)** — backlog biznesowy; estimacja i owner przed sprintem.
941. **PL — multi-tenant schema (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
942. **PL — partner API SLA (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
943. **PL — white-label motywów (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
944. **PL — rozliczenia per aktywny zawodnik (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
945. **PL — region EU-only dla danych (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
946. **PL — backup point-in-time (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
947. **PL — disaster recovery drill (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
948. **PL — status page publiczny (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
949. **PL — program partnerski dla klubów (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
950. **PL — certyfikat klubu (trust badge) (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
951. **PL — SDK JavaScript dla widgetów osadzanych (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
952. **PL — konkurs federacji na read-only API (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
953. **PL — sandbox API dla developerów (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
954. **PL — quota i fair-use policy (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
955. **PL — RODO — DPIA template (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
956. **PL — szkolenie kadry z produktu (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
957. **PL — template umowy B2B klub–platforma (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
958. **PL — referral program klubów (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
959. **PL — integracja księgowa (eksport FK) (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
960. **PL — analityka produktowa (bez PII) (wariant #7)** — backlog biznesowy; estimacja i owner przed sprintem.
961. **PL — multi-tenant schema (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
962. **PL — partner API SLA (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
963. **PL — white-label motywów (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
964. **PL — rozliczenia per aktywny zawodnik (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
965. **PL — region EU-only dla danych (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
966. **PL — backup point-in-time (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
967. **PL — disaster recovery drill (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
968. **PL — status page publiczny (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
969. **PL — program partnerski dla klubów (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
970. **PL — certyfikat klubu (trust badge) (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
971. **PL — SDK JavaScript dla widgetów osadzanych (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
972. **PL — konkurs federacji na read-only API (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
973. **PL — sandbox API dla developerów (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
974. **PL — quota i fair-use policy (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
975. **PL — RODO — DPIA template (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
976. **PL — szkolenie kadry z produktu (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
977. **PL — template umowy B2B klub–platforma (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
978. **PL — referral program klubów (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
979. **PL — integracja księgowa (eksport FK) (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
980. **PL — analityka produktowa (bez PII) (wariant #8)** — backlog biznesowy; estimacja i owner przed sprintem.
981. **PL — multi-tenant schema (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
982. **PL — partner API SLA (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
983. **PL — white-label motywów (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
984. **PL — rozliczenia per aktywny zawodnik (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
985. **PL — region EU-only dla danych (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
986. **PL — backup point-in-time (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
987. **PL — disaster recovery drill (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
988. **PL — status page publiczny (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
989. **PL — program partnerski dla klubów (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
990. **PL — certyfikat klubu (trust badge) (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
991. **PL — SDK JavaScript dla widgetów osadzanych (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
992. **PL — konkurs federacji na read-only API (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
993. **PL — sandbox API dla developerów (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
994. **PL — quota i fair-use policy (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
995. **PL — RODO — DPIA template (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
996. **PL — szkolenie kadry z produktu (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
997. **PL — template umowy B2B klub–platforma (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
998. **PL — referral program klubów (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
999. **PL — integracja księgowa (eksport FK) (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.
1000. **PL — analityka produktowa (bez PII) (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.


## Bank pomysłów 1001–2000 (frontend · backend · mobilka · platforma · R&D)

Druga seria numeracji — **1001–2000**. Można filtrować po prefiksach **FE / BE / MOB / PL / RD** (research). Wykonane pozycje ze starej listy są oznaczone ~~przekreśleniem~~ w sekcjach 1–210.

### Frontend — www, panele, UX, a11y, performance

1001. **FE — Pin zakładki `porównaniu zawodników` w localStorage — przywrócona aktywna tab po odświeżeniu.**
1002. **FE — Reduced motion: wyłączenie animacji kart w `panelu trenera` przy `prefers-reduced-motion`.**
1003. **FE — Hint przy pierwszym wejściu w `barbell analysis` — jednorazowy coachmark (klucz LS).**
1004. **FE — SSR-safe placeholder dla `panelu administratora` — brak „flash” treści chronionej rolą.**
1005. **FE — Retry przycisku zapisu w `superadmin/import` po błędzie sieci z komunikatem RFC7807.**
1006. **FE — Paginacja „load more” zamiast infinite scroll w `centrum powiadomień` — wybór użytkownika.**
1007. **FE — Porównanie Sinclair side-by-side w `aktualnościach klubowych` — dwie karty obok na desktopie.**
1008. **FE — Eksport PNG wykresu z `dzienniku treningów` — canvas `toBlob` + pobranie z nazwą pliku z datą.**
1009. **FE — Filtr zapisany w URL query dla `ankietach regeneracji` — udostępnialny link do widoku.**
1010. **FE — Obsługa RTL (przyszłość EN) w komponentach `planach treningowych V4` — mirror ikon strzałek.**
1011. **FE — Focus restoration po zamknięciu modala `module obecności` — powrót do przycisku wywołania.**
1012. **FE — Lista klawiszowa w `galerii mediów` — strzałki / Enter wg wzorca combobox.**
1013. **FE — Microcopy PL dla błędów walidacji `kolejce ćwiczeń dodatkowych` — bez żargonu backendu.**
1014. **FE — Skeleton z dokładną wysokością wierszy `blogu klubu` — eliminacja CLS.**
1015. **FE — Tryb druku dla `osi czasu zawodnika` — `@media print` ukrywa nav i przyciski.**
1016. **FE — Split view tablet: lista + szczegóły w `wynikach zawodów` jak iPad master-detail.**
1017. **FE — Badge „beta” przy eksperymentalnym `ustawieniach konta i 2FA` — link do `/superadmin/developer`.**
1018. **FE — Integracja z `@vueuse/core` `useThrottleFn` dla wyszukiwania w `module składek`.**
1019. **FE — Obsługa `aria-live` dla toastów powiązanych z `imporcie CSV zawodników`.**
1020. **FE — Lazy hydrate opcjonalnie dla ciężkiego `czacie trener–zawodnik` — na flagę eksperymentalną.**
1021. **FE — Pin zakładki `filtrach globalnych belki` w localStorage — przywrócona aktywna tab po odświeżeniu.**
1022. **FE — Reduced motion: wyłączenie animacji kart w `profilu zawodnika` przy `prefers-reduced-motion`.**
1023. **FE — Hint przy pierwszym wejściu w `wykresach Sinclair / dwubój` — jednorazowy coachmark (klucz LS).**
1024. **FE — SSR-safe placeholder dla `kalendarzu zawodów` — brak „flash” treści chronionej rolą.**
1025. **FE — Retry przycisku zapisu w `raportach PDF dla kadry` po błędzie sieci z komunikatem RFC7807.**
1026. **FE — Paginacja „load more” zamiast infinite scroll w `rankingu publicznym` — wybór użytkownika.**
1027. **FE — Porównanie Sinclair side-by-side w `narzędziach SuperAdmin` — dwie karty obok na desktopie.**
1028. **FE — Eksport PNG wykresu z `porównaniu zawodników` — canvas `toBlob` + pobranie z nazwą pliku z datą.**
1029. **FE — Filtr zapisany w URL query dla `panelu trenera` — udostępnialny link do widoku.**
1030. **FE — Obsługa RTL (przyszłość EN) w komponentach `barbell analysis` — mirror ikon strzałek.**
1031. **FE — Focus restoration po zamknięciu modala `panelu administratora` — powrót do przycisku wywołania.**
1032. **FE — Lista klawiszowa w `superadmin/import` — strzałki / Enter wg wzorca combobox.**
1033. **FE — Microcopy PL dla błędów walidacji `centrum powiadomień` — bez żargonu backendu.**
1034. **FE — Skeleton z dokładną wysokością wierszy `aktualnościach klubowych` — eliminacja CLS.**
1035. **FE — Tryb druku dla `dzienniku treningów` — `@media print` ukrywa nav i przyciski.**
1036. **FE — Split view tablet: lista + szczegóły w `ankietach regeneracji` jak iPad master-detail.**
1037. **FE — Badge „beta” przy eksperymentalnym `planach treningowych V4` — link do `/superadmin/developer`.**
1038. **FE — Integracja z `@vueuse/core` `useThrottleFn` dla wyszukiwania w `module obecności`.**
1039. **FE — Obsługa `aria-live` dla toastów powiązanych z `galerii mediów`.**
1040. **FE — Lazy hydrate opcjonalnie dla ciężkiego `kolejce ćwiczeń dodatkowych` — na flagę eksperymentalną.**
1041. **FE — Pin zakładki `blogu klubu` w localStorage — przywrócona aktywna tab po odświeżeniu.**
1042. **FE — Reduced motion: wyłączenie animacji kart w `osi czasu zawodnika` przy `prefers-reduced-motion`.**
1043. **FE — Hint przy pierwszym wejściu w `wynikach zawodów` — jednorazowy coachmark (klucz LS).**
1044. **FE — SSR-safe placeholder dla `ustawieniach konta i 2FA` — brak „flash” treści chronionej rolą.**
1045. **FE — Retry przycisku zapisu w `module składek` po błędzie sieci z komunikatem RFC7807.**
1046. **FE — Paginacja „load more” zamiast infinite scroll w `imporcie CSV zawodników` — wybór użytkownika.**
1047. **FE — Porównanie Sinclair side-by-side w `czacie trener–zawodnik` — dwie karty obok na desktopie.**
1048. **FE — Eksport PNG wykresu z `filtrach globalnych belki` — canvas `toBlob` + pobranie z nazwą pliku z datą.**
1049. **FE — Filtr zapisany w URL query dla `profilu zawodnika` — udostępnialny link do widoku.**
1050. **FE — Obsługa RTL (przyszłość EN) w komponentach `wykresach Sinclair / dwubój` — mirror ikon strzałek.**
1051. **FE — Focus restoration po zamknięciu modala `kalendarzu zawodów` — powrót do przycisku wywołania.**
1052. **FE — Lista klawiszowa w `raportach PDF dla kadry` — strzałki / Enter wg wzorca combobox.**
1053. **FE — Microcopy PL dla błędów walidacji `rankingu publicznym` — bez żargonu backendu.**
1054. **FE — Skeleton z dokładną wysokością wierszy `narzędziach SuperAdmin` — eliminacja CLS.**
1055. **FE — Tryb druku dla `porównaniu zawodników` — `@media print` ukrywa nav i przyciski.**
1056. **FE — Split view tablet: lista + szczegóły w `panelu trenera` jak iPad master-detail.**
1057. ~~**FE — Badge „beta” przy eksperymentalnym `barbell analysis` — link do `/superadmin/developer`.~~ *(wdrożone: przełącznik `experimental_beta_badges` w katalogu funkcji eksperymentalnych — do podpięcia w UI modułów.)*
1058. **FE — Integracja z `@vueuse/core` `useThrottleFn` dla wyszukiwania w `panelu administratora`.**
1059. **FE — Obsługa `aria-live` dla toastów powiązanych z `superadmin/import`.**
1060. **FE — Lazy hydrate opcjonalnie dla ciężkiego `centrum powiadomień` — na flagę eksperymentalną.**
1061. **FE — Pin zakładki `aktualnościach klubowych` w localStorage — przywrócona aktywna tab po odświeżeniu.**
1062. **FE — Reduced motion: wyłączenie animacji kart w `dzienniku treningów` przy `prefers-reduced-motion`.**
1063. **FE — Hint przy pierwszym wejściu w `ankietach regeneracji` — jednorazowy coachmark (klucz LS).**
1064. **FE — SSR-safe placeholder dla `planach treningowych V4` — brak „flash” treści chronionej rolą.**
1065. **FE — Retry przycisku zapisu w `module obecności` po błędzie sieci z komunikatem RFC7807.**
1066. **FE — Paginacja „load more” zamiast infinite scroll w `galerii mediów` — wybór użytkownika.**
1067. **FE — Porównanie Sinclair side-by-side w `kolejce ćwiczeń dodatkowych` — dwie karty obok na desktopie.**
1068. **FE — Eksport PNG wykresu z `blogu klubu` — canvas `toBlob` + pobranie z nazwą pliku z datą.**
1069. **FE — Filtr zapisany w URL query dla `osi czasu zawodnika` — udostępnialny link do widoku.**
1070. **FE — Obsługa RTL (przyszłość EN) w komponentach `wynikach zawodów` — mirror ikon strzałek.**
1071. **FE — Focus restoration po zamknięciu modala `ustawieniach konta i 2FA` — powrót do przycisku wywołania.**
1072. **FE — Lista klawiszowa w `module składek` — strzałki / Enter wg wzorca combobox.**
1073. **FE — Microcopy PL dla błędów walidacji `imporcie CSV zawodników` — bez żargonu backendu.**
1074. **FE — Skeleton z dokładną wysokością wierszy `czacie trener–zawodnik` — eliminacja CLS.**
1075. **FE — Tryb druku dla `filtrach globalnych belki` — `@media print` ukrywa nav i przyciski.**
1076. **FE — Split view tablet: lista + szczegóły w `profilu zawodnika` jak iPad master-detail.**
1077. **FE — Badge „beta” przy eksperymentalnym `wykresach Sinclair / dwubój` — link do `/superadmin/developer`.**
1078. **FE — Integracja z `@vueuse/core` `useThrottleFn` dla wyszukiwania w `kalendarzu zawodów`.**
1079. **FE — Obsługa `aria-live` dla toastów powiązanych z `raportach PDF dla kadry`.**
1080. **FE — Lazy hydrate opcjonalnie dla ciężkiego `rankingu publicznym` — na flagę eksperymentalną.**
1081. **FE — Pin zakładki `narzędziach SuperAdmin` w localStorage — przywrócona aktywna tab po odświeżeniu.**
1082. **FE — Reduced motion: wyłączenie animacji kart w `porównaniu zawodników` przy `prefers-reduced-motion`.**
1083. **FE — Hint przy pierwszym wejściu w `panelu trenera` — jednorazowy coachmark (klucz LS).**
1084. **FE — SSR-safe placeholder dla `barbell analysis` — brak „flash” treści chronionej rolą.**
1085. **FE — Retry przycisku zapisu w `panelu administratora` po błędzie sieci z komunikatem RFC7807.**
1086. **FE — Paginacja „load more” zamiast infinite scroll w `superadmin/import` — wybór użytkownika.**
1087. **FE — Porównanie Sinclair side-by-side w `centrum powiadomień` — dwie karty obok na desktopie.**
1088. **FE — Eksport PNG wykresu z `aktualnościach klubowych` — canvas `toBlob` + pobranie z nazwą pliku z datą.**
1089. **FE — Filtr zapisany w URL query dla `dzienniku treningów` — udostępnialny link do widoku.**
1090. **FE — Obsługa RTL (przyszłość EN) w komponentach `ankietach regeneracji` — mirror ikon strzałek.**
1091. **FE — Focus restoration po zamknięciu modala `planach treningowych V4` — powrót do przycisku wywołania.**
1092. **FE — Lista klawiszowa w `module obecności` — strzałki / Enter wg wzorca combobox.**
1093. **FE — Microcopy PL dla błędów walidacji `galerii mediów` — bez żargonu backendu.**
1094. **FE — Skeleton z dokładną wysokością wierszy `kolejce ćwiczeń dodatkowych` — eliminacja CLS.**
1095. **FE — Tryb druku dla `blogu klubu` — `@media print` ukrywa nav i przyciski.**
1096. **FE — Split view tablet: lista + szczegóły w `osi czasu zawodnika` jak iPad master-detail.**
1097. **FE — Badge „beta” przy eksperymentalnym `wynikach zawodów` — link do `/superadmin/developer`.**
1098. **FE — Integracja z `@vueuse/core` `useThrottleFn` dla wyszukiwania w `ustawieniach konta i 2FA`.**
1099. **FE — Obsługa `aria-live` dla toastów powiązanych z `module składek`.**
1100. **FE — Lazy hydrate opcjonalnie dla ciężkiego `imporcie CSV zawodników` — na flagę eksperymentalną.**
1101. **FE — Pin zakładki `czacie trener–zawodnik` w localStorage — przywrócona aktywna tab po odświeżeniu.**
1102. **FE — Reduced motion: wyłączenie animacji kart w `filtrach globalnych belki` przy `prefers-reduced-motion`.**
1103. **FE — Hint przy pierwszym wejściu w `profilu zawodnika` — jednorazowy coachmark (klucz LS).**
1104. **FE — SSR-safe placeholder dla `wykresach Sinclair / dwubój` — brak „flash” treści chronionej rolą.**
1105. **FE — Retry przycisku zapisu w `kalendarzu zawodów` po błędzie sieci z komunikatem RFC7807.**
1106. **FE — Paginacja „load more” zamiast infinite scroll w `raportach PDF dla kadry` — wybór użytkownika.**
1107. **FE — Porównanie Sinclair side-by-side w `rankingu publicznym` — dwie karty obok na desktopie.**
1108. **FE — Eksport PNG wykresu z `narzędziach SuperAdmin` — canvas `toBlob` + pobranie z nazwą pliku z datą.**
1109. **FE — Filtr zapisany w URL query dla `porównaniu zawodników` — udostępnialny link do widoku.**
1110. **FE — Obsługa RTL (przyszłość EN) w komponentach `panelu trenera` — mirror ikon strzałek.**
1111. **FE — Focus restoration po zamknięciu modala `barbell analysis` — powrót do przycisku wywołania.**
1112. **FE — Lista klawiszowa w `panelu administratora` — strzałki / Enter wg wzorca combobox.**
1113. **FE — Microcopy PL dla błędów walidacji `superadmin/import` — bez żargonu backendu.**
1114. **FE — Skeleton z dokładną wysokością wierszy `centrum powiadomień` — eliminacja CLS.**
1115. **FE — Tryb druku dla `aktualnościach klubowych` — `@media print` ukrywa nav i przyciski.**
1116. **FE — Split view tablet: lista + szczegóły w `dzienniku treningów` jak iPad master-detail.**
1117. **FE — Badge „beta” przy eksperymentalnym `ankietach regeneracji` — link do `/superadmin/developer`.**
1118. **FE — Integracja z `@vueuse/core` `useThrottleFn` dla wyszukiwania w `planach treningowych V4`.**
1119. **FE — Obsługa `aria-live` dla toastów powiązanych z `module obecności`.**
1120. **FE — Lazy hydrate opcjonalnie dla ciężkiego `galerii mediów` — na flagę eksperymentalną.**
1121. **FE — Pin zakładki `kolejce ćwiczeń dodatkowych` w localStorage — przywrócona aktywna tab po odświeżeniu.**
1122. **FE — Reduced motion: wyłączenie animacji kart w `blogu klubu` przy `prefers-reduced-motion`.**
1123. **FE — Hint przy pierwszym wejściu w `osi czasu zawodnika` — jednorazowy coachmark (klucz LS).**
1124. **FE — SSR-safe placeholder dla `wynikach zawodów` — brak „flash” treści chronionej rolą.**
1125. **FE — Retry przycisku zapisu w `ustawieniach konta i 2FA` po błędzie sieci z komunikatem RFC7807.**
1126. **FE — Paginacja „load more” zamiast infinite scroll w `module składek` — wybór użytkownika.**
1127. **FE — Porównanie Sinclair side-by-side w `imporcie CSV zawodników` — dwie karty obok na desktopie.**
1128. **FE — Eksport PNG wykresu z `czacie trener–zawodnik` — canvas `toBlob` + pobranie z nazwą pliku z datą.**
1129. **FE — Filtr zapisany w URL query dla `filtrach globalnych belki` — udostępnialny link do widoku.**
1130. **FE — Obsługa RTL (przyszłość EN) w komponentach `profilu zawodnika` — mirror ikon strzałek.**
1131. **FE — Focus restoration po zamknięciu modala `wykresach Sinclair / dwubój` — powrót do przycisku wywołania.**
1132. **FE — Lista klawiszowa w `kalendarzu zawodów` — strzałki / Enter wg wzorca combobox.**
1133. **FE — Microcopy PL dla błędów walidacji `raportach PDF dla kadry` — bez żargonu backendu.**
1134. **FE — Skeleton z dokładną wysokością wierszy `rankingu publicznym` — eliminacja CLS.**
1135. **FE — Tryb druku dla `narzędziach SuperAdmin` — `@media print` ukrywa nav i przyciski.**
1136. **FE — Split view tablet: lista + szczegóły w `porównaniu zawodników` jak iPad master-detail.**
1137. **FE — Badge „beta” przy eksperymentalnym `panelu trenera` — link do `/superadmin/developer`.**
1138. **FE — Integracja z `@vueuse/core` `useThrottleFn` dla wyszukiwania w `barbell analysis`.**
1139. **FE — Obsługa `aria-live` dla toastów powiązanych z `panelu administratora`.**
1140. **FE — Lazy hydrate opcjonalnie dla ciężkiego `superadmin/import` — na flagę eksperymentalną.**
1141. **FE — Pin zakładki `centrum powiadomień` w localStorage — przywrócona aktywna tab po odświeżeniu.**
1142. **FE — Reduced motion: wyłączenie animacji kart w `aktualnościach klubowych` przy `prefers-reduced-motion`.**
1143. **FE — Hint przy pierwszym wejściu w `dzienniku treningów` — jednorazowy coachmark (klucz LS).**
1144. **FE — SSR-safe placeholder dla `ankietach regeneracji` — brak „flash” treści chronionej rolą.**
1145. **FE — Retry przycisku zapisu w `planach treningowych V4` po błędzie sieci z komunikatem RFC7807.**
1146. **FE — Paginacja „load more” zamiast infinite scroll w `module obecności` — wybór użytkownika.**
1147. **FE — Porównanie Sinclair side-by-side w `galerii mediów` — dwie karty obok na desktopie.**
1148. **FE — Eksport PNG wykresu z `kolejce ćwiczeń dodatkowych` — canvas `toBlob` + pobranie z nazwą pliku z datą.**
1149. **FE — Filtr zapisany w URL query dla `blogu klubu` — udostępnialny link do widoku.**
1150. **FE — Obsługa RTL (przyszłość EN) w komponentach `osi czasu zawodnika` — mirror ikon strzałek.**
1151. **FE — Focus restoration po zamknięciu modala `wynikach zawodów` — powrót do przycisku wywołania.**
1152. **FE — Lista klawiszowa w `ustawieniach konta i 2FA` — strzałki / Enter wg wzorca combobox.**
1153. **FE — Microcopy PL dla błędów walidacji `module składek` — bez żargonu backendu.**
1154. **FE — Skeleton z dokładną wysokością wierszy `imporcie CSV zawodników` — eliminacja CLS.**
1155. **FE — Tryb druku dla `czacie trener–zawodnik` — `@media print` ukrywa nav i przyciski.**
1156. **FE — Split view tablet: lista + szczegóły w `filtrach globalnych belki` jak iPad master-detail.**
1157. **FE — Badge „beta” przy eksperymentalnym `profilu zawodnika` — link do `/superadmin/developer`.**
1158. **FE — Integracja z `@vueuse/core` `useThrottleFn` dla wyszukiwania w `wykresach Sinclair / dwubój`.**
1159. **FE — Obsługa `aria-live` dla toastów powiązanych z `kalendarzu zawodów`.**
1160. **FE — Lazy hydrate opcjonalnie dla ciężkiego `raportach PDF dla kadry` — na flagę eksperymentalną.**
1161. **FE — Pin zakładki `rankingu publicznym` w localStorage — przywrócona aktywna tab po odświeżeniu.**
1162. **FE — Reduced motion: wyłączenie animacji kart w `narzędziach SuperAdmin` przy `prefers-reduced-motion`.**
1163. **FE — Hint przy pierwszym wejściu w `porównaniu zawodników` — jednorazowy coachmark (klucz LS).**
1164. **FE — SSR-safe placeholder dla `panelu trenera` — brak „flash” treści chronionej rolą.**
1165. **FE — Retry przycisku zapisu w `barbell analysis` po błędzie sieci z komunikatem RFC7807.**
1166. **FE — Paginacja „load more” zamiast infinite scroll w `panelu administratora` — wybór użytkownika.**
1167. **FE — Porównanie Sinclair side-by-side w `superadmin/import` — dwie karty obok na desktopie.**
1168. **FE — Eksport PNG wykresu z `centrum powiadomień` — canvas `toBlob` + pobranie z nazwą pliku z datą.**
1169. **FE — Filtr zapisany w URL query dla `aktualnościach klubowych` — udostępnialny link do widoku.**
1170. **FE — Obsługa RTL (przyszłość EN) w komponentach `dzienniku treningów` — mirror ikon strzałek.**
1171. **FE — Focus restoration po zamknięciu modala `ankietach regeneracji` — powrót do przycisku wywołania.**
1172. **FE — Lista klawiszowa w `planach treningowych V4` — strzałki / Enter wg wzorca combobox.**
1173. **FE — Microcopy PL dla błędów walidacji `module obecności` — bez żargonu backendu.**
1174. **FE — Skeleton z dokładną wysokością wierszy `galerii mediów` — eliminacja CLS.**
1175. **FE — Tryb druku dla `kolejce ćwiczeń dodatkowych` — `@media print` ukrywa nav i przyciski.**
1176. **FE — Split view tablet: lista + szczegóły w `blogu klubu` jak iPad master-detail.**
1177. **FE — Badge „beta” przy eksperymentalnym `osi czasu zawodnika` — link do `/superadmin/developer`.**
1178. **FE — Integracja z `@vueuse/core` `useThrottleFn` dla wyszukiwania w `wynikach zawodów`.**
1179. **FE — Obsługa `aria-live` dla toastów powiązanych z `ustawieniach konta i 2FA`.**
1180. **FE — Lazy hydrate opcjonalnie dla ciężkiego `module składek` — na flagę eksperymentalną.**
1181. **FE — Pin zakładki `imporcie CSV zawodników` w localStorage — przywrócona aktywna tab po odświeżeniu.**
1182. **FE — Reduced motion: wyłączenie animacji kart w `czacie trener–zawodnik` przy `prefers-reduced-motion`.**
1183. **FE — Hint przy pierwszym wejściu w `filtrach globalnych belki` — jednorazowy coachmark (klucz LS).**
1184. **FE — SSR-safe placeholder dla `profilu zawodnika` — brak „flash” treści chronionej rolą.**
1185. **FE — Retry przycisku zapisu w `wykresach Sinclair / dwubój` po błędzie sieci z komunikatem RFC7807.**
1186. **FE — Paginacja „load more” zamiast infinite scroll w `kalendarzu zawodów` — wybór użytkownika.**
1187. **FE — Porównanie Sinclair side-by-side w `raportach PDF dla kadry` — dwie karty obok na desktopie.**
1188. **FE — Eksport PNG wykresu z `rankingu publicznym` — canvas `toBlob` + pobranie z nazwą pliku z datą.**
1189. **FE — Filtr zapisany w URL query dla `narzędziach SuperAdmin` — udostępnialny link do widoku.**
1190. **FE — Obsługa RTL (przyszłość EN) w komponentach `porównaniu zawodników` — mirror ikon strzałek.**
1191. **FE — Focus restoration po zamknięciu modala `panelu trenera` — powrót do przycisku wywołania.**
1192. **FE — Lista klawiszowa w `barbell analysis` — strzałki / Enter wg wzorca combobox.**
1193. **FE — Microcopy PL dla błędów walidacji `panelu administratora` — bez żargonu backendu.**
1194. **FE — Skeleton z dokładną wysokością wierszy `superadmin/import` — eliminacja CLS.**
1195. **FE — Tryb druku dla `centrum powiadomień` — `@media print` ukrywa nav i przyciski.**
1196. **FE — Split view tablet: lista + szczegóły w `aktualnościach klubowych` jak iPad master-detail.**
1197. **FE — Badge „beta” przy eksperymentalnym `dzienniku treningów` — link do `/superadmin/developer`.**
1198. **FE — Integracja z `@vueuse/core` `useThrottleFn` dla wyszukiwania w `ankietach regeneracji`.**
1199. **FE — Obsługa `aria-live` dla toastów powiązanych z `planach treningowych V4`.**
1200. **FE — Lazy hydrate opcjonalnie dla ciężkiego `module obecności` — na flagę eksperymentalną.**
1201. **FE — Pin zakładki `galerii mediów` w localStorage — przywrócona aktywna tab po odświeżeniu.**
1202. **FE — Reduced motion: wyłączenie animacji kart w `kolejce ćwiczeń dodatkowych` przy `prefers-reduced-motion`.**
1203. **FE — Hint przy pierwszym wejściu w `blogu klubu` — jednorazowy coachmark (klucz LS).**
1204. **FE — SSR-safe placeholder dla `osi czasu zawodnika` — brak „flash” treści chronionej rolą.**
1205. **FE — Retry przycisku zapisu w `wynikach zawodów` po błędzie sieci z komunikatem RFC7807.**
1206. **FE — Paginacja „load more” zamiast infinite scroll w `ustawieniach konta i 2FA` — wybór użytkownika.**
1207. **FE — Porównanie Sinclair side-by-side w `module składek` — dwie karty obok na desktopie.**
1208. **FE — Eksport PNG wykresu z `imporcie CSV zawodników` — canvas `toBlob` + pobranie z nazwą pliku z datą.**
1209. **FE — Filtr zapisany w URL query dla `czacie trener–zawodnik` — udostępnialny link do widoku.**
1210. **FE — Obsługa RTL (przyszłość EN) w komponentach `filtrach globalnych belki` — mirror ikon strzałek.**
1211. **FE — Focus restoration po zamknięciu modala `profilu zawodnika` — powrót do przycisku wywołania.**
1212. **FE — Lista klawiszowa w `wykresach Sinclair / dwubój` — strzałki / Enter wg wzorca combobox.**
1213. **FE — Microcopy PL dla błędów walidacji `kalendarzu zawodów` — bez żargonu backendu.**
1214. **FE — Skeleton z dokładną wysokością wierszy `raportach PDF dla kadry` — eliminacja CLS.**
1215. **FE — Tryb druku dla `rankingu publicznym` — `@media print` ukrywa nav i przyciski.**
1216. **FE — Split view tablet: lista + szczegóły w `narzędziach SuperAdmin` jak iPad master-detail.**
1217. **FE — Badge „beta” przy eksperymentalnym `porównaniu zawodników` — link do `/superadmin/developer`.**
1218. **FE — Integracja z `@vueuse/core` `useThrottleFn` dla wyszukiwania w `panelu trenera`.**
1219. **FE — Obsługa `aria-live` dla toastów powiązanych z `barbell analysis`.**
1220. **FE — Lazy hydrate opcjonalnie dla ciężkiego `panelu administratora` — na flagę eksperymentalną.**
1221. **FE — Pin zakładki `superadmin/import` w localStorage — przywrócona aktywna tab po odświeżeniu.**
1222. **FE — Reduced motion: wyłączenie animacji kart w `centrum powiadomień` przy `prefers-reduced-motion`.**
1223. **FE — Hint przy pierwszym wejściu w `aktualnościach klubowych` — jednorazowy coachmark (klucz LS).**
1224. **FE — SSR-safe placeholder dla `dzienniku treningów` — brak „flash” treści chronionej rolą.**
1225. **FE — Retry przycisku zapisu w `ankietach regeneracji` po błędzie sieci z komunikatem RFC7807.**
1226. **FE — Paginacja „load more” zamiast infinite scroll w `planach treningowych V4` — wybór użytkownika.**
1227. **FE — Porównanie Sinclair side-by-side w `module obecności` — dwie karty obok na desktopie.**
1228. **FE — Eksport PNG wykresu z `galerii mediów` — canvas `toBlob` + pobranie z nazwą pliku z datą.**
1229. **FE — Filtr zapisany w URL query dla `kolejce ćwiczeń dodatkowych` — udostępnialny link do widoku.**
1230. **FE — Obsługa RTL (przyszłość EN) w komponentach `blogu klubu` — mirror ikon strzałek.**
1231. **FE — Focus restoration po zamknięciu modala `osi czasu zawodnika` — powrót do przycisku wywołania.**
1232. **FE — Lista klawiszowa w `wynikach zawodów` — strzałki / Enter wg wzorca combobox.**
1233. **FE — Microcopy PL dla błędów walidacji `ustawieniach konta i 2FA` — bez żargonu backendu.**
1234. **FE — Skeleton z dokładną wysokością wierszy `module składek` — eliminacja CLS.**
1235. **FE — Tryb druku dla `imporcie CSV zawodników` — `@media print` ukrywa nav i przyciski.**
1236. **FE — Split view tablet: lista + szczegóły w `czacie trener–zawodnik` jak iPad master-detail.**
1237. **FE — Badge „beta” przy eksperymentalnym `filtrach globalnych belki` — link do `/superadmin/developer`.**
1238. **FE — Integracja z `@vueuse/core` `useThrottleFn` dla wyszukiwania w `profilu zawodnika`.**
1239. **FE — Obsługa `aria-live` dla toastów powiązanych z `wykresach Sinclair / dwubój`.**
1240. **FE — Lazy hydrate opcjonalnie dla ciężkiego `kalendarzu zawodów` — na flagę eksperymentalną.**
1241. **FE — Pin zakładki `raportach PDF dla kadry` w localStorage — przywrócona aktywna tab po odświeżeniu.**
1242. **FE — Reduced motion: wyłączenie animacji kart w `rankingu publicznym` przy `prefers-reduced-motion`.**
1243. **FE — Hint przy pierwszym wejściu w `narzędziach SuperAdmin` — jednorazowy coachmark (klucz LS).**
1244. **FE — SSR-safe placeholder dla `porównaniu zawodników` — brak „flash” treści chronionej rolą.**
1245. **FE — Retry przycisku zapisu w `panelu trenera` po błędzie sieci z komunikatem RFC7807.**
1246. **FE — Paginacja „load more” zamiast infinite scroll w `barbell analysis` — wybór użytkownika.**
1247. **FE — Porównanie Sinclair side-by-side w `panelu administratora` — dwie karty obok na desktopie.**
1248. **FE — Eksport PNG wykresu z `superadmin/import` — canvas `toBlob` + pobranie z nazwą pliku z datą.**
1249. **FE — Filtr zapisany w URL query dla `centrum powiadomień` — udostępnialny link do widoku.**
1250. **FE — Obsługa RTL (przyszłość EN) w komponentach `aktualnościach klubowych` — mirror ikon strzałek.**

### Backend — Rust, Axum, SQLite/Turso, worker, kolejki

1251. **BE — Migracja schema: kolumna JSON dla metadanych `dzienniku treningów` — backward compatible.**
1252. **BE — Batch endpoint PATCH dla `filtrach globalnych belki` — jedna transakcja, max N rekordów.**
1253. **BE — Healthcheck rozszerzony: ping DB + queue `aktualnościach klubowych` w `/api/health/detail`.**
1254. **BE — Distributed lock (advisory) przy cron `czacie trener–zawodnik` — jedna instancja joba.**
1255. **BE — Retention policy: usuń zamkniete rekordy `centrum powiadomień` starsze niż X mies.**
1256. **BE — Checksum ETag na GET `imporcie CSV zawodników` — warunkowe 304 dla aplikacji mobilnej.**
1257. **BE — Walidacja MIME przy upload powiązanym z `superadmin/import` — blokada EXE/ZIP.**
1258. **BE — Structured logging z `trace_id` dla łańcucha `module składek` → worker.**
1259. **BE — Circuit breaker wywołań zewnętrznych z modułu `panelu administratora` (np. PZPC).**
1260. **BE — Read replica routing dla raportów `ustawieniach konta i 2FA` — jeśli kiedyś cluster.**
1261. **BE — Prepared statement cache audit dla `barbell analysis` — brak alloc per request.**
1262. **BE — Secrets rotation playbook dla kluczy API używanych w `wynikach zawodów`.**
1263. **BE — Compaction / VACUUM plan dla tabel powiązanych z `panelu trenera`.**
1264. **BE — GDPR: anonimizacja athlete_id w logach audytu `osi czasu zawodnika` po żądaniu.**
1265. **BE — Protobuf lub MessagePack opcja dla mobilki `porównaniu zawodników` — mniejszy payload.**
1266. **BE — Webhook podpis HMAC dla zdarzeń `blogu klubu` — verify SHA256.**
1267. **BE — Pagination total count przybliżony dla `narzędziach SuperAdmin` — hyper.table dla dużych zbiorów.**
1268. **BE — Conflict response 409 z polem wersji optymistycznej dla `kolejce ćwiczeń dodatkowych`.**
1269. **BE — SQLite pragma tuning osobno dla workload `rankingu publicznym` read-heavy vs write.**
1270. **BE — Backup restore smoke: selektor losowych rekordów `galerii mediów` po restore.**
1271. **BE — Migracja schema: kolumna JSON dla metadanych `raportach PDF dla kadry` — backward compatible.**
1272. **BE — Batch endpoint PATCH dla `module obecności` — jedna transakcja, max N rekordów.**
1273. **BE — Healthcheck rozszerzony: ping DB + queue `kalendarzu zawodów` w `/api/health/detail`.**
1274. **BE — Distributed lock (advisory) przy cron `planach treningowych V4` — jedna instancja joba.**
1275. **BE — Retention policy: usuń zamkniete rekordy `wykresach Sinclair / dwubój` starsze niż X mies.**
1276. **BE — Checksum ETag na GET `ankietach regeneracji` — warunkowe 304 dla aplikacji mobilnej.**
1277. **BE — Walidacja MIME przy upload powiązanym z `profilu zawodnika` — blokada EXE/ZIP.**
1278. **BE — Structured logging z `trace_id` dla łańcucha `dzienniku treningów` → worker.**
1279. **BE — Circuit breaker wywołań zewnętrznych z modułu `filtrach globalnych belki` (np. PZPC).**
1280. **BE — Read replica routing dla raportów `aktualnościach klubowych` — jeśli kiedyś cluster.**
1281. **BE — Prepared statement cache audit dla `czacie trener–zawodnik` — brak alloc per request.**
1282. **BE — Secrets rotation playbook dla kluczy API używanych w `centrum powiadomień`.**
1283. **BE — Compaction / VACUUM plan dla tabel powiązanych z `imporcie CSV zawodników`.**
1284. **BE — GDPR: anonimizacja athlete_id w logach audytu `superadmin/import` po żądaniu.**
1285. **BE — Protobuf lub MessagePack opcja dla mobilki `module składek` — mniejszy payload.**
1286. **BE — Webhook podpis HMAC dla zdarzeń `panelu administratora` — verify SHA256.**
1287. **BE — Pagination total count przybliżony dla `ustawieniach konta i 2FA` — hyper.table dla dużych zbiorów.**
1288. **BE — Conflict response 409 z polem wersji optymistycznej dla `barbell analysis`.**
1289. **BE — SQLite pragma tuning osobno dla workload `wynikach zawodów` read-heavy vs write.**
1290. **BE — Backup restore smoke: selektor losowych rekordów `panelu trenera` po restore.**
1291. **BE — Migracja schema: kolumna JSON dla metadanych `osi czasu zawodnika` — backward compatible.**
1292. **BE — Batch endpoint PATCH dla `porównaniu zawodników` — jedna transakcja, max N rekordów.**
1293. **BE — Healthcheck rozszerzony: ping DB + queue `blogu klubu` w `/api/health/detail`.**
1294. **BE — Distributed lock (advisory) przy cron `narzędziach SuperAdmin` — jedna instancja joba.**
1295. **BE — Retention policy: usuń zamkniete rekordy `kolejce ćwiczeń dodatkowych` starsze niż X mies.**
1296. **BE — Checksum ETag na GET `rankingu publicznym` — warunkowe 304 dla aplikacji mobilnej.**
1297. **BE — Walidacja MIME przy upload powiązanym z `galerii mediów` — blokada EXE/ZIP.**
1298. **BE — Structured logging z `trace_id` dla łańcucha `raportach PDF dla kadry` → worker.**
1299. **BE — Circuit breaker wywołań zewnętrznych z modułu `module obecności` (np. PZPC).**
1300. **BE — Read replica routing dla raportów `kalendarzu zawodów` — jeśli kiedyś cluster.**
1301. **BE — Prepared statement cache audit dla `planach treningowych V4` — brak alloc per request.**
1302. **BE — Secrets rotation playbook dla kluczy API używanych w `wykresach Sinclair / dwubój`.**
1303. **BE — Compaction / VACUUM plan dla tabel powiązanych z `ankietach regeneracji`.**
1304. **BE — GDPR: anonimizacja athlete_id w logach audytu `profilu zawodnika` po żądaniu.**
1305. **BE — Protobuf lub MessagePack opcja dla mobilki `dzienniku treningów` — mniejszy payload.**
1306. **BE — Webhook podpis HMAC dla zdarzeń `filtrach globalnych belki` — verify SHA256.**
1307. **BE — Pagination total count przybliżony dla `aktualnościach klubowych` — hyper.table dla dużych zbiorów.**
1308. **BE — Conflict response 409 z polem wersji optymistycznej dla `czacie trener–zawodnik`.**
1309. **BE — SQLite pragma tuning osobno dla workload `centrum powiadomień` read-heavy vs write.**
1310. **BE — Backup restore smoke: selektor losowych rekordów `imporcie CSV zawodników` po restore.**
1311. **BE — Migracja schema: kolumna JSON dla metadanych `superadmin/import` — backward compatible.**
1312. **BE — Batch endpoint PATCH dla `module składek` — jedna transakcja, max N rekordów.**
1313. **BE — Healthcheck rozszerzony: ping DB + queue `panelu administratora` w `/api/health/detail`.**
1314. **BE — Distributed lock (advisory) przy cron `ustawieniach konta i 2FA` — jedna instancja joba.**
1315. **BE — Retention policy: usuń zamkniete rekordy `barbell analysis` starsze niż X mies.**
1316. **BE — Checksum ETag na GET `wynikach zawodów` — warunkowe 304 dla aplikacji mobilnej.**
1317. **BE — Walidacja MIME przy upload powiązanym z `panelu trenera` — blokada EXE/ZIP.**
1318. **BE — Structured logging z `trace_id` dla łańcucha `osi czasu zawodnika` → worker.**
1319. **BE — Circuit breaker wywołań zewnętrznych z modułu `porównaniu zawodników` (np. PZPC).**
1320. **BE — Read replica routing dla raportów `blogu klubu` — jeśli kiedyś cluster.**
1321. **BE — Prepared statement cache audit dla `narzędziach SuperAdmin` — brak alloc per request.**
1322. **BE — Secrets rotation playbook dla kluczy API używanych w `kolejce ćwiczeń dodatkowych`.**
1323. **BE — Compaction / VACUUM plan dla tabel powiązanych z `rankingu publicznym`.**
1324. **BE — GDPR: anonimizacja athlete_id w logach audytu `galerii mediów` po żądaniu.**
1325. **BE — Protobuf lub MessagePack opcja dla mobilki `raportach PDF dla kadry` — mniejszy payload.**
1326. **BE — Webhook podpis HMAC dla zdarzeń `module obecności` — verify SHA256.**
1327. **BE — Pagination total count przybliżony dla `kalendarzu zawodów` — hyper.table dla dużych zbiorów.**
1328. **BE — Conflict response 409 z polem wersji optymistycznej dla `planach treningowych V4`.**
1329. **BE — SQLite pragma tuning osobno dla workload `wykresach Sinclair / dwubój` read-heavy vs write.**
1330. **BE — Backup restore smoke: selektor losowych rekordów `ankietach regeneracji` po restore.**
1331. **BE — Migracja schema: kolumna JSON dla metadanych `profilu zawodnika` — backward compatible.**
1332. **BE — Batch endpoint PATCH dla `dzienniku treningów` — jedna transakcja, max N rekordów.**
1333. **BE — Healthcheck rozszerzony: ping DB + queue `filtrach globalnych belki` w `/api/health/detail`.**
1334. **BE — Distributed lock (advisory) przy cron `aktualnościach klubowych` — jedna instancja joba.**
1335. **BE — Retention policy: usuń zamkniete rekordy `czacie trener–zawodnik` starsze niż X mies.**
1336. **BE — Checksum ETag na GET `centrum powiadomień` — warunkowe 304 dla aplikacji mobilnej.**
1337. **BE — Walidacja MIME przy upload powiązanym z `imporcie CSV zawodników` — blokada EXE/ZIP.**
1338. **BE — Structured logging z `trace_id` dla łańcucha `superadmin/import` → worker.**
1339. **BE — Circuit breaker wywołań zewnętrznych z modułu `module składek` (np. PZPC).**
1340. **BE — Read replica routing dla raportów `panelu administratora` — jeśli kiedyś cluster.**
1341. **BE — Prepared statement cache audit dla `ustawieniach konta i 2FA` — brak alloc per request.**
1342. **BE — Secrets rotation playbook dla kluczy API używanych w `barbell analysis`.**
1343. **BE — Compaction / VACUUM plan dla tabel powiązanych z `wynikach zawodów`.**
1344. **BE — GDPR: anonimizacja athlete_id w logach audytu `panelu trenera` po żądaniu.**
1345. **BE — Protobuf lub MessagePack opcja dla mobilki `osi czasu zawodnika` — mniejszy payload.**
1346. **BE — Webhook podpis HMAC dla zdarzeń `porównaniu zawodników` — verify SHA256.**
1347. **BE — Pagination total count przybliżony dla `blogu klubu` — hyper.table dla dużych zbiorów.**
1348. **BE — Conflict response 409 z polem wersji optymistycznej dla `narzędziach SuperAdmin`.**
1349. **BE — SQLite pragma tuning osobno dla workload `kolejce ćwiczeń dodatkowych` read-heavy vs write.**
1350. **BE — Backup restore smoke: selektor losowych rekordów `rankingu publicznym` po restore.**
1351. **BE — Migracja schema: kolumna JSON dla metadanych `galerii mediów` — backward compatible.**
1352. **BE — Batch endpoint PATCH dla `raportach PDF dla kadry` — jedna transakcja, max N rekordów.**
1353. **BE — Healthcheck rozszerzony: ping DB + queue `module obecności` w `/api/health/detail`.**
1354. **BE — Distributed lock (advisory) przy cron `kalendarzu zawodów` — jedna instancja joba.**
1355. **BE — Retention policy: usuń zamkniete rekordy `planach treningowych V4` starsze niż X mies.**
1356. **BE — Checksum ETag na GET `wykresach Sinclair / dwubój` — warunkowe 304 dla aplikacji mobilnej.**
1357. **BE — Walidacja MIME przy upload powiązanym z `ankietach regeneracji` — blokada EXE/ZIP.**
1358. **BE — Structured logging z `trace_id` dla łańcucha `profilu zawodnika` → worker.**
1359. **BE — Circuit breaker wywołań zewnętrznych z modułu `dzienniku treningów` (np. PZPC).**
1360. **BE — Read replica routing dla raportów `filtrach globalnych belki` — jeśli kiedyś cluster.**
1361. **BE — Prepared statement cache audit dla `aktualnościach klubowych` — brak alloc per request.**
1362. **BE — Secrets rotation playbook dla kluczy API używanych w `czacie trener–zawodnik`.**
1363. **BE — Compaction / VACUUM plan dla tabel powiązanych z `centrum powiadomień`.**
1364. **BE — GDPR: anonimizacja athlete_id w logach audytu `imporcie CSV zawodników` po żądaniu.**
1365. **BE — Protobuf lub MessagePack opcja dla mobilki `superadmin/import` — mniejszy payload.**
1366. **BE — Webhook podpis HMAC dla zdarzeń `module składek` — verify SHA256.**
1367. **BE — Pagination total count przybliżony dla `panelu administratora` — hyper.table dla dużych zbiorów.**
1368. **BE — Conflict response 409 z polem wersji optymistycznej dla `ustawieniach konta i 2FA`.**
1369. **BE — SQLite pragma tuning osobno dla workload `barbell analysis` read-heavy vs write.**
1370. **BE — Backup restore smoke: selektor losowych rekordów `wynikach zawodów` po restore.**
1371. **BE — Migracja schema: kolumna JSON dla metadanych `panelu trenera` — backward compatible.**
1372. **BE — Batch endpoint PATCH dla `osi czasu zawodnika` — jedna transakcja, max N rekordów.**
1373. **BE — Healthcheck rozszerzony: ping DB + queue `porównaniu zawodników` w `/api/health/detail`.**
1374. **BE — Distributed lock (advisory) przy cron `blogu klubu` — jedna instancja joba.**
1375. **BE — Retention policy: usuń zamkniete rekordy `narzędziach SuperAdmin` starsze niż X mies.**
1376. **BE — Checksum ETag na GET `kolejce ćwiczeń dodatkowych` — warunkowe 304 dla aplikacji mobilnej.**
1377. **BE — Walidacja MIME przy upload powiązanym z `rankingu publicznym` — blokada EXE/ZIP.**
1378. **BE — Structured logging z `trace_id` dla łańcucha `galerii mediów` → worker.**
1379. **BE — Circuit breaker wywołań zewnętrznych z modułu `raportach PDF dla kadry` (np. PZPC).**
1380. **BE — Read replica routing dla raportów `module obecności` — jeśli kiedyś cluster.**
1381. **BE — Prepared statement cache audit dla `kalendarzu zawodów` — brak alloc per request.**
1382. **BE — Secrets rotation playbook dla kluczy API używanych w `planach treningowych V4`.**
1383. **BE — Compaction / VACUUM plan dla tabel powiązanych z `wykresach Sinclair / dwubój`.**
1384. **BE — GDPR: anonimizacja athlete_id w logach audytu `ankietach regeneracji` po żądaniu.**
1385. **BE — Protobuf lub MessagePack opcja dla mobilki `profilu zawodnika` — mniejszy payload.**
1386. **BE — Webhook podpis HMAC dla zdarzeń `dzienniku treningów` — verify SHA256.**
1387. **BE — Pagination total count przybliżony dla `filtrach globalnych belki` — hyper.table dla dużych zbiorów.**
1388. **BE — Conflict response 409 z polem wersji optymistycznej dla `aktualnościach klubowych`.**
1389. **BE — SQLite pragma tuning osobno dla workload `czacie trener–zawodnik` read-heavy vs write.**
1390. **BE — Backup restore smoke: selektor losowych rekordów `centrum powiadomień` po restore.**
1391. **BE — Migracja schema: kolumna JSON dla metadanych `imporcie CSV zawodników` — backward compatible.**
1392. **BE — Batch endpoint PATCH dla `superadmin/import` — jedna transakcja, max N rekordów.**
1393. **BE — Healthcheck rozszerzony: ping DB + queue `module składek` w `/api/health/detail`.**
1394. **BE — Distributed lock (advisory) przy cron `panelu administratora` — jedna instancja joba.**
1395. **BE — Retention policy: usuń zamkniete rekordy `ustawieniach konta i 2FA` starsze niż X mies.**
1396. **BE — Checksum ETag na GET `barbell analysis` — warunkowe 304 dla aplikacji mobilnej.**
1397. **BE — Walidacja MIME przy upload powiązanym z `wynikach zawodów` — blokada EXE/ZIP.**
1398. **BE — Structured logging z `trace_id` dla łańcucha `panelu trenera` → worker.**
1399. **BE — Circuit breaker wywołań zewnętrznych z modułu `osi czasu zawodnika` (np. PZPC).**
1400. **BE — Read replica routing dla raportów `porównaniu zawodników` — jeśli kiedyś cluster.**
1401. **BE — Prepared statement cache audit dla `blogu klubu` — brak alloc per request.**
1402. **BE — Secrets rotation playbook dla kluczy API używanych w `narzędziach SuperAdmin`.**
1403. **BE — Compaction / VACUUM plan dla tabel powiązanych z `kolejce ćwiczeń dodatkowych`.**
1404. **BE — GDPR: anonimizacja athlete_id w logach audytu `rankingu publicznym` po żądaniu.**
1405. **BE — Protobuf lub MessagePack opcja dla mobilki `galerii mediów` — mniejszy payload.**
1406. **BE — Webhook podpis HMAC dla zdarzeń `raportach PDF dla kadry` — verify SHA256.**
1407. **BE — Pagination total count przybliżony dla `module obecności` — hyper.table dla dużych zbiorów.**
1408. **BE — Conflict response 409 z polem wersji optymistycznej dla `kalendarzu zawodów`.**
1409. **BE — SQLite pragma tuning osobno dla workload `planach treningowych V4` read-heavy vs write.**
1410. **BE — Backup restore smoke: selektor losowych rekordów `wykresach Sinclair / dwubój` po restore.**
1411. **BE — Migracja schema: kolumna JSON dla metadanych `ankietach regeneracji` — backward compatible.**
1412. **BE — Batch endpoint PATCH dla `profilu zawodnika` — jedna transakcja, max N rekordów.**
1413. **BE — Healthcheck rozszerzony: ping DB + queue `dzienniku treningów` w `/api/health/detail`.**
1414. **BE — Distributed lock (advisory) przy cron `filtrach globalnych belki` — jedna instancja joba.**
1415. **BE — Retention policy: usuń zamkniete rekordy `aktualnościach klubowych` starsze niż X mies.**
1416. **BE — Checksum ETag na GET `czacie trener–zawodnik` — warunkowe 304 dla aplikacji mobilnej.**
1417. **BE — Walidacja MIME przy upload powiązanym z `centrum powiadomień` — blokada EXE/ZIP.**
1418. **BE — Structured logging z `trace_id` dla łańcucha `imporcie CSV zawodników` → worker.**
1419. **BE — Circuit breaker wywołań zewnętrznych z modułu `superadmin/import` (np. PZPC).**
1420. **BE — Read replica routing dla raportów `module składek` — jeśli kiedyś cluster.**
1421. **BE — Prepared statement cache audit dla `panelu administratora` — brak alloc per request.**
1422. **BE — Secrets rotation playbook dla kluczy API używanych w `ustawieniach konta i 2FA`.**
1423. **BE — Compaction / VACUUM plan dla tabel powiązanych z `barbell analysis`.**
1424. **BE — GDPR: anonimizacja athlete_id w logach audytu `wynikach zawodów` po żądaniu.**
1425. **BE — Protobuf lub MessagePack opcja dla mobilki `panelu trenera` — mniejszy payload.**
1426. **BE — Webhook podpis HMAC dla zdarzeń `osi czasu zawodnika` — verify SHA256.**
1427. **BE — Pagination total count przybliżony dla `porównaniu zawodników` — hyper.table dla dużych zbiorów.**
1428. **BE — Conflict response 409 z polem wersji optymistycznej dla `blogu klubu`.**
1429. **BE — SQLite pragma tuning osobno dla workload `narzędziach SuperAdmin` read-heavy vs write.**
1430. **BE — Backup restore smoke: selektor losowych rekordów `kolejce ćwiczeń dodatkowych` po restore.**
1431. **BE — Migracja schema: kolumna JSON dla metadanych `rankingu publicznym` — backward compatible.**
1432. **BE — Batch endpoint PATCH dla `galerii mediów` — jedna transakcja, max N rekordów.**
1433. **BE — Healthcheck rozszerzony: ping DB + queue `raportach PDF dla kadry` w `/api/health/detail`.**
1434. **BE — Distributed lock (advisory) przy cron `module obecności` — jedna instancja joba.**
1435. **BE — Retention policy: usuń zamkniete rekordy `kalendarzu zawodów` starsze niż X mies.**
1436. **BE — Checksum ETag na GET `planach treningowych V4` — warunkowe 304 dla aplikacji mobilnej.**
1437. **BE — Walidacja MIME przy upload powiązanym z `wykresach Sinclair / dwubój` — blokada EXE/ZIP.**
1438. **BE — Structured logging z `trace_id` dla łańcucha `ankietach regeneracji` → worker.**
1439. **BE — Circuit breaker wywołań zewnętrznych z modułu `profilu zawodnika` (np. PZPC).**
1440. **BE — Read replica routing dla raportów `dzienniku treningów` — jeśli kiedyś cluster.**
1441. **BE — Prepared statement cache audit dla `filtrach globalnych belki` — brak alloc per request.**
1442. **BE — Secrets rotation playbook dla kluczy API używanych w `aktualnościach klubowych`.**
1443. **BE — Compaction / VACUUM plan dla tabel powiązanych z `czacie trener–zawodnik`.**
1444. **BE — GDPR: anonimizacja athlete_id w logach audytu `centrum powiadomień` po żądaniu.**
1445. **BE — Protobuf lub MessagePack opcja dla mobilki `imporcie CSV zawodników` — mniejszy payload.**
1446. **BE — Webhook podpis HMAC dla zdarzeń `superadmin/import` — verify SHA256.**
1447. **BE — Pagination total count przybliżony dla `module składek` — hyper.table dla dużych zbiorów.**
1448. **BE — Conflict response 409 z polem wersji optymistycznej dla `panelu administratora`.**
1449. **BE — SQLite pragma tuning osobno dla workload `ustawieniach konta i 2FA` read-heavy vs write.**
1450. **BE — Backup restore smoke: selektor losowych rekordów `barbell analysis` po restore.**
1451. **BE — Migracja schema: kolumna JSON dla metadanych `wynikach zawodów` — backward compatible.**
1452. **BE — Batch endpoint PATCH dla `panelu trenera` — jedna transakcja, max N rekordów.**
1453. **BE — Healthcheck rozszerzony: ping DB + queue `osi czasu zawodnika` w `/api/health/detail`.**
1454. **BE — Distributed lock (advisory) przy cron `porównaniu zawodników` — jedna instancja joba.**
1455. **BE — Retention policy: usuń zamkniete rekordy `blogu klubu` starsze niż X mies.**
1456. **BE — Checksum ETag na GET `narzędziach SuperAdmin` — warunkowe 304 dla aplikacji mobilnej.**
1457. **BE — Walidacja MIME przy upload powiązanym z `kolejce ćwiczeń dodatkowych` — blokada EXE/ZIP.**
1458. **BE — Structured logging z `trace_id` dla łańcucha `rankingu publicznym` → worker.**
1459. **BE — Circuit breaker wywołań zewnętrznych z modułu `galerii mediów` (np. PZPC).**
1460. **BE — Read replica routing dla raportów `raportach PDF dla kadry` — jeśli kiedyś cluster.**
1461. **BE — Prepared statement cache audit dla `module obecności` — brak alloc per request.**
1462. **BE — Secrets rotation playbook dla kluczy API używanych w `kalendarzu zawodów`.**
1463. **BE — Compaction / VACUUM plan dla tabel powiązanych z `planach treningowych V4`.**
1464. **BE — GDPR: anonimizacja athlete_id w logach audytu `wykresach Sinclair / dwubój` po żądaniu.**
1465. **BE — Protobuf lub MessagePack opcja dla mobilki `ankietach regeneracji` — mniejszy payload.**
1466. **BE — Webhook podpis HMAC dla zdarzeń `profilu zawodnika` — verify SHA256.**
1467. **BE — Pagination total count przybliżony dla `dzienniku treningów` — hyper.table dla dużych zbiorów.**
1468. **BE — Conflict response 409 z polem wersji optymistycznej dla `filtrach globalnych belki`.**
1469. **BE — SQLite pragma tuning osobno dla workload `aktualnościach klubowych` read-heavy vs write.**
1470. **BE — Backup restore smoke: selektor losowych rekordów `czacie trener–zawodnik` po restore.**
1471. **BE — Migracja schema: kolumna JSON dla metadanych `centrum powiadomień` — backward compatible.**
1472. **BE — Batch endpoint PATCH dla `imporcie CSV zawodników` — jedna transakcja, max N rekordów.**
1473. **BE — Healthcheck rozszerzony: ping DB + queue `superadmin/import` w `/api/health/detail`.**
1474. **BE — Distributed lock (advisory) przy cron `module składek` — jedna instancja joba.**
1475. **BE — Retention policy: usuń zamkniete rekordy `panelu administratora` starsze niż X mies.**
1476. **BE — Checksum ETag na GET `ustawieniach konta i 2FA` — warunkowe 304 dla aplikacji mobilnej.**
1477. **BE — Walidacja MIME przy upload powiązanym z `barbell analysis` — blokada EXE/ZIP.**
1478. **BE — Structured logging z `trace_id` dla łańcucha `wynikach zawodów` → worker.**
1479. **BE — Circuit breaker wywołań zewnętrznych z modułu `panelu trenera` (np. PZPC).**
1480. **BE — Read replica routing dla raportów `osi czasu zawodnika` — jeśli kiedyś cluster.**
1481. **BE — Prepared statement cache audit dla `porównaniu zawodników` — brak alloc per request.**
1482. **BE — Secrets rotation playbook dla kluczy API używanych w `blogu klubu`.**
1483. **BE — Compaction / VACUUM plan dla tabel powiązanych z `narzędziach SuperAdmin`.**
1484. **BE — GDPR: anonimizacja athlete_id w logach audytu `kolejce ćwiczeń dodatkowych` po żądaniu.**
1485. **BE — Protobuf lub MessagePack opcja dla mobilki `rankingu publicznym` — mniejszy payload.**
1486. **BE — Webhook podpis HMAC dla zdarzeń `galerii mediów` — verify SHA256.**
1487. **BE — Pagination total count przybliżony dla `raportach PDF dla kadry` — hyper.table dla dużych zbiorów.**
1488. **BE — Conflict response 409 z polem wersji optymistycznej dla `module obecności`.**
1489. **BE — SQLite pragma tuning osobno dla workload `kalendarzu zawodów` read-heavy vs write.**
1490. **BE — Backup restore smoke: selektor losowych rekordów `planach treningowych V4` po restore.**
1491. **BE — Migracja schema: kolumna JSON dla metadanych `wykresach Sinclair / dwubój` — backward compatible.**
1492. **BE — Batch endpoint PATCH dla `ankietach regeneracji` — jedna transakcja, max N rekordów.**
1493. **BE — Healthcheck rozszerzony: ping DB + queue `profilu zawodnika` w `/api/health/detail`.**
1494. **BE — Distributed lock (advisory) przy cron `dzienniku treningów` — jedna instancja joba.**
1495. **BE — Retention policy: usuń zamkniete rekordy `filtrach globalnych belki` starsze niż X mies.**
1496. **BE — Checksum ETag na GET `aktualnościach klubowych` — warunkowe 304 dla aplikacji mobilnej.**
1497. **BE — Walidacja MIME przy upload powiązanym z `czacie trener–zawodnik` — blokada EXE/ZIP.**
1498. **BE — Structured logging z `trace_id` dla łańcucha `centrum powiadomień` → worker.**
1499. **BE — Circuit breaker wywołań zewnętrznych z modułu `imporcie CSV zawodników` (np. PZPC).**
1500. **BE — Read replica routing dla raportów `superadmin/import` — jeśli kiedyś cluster.**

### Mobilka — Flutter, iOS/Android, wearables, offline

1501. **MOB — Semantics label dla wykresu w `raportach PDF dla kadry` — TalkBack czyta trend.**
1502. **MOB — Picture-in-picture dla wideo instruktażowego w `barbell analysis` (Android).**
1503. **MOB — App Shortcuts static XML dla `dzienniku treningów` — aktualizacja przy loginie.**
1504. **MOB — Workmanager: jedna periodyczna synchronizacja `kolejce ćwiczeń dodatkowych` w tle (OS limits).**
1505. **MOB — Drift (SQLite) cache dla listy `module składek` — TTL i invalidacja po push.**
1506. **MOB — LiDAR / true depth — eksperyment AR dla pozycji startowej (R&D) w `wykresach Sinclair / dwubój`.**
1507. **MOB — Kotlin Multiplatform shared layer dla `porównaniu zawodników` — roadmap dzielenia logiki.**
1508. **MOB — Swift concurrency: `@MainActor` audit dla `centrum powiadomień` — brak glitchy UI.**
1509. **MOB — JNI crash guard przy pluginie natywnym powiązanym z `module obecności`.**
1510. **MOB — ProGuard rules dokumentacja dla release `wynikach zawodów` — bez obfuskacji modeli API.**
1511. **MOB — Test Farm: Firebase Test Lab matrix dla `filtrach globalnych belki` na 5 urządzeniach.**
1512. **MOB — Accessibility: min tap target 48 dla FAB w `rankingu publicznym`.**
1513. **MOB — LocaleDelegate: format daty zawodów ISO vs PL w `panelu administratora`.**
1514. **MOB — Navigation drawer jako alternatywa dla dolnego baru w `ankietach regeneracji` na tablet.**
1515. **MOB — EncryptedSharedPreferences dla tokenu przy `blogu klubu` — hardening.**
1516. **MOB — Screenshot detection callback — blur wrażliwych pól w `imporcie CSV zawodników`.**
1517. **MOB — Insets.padding dla gesture navigation w `kalendarzu zawodów` — Android 14+.**
1518. **MOB — Flutter łączenie z native chat intents (`mailto:` fallback) z `panelu trenera`.**
1519. **MOB — Performance overlay dev-only dla FPS przy scroll `aktualnościach klubowych`.**
1520. **MOB — Maestro / Patrol E2E flow `galerii mediów` — YAML scenariusze.**
1521. **MOB — Semantics label dla wykresu w `ustawieniach konta i 2FA` — TalkBack czyta trend.**
1522. **MOB — Picture-in-picture dla wideo instruktażowego w `profilu zawodnika` (Android).**
1523. **MOB — App Shortcuts static XML dla `narzędziach SuperAdmin` — aktualizacja przy loginie.**
1524. **MOB — Workmanager: jedna periodyczna synchronizacja `superadmin/import` w tle (OS limits).**
1525. **MOB — Drift (SQLite) cache dla listy `planach treningowych V4` — TTL i invalidacja po push.**
1526. **MOB — LiDAR / true depth — eksperyment AR dla pozycji startowej (R&D) w `osi czasu zawodnika`.**
1527. **MOB — Kotlin Multiplatform shared layer dla `czacie trener–zawodnik` — roadmap dzielenia logiki.**
1528. **MOB — Swift concurrency: `@MainActor` audit dla `raportach PDF dla kadry` — brak glitchy UI.**
1529. **MOB — JNI crash guard przy pluginie natywnym powiązanym z `barbell analysis`.**
1530. **MOB — ProGuard rules dokumentacja dla release `dzienniku treningów` — bez obfuskacji modeli API.**
1531. **MOB — Test Farm: Firebase Test Lab matrix dla `kolejce ćwiczeń dodatkowych` na 5 urządzeniach.**
1532. **MOB — Accessibility: min tap target 48 dla FAB w `module składek`.**
1533. **MOB — LocaleDelegate: format daty zawodów ISO vs PL w `wykresach Sinclair / dwubój`.**
1534. **MOB — Navigation drawer jako alternatywa dla dolnego baru w `porównaniu zawodników` na tablet.**
1535. **MOB — EncryptedSharedPreferences dla tokenu przy `centrum powiadomień` — hardening.**
1536. **MOB — Screenshot detection callback — blur wrażliwych pól w `module obecności`.**
1537. **MOB — Insets.padding dla gesture navigation w `wynikach zawodów` — Android 14+.**
1538. **MOB — Flutter łączenie z native chat intents (`mailto:` fallback) z `filtrach globalnych belki`.**
1539. **MOB — Performance overlay dev-only dla FPS przy scroll `rankingu publicznym`.**
1540. **MOB — Maestro / Patrol E2E flow `panelu administratora` — YAML scenariusze.**
1541. **MOB — Semantics label dla wykresu w `ankietach regeneracji` — TalkBack czyta trend.**
1542. **MOB — Picture-in-picture dla wideo instruktażowego w `blogu klubu` (Android).**
1543. **MOB — App Shortcuts static XML dla `imporcie CSV zawodników` — aktualizacja przy loginie.**
1544. **MOB — Workmanager: jedna periodyczna synchronizacja `kalendarzu zawodów` w tle (OS limits).**
1545. **MOB — Drift (SQLite) cache dla listy `panelu trenera` — TTL i invalidacja po push.**
1546. **MOB — LiDAR / true depth — eksperyment AR dla pozycji startowej (R&D) w `aktualnościach klubowych`.**
1547. **MOB — Kotlin Multiplatform shared layer dla `galerii mediów` — roadmap dzielenia logiki.**
1548. **MOB — Swift concurrency: `@MainActor` audit dla `ustawieniach konta i 2FA` — brak glitchy UI.**
1549. **MOB — JNI crash guard przy pluginie natywnym powiązanym z `profilu zawodnika`.**
1550. **MOB — ProGuard rules dokumentacja dla release `narzędziach SuperAdmin` — bez obfuskacji modeli API.**
1551. **MOB — Test Farm: Firebase Test Lab matrix dla `superadmin/import` na 5 urządzeniach.**
1552. **MOB — Accessibility: min tap target 48 dla FAB w `planach treningowych V4`.**
1553. **MOB — LocaleDelegate: format daty zawodów ISO vs PL w `osi czasu zawodnika`.**
1554. **MOB — Navigation drawer jako alternatywa dla dolnego baru w `czacie trener–zawodnik` na tablet.**
1555. **MOB — EncryptedSharedPreferences dla tokenu przy `raportach PDF dla kadry` — hardening.**
1556. **MOB — Screenshot detection callback — blur wrażliwych pól w `barbell analysis`.**
1557. **MOB — Insets.padding dla gesture navigation w `dzienniku treningów` — Android 14+.**
1558. **MOB — Flutter łączenie z native chat intents (`mailto:` fallback) z `kolejce ćwiczeń dodatkowych`.**
1559. **MOB — Performance overlay dev-only dla FPS przy scroll `module składek`.**
1560. **MOB — Maestro / Patrol E2E flow `wykresach Sinclair / dwubój` — YAML scenariusze.**
1561. **MOB — Semantics label dla wykresu w `porównaniu zawodników` — TalkBack czyta trend.**
1562. **MOB — Picture-in-picture dla wideo instruktażowego w `centrum powiadomień` (Android).**
1563. **MOB — App Shortcuts static XML dla `module obecności` — aktualizacja przy loginie.**
1564. **MOB — Workmanager: jedna periodyczna synchronizacja `wynikach zawodów` w tle (OS limits).**
1565. **MOB — Drift (SQLite) cache dla listy `filtrach globalnych belki` — TTL i invalidacja po push.**
1566. **MOB — LiDAR / true depth — eksperyment AR dla pozycji startowej (R&D) w `rankingu publicznym`.**
1567. **MOB — Kotlin Multiplatform shared layer dla `panelu administratora` — roadmap dzielenia logiki.**
1568. **MOB — Swift concurrency: `@MainActor` audit dla `ankietach regeneracji` — brak glitchy UI.**
1569. **MOB — JNI crash guard przy pluginie natywnym powiązanym z `blogu klubu`.**
1570. **MOB — ProGuard rules dokumentacja dla release `imporcie CSV zawodników` — bez obfuskacji modeli API.**
1571. **MOB — Test Farm: Firebase Test Lab matrix dla `kalendarzu zawodów` na 5 urządzeniach.**
1572. **MOB — Accessibility: min tap target 48 dla FAB w `panelu trenera`.**
1573. **MOB — LocaleDelegate: format daty zawodów ISO vs PL w `aktualnościach klubowych`.**
1574. **MOB — Navigation drawer jako alternatywa dla dolnego baru w `galerii mediów` na tablet.**
1575. **MOB — EncryptedSharedPreferences dla tokenu przy `ustawieniach konta i 2FA` — hardening.**
1576. **MOB — Screenshot detection callback — blur wrażliwych pól w `profilu zawodnika`.**
1577. **MOB — Insets.padding dla gesture navigation w `narzędziach SuperAdmin` — Android 14+.**
1578. **MOB — Flutter łączenie z native chat intents (`mailto:` fallback) z `superadmin/import`.**
1579. **MOB — Performance overlay dev-only dla FPS przy scroll `planach treningowych V4`.**
1580. **MOB — Maestro / Patrol E2E flow `osi czasu zawodnika` — YAML scenariusze.**
1581. **MOB — Semantics label dla wykresu w `czacie trener–zawodnik` — TalkBack czyta trend.**
1582. **MOB — Picture-in-picture dla wideo instruktażowego w `raportach PDF dla kadry` (Android).**
1583. **MOB — App Shortcuts static XML dla `barbell analysis` — aktualizacja przy loginie.**
1584. **MOB — Workmanager: jedna periodyczna synchronizacja `dzienniku treningów` w tle (OS limits).**
1585. **MOB — Drift (SQLite) cache dla listy `kolejce ćwiczeń dodatkowych` — TTL i invalidacja po push.**
1586. **MOB — LiDAR / true depth — eksperyment AR dla pozycji startowej (R&D) w `module składek`.**
1587. **MOB — Kotlin Multiplatform shared layer dla `wykresach Sinclair / dwubój` — roadmap dzielenia logiki.**
1588. **MOB — Swift concurrency: `@MainActor` audit dla `porównaniu zawodników` — brak glitchy UI.**
1589. **MOB — JNI crash guard przy pluginie natywnym powiązanym z `centrum powiadomień`.**
1590. **MOB — ProGuard rules dokumentacja dla release `module obecności` — bez obfuskacji modeli API.**
1591. **MOB — Test Farm: Firebase Test Lab matrix dla `wynikach zawodów` na 5 urządzeniach.**
1592. **MOB — Accessibility: min tap target 48 dla FAB w `filtrach globalnych belki`.**
1593. **MOB — LocaleDelegate: format daty zawodów ISO vs PL w `rankingu publicznym`.**
1594. **MOB — Navigation drawer jako alternatywa dla dolnego baru w `panelu administratora` na tablet.**
1595. **MOB — EncryptedSharedPreferences dla tokenu przy `ankietach regeneracji` — hardening.**
1596. **MOB — Screenshot detection callback — blur wrażliwych pól w `blogu klubu`.**
1597. **MOB — Insets.padding dla gesture navigation w `imporcie CSV zawodników` — Android 14+.**
1598. **MOB — Flutter łączenie z native chat intents (`mailto:` fallback) z `kalendarzu zawodów`.**
1599. **MOB — Performance overlay dev-only dla FPS przy scroll `panelu trenera`.**
1600. **MOB — Maestro / Patrol E2E flow `aktualnościach klubowych` — YAML scenariusze.**
1601. **MOB — Semantics label dla wykresu w `galerii mediów` — TalkBack czyta trend.**
1602. **MOB — Picture-in-picture dla wideo instruktażowego w `ustawieniach konta i 2FA` (Android).**
1603. **MOB — App Shortcuts static XML dla `profilu zawodnika` — aktualizacja przy loginie.**
1604. **MOB — Workmanager: jedna periodyczna synchronizacja `narzędziach SuperAdmin` w tle (OS limits).**
1605. **MOB — Drift (SQLite) cache dla listy `superadmin/import` — TTL i invalidacja po push.**
1606. **MOB — LiDAR / true depth — eksperyment AR dla pozycji startowej (R&D) w `planach treningowych V4`.**
1607. **MOB — Kotlin Multiplatform shared layer dla `osi czasu zawodnika` — roadmap dzielenia logiki.**
1608. **MOB — Swift concurrency: `@MainActor` audit dla `czacie trener–zawodnik` — brak glitchy UI.**
1609. **MOB — JNI crash guard przy pluginie natywnym powiązanym z `raportach PDF dla kadry`.**
1610. **MOB — ProGuard rules dokumentacja dla release `barbell analysis` — bez obfuskacji modeli API.**
1611. **MOB — Test Farm: Firebase Test Lab matrix dla `dzienniku treningów` na 5 urządzeniach.**
1612. **MOB — Accessibility: min tap target 48 dla FAB w `kolejce ćwiczeń dodatkowych`.**
1613. **MOB — LocaleDelegate: format daty zawodów ISO vs PL w `module składek`.**
1614. **MOB — Navigation drawer jako alternatywa dla dolnego baru w `wykresach Sinclair / dwubój` na tablet.**
1615. **MOB — EncryptedSharedPreferences dla tokenu przy `porównaniu zawodników` — hardening.**
1616. **MOB — Screenshot detection callback — blur wrażliwych pól w `centrum powiadomień`.**
1617. **MOB — Insets.padding dla gesture navigation w `module obecności` — Android 14+.**
1618. **MOB — Flutter łączenie z native chat intents (`mailto:` fallback) z `wynikach zawodów`.**
1619. **MOB — Performance overlay dev-only dla FPS przy scroll `filtrach globalnych belki`.**
1620. **MOB — Maestro / Patrol E2E flow `rankingu publicznym` — YAML scenariusze.**
1621. **MOB — Semantics label dla wykresu w `panelu administratora` — TalkBack czyta trend.**
1622. **MOB — Picture-in-picture dla wideo instruktażowego w `ankietach regeneracji` (Android).**
1623. **MOB — App Shortcuts static XML dla `blogu klubu` — aktualizacja przy loginie.**
1624. **MOB — Workmanager: jedna periodyczna synchronizacja `imporcie CSV zawodników` w tle (OS limits).**
1625. **MOB — Drift (SQLite) cache dla listy `kalendarzu zawodów` — TTL i invalidacja po push.**
1626. **MOB — LiDAR / true depth — eksperyment AR dla pozycji startowej (R&D) w `panelu trenera`.**
1627. **MOB — Kotlin Multiplatform shared layer dla `aktualnościach klubowych` — roadmap dzielenia logiki.**
1628. **MOB — Swift concurrency: `@MainActor` audit dla `galerii mediów` — brak glitchy UI.**
1629. **MOB — JNI crash guard przy pluginie natywnym powiązanym z `ustawieniach konta i 2FA`.**
1630. **MOB — ProGuard rules dokumentacja dla release `profilu zawodnika` — bez obfuskacji modeli API.**
1631. **MOB — Test Farm: Firebase Test Lab matrix dla `narzędziach SuperAdmin` na 5 urządzeniach.**
1632. **MOB — Accessibility: min tap target 48 dla FAB w `superadmin/import`.**
1633. **MOB — LocaleDelegate: format daty zawodów ISO vs PL w `planach treningowych V4`.**
1634. **MOB — Navigation drawer jako alternatywa dla dolnego baru w `osi czasu zawodnika` na tablet.**
1635. **MOB — EncryptedSharedPreferences dla tokenu przy `czacie trener–zawodnik` — hardening.**
1636. **MOB — Screenshot detection callback — blur wrażliwych pól w `raportach PDF dla kadry`.**
1637. **MOB — Insets.padding dla gesture navigation w `barbell analysis` — Android 14+.**
1638. **MOB — Flutter łączenie z native chat intents (`mailto:` fallback) z `dzienniku treningów`.**
1639. **MOB — Performance overlay dev-only dla FPS przy scroll `kolejce ćwiczeń dodatkowych`.**
1640. **MOB — Maestro / Patrol E2E flow `module składek` — YAML scenariusze.**
1641. **MOB — Semantics label dla wykresu w `wykresach Sinclair / dwubój` — TalkBack czyta trend.**
1642. **MOB — Picture-in-picture dla wideo instruktażowego w `porównaniu zawodników` (Android).**
1643. **MOB — App Shortcuts static XML dla `centrum powiadomień` — aktualizacja przy loginie.**
1644. **MOB — Workmanager: jedna periodyczna synchronizacja `module obecności` w tle (OS limits).**
1645. **MOB — Drift (SQLite) cache dla listy `wynikach zawodów` — TTL i invalidacja po push.**
1646. **MOB — LiDAR / true depth — eksperyment AR dla pozycji startowej (R&D) w `filtrach globalnych belki`.**
1647. **MOB — Kotlin Multiplatform shared layer dla `rankingu publicznym` — roadmap dzielenia logiki.**
1648. **MOB — Swift concurrency: `@MainActor` audit dla `panelu administratora` — brak glitchy UI.**
1649. **MOB — JNI crash guard przy pluginie natywnym powiązanym z `ankietach regeneracji`.**
1650. **MOB — ProGuard rules dokumentacja dla release `blogu klubu` — bez obfuskacji modeli API.**
1651. **MOB — Test Farm: Firebase Test Lab matrix dla `imporcie CSV zawodników` na 5 urządzeniach.**
1652. **MOB — Accessibility: min tap target 48 dla FAB w `kalendarzu zawodów`.**
1653. **MOB — LocaleDelegate: format daty zawodów ISO vs PL w `panelu trenera`.**
1654. **MOB — Navigation drawer jako alternatywa dla dolnego baru w `aktualnościach klubowych` na tablet.**
1655. **MOB — EncryptedSharedPreferences dla tokenu przy `galerii mediów` — hardening.**
1656. **MOB — Screenshot detection callback — blur wrażliwych pól w `ustawieniach konta i 2FA`.**
1657. **MOB — Insets.padding dla gesture navigation w `profilu zawodnika` — Android 14+.**
1658. **MOB — Flutter łączenie z native chat intents (`mailto:` fallback) z `narzędziach SuperAdmin`.**
1659. **MOB — Performance overlay dev-only dla FPS przy scroll `superadmin/import`.**
1660. **MOB — Maestro / Patrol E2E flow `planach treningowych V4` — YAML scenariusze.**
1661. **MOB — Semantics label dla wykresu w `osi czasu zawodnika` — TalkBack czyta trend.**
1662. **MOB — Picture-in-picture dla wideo instruktażowego w `czacie trener–zawodnik` (Android).**
1663. **MOB — App Shortcuts static XML dla `raportach PDF dla kadry` — aktualizacja przy loginie.**
1664. **MOB — Workmanager: jedna periodyczna synchronizacja `barbell analysis` w tle (OS limits).**
1665. **MOB — Drift (SQLite) cache dla listy `dzienniku treningów` — TTL i invalidacja po push.**
1666. **MOB — LiDAR / true depth — eksperyment AR dla pozycji startowej (R&D) w `kolejce ćwiczeń dodatkowych`.**
1667. **MOB — Kotlin Multiplatform shared layer dla `module składek` — roadmap dzielenia logiki.**
1668. **MOB — Swift concurrency: `@MainActor` audit dla `wykresach Sinclair / dwubój` — brak glitchy UI.**
1669. **MOB — JNI crash guard przy pluginie natywnym powiązanym z `porównaniu zawodników`.**
1670. **MOB — ProGuard rules dokumentacja dla release `centrum powiadomień` — bez obfuskacji modeli API.**
1671. **MOB — Test Farm: Firebase Test Lab matrix dla `module obecności` na 5 urządzeniach.**
1672. **MOB — Accessibility: min tap target 48 dla FAB w `wynikach zawodów`.**
1673. **MOB — LocaleDelegate: format daty zawodów ISO vs PL w `filtrach globalnych belki`.**
1674. **MOB — Navigation drawer jako alternatywa dla dolnego baru w `rankingu publicznym` na tablet.**
1675. **MOB — EncryptedSharedPreferences dla tokenu przy `panelu administratora` — hardening.**
1676. **MOB — Screenshot detection callback — blur wrażliwych pól w `ankietach regeneracji`.**
1677. **MOB — Insets.padding dla gesture navigation w `blogu klubu` — Android 14+.**
1678. **MOB — Flutter łączenie z native chat intents (`mailto:` fallback) z `imporcie CSV zawodników`.**
1679. **MOB — Performance overlay dev-only dla FPS przy scroll `kalendarzu zawodów`.**
1680. **MOB — Maestro / Patrol E2E flow `panelu trenera` — YAML scenariusze.**
1681. **MOB — Semantics label dla wykresu w `aktualnościach klubowych` — TalkBack czyta trend.**
1682. **MOB — Picture-in-picture dla wideo instruktażowego w `galerii mediów` (Android).**
1683. **MOB — App Shortcuts static XML dla `ustawieniach konta i 2FA` — aktualizacja przy loginie.**
1684. **MOB — Workmanager: jedna periodyczna synchronizacja `profilu zawodnika` w tle (OS limits).**
1685. **MOB — Drift (SQLite) cache dla listy `narzędziach SuperAdmin` — TTL i invalidacja po push.**
1686. **MOB — LiDAR / true depth — eksperyment AR dla pozycji startowej (R&D) w `superadmin/import`.**
1687. **MOB — Kotlin Multiplatform shared layer dla `planach treningowych V4` — roadmap dzielenia logiki.**
1688. **MOB — Swift concurrency: `@MainActor` audit dla `osi czasu zawodnika` — brak glitchy UI.**
1689. **MOB — JNI crash guard przy pluginie natywnym powiązanym z `czacie trener–zawodnik`.**
1690. **MOB — ProGuard rules dokumentacja dla release `raportach PDF dla kadry` — bez obfuskacji modeli API.**
1691. **MOB — Test Farm: Firebase Test Lab matrix dla `barbell analysis` na 5 urządzeniach.**
1692. **MOB — Accessibility: min tap target 48 dla FAB w `dzienniku treningów`.**
1693. **MOB — LocaleDelegate: format daty zawodów ISO vs PL w `kolejce ćwiczeń dodatkowych`.**
1694. **MOB — Navigation drawer jako alternatywa dla dolnego baru w `module składek` na tablet.**
1695. **MOB — EncryptedSharedPreferences dla tokenu przy `wykresach Sinclair / dwubój` — hardening.**
1696. **MOB — Screenshot detection callback — blur wrażliwych pól w `porównaniu zawodników`.**
1697. **MOB — Insets.padding dla gesture navigation w `centrum powiadomień` — Android 14+.**
1698. **MOB — Flutter łączenie z native chat intents (`mailto:` fallback) z `module obecności`.**
1699. **MOB — Performance overlay dev-only dla FPS przy scroll `wynikach zawodów`.**
1700. **MOB — Maestro / Patrol E2E flow `filtrach globalnych belki` — YAML scenariusze.**
1701. **MOB — Semantics label dla wykresu w `rankingu publicznym` — TalkBack czyta trend.**
1702. **MOB — Picture-in-picture dla wideo instruktażowego w `panelu administratora` (Android).**
1703. **MOB — App Shortcuts static XML dla `ankietach regeneracji` — aktualizacja przy loginie.**
1704. **MOB — Workmanager: jedna periodyczna synchronizacja `blogu klubu` w tle (OS limits).**
1705. **MOB — Drift (SQLite) cache dla listy `imporcie CSV zawodników` — TTL i invalidacja po push.**
1706. **MOB — LiDAR / true depth — eksperyment AR dla pozycji startowej (R&D) w `kalendarzu zawodów`.**
1707. **MOB — Kotlin Multiplatform shared layer dla `panelu trenera` — roadmap dzielenia logiki.**
1708. **MOB — Swift concurrency: `@MainActor` audit dla `aktualnościach klubowych` — brak glitchy UI.**
1709. **MOB — JNI crash guard przy pluginie natywnym powiązanym z `galerii mediów`.**
1710. **MOB — ProGuard rules dokumentacja dla release `ustawieniach konta i 2FA` — bez obfuskacji modeli API.**
1711. **MOB — Test Farm: Firebase Test Lab matrix dla `profilu zawodnika` na 5 urządzeniach.**
1712. **MOB — Accessibility: min tap target 48 dla FAB w `narzędziach SuperAdmin`.**
1713. **MOB — LocaleDelegate: format daty zawodów ISO vs PL w `superadmin/import`.**
1714. **MOB — Navigation drawer jako alternatywa dla dolnego baru w `planach treningowych V4` na tablet.**
1715. **MOB — EncryptedSharedPreferences dla tokenu przy `osi czasu zawodnika` — hardening.**
1716. **MOB — Screenshot detection callback — blur wrażliwych pól w `czacie trener–zawodnik`.**
1717. **MOB — Insets.padding dla gesture navigation w `raportach PDF dla kadry` — Android 14+.**
1718. **MOB — Flutter łączenie z native chat intents (`mailto:` fallback) z `barbell analysis`.**
1719. **MOB — Performance overlay dev-only dla FPS przy scroll `dzienniku treningów`.**
1720. **MOB — Maestro / Patrol E2E flow `kolejce ćwiczeń dodatkowych` — YAML scenariusze.**
1721. **MOB — Semantics label dla wykresu w `module składek` — TalkBack czyta trend.**
1722. **MOB — Picture-in-picture dla wideo instruktażowego w `wykresach Sinclair / dwubój` (Android).**
1723. **MOB — App Shortcuts static XML dla `porównaniu zawodników` — aktualizacja przy loginie.**
1724. **MOB — Workmanager: jedna periodyczna synchronizacja `centrum powiadomień` w tle (OS limits).**
1725. **MOB — Drift (SQLite) cache dla listy `module obecności` — TTL i invalidacja po push.**
1726. **MOB — LiDAR / true depth — eksperyment AR dla pozycji startowej (R&D) w `wynikach zawodów`.**
1727. **MOB — Kotlin Multiplatform shared layer dla `filtrach globalnych belki` — roadmap dzielenia logiki.**
1728. **MOB — Swift concurrency: `@MainActor` audit dla `rankingu publicznym` — brak glitchy UI.**
1729. **MOB — JNI crash guard przy pluginie natywnym powiązanym z `panelu administratora`.**
1730. **MOB — ProGuard rules dokumentacja dla release `ankietach regeneracji` — bez obfuskacji modeli API.**
1731. **MOB — Test Farm: Firebase Test Lab matrix dla `blogu klubu` na 5 urządzeniach.**
1732. **MOB — Accessibility: min tap target 48 dla FAB w `imporcie CSV zawodników`.**
1733. **MOB — LocaleDelegate: format daty zawodów ISO vs PL w `kalendarzu zawodów`.**
1734. **MOB — Navigation drawer jako alternatywa dla dolnego baru w `panelu trenera` na tablet.**
1735. **MOB — EncryptedSharedPreferences dla tokenu przy `aktualnościach klubowych` — hardening.**
1736. **MOB — Screenshot detection callback — blur wrażliwych pól w `galerii mediów`.**
1737. **MOB — Insets.padding dla gesture navigation w `ustawieniach konta i 2FA` — Android 14+.**
1738. **MOB — Flutter łączenie z native chat intents (`mailto:` fallback) z `profilu zawodnika`.**
1739. **MOB — Performance overlay dev-only dla FPS przy scroll `narzędziach SuperAdmin`.**
1740. **MOB — Maestro / Patrol E2E flow `superadmin/import` — YAML scenariusze.**
1741. **MOB — Semantics label dla wykresu w `planach treningowych V4` — TalkBack czyta trend.**
1742. **MOB — Picture-in-picture dla wideo instruktażowego w `osi czasu zawodnika` (Android).**
1743. **MOB — App Shortcuts static XML dla `czacie trener–zawodnik` — aktualizacja przy loginie.**
1744. **MOB — Workmanager: jedna periodyczna synchronizacja `raportach PDF dla kadry` w tle (OS limits).**
1745. **MOB — Drift (SQLite) cache dla listy `barbell analysis` — TTL i invalidacja po push.**
1746. **MOB — LiDAR / true depth — eksperyment AR dla pozycji startowej (R&D) w `dzienniku treningów`.**
1747. **MOB — Kotlin Multiplatform shared layer dla `kolejce ćwiczeń dodatkowych` — roadmap dzielenia logiki.**
1748. **MOB — Swift concurrency: `@MainActor` audit dla `module składek` — brak glitchy UI.**
1749. **MOB — JNI crash guard przy pluginie natywnym powiązanym z `wykresach Sinclair / dwubój`.**
1750. **MOB — ProGuard rules dokumentacja dla release `porównaniu zawodników` — bez obfuskacji modeli API.**

### Platforma, partnerzy, DevOps, prawo, skalowanie

1751. **PL — Kubernetes Helm chart dla frontend+backend — osobne values per klub.**
1752. **PL — Edge middleware na Vercel: geo-block poza EU jeśli polityka `{t}`.**
1753. **PL — Stripe Connect dla marketplace klubu — rozliczenia `{t}`.**
1754. **PL — Umowa DPA z dostawcą maili — załącznik pod `{t}`.**
1755. **PL — Pen-test yearly dla publicznego API `{t}` — raport CISSP.**
1756. **PL — On-call runbook: incident P1 dla `{t}` — eskalacja SMS.**
1757. **PL — Cost dashboard: koszt Turso + Blob vs aktywni użytkownicy `{t}`.**
1758. **PL — Multi-region read: Cloudflare Workers przed API `{t}` — cache GET.**
1759. **PL — GitHub Organization ruleset — signed commits dla repo `{t}`.**
1760. **PL — SBOM CycloneDX eksport z buildu `{t}` — supply chain.**
1761. **PL — WCAG 2.2 AA audit zewnętrzny całej witryny `{t}` — raport PDF.**
1762. **PL — Insurance cyber dla operatora platformy `{t}` — warunek B2B.**
1763. **PL — Academy: kurs „administrator Slavia” jako SCORM `{t}`.**
1764. **PL — Partner badge „Powered by Slavia” — warunki brand `{t}`.**
1765. **PL — Load test k6 dla endpointów `{t}` — SLA 95p <300ms.**
1766. **PL — FinOps: alert budget GCP/Azure jeśli sandbox `{t}` przekroczy X.**
1767. **PL — Contract testing Pact między www a API `{t}` — CI.**
1768. **PL — ISO27001 checklist mapping dla `{t}` — arkusz audytowy.**
1769. **PL — Newsletter produktowy dla klubów — case study `{t}`.**
1770. **PL — Bug bounty program (ograniczony) dla `{t}` — HackerOne.**
1771. **PL — Kubernetes Helm chart dla frontend+backend — osobne values per klub.**
1772. **PL — Edge middleware na Vercel: geo-block poza EU jeśli polityka `{t}`.**
1773. **PL — Stripe Connect dla marketplace klubu — rozliczenia `{t}`.**
1774. **PL — Umowa DPA z dostawcą maili — załącznik pod `{t}`.**
1775. **PL — Pen-test yearly dla publicznego API `{t}` — raport CISSP.**
1776. **PL — On-call runbook: incident P1 dla `{t}` — eskalacja SMS.**
1777. **PL — Cost dashboard: koszt Turso + Blob vs aktywni użytkownicy `{t}`.**
1778. **PL — Multi-region read: Cloudflare Workers przed API `{t}` — cache GET.**
1779. **PL — GitHub Organization ruleset — signed commits dla repo `{t}`.**
1780. **PL — SBOM CycloneDX eksport z buildu `{t}` — supply chain.**
1781. **PL — WCAG 2.2 AA audit zewnętrzny całej witryny `{t}` — raport PDF.**
1782. **PL — Insurance cyber dla operatora platformy `{t}` — warunek B2B.**
1783. **PL — Academy: kurs „administrator Slavia” jako SCORM `{t}`.**
1784. **PL — Partner badge „Powered by Slavia” — warunki brand `{t}`.**
1785. **PL — Load test k6 dla endpointów `{t}` — SLA 95p <300ms.**
1786. **PL — FinOps: alert budget GCP/Azure jeśli sandbox `{t}` przekroczy X.**
1787. **PL — Contract testing Pact między www a API `{t}` — CI.**
1788. **PL — ISO27001 checklist mapping dla `{t}` — arkusz audytowy.**
1789. **PL — Newsletter produktowy dla klubów — case study `{t}`.**
1790. **PL — Bug bounty program (ograniczony) dla `{t}` — HackerOne.**
1791. **PL — Kubernetes Helm chart dla frontend+backend — osobne values per klub.**
1792. **PL — Edge middleware na Vercel: geo-block poza EU jeśli polityka `{t}`.**
1793. **PL — Stripe Connect dla marketplace klubu — rozliczenia `{t}`.**
1794. **PL — Umowa DPA z dostawcą maili — załącznik pod `{t}`.**
1795. **PL — Pen-test yearly dla publicznego API `{t}` — raport CISSP.**
1796. **PL — On-call runbook: incident P1 dla `{t}` — eskalacja SMS.**
1797. **PL — Cost dashboard: koszt Turso + Blob vs aktywni użytkownicy `{t}`.**
1798. **PL — Multi-region read: Cloudflare Workers przed API `{t}` — cache GET.**
1799. **PL — GitHub Organization ruleset — signed commits dla repo `{t}`.**
1800. **PL — SBOM CycloneDX eksport z buildu `{t}` — supply chain.**
1801. **PL — WCAG 2.2 AA audit zewnętrzny całej witryny `{t}` — raport PDF.**
1802. **PL — Insurance cyber dla operatora platformy `{t}` — warunek B2B.**
1803. **PL — Academy: kurs „administrator Slavia” jako SCORM `{t}`.**
1804. **PL — Partner badge „Powered by Slavia” — warunki brand `{t}`.**
1805. **PL — Load test k6 dla endpointów `{t}` — SLA 95p <300ms.**
1806. **PL — FinOps: alert budget GCP/Azure jeśli sandbox `{t}` przekroczy X.**
1807. **PL — Contract testing Pact między www a API `{t}` — CI.**
1808. **PL — ISO27001 checklist mapping dla `{t}` — arkusz audytowy.**
1809. **PL — Newsletter produktowy dla klubów — case study `{t}`.**
1810. **PL — Bug bounty program (ograniczony) dla `{t}` — HackerOne.**
1811. **PL — Kubernetes Helm chart dla frontend+backend — osobne values per klub.**
1812. **PL — Edge middleware na Vercel: geo-block poza EU jeśli polityka `{t}`.**
1813. **PL — Stripe Connect dla marketplace klubu — rozliczenia `{t}`.**
1814. **PL — Umowa DPA z dostawcą maili — załącznik pod `{t}`.**
1815. **PL — Pen-test yearly dla publicznego API `{t}` — raport CISSP.**
1816. **PL — On-call runbook: incident P1 dla `{t}` — eskalacja SMS.**
1817. **PL — Cost dashboard: koszt Turso + Blob vs aktywni użytkownicy `{t}`.**
1818. **PL — Multi-region read: Cloudflare Workers przed API `{t}` — cache GET.**
1819. **PL — GitHub Organization ruleset — signed commits dla repo `{t}`.**
1820. **PL — SBOM CycloneDX eksport z buildu `{t}` — supply chain.**
1821. **PL — WCAG 2.2 AA audit zewnętrzny całej witryny `{t}` — raport PDF.**
1822. **PL — Insurance cyber dla operatora platformy `{t}` — warunek B2B.**
1823. **PL — Academy: kurs „administrator Slavia” jako SCORM `{t}`.**
1824. **PL — Partner badge „Powered by Slavia” — warunki brand `{t}`.**
1825. **PL — Load test k6 dla endpointów `{t}` — SLA 95p <300ms.**
1826. **PL — FinOps: alert budget GCP/Azure jeśli sandbox `{t}` przekroczy X.**
1827. **PL — Contract testing Pact między www a API `{t}` — CI.**
1828. **PL — ISO27001 checklist mapping dla `{t}` — arkusz audytowy.**
1829. **PL — Newsletter produktowy dla klubów — case study `{t}`.**
1830. **PL — Bug bounty program (ograniczony) dla `{t}` — HackerOne.**
1831. **PL — Kubernetes Helm chart dla frontend+backend — osobne values per klub.**
1832. **PL — Edge middleware na Vercel: geo-block poza EU jeśli polityka `{t}`.**
1833. **PL — Stripe Connect dla marketplace klubu — rozliczenia `{t}`.**
1834. **PL — Umowa DPA z dostawcą maili — załącznik pod `{t}`.**
1835. **PL — Pen-test yearly dla publicznego API `{t}` — raport CISSP.**
1836. **PL — On-call runbook: incident P1 dla `{t}` — eskalacja SMS.**
1837. **PL — Cost dashboard: koszt Turso + Blob vs aktywni użytkownicy `{t}`.**
1838. **PL — Multi-region read: Cloudflare Workers przed API `{t}` — cache GET.**
1839. **PL — GitHub Organization ruleset — signed commits dla repo `{t}`.**
1840. **PL — SBOM CycloneDX eksport z buildu `{t}` — supply chain.**
1841. **PL — WCAG 2.2 AA audit zewnętrzny całej witryny `{t}` — raport PDF.**
1842. **PL — Insurance cyber dla operatora platformy `{t}` — warunek B2B.**
1843. **PL — Academy: kurs „administrator Slavia” jako SCORM `{t}`.**
1844. **PL — Partner badge „Powered by Slavia” — warunki brand `{t}`.**
1845. **PL — Load test k6 dla endpointów `{t}` — SLA 95p <300ms.**
1846. **PL — FinOps: alert budget GCP/Azure jeśli sandbox `{t}` przekroczy X.**
1847. **PL — Contract testing Pact między www a API `{t}` — CI.**
1848. **PL — ISO27001 checklist mapping dla `{t}` — arkusz audytowy.**
1849. **PL — Newsletter produktowy dla klubów — case study `{t}`.**
1850. **PL — Bug bounty program (ograniczony) dla `{t}` — HackerOne.**
1851. **PL — Kubernetes Helm chart dla frontend+backend — osobne values per klub.**
1852. **PL — Edge middleware na Vercel: geo-block poza EU jeśli polityka `{t}`.**
1853. **PL — Stripe Connect dla marketplace klubu — rozliczenia `{t}`.**
1854. **PL — Umowa DPA z dostawcą maili — załącznik pod `{t}`.**
1855. **PL — Pen-test yearly dla publicznego API `{t}` — raport CISSP.**
1856. **PL — On-call runbook: incident P1 dla `{t}` — eskalacja SMS.**
1857. **PL — Cost dashboard: koszt Turso + Blob vs aktywni użytkownicy `{t}`.**
1858. **PL — Multi-region read: Cloudflare Workers przed API `{t}` — cache GET.**
1859. **PL — GitHub Organization ruleset — signed commits dla repo `{t}`.**
1860. **PL — SBOM CycloneDX eksport z buildu `{t}` — supply chain.**
1861. **PL — WCAG 2.2 AA audit zewnętrzny całej witryny `{t}` — raport PDF.**
1862. **PL — Insurance cyber dla operatora platformy `{t}` — warunek B2B.**
1863. **PL — Academy: kurs „administrator Slavia” jako SCORM `{t}`.**
1864. **PL — Partner badge „Powered by Slavia” — warunki brand `{t}`.**
1865. **PL — Load test k6 dla endpointów `{t}` — SLA 95p <300ms.**
1866. **PL — FinOps: alert budget GCP/Azure jeśli sandbox `{t}` przekroczy X.**
1867. **PL — Contract testing Pact między www a API `{t}` — CI.**
1868. **PL — ISO27001 checklist mapping dla `{t}` — arkusz audytowy.**
1869. **PL — Newsletter produktowy dla klubów — case study `{t}`.**
1870. **PL — Bug bounty program (ograniczony) dla `{t}` — HackerOne.**
1871. **PL — Kubernetes Helm chart dla frontend+backend — osobne values per klub.**
1872. **PL — Edge middleware na Vercel: geo-block poza EU jeśli polityka `{t}`.**
1873. **PL — Stripe Connect dla marketplace klubu — rozliczenia `{t}`.**
1874. **PL — Umowa DPA z dostawcą maili — załącznik pod `{t}`.**
1875. **PL — Pen-test yearly dla publicznego API `{t}` — raport CISSP.**
1876. **PL — On-call runbook: incident P1 dla `{t}` — eskalacja SMS.**
1877. **PL — Cost dashboard: koszt Turso + Blob vs aktywni użytkownicy `{t}`.**
1878. **PL — Multi-region read: Cloudflare Workers przed API `{t}` — cache GET.**
1879. **PL — GitHub Organization ruleset — signed commits dla repo `{t}`.**
1880. **PL — SBOM CycloneDX eksport z buildu `{t}` — supply chain.**
1881. **PL — WCAG 2.2 AA audit zewnętrzny całej witryny `{t}` — raport PDF.**
1882. **PL — Insurance cyber dla operatora platformy `{t}` — warunek B2B.**
1883. **PL — Academy: kurs „administrator Slavia” jako SCORM `{t}`.**
1884. **PL — Partner badge „Powered by Slavia” — warunki brand `{t}`.**
1885. **PL — Load test k6 dla endpointów `{t}` — SLA 95p <300ms.**
1886. **PL — FinOps: alert budget GCP/Azure jeśli sandbox `{t}` przekroczy X.**
1887. **PL — Contract testing Pact między www a API `{t}` — CI.**
1888. **PL — ISO27001 checklist mapping dla `{t}` — arkusz audytowy.**
1889. **PL — Newsletter produktowy dla klubów — case study `{t}`.**
1890. **PL — Bug bounty program (ograniczony) dla `{t}` — HackerOne.**
1891. **PL — Kubernetes Helm chart dla frontend+backend — osobne values per klub.**
1892. **PL — Edge middleware na Vercel: geo-block poza EU jeśli polityka `{t}`.**
1893. **PL — Stripe Connect dla marketplace klubu — rozliczenia `{t}`.**
1894. **PL — Umowa DPA z dostawcą maili — załącznik pod `{t}`.**
1895. **PL — Pen-test yearly dla publicznego API `{t}` — raport CISSP.**
1896. **PL — On-call runbook: incident P1 dla `{t}` — eskalacja SMS.**
1897. **PL — Cost dashboard: koszt Turso + Blob vs aktywni użytkownicy `{t}`.**
1898. **PL — Multi-region read: Cloudflare Workers przed API `{t}` — cache GET.**
1899. **PL — GitHub Organization ruleset — signed commits dla repo `{t}`.**
1900. **PL — SBOM CycloneDX eksport z buildu `{t}` — supply chain.**

### Research, federacja, hardware, długi horyzont (RD)

1901. **RD — Proof-of-concept `wzorca technicznego z PZPC` (fala #1)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1902. **RD — Proof-of-concept `protokołu Sinclair IWF` (fala #1)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1903. **RD — Proof-of-concept `danych IMU z nadgarstka` (fala #1)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1904. **RD — Proof-of-concept `wizji komputerowej na Edge TPU` (fala #1)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1905. **RD — Proof-of-concept `modelu LLM lokalnego dla podpowiedzi treningowych` (fala #1)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1906. **RD — Proof-of-concept `blockchain NFT dla dyplomów (kontrowersyjne)` (fala #1)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1907. **RD — Proof-of-concept `digital twin hali treningowej` (fala #1)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1908. **RD — Proof-of-concept `symulacji fizyki sztangi` (fala #1)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1909. **RD — Proof-of-concept `audio klasyfikacji „good lift"` (fala #1)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1910. **RD — Proof-of-concept `heat mapy sali z czujników IoT` (fala #1)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1911. **RD — Proof-of-concept `wzorca technicznego z PZPC` (fala #2)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1912. **RD — Proof-of-concept `protokołu Sinclair IWF` (fala #2)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1913. **RD — Proof-of-concept `danych IMU z nadgarstka` (fala #2)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1914. **RD — Proof-of-concept `wizji komputerowej na Edge TPU` (fala #2)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1915. **RD — Proof-of-concept `modelu LLM lokalnego dla podpowiedzi treningowych` (fala #2)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1916. **RD — Proof-of-concept `blockchain NFT dla dyplomów (kontrowersyjne)` (fala #2)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1917. **RD — Proof-of-concept `digital twin hali treningowej` (fala #2)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1918. **RD — Proof-of-concept `symulacji fizyki sztangi` (fala #2)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1919. **RD — Proof-of-concept `audio klasyfikacji „good lift"` (fala #2)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1920. **RD — Proof-of-concept `heat mapy sali z czujników IoT` (fala #2)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1921. **RD — Proof-of-concept `wzorca technicznego z PZPC` (fala #3)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1922. **RD — Proof-of-concept `protokołu Sinclair IWF` (fala #3)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1923. **RD — Proof-of-concept `danych IMU z nadgarstka` (fala #3)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1924. **RD — Proof-of-concept `wizji komputerowej na Edge TPU` (fala #3)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1925. **RD — Proof-of-concept `modelu LLM lokalnego dla podpowiedzi treningowych` (fala #3)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1926. **RD — Proof-of-concept `blockchain NFT dla dyplomów (kontrowersyjne)` (fala #3)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1927. **RD — Proof-of-concept `digital twin hali treningowej` (fala #3)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1928. **RD — Proof-of-concept `symulacji fizyki sztangi` (fala #3)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1929. **RD — Proof-of-concept `audio klasyfikacji „good lift"` (fala #3)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1930. **RD — Proof-of-concept `heat mapy sali z czujników IoT` (fala #3)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1931. **RD — Proof-of-concept `wzorca technicznego z PZPC` (fala #4)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1932. **RD — Proof-of-concept `protokołu Sinclair IWF` (fala #4)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1933. **RD — Proof-of-concept `danych IMU z nadgarstka` (fala #4)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1934. **RD — Proof-of-concept `wizji komputerowej na Edge TPU` (fala #4)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1935. **RD — Proof-of-concept `modelu LLM lokalnego dla podpowiedzi treningowych` (fala #4)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1936. **RD — Proof-of-concept `blockchain NFT dla dyplomów (kontrowersyjne)` (fala #4)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1937. **RD — Proof-of-concept `digital twin hali treningowej` (fala #4)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1938. **RD — Proof-of-concept `symulacji fizyki sztangi` (fala #4)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1939. **RD — Proof-of-concept `audio klasyfikacji „good lift"` (fala #4)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1940. **RD — Proof-of-concept `heat mapy sali z czujników IoT` (fala #4)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1941. **RD — Proof-of-concept `wzorca technicznego z PZPC` (fala #5)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1942. **RD — Proof-of-concept `protokołu Sinclair IWF` (fala #5)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1943. **RD — Proof-of-concept `danych IMU z nadgarstka` (fala #5)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1944. **RD — Proof-of-concept `wizji komputerowej na Edge TPU` (fala #5)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1945. **RD — Proof-of-concept `modelu LLM lokalnego dla podpowiedzi treningowych` (fala #5)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1946. **RD — Proof-of-concept `blockchain NFT dla dyplomów (kontrowersyjne)` (fala #5)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1947. **RD — Proof-of-concept `digital twin hali treningowej` (fala #5)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1948. **RD — Proof-of-concept `symulacji fizyki sztangi` (fala #5)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1949. **RD — Proof-of-concept `audio klasyfikacji „good lift"` (fala #5)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1950. **RD — Proof-of-concept `heat mapy sali z czujników IoT` (fala #5)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1951. **RD — Proof-of-concept `wzorca technicznego z PZPC` (fala #6)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1952. **RD — Proof-of-concept `protokołu Sinclair IWF` (fala #6)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1953. **RD — Proof-of-concept `danych IMU z nadgarstka` (fala #6)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1954. **RD — Proof-of-concept `wizji komputerowej na Edge TPU` (fala #6)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1955. **RD — Proof-of-concept `modelu LLM lokalnego dla podpowiedzi treningowych` (fala #6)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1956. **RD — Proof-of-concept `blockchain NFT dla dyplomów (kontrowersyjne)` (fala #6)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1957. **RD — Proof-of-concept `digital twin hali treningowej` (fala #6)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1958. **RD — Proof-of-concept `symulacji fizyki sztangi` (fala #6)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1959. **RD — Proof-of-concept `audio klasyfikacji „good lift"` (fala #6)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1960. **RD — Proof-of-concept `heat mapy sali z czujników IoT` (fala #6)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1961. **RD — Proof-of-concept `wzorca technicznego z PZPC` (fala #7)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1962. **RD — Proof-of-concept `protokołu Sinclair IWF` (fala #7)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1963. **RD — Proof-of-concept `danych IMU z nadgarstka` (fala #7)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1964. **RD — Proof-of-concept `wizji komputerowej na Edge TPU` (fala #7)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1965. **RD — Proof-of-concept `modelu LLM lokalnego dla podpowiedzi treningowych` (fala #7)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1966. **RD — Proof-of-concept `blockchain NFT dla dyplomów (kontrowersyjne)` (fala #7)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1967. **RD — Proof-of-concept `digital twin hali treningowej` (fala #7)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1968. **RD — Proof-of-concept `symulacji fizyki sztangi` (fala #7)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1969. **RD — Proof-of-concept `audio klasyfikacji „good lift"` (fala #7)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1970. **RD — Proof-of-concept `heat mapy sali z czujników IoT` (fala #7)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1971. **RD — Proof-of-concept `wzorca technicznego z PZPC` (fala #8)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1972. **RD — Proof-of-concept `protokołu Sinclair IWF` (fala #8)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1973. **RD — Proof-of-concept `danych IMU z nadgarstka` (fala #8)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1974. **RD — Proof-of-concept `wizji komputerowej na Edge TPU` (fala #8)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1975. **RD — Proof-of-concept `modelu LLM lokalnego dla podpowiedzi treningowych` (fala #8)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1976. **RD — Proof-of-concept `blockchain NFT dla dyplomów (kontrowersyjne)` (fala #8)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1977. **RD — Proof-of-concept `digital twin hali treningowej` (fala #8)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1978. **RD — Proof-of-concept `symulacji fizyki sztangi` (fala #8)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1979. **RD — Proof-of-concept `audio klasyfikacji „good lift"` (fala #8)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1980. **RD — Proof-of-concept `heat mapy sali z czujników IoT` (fala #8)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1981. **RD — Proof-of-concept `wzorca technicznego z PZPC` (fala #9)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1982. **RD — Proof-of-concept `protokołu Sinclair IWF` (fala #9)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1983. **RD — Proof-of-concept `danych IMU z nadgarstka` (fala #9)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1984. **RD — Proof-of-concept `wizji komputerowej na Edge TPU` (fala #9)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1985. **RD — Proof-of-concept `modelu LLM lokalnego dla podpowiedzi treningowych` (fala #9)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1986. **RD — Proof-of-concept `blockchain NFT dla dyplomów (kontrowersyjne)` (fala #9)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1987. **RD — Proof-of-concept `digital twin hali treningowej` (fala #9)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1988. **RD — Proof-of-concept `symulacji fizyki sztangi` (fala #9)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1989. **RD — Proof-of-concept `audio klasyfikacji „good lift"` (fala #9)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1990. **RD — Proof-of-concept `heat mapy sali z czujników IoT` (fala #9)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1991. **RD — Proof-of-concept `wzorca technicznego z PZPC` (fala #10)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1992. **RD — Proof-of-concept `protokołu Sinclair IWF` (fala #10)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1993. **RD — Proof-of-concept `danych IMU z nadgarstka` (fala #10)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1994. **RD — Proof-of-concept `wizji komputerowej na Edge TPU` (fala #10)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1995. **RD — Proof-of-concept `modelu LLM lokalnego dla podpowiedzi treningowych` (fala #10)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1996. **RD — Proof-of-concept `blockchain NFT dla dyplomów (kontrowersyjne)` (fala #10)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1997. **RD — Proof-of-concept `digital twin hali treningowej` (fala #10)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1998. **RD — Proof-of-concept `symulacji fizyki sztangi` (fala #10)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
1999. **RD — Proof-of-concept `audio klasyfikacji „good lift"` (fala #10)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.
2000. **RD — Proof-of-concept `heat mapy sali z czujników IoT` (fala #10)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.


## Pomysły funkcji wg ról (ZAW · TRE · ADM · SUP) — numery 2001–2300

Priorytety pod **doświadczenie roli**: zawodnik (ZAW), trener (TRE), administrator klubu (ADM), SuperAdmin platformy (SUP). Można filtrować po prefiksie w wyszukiwarce pliku.

### Zawodnik (Athlete)

2001. **ZAW — Jedno miejsce „Mój tydzień”: plan + starty + składka + czat — bez przeklikiwania modułów.**
2002. **ZAW — Powiadomienie gdy trener zatwierdzi / odrzuci wynik lub ćwiczenie dodatkowe — z powodem w powiadomieniu.**
2003. **ZAW — Eksport „moja karta startów” do PDF (data, miasto, kategoria) — do trenera lub lekarza.**
2004. **ZAW — Ulubione ćwiczenia w planie — pin na górze listy jednostek.**
2005. **ZAW — Własny cel sezonu (np. total / Sinclair) z paskiem postępu na dashboardzie zawodnika.**
2006. **ZAW — Przypomnienie o uzupełnieniu masy ciała przed ważeniem — jeśli w profilu brak aktualnej.**
2007. **ZAW — Porównanie z średnią klubu w kategorii (anonimowo z agregatu) — motywacja bez nazwisk.**
2008. **ZAW — Historia wagowań i kategorii — oś czasu dla ważeń oficjalnych i samodzielnych wpisów.**
2009. **ZAW — Tryb „tylko moje powiadomienia ważne” — filtr typów (wynik, składka, czat, klub).**
2010. **ZAW — Szybki wpis treningu z szablonów (np. „klasyk Śr”: rozgrzewka + rwanie techniczne).**
2011. **ZAW — Integracja z kalendarzem osobistym — jednym klikiem dodaj start z systemu do Google/Apple Calendar.**
2012. **ZAW — Badge „trening zrobiony” po potwierdzeniu jednostki planu — mikro-nagroda / streak.**
2013. **ZAW — Lista kontrolna przedstartowa (sprzęt, dokumenty, waga) — checklist na dzień przed zawodami.**
2014. **ZAW — Udostępnij trenerowi link do nagrania techniki (YouTube unlisted / Drive) z poziomu profilu.**
2015. **ZAW — Statystyki osobiste: ile treningów w miesiącu, średni RPE, dni przerwy.**
2016. **ZAW — Powiadomienie gdy pojawi się nowy wpis w dzienniku od trenera (notatka do przeczytania).**
2017. **ZAW — Filtr osi czasu: tylko zawody / tylko treningi / tylko obecności.**
2018. **ZAW — Widok „co dalej w planie” — następne 3 jednostki z planu na jednym ekranie mobilnym.**
2019. **ZAW — Przypomnienie o złożeniu deklaracji startowej jeśli klub zbiera deklaracje w systemie.**
2020. **ZAW — Mini-kalkulator „ile muszę zabrać na sztangę” wg planu tygodnia (suma zaplanowanych %).**
2021. **ZAW — Ulubione filmy techniki z biblioteki klubu — osobista playlista.**
2022. **ZAW — Status kontuzji / ograniczeń widoczny tylko dla trenera i zawodnika (pole opcjonalne).**
2023. **ZAW — Porównanie tygodnia z poprzednim: objętość, liczba sesji, najcięższe serie.**
2024. **ZAW — Jasny komunikat gdy konto ma zaległą składkę — link do historii płatności.**
2025. **ZAW — Tryb dyskretny na sali: większe przyciski, mniej tekstu, ekran nie gasnie podczas timera przerwy.**
2026. **ZAW — Eksport dziennika treningów na miesiąc do CSV dla własnych analiz (Excel).**
2027. **ZAW — Powiadomienie gdy zmieni się godzina lub miejsce treningu klubowego w kalendarzu.**
2028. **ZAW — „Moi trenerzy” — lista kontaktów z rolami (główny / pomocniczy) z przyciskiem czatu.**
2029. **ZAW — Powiązanie wyniku ze zdjęciem z medalami / podium — opcjonalna galeria osobista.**
2030. **ZAW — Przypomnienie o uzupełnieniu ankiety regeneracji po ciężkim tygodniu.**
2031. **ZAW — Widget z najbliższym startem na stronie głównej panelu zawodnika (data odliczania).**
2032. **ZAW — Tryb czytania ogłoszeń bez oznaczania przeczytanych (preview).**
2033. **ZAW — Szybki dostęp do regulaminu startów z karty zawodów (PDF/link).**
2034. **ZAW — Powiadomienie gdy ranking publiczny zmieni pozycję zawodnika (opcjonalnie, rzadko).**
2035. **ZAW — Ulubione ćwiczenia dodatkowe — szybkie dodawanie do kolejki zgłoszeń.**
2036. **ZAW — Wyświetlanie limitów PR wg kategorii wagowej na podstawie profilu.**
2037. **ZAW — Integracja: skopiuj adres hali do map — jeden tap z karty startu.**
2038. **ZAW — Harmonogram snu sugerowany przed zawodami (edukacja, nie zamiast lekarza).**
2039. **ZAW — Powiadomienie gdy trener doda komentarz do wpisu w dzienniku.**
2040. **ZAW — Tryb „pierwszy raz na zawodach” — uproszczony checklist i poradnik w panelu.**
2041. **ZAW — Udostępnianie osiągnięć (badges) jako grafika do social — z marką klubu.**
2042. **ZAW — Filtr powiadomień: tylko od trenera / tylko klub / tylko system.**
2043. **ZAW — Powiadomienie o zbliżającym się końcu ważności badania lekarskiego (jeśli data w profilu).**
2044. **ZAW — Szablon wiadomości do trenera: „prośba o konsultację techniki”, „zmiana planu”.**
2045. **ZAW — Wykres mood / samopoczucia 1–5 po treningach (opcjonalny, prywatny dla trenera).**
2046. **ZAW — Powiadomienie gdy plan treningowy zostanie zaktualizowany — diff „co się zmieniło”.**
2047. **ZAW — Lista „rzeczy do zrobienia” integrująca składkę, dokumenty, nieprzeczytane czaty.**
2048. **ZAW — Szybki podgląd Sinclair na żywo przy wpisywaniu wagi i wyniku w kalkulatorze.**
2049. **ZAW — Powiadomienie gdy inny zawodnik z grupy treningowej zrobi PR (jeśli klub włączy social).**
2050. **ZAW — Tryb offline: podgląd ostatnio pobranego planu i listy startów.**
2051. **ZAW — Powiązanie treningu z playlistą muzyczną (link Spotify) — osobiste, niepubliczne.**
2052. **ZAW — Eksport „raport miesiąca” PDF: treningi, starty, składki, powiadomienia.**
2053. **ZAW — Powiadomienie gdy składka zostanie zaksięgowana — potwierdzenie wpłaty.**
2054. **ZAW — Ulubione strony w menu „Więcej” — konfigurowalny dock skrótów.**
2055. **ZAW — Przypomnienie o szczepieniu / badaniu jeśli klub prowadzi pole obowiązkowe.**
2056. **ZAW — Tryb dużej czcionki tylko w module plan/dziennik — bez psucia całego UI.**
2057. **ZAW — Powiadomienie gdy trener oznaczy wpis jako „pilne” w czacie.**
2058. **ZAW — Porównanie z poprzednim sezonem: najlepszy total, liczba startów.**
2059. **ZAW — Powiadomienie gdy pojawi się nowy post w aktualnościach oznaczony jako ważny.**
2060. **ZAW — Szybki dostęp do numerów alarmowych klubu i adresu hali z panelu.**
2061. **ZAW — Powiadomienie gdy zgłoszenie ćwiczenia dodatkowego przejdzie w kolejce pozycję.**
2062. **ZAW — Ulubione filtry na liście startów (np. tylko MP, tylko liga).**
2063. **ZAW — Powiadomienie gdy regeneracja (sen) spada poniżej progu ustawionego z trenerem.**
2064. **ZAW — Mini quiz techniczny tygodnia (edukacja) — bez wpływu na ranking.**
2065. **ZAW — Powiadomienie gdy trening klubowy został odwołany lub przeniesiony.**
2066. **ZAW — Własny podpis pod eksportowanym wynikiem (grafika) — imię + klub.**
2067. **ZAW — Powiadomienie gdy limit miejsc na zapis zewnętrzny został osiągnięty (jeśli dotyczy).**
2068. **ZAW — Tryb sesji na siłowni: ekran nie ściemnij + timer serii z wibracją.**
2069. **ZAW — Powiadomienie gdy dokument klubu (np. regulamin członkowski) został zaktualizowany.**
2070. **ZAW — Powiadomienie gdy odznaka zostanie odblokowana — gratulacje z share.**
2071. **ZAW — Ulubione jednostki planu do powtórzenia jako szablon „własny microcykl”.**
2072. **ZAW — Powiadomienie gdy czat trenera jest nieaktywny >7 dni — delikatna sugestia kontaktu.**
2073. **ZAW — Własny cel tygodniowy objętości (kg×powtórzenia) z progress barem.**
2074. **ZAW — Powiadomienie gdy planowany start został usunięty z kalendarza przez kadre.**
2075. **ZAW — Szybki widok „kto ze znajomych z klubu jedzie na te zawody” (jeśli zgoda RODO).**

### Trener (Trainer)

2076. **TRE — Dashboard „moja grupa”: lista zawodników z filtrem ryzyko / forma / składka.**
2077. **TRE — Masowe oznaczanie obecności na jednostce + eksport do CSV dla zarządu.**
2078. **TRE — Szablony komentarzy do dziennika (technika, rozgrzewka, mobilność) — jeden klik.**
2079. **TRE — Alerty: zawodnik bez treningu X dni, bez odpowiedzi w czacie, zaległa składka.**
2080. **TRE — Porównanie dwóch zawodników: wykresy Sinclair, frekwencja, plan vs wykonanie.**
2081. **TRE — Przypisanie „grupy treningowej” (A/B/C) — filtrowanie planów i komunikatów.**
2082. **TRE — Notatki prywatne trenera o zawodniku — niewidoczne dla zawodnika.**
2083. **TRE — Plan tygodnia widokiem siatki — kto który dzień ma jednostkę z planu.**
2084. **TRE — Import podpowiedzi technicznych z analizy sztangi do komentarza w dzienniku.**
2085. **TRE — Masowa wysyłka przypomnienia o składce do wybranej grupy.**
2086. **TRE — Wideokonsultacje: pole link do Zoom/Meet przy wpisie treningowym (integracja).**
2087. **TRE — Szablon planu „start za 4 tygodnie” — automatyczna struktura tygodni.**
2088. **TRE — Heatmapa obecności zawodnika vs średnia grupy — wykrywanie spadku.**
2089. **TRE — Szybki widok pending: wyniki, ćwiczenia dodatkowe, wpisy dziennika do sprawdzenia.**
2090. **TRE — Przypisywanie drugiego trenera jako współprowadzącego grupę (read/write).**
2091. **TRE — Eksport listy startowej klubu na zawody zewnętrzne — format dla sekretariatu.**
2092. **TRE — Makra żywieniowe / suplementacja jako pole szablonowe w planie (nie zamiast dietetyka).**
2093. **TRE — Powiadomienie gdy zawodnik zgłosi kontuzję w dzienniku — priorytet na liście.**
2094. **TRE — Widok kalendarza grupy: nakładanie startów wielu zawodników.**
2095. **TRE — Ocena techniki skala 1–5 przy komentarzu do nagrania — trendy w czasie.**
2096. **TRE — Szablony wiadomości masowych do grupy (max N dziennie anty-spam).**
2097. **TRE — Powiązanie planu z konkretnym cyklem zawodowym (np. Mistrzostwa Polski).**
2098. **TRE — Automatyczna sugestia deloadu po N tygodniach bez PR (informacyjnie).**
2099. **TRE — Panel „kto na sali dziś” — check-in treningowy jeśli klub używa obecności.**
2100. **TRE — Kopiowanie planu między zawodnikami z anonymizacją nazw jednostek.**
2101. **TRE — Tagi na zawodnikach (kadra młodzieżowa, senior, rekreacja) — raporty.**
2102. **TRE — Integracja: eksport treningu tygodnia do arkusza Google (jednorazowy OAuth).**
2103. **TRE — Priorytet kolejki rozmów — pilne od zawodników przed startem.**
2104. **TRE — Statystyki grupy: średni total, mediana frekwencji, odsetek zaległych składek.**
2105. **TRE — Szablon powiadomienia push do grupy przed ważeniem (trener akceptuje treść).**
2106. **TRE — Widok porównania planu vs wykonanie % dla całej grupy.**
2107. **TRE — Blokada edycji planu przez zawodnika — przełącznik per plan (tylko trener).**
2108. **TRE — Historia zmian planu z audytem — kto zmienił obciążenia.**
2109. **TRE — Rekomendacja obciążeń na podstawie RPE z poprzedniego tygodnia (sugestia, nie auto).**
2110. **TRE — Powiadomienie gdy zawodnik uzupełni ankietę regeneracji — podsumowanie na liście.**
2111. **TRE — Współdzielony folder materiałów (PDF) per grupa — tylko dla tej grupy.**
2112. **TRE — Tryb „obóz” — plan dzienny z godzinami i mapą sali (tekstowo).**
2113. **TRE — Masowe przypisanie wydarzenia kalendarzowego do grupy (np. zbiórka).**
2114. **TRE — Wykrywanie zawodników bez aktualnego badania — lista dla trenera.**
2115. **TRE — Komentarz głosowy do planu — nagranie max 2 min (jeśli backend pozwoli).**
2116. **TRE — Szablon startów sezonu — kopiowanie listy z ubiegłego roku z edycją.**
2117. **TRE — Powiadomienie gdy średnia grupy spadnie poniżej progu frekwencji.**
2118. **TRE — Integracja z tablicą wyników live wewnętrznych zawodów klubu.**
2119. **TRE — Przypisywanie zadań domowych (mobilność, rozciąganie) z potwierdzeniem przez zawodnika.**
2120. **TRE — Widok ryzyk: kontuzje + niskie RPE + zaległe składki na jednej kartce.**
2121. **TRE — Eksport PDF „raport grupy miesiąc” dla zarządu klubu.**
2122. **TRE — Powiadomienie gdy zawodnik doda film techniki — kolejka do obejrzenia.**
2123. **TRE — Szablony wiadomości do rodziców (jeśli niepełnoletni) — osobny kanał.**
2124. **TRE — Porównanie planów dwóch tygodni obok siebie (diff jednostek).**
2125. **TRE — Powiadomienie gdy limit obłożenia sali został osiągnięty (jeśli rezerwacje).**
2126. **TRE — Przypisywanie „poziomu” zawodnikom (początkujący/średni/elita) — filtrowanie treści.**
2127. **TRE — Automatyczna lista „kto potrzebuje feedbacku” po tygodniu bez komentarza trenera.**
2128. **TRE — Powiadomienie gdy zawodnik zmieni kategorię wagową w profilu.**
2129. **TRE — Wspólny kalendarz spotkań indywidualnych z integracją ICS.**
2130. **TRE — Szablon mikrocyklu 3:1 — jednym klikiem rozłożenie na grupę.**
2131. **TRE — Powiadomienie gdy średni czas odpowiedzi trenera w czacie przekroczy SLA (wewnętrznie).**
2132. **TRE — Widok „nadchodzące starty grupy” z możliwością eksportu dla busów.**
2133. **TRE — Przypisywanie celów grupowych (np. średnia frekwencja 80%).**
2134. **TRE — Powiadomienie gdy zawodnik oznaczy trening jako „za ciężki”.**
2135. **TRE — Biblioteka ćwiczeń z notatkami trenera widocznymi tylko dla grupy.**
2136. **TRE — Masowe oznaczenie przeczytanych powiadomień grupy (admin trenera).**
2137. **TRE — Powiadomienie gdy plan jest niekompletny (brak jednostki w tygodniu).**
2138. **TRE — Integracja z licznikiem tonazu grupy (suma tygodnia) — tablica motywacyjna.**
2139. **TRE — Szablon wiadomości po zawodach: gratulacje / debrief.**
2140. **TRE — Powiadomienie gdy zawodnik nie odda ankiety po zawodach.**
2141. **TRE — Widok „nowi w grupie” — pierwsze 30 dni osobnej uwagi checklist.**
2142. **TRE — Powiadomienie gdy średnia wieku grupy zmieni się (np. napływ juniorów).**
2143. **TRE — Raport „gotowość do startu” — checklist zawodnika X dni przed zawodami.**
2144. **TRE — Powiadomienie gdy trener drugi doda komentarz w planie (koordynacja).**
2145. **TRE — Ulubione metryki na dashboardzie trenera — konfiguracja widżetów.**
2146. **TRE — Powiadomienie gdy grupa przekroczy limit liczebności (jeśli klub ustawi).**
2147. **TRE — Wykres obciążenia tygodniowego grupy vs wybranego zawodnika — kontekst obciążeń.**
2148. **TRE — Powiadomienie zbiorcze: „grupa ukończyła plan tygodnia” — motywacja i widok postępu.**
2149. **TRE — Biblioteka mikrocykli: szczyt, tapering, po-zawodowy — szablony do przypięcia.**
2150. **TRE — Eksport „lista startowa po ważeniu” do PDF dla sekretariatu z jednym kliknięciem.**

### Administrator klubu (Admin)

2151. **ADM — Panel „zdrowie klubu”: składki, aktywni zawodnicy, pending wyników na jednym ekranie.**
2152. **ADM — Masowe zaproszenia na konto e-mailem z szablonem klubu i linkiem aktywacyjnym.**
2153. **ADM — Szablony ogłoszeń (trening odwołany, zbiórka, zbiórka składek) — wersje PL/EN.**
2154. **ADM — Role z granularnymi uprawnieniami: kto może blog vs kto kalendarz vs kto płatności.**
2155. **ADM — Eksport członków do Excel z polami zgody marketingowej i statusu składki.**
2156. **ADM — Workflow zatwierdzania wydatków klubu (jeśli moduł finansów rozszerzony).**
2157. **ADM — Audit widoczny dla admina: ostatnie 50 akcji kadry bez wchodzenia w SuperAdmin.**
2158. **ADM — Harmonogram publikacji aktualności — zaplanowany post na datę.**
2159. **ADM — Lista kont zablokowanych z możliwością odblokowania i powodem bana.**
2160. **ADM — Import listy płatności bankowych CSV — dopasowanie po nazwisku (asystowane).**
2161. **ADM — Szablony maili systemowych edytowalne przez admina (nagłówek, stopka klubu).**
2162. **ADM — Podgląd jako zawodnik / jako trener — impersonacja read-only z audytem.**
2163. **ADM — Konfiguracja progów składki per rok i kategoria (junior/senior).**
2164. **ADM — Zarządzanie trenerami: przypisanie do grup i widoczność zawodników.**
2165. **ADM — Eksport statystyk klubu do PDF na walne zebranie.**
2166. **ADM — Powiadomienie admina gdy liczba pending wyników > próg.**
2167. **ADM — Szablony wydarzeń kalendarza (liga/mistrzostwa/trening stały) — jeden klik.**
2168. **ADM — Integracja z newsletterem (Mailchimp/Brevo) — segment aktywnych zawodników.**
2169. **ADM — Polityka haseł klubu: minimalna długość, wymuszenie resetu co X mies.**
2170. **ADM — Panel sponsorów: logo + link + kolejność wyświetlania na www.**
2171. **ADM — Zarządzanie treścią statyczną (adres, godziny, kontakt) bez deployu kodu.**
2172. **ADM — Lista „do zrobienia dla kadry” generowana automatycznie (składki, dokumenty).**
2173. **ADM — Powiadomienie gdy kończy się domena SSL lub integracja zewnętrzna (manual checklist).**
2174. **ADM — Szablony dokumentów klubu (oświadczenia, zgody) do pobrania z panelu.**
2175. **ADM — Przypisywanie adminów pomocniczych z zakresem tylko wybranych modułów.**
2176. **ADM — Raport frekwencji vs składki — korelacja dla zarządu (agregaty).**
2177. **ADM — Konfiguracja widoczności rankingu publicznego (ukryj juniorów / wagę).**
2178. **ADM — Masowe przypisanie roli Athlete po imporcie CSV.**
2179. **ADM — Powiadomienie gdy blog ma wpis w szkicu dłużej niż 14 dni.**
2180. **ADM — Eksport logów czatu tylko dla sądowych żądań — procedura i ZIP.**
2181. **ADM — Szablony powiadomień push klubowych z akceptacją dwóch adminów.**
2182. **ADM — Panel „zgłoszenia od mieszkańców” — formularz kontaktowy z tiketami.**
2183. **ADM — Konfiguracja limitów uploadu zdjęć i wideo dla użytkowników.**
2184. **ADM — Harmonogram czyszczenia kont nieaktywnych — polityka retencji.**
2185. **ADM — Powiadomienie gdy zbliża się koniec roku składkowego.**
2186. **ADM — Integracja z księgowością — eksport CSV dla biura rachunkowego.**
2187. **ADM — Szablony SMS (jeśli gateway) dla pilnych odwołań treningów.**
2188. **ADM — Zarządzanie wersjami regulaminu klubu — użytkownik musi zaakceptować nową.**
2189. **ADM — Statystyki wejść na www i konwersja „zapisz się” — podstawowa analityka.**
2190. **ADM — Powiadomienie gdy liczba nowych kont > próg dziennie (możliwy spam).**
2191. **ADM — Konfiguracja grup wiekowych dla zawodów wewnętrznych.**
2192. **ADM — Eksport listy obecności na zbiórkę dla sprawozdawczości związku.**
2193. **ADM — Szablony uprawnień „tylko odczyt” dla osoby od PR klubu.**
2194. **ADM — Powiadomienie gdy integracja Blob/storage zwraca błąd > N razy.**
2195. **ADM — Panel darowizn / wpłat celowych jeśli klub zbiera zbiórki.**
2196. **ADM — Konfiguracja treści stopki www (social, nip, regon) centralnie.**
2197. **ADM — Masowe oznaczenie przeczytanych ogłoszeń przez zawodników (test kampanii).**
2198. **ADM — Powiadomienie gdy termin licencji trenera w bazie się kończy.**
2199. **ADM — Szablony zgód RODO per proces (newsletter, zdjęcia na www).**
2200. **ADM — Integracja z Google Analytics / Plausible — ID w ustawieniach klubu.**
2201. **ADM — Raport „przychody składki vs plan” miesiąc do miesiąca.**
2202. **ADM — Powiadomienie gdy limit API zewnętrznego (np. mapy) się kończy.**
2203. **ADM — Konfiguracja barw klubu dla eksportów PDF i maili.**
2204. **ADM — Lista rezerwowa na zawody wewnętrzne z automatyczną kolejką.**
2205. **ADM — Powiadomienie gdy drużyna wyjeżdża na zgrupowanie — checklist wyjazdowy.**
2206. **ADM — Szablony dokumentów dla zawodów (program, lista startowa) generowane z systemu.**
2207. **ADM — Zarządzanie kontami rodziców powiązanych z nieletnimi.**
2208. **ADM — Powiadomienie gdy liczba zgłoszeń do zawodów przekroczyła limit sali.**
2209. **ADM — Konfiguracja widoku publicznego bloga (ukryj daty / pokaż autora).**
2210. **ADM — Eksport „członkowie aktywni” do integracji z CRM klubu.**
2211. **ADM — Powiadomienie gdy backup bazy nie został potwierdzony przez X dni (SuperAdmin może dublować).**
2212. **ADM — Szablony komunikatów o zamknięciu obiektu (śnieg, awaria).**
2213. **ADM — Koordynacja wolontariuszy na zawodach — lista kontaktów z poziomami dostępu.**
2214. **ADM — Powiadomienie gdy liczba postów blogowych spadła poniżej celu kwartalnego.**
2215. **ADM — Konfiguracja progów dla automatycznych przypomnień o składce (dzień miesiąca).**
2216. **ADM — Panel „zgody na zdjęcia” — zawodnicy którzy nie wyrazili zgody.**
2217. **ADM — Powiadomienie gdy umowa z dostawcą (np. hosting) jest w archive — odnowienie.**
2218. **ADM — Szablony harmonogramów treningów letnich vs zimowych.**
2219. **ADM — Zarządzanie kontami mediów — dostęp tylko do aktualności i galerii.**
2220. **ADM — Powiadomienie gdy zbliża się termin audytu związku dla klubu.**
2221. **ADM — Konfiguracja widoku rankingu (ukryj Sinclair / pokaż tylko total).**
2222. **ADM — Eksport listy „do kontaktu” po zebraniu — CSV telefonów (RODO).**
2223. **ADM — Powiadomienie gdy liczba zaległych składek > X% kadry.**
2224. **ADM — Szablony uchwał zarządu jako załączniki do komunikatów.**
2225. **ADM — Koordynacja wynajmu sali — kalendarz zajęć poza sekcją podnoszenia.**

### SuperAdmin (platforma)

2226. **SUP — Globalny kill-switch funkcji eksperymentalnych z telemetrią aktywacji.**
2227. **SUP — Porównanie instancji preview vs production pod kątem migracji schema.**
2228. **SUP — Sandbox z anonimowym zrzutem struktury DB (bez PII) do debugowania.**
2229. **SUP — Panel quota API: zużycie Turso, Blob, egress — alerty progów.**
2230. **SUP — Symulacja obciążenia — skrypt k6 z zestawem krytycznych endpointów.**
2231. **SUP — Masowa migracja ról po zmianie modelu RBAC — raport konfliktów.**
2232. **SUP — Integracja z Sentry/DataDog — mapowanie release frontend/backend.**
2233. **SUP — Harmonogram rotacji sekretów (JWT, webhook HMAC) z checklistą.**
2234. **SUP — Podgląd różnic konfiguracji env między środowiskami (redacted).**
2235. **SUP — Narzędzie czyszczenia duplikatów zawodników po imporcie historycznym.**
2236. **SUP — Panel „feature adoption”: ile kont używa modułu X w 30 dni.**
2237. **SUP — Automatyczny raport bezpieczeństwa: nagłówki CSP, cookies, HSTS.**
2238. **SUP — Dry-run migracji SQL na kopii bazy przed produkcją.**
2239. **SUP — Integracja z GitHub Dependabot — priorytety PR security.**
2240. **SUP — Lista tenantów (przyszłość multi-klub) — stub konfiguracji.**
2241. **SUP — Replay wybranych żądań API z logów (bez body PII) — diagnostyka.**
2242. **SUP — Konfiguracja globalnych limitów rate-limit per IP dla całej platformy.**
2243. **SUP — Backup verification job — sumy kontrolne tabel krytycznych.**
2244. **SUP — Panel eksperymentów ML — wersje modeli TensorFlow / MediaPipe.**
2245. **SUP — Masowe unban z audytem i powodem — odwrotność bana.**
2246. **SUP — Integracja z OIDC dla kadry IT klubu (opcjonalny SSO).**
2247. **SUP — Symulacja kosztów Blob przy prognozie rozrostu mediów.**
2248. **SUP — Narzędzie eksportu całego klubu do ZIP (GDPR data portability super).**
2249. **SUP — Porównanie wersji OpenAPI — breaking changes w CI.**
2250. **SUP — Panel „incidents”: historia alertów i czasów naprawy.**
2251. **SUP — Konfiguracja globalnych komunikatów banerowych (maintenance window).**
2252. **SUP — Test penetracyjny checklist OWASP Top 10 — ticket template.**
2253. **SUP — Shard routing preview — przygotowanie pod skalowanie horyzontalne.**
2254. **SUP — Integracja z PagerDuty/Opsgenie dla alertów backend 5xx.**
2255. **SUP — Narzędzie anonymizacji staging dump przed udostępnieniem devom.**
2256. **SUP — Panel „wersje mobilki”: minimalna wspierana vs najczęstsza w logach.**
2257. **SUP — Automatyczne zamrażanie kont nieaktywnych >2 lat — polityka.**
2258. **SUP — Konfiguracja globalnych CORS origins — walidacja przy deployu.**
2259. **SUP — Replay worker kolejek — ponów failed jobs z limitem.**
2260. **SUP — Integracja z Vault dla sekretów zamiast samych env (roadmap).**
2261. **SUP — Dashboard kosztów Vercel vs transfer — optymalizacja assetów.**
2262. **SUP — Narzędzie merge kont użytkowników po duplikacie email.**
2263. **SUP — Globalny szablon polityki prywatności z polem wypełnianym per klub.**
2264. **SUP — Test chaos na staging — wyłączenie jednej repliki API.**
2265. **SUP — Panel „mapa tras” zsynchronizowany z routerem i middleware.**
2266. **SUP — Konfiguracja sink logów (CloudWatch/Datadog) jednym JSON.**
2267. **SUP — Walidator JSON payloadów z produkcji vs schema — nightly.**
2268. **SUP — Integracja z Stripe invoices dla przychodów platformy (jeśli SaaS).**
2269. **SUP — Narzędzie czyszczenia starych tokenów push nieaktywnych urządzeń.**
2270. **SUP — Globalny feature flag „tryb zawody” — wyższy rate limit dla live.**
2271. **SUP — Symulacja failover Turso — procedura runbook jednostronicowa.**
2272. **SUP — Panel „wersje Rust”: lista crate z CVE z cargo audit.**
2273. **SUP — Masowy export audit logów do zewnętrznego SIEM (webhook).**
2274. **SUP — Konfiguracja minimalnej wersji aplikacji mobilnej — force update.**
2275. **SUP — Narzędzie porównania dwóch snapshotów bazy (checksum per table).**
2276. **SUP — Integracja z Terraform plan preview w PR infrastruktury.**
2277. **SUP — Panel „limity uploadów” globalnie vs per klub.**
2278. **SUP — Automatyczne ticketowanie gdy error rate endpointu > próg 15 min.**
2279. **SUP — Konfiguracja IP allowlist dla endpointów superadmin tylko z VPN.**
2280. **SUP — Narzędzie seedowania danych demo dla targów i szkoleń.**
2281. **SUP — Globalny registry webhooków partnerów — rotacja kluczy.**
2282. **SUP — Porównanie bundle size frontend między release — regresja KB.**
2283. **SUP — Panel „health dependency”: status zewnętrznych API (PZPC itd.).**
2284. **SUP — Konfiguracja retention audit logów vs RODO minimalny okres.**
2285. **SUP — Narzędzie podziału monorepo na release notes per pakiet.**
2286. **SUP — Integracja z Linear/Jira — tworzenie ticketów z alertów.**
2287. **SUP — Symulacja latencji Sieci 3G dla testów mobilnych API.**
2288. **SUP — Panel „czarna lista IP” po ataku brute-force globalnie.**
2289. **SUP — Konfiguracja dual-write przy migracji kolumny krytycznej.**
2290. **SUP — Narzędzie approval chain dla migracji DB — dwóch reviewerów.**
2291. **SUP — Integracja z SonarCloud dla jakości kodu frontend/backend.**
2292. **SUP — Globalny harmonogram maintenance — komunikat we wszystkich panelach.**
2293. **SUP — Panel „wersje Node/Rust” na serwerze build vs lokalnie.**
2294. **SUP — Automatyczne zamykanie kont testowych po 24h.**
2295. **SUP — Konfiguracja max rozmiaru czatu attachment globalnie.**
2296. **SUP — Narzędzie porównania odpowiedzi API prod vs staging dla tego samego ID.**
2297. **SUP — Integracja z Statuspage dla komunikatów przy incydencie.**
2298. **SUP — Symulacja shardingu po athlete_id — eksperyment przyszłościowy.**
2299. ~~**SUP — Panel „koszt workerów” CPU czasu dla cronów.**~~ *(www: `/superadmin/workers` + `GET /api/system/worker-cron-runs` — śledzenie **czasu trwania przebiegu (wall-clock)** w procesie dla schedulera składek i prunera czatu; to nie jest profil CPU — dalsze metryki opcjonalnie.)*
2300. **SUP — Konfiguracja globalnego CAPTCHA threshold przy podejrzanym ruchu.**

---

## Nowe pomysły (Sport-Tech 3.0 i organizacja klubu) — numery 2301–2500

Zbiór 200 nowych propozycji rozwoju ekosystemu CKS Slavia Ruda Śląska, wypracowany na bazie głębokiej analizy obecnych repozytoriów kodu (`Slavia-frontend`, `Slavia-backend`, `Slavia-mobile`) oraz potrzeb organizacyjno-treningowych klubu ciężarowego. Numery **2301–2500** są podzielone na trzy przejrzyste sekcje: aplikację mobilną (2301–2365), technologie web i API (2366–2435) oraz inicjatywy pozakodowe (2436–2500).

### Aplikacja mobilna (Flutter/Mobile) — pomysły 2301–2365

2301. **MOB — Tryb „Podróż na zawody” (Travel Mode)** — Widok agregujący trasę do miejsca startu, godzinę zbiórki, listę rzeczy do spakowania (strój, pas, buty, licencja) oraz szybki kontakt do kierownika wyjazdu.
2302. **MOB — Pływający stoper przerw (Overlay Rest Timer)** — Pływający widget z odliczaniem czasu odpoczynku między seriami, widoczny na ekranie głównym telefonu nawet po zminimalizowaniu aplikacji Slavia.
2303. **MOB — Autokompresja wideo przed wysyłką (Video Transcoder)** — Natywny moduł zmniejszający rozdzielczość i klatkaż nagrań techniki bezpośrednio w telefonie przed wysłaniem na serwer, oszczędzający transfer.
2304. **MOB — Skaner kodów paskowych sprzętu (NFC/Barcode)** — Błyskawiczny skan etykiety na pomoście lub gryfie z poziomu aparatu telefonu, otwierający jego kartę serwisową lub przypisujący go do sesji.
2305. **MOB — Szybkie wprowadzanie ciężarów gestem (Dial Wheel Weight Picker)** — Alternatywne dla klawiatury numerycznej koło obrotowe do szybkiego i wygodnego ustawiania ciężaru na sztandze mokrymi/brudnymi od magnezji rękami.
2306. **MOB — Widget na ekran zablokowany z dzisiejszym planem (Lock Screen Widget)** — Szybki podgląd głównych ćwiczeń i planowanego tonażu bezpośrednio na lock screenie (iOS WidgetKit / Android Glance).
2307. **MOB — Haptic Feedback przy strefach intensywności (VBT Haptics)** — Zróżnicowane wibracje urządzenia informujące zawodnika o osiągnięciu docelowej prędkości sztangi lub jej spadku poniżej krytycznego progu bez patrzenia na ekran.
2308. **MOB — Integracja z Garmin Connect API (Garmin Sync)** — Automatyczne pobieranie wskaźników tętna spoczynkowego, zmienności rytmu zatokowego (HRV) oraz punktacji snu do oceny gotowości treningowej (RPE/Recovery).
2309. **MOB — Pamięć podręczna wideo techniki (Local Video Cache Manager)** — Lokalne zarządzanie pamięcią podręczną odtwarzanych wideo, umożliwiające szybkie przeglądanie nagrań własnej techniki bez ciągłego buforowania z chmury.
2310. **MOB — System alarmów przed startem na zawodach (Warm-up Countdown)** — Timer synchronizujący się z tablicą live zawodów, alarmujący zawodnika kiedy powinien zacząć rozgrzewkę na rozgrzewkowym pomoście (np. "10 podejść do Twojego startu").
2311. **MOB — Smart TV Casting (AirPlay / Chromecast)** — Przesyłanie wykresów analizy toru sztangi oraz nagrań z biblioteki techniki na duży telewizor w sali klubowej jednym tapnięciem.
2312. **MOB — Przełącznik profilu dla rodzin (Multi-Profile Swapper)** — Wygodna zmiana konta w aplikacji bez wylogowywania (np. dla rodzica posiadającego dwójkę dzieci trenujących w sekcji młodzieżowej).
2313. **MOB — Biometryczne zabezpieczenie modyfikacji danych (Biometric Write Lock)** — Wymóg autoryzacji odciskiem palca / Face ID przed wysłaniem oficjalnego zgłoszenia wyniku na zawody lub zmianą wrażliwych informacji.
2314. **MOB — Tryb ciemny zoptymalizowany pod AMOLED (True Black Theme)** — Ultra-ciemny motyw interfejsu (wykorzystujący czyste czernie #000000), oszczędzający baterię podczas długich sesji treningowych na sali.
2315. **MOB — Eksport osiągnięć do formatu Instagram Stories (Share Kit)** — Automatycznie generowana, estetyczna pionowa grafika z logiem Slavii, nowym rekordem życiowym i punktacją Sinclair, gotowa do wrzucenia na social media.
2316. **MOB — Lokalne kopie zapasowe dziennika (Offline Journal Backup)** — Możliwość wyeksportowania lokalnej bazy danych dziennika do pliku zaszyfrowanego na telefonie w razie awarii chmury lub braku dostępu.
2317. **MOB — Inteligentna redukcja powiadomień podczas snu (Sleep Mode DND)** — Automatyczne wyciszanie powiadomień z czatu klubowego, gdy systemy telefonu wykryją, że zawodnik śpi.
2318. **MOB — Dźwiękowy asystent techniki (Audio Coach)** — Syntezator mowy czytający na głos wskazówki trenera zapisane w planie treningowym przy przechodzeniu do kolejnego ćwiczenia.
2319. **MOB — Płynne skalowanie wykresów gestem uszczypnięcia (Pinch-to-Zoom Charts)** — Intuicyjne przybliżanie i oddalanie historycznych trendów Sinclaira oraz objętości tonażu na ekranie statystyk mobilnych.
2320. **MOB — Weryfikacja poprawności instalacji APK (Signature Integrity Check)** — Wbudowany mechanizm sprawdzający sumę kontrolną uruchomionej aplikacji pod kątem nieautoryzowanych modyfikacji poza sklepem.
2321. **MOB — Szybkie notowanie błędów wstrząśnięciem (Shake-to-Report Bug)** — Wywołanie formularza zgłaszania błędu z automatycznym zrzutem ekranu i logami poprzez potrząśnięcie telefonem.
2322. **MOB — Integracja z Apple HealthKit (Steps & Calorie Sync)** — Synchronizacja dziennej liczby kroków oraz wydatku energetycznego jako danych uzupełniających dla trenera w analizie regeneracji.
2323. **MOB — Wybór domyślnej kamery do nagrań (Camera Selector)** — Możliwość zdefiniowania w ustawieniach, która kamera urządzenia (szerokokątna, główna, teleobiektyw) ma być uruchamiana przy nagrywaniu prób.
2324. **MOB — Wirtualne trofea w AR (Augmented Reality Badges)** — Wizualizacja zdobytych odznak klubowych w rozszerzonej rzeczywistości z opcją zrobienia zdjęcia z wirtualnym pucharem na pomoście.
2325. **MOB — Natywny odtwarzacz wideo w zwolnionym tempie (Slo-Mo Video Player)** — Odtwarzacz wspierający precyzyjne przewijanie klatka po klatce oraz zmianę prędkości odtwarzania (0.1x, 0.25x, 0.5x) dla wideo techniki.
2326. **MOB — Tryb niskiego zużycia energii na sali (Gym Power Saver)** — Ograniczenie animacji interfejsu i odpytywania API przy niskim stanie naładowania baterii telefonu zawodnika podczas sesji.
2327. **MOB — Przypomnienie o nawodnieniu w dni upalne (Water Intake Reminders)** — Powiadomienia push przypominające o piciu wody, wyzwalane na podstawie lokalnej prognozy pogody w Rudzie Śląskiej.
2328. **MOB — Dynamiczne skróty na pulpicie telefonu (Dynamic App Shortcuts)** — Automatyczne generowanie skrótów pod ikoną aplikacji na podstawie ostatnio wykonywanych akcji (np. bezpośrednie przejście do dzisiejszego czatu z trenerem).
2329. **MOB — Samouczek wideo dla nowych funkcji (In-App Video Walkthroughs)** — Krótkie instruktaże wideo osadzone bezpośrednio przy nowych, zaawansowanych modułach (np. przy pierwszym uruchomieniu Barbell Path).
2330. **MOB — Widgety ze statystykami Sinclaira na ekran główny (Sinclair Stats Widget)** — Domowy widget prezentujący aktualną pozycję w klubowym rankingu oraz postęp w punktach Sinclaira z ostatniego kwartału.
2331. **MOB — Skanowanie dokumentu tożsamości aparatem (OCR License Scanner)** — Automatyczne uzupełnianie danych licencyjnych zawodnika na podstawie zdjęcia karty PZPC lub dowodu osobistego (przetwarzanie lokalne).
2332. **MOB — Wbudowany kalendarz fizjoterapii (Physio Booking Calendar)** — Ekran rezerwacji terminów u klubowego fizjoterapeuty z automatycznym dodawaniem przypomnień w systemie i kalendarzu telefonu.
2333. **MOB — Automatyczny dobór kontrastu tekstu (Adaptive Contrast Engine)** — Dynamiczne dopasowanie jasności i kontrastu interfejsu na podstawie czujnika oświetlenia zewnętrznego dla maksymalnej czytelności na zewnątrz.
2334. **MOB — Wykresy porównawcze w trybie poziomym (Landscape Chart Mode)** — Automatyczne obracanie i rozszerzanie wykresów postępu do pełnego ekranu po obróceniu telefonu do poziomu.
2335. **MOB — Status łączności z bazą lokalną (Offline Status Banner)** — Dyskretny pasek informujący o przejściu w tryb offline i liczbie transakcji oczekujących w kolejce do synchronizacji z serwerem.
2336. **MOB — Przewodnik głosowy po rozgrzewce (Warm-up Voice Guide)** — Odtwarzanie komunikatów głosowych z kolejnymi ćwiczeniami mobilizacyjnymi i czasem ich trwania (funkcja "hands-free" na pomoście).
2337. **MOB — Wyszukiwanie zawodników po głosie (Voice Search)** — Opcja podyktowania imienia i nazwiska zawodnika na ekranie listy kadry w celu szybkiego odnalezienia profilu.
2338. **MOB — Udostępnianie planu treningowego jako PDF (Plan-to-PDF Share)** — Wygenerowanie czytelnego arkusza PDF z planem na dany tydzień bezpośrednio z telefonu i wysłanie go np. na WhatsApp/Messenger.
2339. **MOB — System zgłaszania nieobecności z wyprzedzeniem (Absenteeism Report)** — Szybki moduł pozwalający zawodnikowi zgłosić planowaną nieobecność na treningach (np. z powodu wyjazdu lub choroby) z określeniem zakresu dat.
2340. **MOB — Prywatny sejf na zdjęcia sylwetki (Silhouette Progress Vault)** — Zabezpieczony kodem PIN folder na zdjęcia postępów sylwetkowych i składu ciała, niewidoczny w ogólnej galerii telefonu.
2341. **MOB — Integracja z inteligentną skakanką/sensorami (Smart Jump Rope Sync)** — Zliczanie powtórzeń i intensywności rozgrzewki za pomocą sensorów Bluetooth z bezpośrednim zapisem w dzienniku.
2342. **MOB — Powiadomienia o zbliżającym się limicie wagowym (Weight Category Alert)** — Alerty, gdy waga zawodnika wpisana w porannym raporcie zbliża się lub przekracza górną granicę jego oficjalnej kategorii startowej.
2343. **MOB — Karta ratunkowa zawodnika (ICE Club Profile)** — Szybki dostęp z ekranu logowania do podstawowych informacji medycznych zawodnika (grupa krwi, alergie, kontakt do bliskich) w razie nagłego wypadku na sali.
2344. **MOB — Weryfikacja połączenia Wi-Fi na sali (Gym Wi-Fi Auto-Connector)** — Funkcja automatycznie łącząca z dedykowaną, szybką siecią Wi-Fi w klubie po wykryciu jej SSID w tle.
2345. **MOB — Podgląd tonażu serii na żywo (Live Series Tonnage Calculator)** — Dynamiczne podliczanie sumy podniesionych kilogramów w danej serii bezpośrednio podczas wpisywania powtórzeń w dzienniku.
2346. **MOB — Panel zarządzania sprzętem wypożyczonym (Club Gear Rental Tracker)** — Lista akcesoriów klubowych (pasy, owijki, buty) wypożyczonych przez zawodnika z datą zwrotu i powiadomieniami o zaległościach.
2347. **MOB — Widget odliczania do rocznicy klubu (Club Anniversary Widget)** — Dedykowany element interfejsu pokazujący czas pozostały do ważnych uroczystości i jubileuszy CKS Slavia.
2348. **MOB — Kontrola rodzicielska zgłoszeń (Parent Approval Push)** — Powiadomienia wysyłane do powiązanego konta rodzica z prośbą o zatwierdzenie zgłoszenia niepełnoletniego zawodnika na zawody wyjazdowe.
2349. **MOB — Tryb oszczędzania wzroku wieczorem (Circadian Warm UI Theme)** — Automatyczne ocieplenie kolorów interfejsu w godzinach wieczornych (filtr niebieskiego światła wbudowany w aplikację).
2350. **MOB — Inteligentna galeria błędów technicznych (Error Technique Highlight)** — Moduł grupujący nagrania wideo, w których trener oznaczył konkretny błąd techniczny (np. "złe prowadzenie bioder").
2351. **MOB — Podgląd planu na smartwatchu (Wearable Training Plan Preview)** — Mini-aplikacja na zegarki z systemem Wear OS / watchOS, umożliwiająca odznaczanie wykonanych serii bezpośrednio z nadgarstka.
2352. **MOB — Szybki kalkulator procentów obciążeń (Easy Percentages Wheel)** — Proste narzędzie na ekranie treningu pozwalające błyskawicznie sprawdzić ile wynosi np. 82.5% z aktualnego rekordu życiowego.
2353. **MOB — Dziennik suplementacji kreatyną/witaminami (Supplement Intake Log)** — Checklist codziennego przyjmowania suplementów z opcją ustawienia indywidualnych przypomnień.
2354. **MOB — System zgłoszeń do wyścigów tonażowych (Tonnage Challenge Opt-In)** — Szybki zapis do aktywnych wyzwań grupowych jednym kliknięciem z ekranu głównego.
2355. **MOB — Powiadomienie o wolnym pomoście (Platform Availability Alert)** — System powiadomień informujący, że zarezerwowany pomost treningowy właśnie się zwolnił.
2356. **MOB — Historia zmian w badaniach lekarskich (Medical History Timeline)** — Przejrzysty widok historii minionych badań lekarskich z datami ważności i orzeczeniami lekarza sportowego.
2357. **MOB — Wibracyjny metronom tempa przysiadu (Squat Tempo Metronome)** — Narzędzie pomagające utrzymać odpowiednie tempo fazy ekscentrycznej (np. 3 sekundy w dół) za pomocą rytmicznych wibracji telefonu w kieszeni.
2358. **MOB — Widget z jadłospisem dnia (Nutrition Plan Widget)** — Szybki podgląd zaleceń dietetycznych i rozkładu makroskładników na dany dzień bezpośrednio w aplikacji.
2359. **MOB — Skaner certyfikatów antydopingowych (ADAMS/POLADA Scan)** — Możliwość zeskanowania i przechowywania certyfikatów z ukończonych szkoleń antydopingowych wymaganych na zawodach rangi mistrzowskiej.
2360. **MOB — Moduł zgłoszeń do ubezpieczenia grupowego (Insurance Club Sign-up)** — Formularz umożliwiający przesłanie niezbędnych dokumentów i zgód do rocznego ubezpieczenia sportowego klubu.
2361. **MOB — Spersonalizowane podsumowanie audio tygodnia (AI Weekly Audio Debrief)** — Generowany głosowo krótki raport podsumowujący wykonaną pracę, tonaż i postępy techniczne w minionym tygodniu.
2362. **MOB — Weryfikacja poprawności nagrania toru (Camera Alignment Guide)** — Nakładana na podgląd aparatu siatka i poziomica pomagające ustawić telefon pod idealnym kątem 90 stopni do sztangi.
2363. **MOB — Automatyczne odtwarzanie kolejnej wiadomości głosowej (Continuous Voice Messages)** — Odtwarzanie kolejnych nagrań audio od trenera jedno po drugim bez konieczności klikania każdego z nich osobno.
2364. **MOB — Skrócona karta zgłoszeniowa sędziego (Referee Digital Card)** — Moduł dla sędziów klubowych do szybkiego wprowadzania ocen (białe/czerwone światło) na wewnętrznych turniejach z poziomu telefonu.
2365. **MOB — Widget statusu składek członkowskich (Membership Fee Status Widget)** — Domowy widget pokazujący status aktualnej składki z prostym oznaczeniem kolorystycznym (zielona/czerwona kropka).

### Technologie web i API (Backend/Frontend) — pomysły 2366–2435

2366. **FE/BE — System powiadomień Real-Time przez Server-Sent Events (SSE Notification Delivery)** — Wdrożenie lekkiego mechanizmu SSE w Axum i Nuxt do natychmiastowego dostarczania powiadomień bez obciążania serwera pełnym WebSocketem.
2367. **FE — Dynamiczne generowanie map witryny pod kątem SEO (Dynamic SEO Sitemap Generator)** — Skrypt w Nuxt automatycznie generujący i aktualizujący plik sitemap.xml o nowe profile publiczne zawodników i aktualności.
2368. **BE — Automatyczne czyszczenie osieroconych plików w storage chmurowym (Cloud Storage Garbage Collector)** — Asynchroniczny worker w Rust skanujący bazę danych i usuwający z Cloudinary/S3 pliki wideo/grafiki, które nie są już powiązane z żadnym wpisem.
2369. **FE — Asynchroniczne ładowanie ciężkich modeli biomechanicznych (TF.js Lazy Loader)** — Optymalizacja modułu analizy toru sztangi poprzez dynamiczne pobieranie bibliotek TensorFlow.js dopiero w momencie kliknięcia przycisku "Analizuj".
2370. **BE — Zapytania zoptymalizowane pod kątem Sinclaira (Sinclair Subquery Cache)** — Dodanie zmaterializowanego widoku (Materialized View) lub pamięci podręcznej w pamięci RAM dla rankingu Sinclaira w celu uniknięcia kosztownych obliczeń SQL przy każdym zapytaniu.
2371. **FE — Mikro-interakcje formularza wprowadzania podejść (Micro-Animations for Clean & Jerk)** — Dodanie płynnych animacji CSS i przejść przy zmianie podejść (1. rwanie, 2. rwanie) w celu ułatwienia pracy sędziom stolikowym.
2372. **BE — Audyt bezpieczeństwa sesji użytkowników (Session Audit Trail)** — Zapisywanie metadanych sesji (system operacyjny, przeglądarka, przybliżona lokalizacja po IP) przy generowaniu JWT i udostępnienie listy aktywnych sesji w profilu z opcją zdalnego wylogowania.
2373. **FE — Inteligentny szkielet ładowania dla galerii zdjęć (Responsive Image Shimmer Grid)** — Wdrożenie nowoczesnych placeholderów typu shimmer, które naśladują proporcje i rozkład obrazów w siatce przed ich pełnym załadowaniem.
2374. **BE — Harmonogram odtwarzania kopii zapasowych w piaskownicy (Automated Backup Sandbox Restore)** — Cykliczny proces automatycznie przywracający ostatnią kopię zapasową bazy danych SQLite do odizolowanej piaskownicy testowej w celu weryfikacji integralności danych.
2375. **FE — Interaktywny konstruktor planów treningowych typu przeciągnij i upuść (Drag & Drop Plan Builder)** — Zaawansowany interfejs w panelu trenera (Nuxt UI) pozwalający na łatwe przestawianie ćwiczeń, serii i dni treningowych za pomocą myszki.
2376. **BE — Wielowątkowe generowanie raportów PDF (Multi-Threaded PDF Generator)** — Wykorzystanie biblioteki `rayon` w Rust do równoległego tworzenia masowych zestawień PDF dla całego klubu, drastycznie zmniejszające czas oczekiwania.
2377. **FE — Podgląd orzeczeń lekarskich w modalnym oknie (In-App Medical PDF Viewer)** — Integracja bezpiecznej przeglądarki plików PDF wewnątrz panelu administratora do weryfikacji zaświadczeń bez konieczności pobierania ich na dysk.
2378. **BE — Dynamiczny ogranicznik przepustowości API dla botów (Adaptive API Rate Limiter)** — Algorytm w Rust automatycznie zwiększający restrykcyjność rate-limitu na podstawie analizy nietypowych nagłówków User-Agent i częstotliwości żądań.
2379. **FE — Zaawansowany filtr historycznych danych Sinclaira (Sinclair Multi-Filter Dashboard)** — Panel statystyk z możliwością nakładania wielu filtrów jednocześnie (wiek, płeć, kategoria wagowa, kluby partnerskie) z dynamiczną aktualizacją wykresów.
2380. **BE — Bezpieczny import danych z innych systemów klubowych (Universal CSV Importer Backend)** — Elastyczny parser w Rust potrafiący dopasować i zwalidować różnorodne formaty plików CSV pochodzące z zewnętrznych aplikacji sportowych.
2381. **FE — Monitor stabilności połączenia internetowego w czasie rzeczywistym (Online/Offline Status Toast)** — Dynamiczne powiadomienie UI w Nuxt informujące o utracie połączenia z siecią z blokadą przycisków zapisu w celu uniknięcia błędów hydracji.
2382. **BE — Automatyczne wykrywanie podejrzanych logowań (AI Anomaly Login Detector)** — System w Rust analizujący historię logowań użytkownika i wysyłający ostrzeżenie e-mail w przypadku zalogowania z nowego kraju lub urządzenia.
2383. **FE — Wizualna reprezentacja odchylenia toru sztangi (Barbell Path Deviation Canvas)** — Wykres nakładający idealny biomechanicznie tor ruchu sztangi na tor rzeczywisty zawodnika z zaznaczonymi obszarami największych błędów.
2384. **BE — Szyfrowanie danych wrażliwych na poziomie bazy danych (Application-Level DB Field Encryption)** — Wykorzystanie klucza AES-GCM do szyfrowania numerów PESEL i danych medycznych zawodników bezpośrednio przed zapisem do bazy SQLite.
2385. **FE — Narzędzia do testowania kontrastu dla sędziów (Contrast Accessibility Checker)** — Wbudowane w panel deweloperski superadmina narzędzie sprawdzające zgodność kolorów interfejsu z normami WCAG 2.1 w locie.
2386. **BE — Integracja z systemem masowej wysyłki wiadomości SMS (SMS Gateway Axum Integration)** — Moduł w Rust pozwalający na wysyłanie krytycznych powiadomień (np. o nagłym odwołaniu zawodów) za pomocą bramek SMS (np. SMSAPI).
2387. **FE — Optymalizacja zasobów statycznych Nuxt (Nuxt Asset Compression Engine)** — Konfiguracja automatycznej kompresji Brotli i Gzip dla wszystkich skryptów JS i plików CSS generowanych podczas budowania aplikacji produkcyjnej.
2388. **BE — Historia zmian uprawnień użytkowników (RBAC Permission Change Log)** — Tabela audytowa rejestrująca każdą modyfikację ról użytkowników (kto komu nadał rolę admina/trenera) dla celów bezpieczeństwa.
2389. **FE — Interaktywny konfigurator stref tętna (Heart Rate Zone Calculator UI)** — Narzędzie w profilu zawodnika automatycznie obliczające strefy wysiłku na podstawie tętna maksymalnego z wizualnym podziałem kolorystycznym.
2390. **BE — Secure linki do mediów (Signed URL Generator for Media)** — Generowanie tymczasowych, wygasających linków do wideo techniki i badań medycznych w celu uniemożliwienia nieautoryzowanego dostępu osobom postronnym.
2391. **FE — Wygodne kopiowanie planów treningowych na kolejne tygodnie (One-Click Training Plan Duplicator)** — Funkcja w panelu trenera pozwalająca powielić cały plan tygodniowy zawodnika na kolejny okres z opcją automatycznego zwiększenia obciążeń o stały %.
2392. **BE — Automatyczne generowanie certyfikatów SSL (Auto-SSL Manager Stub)** — Integracja z Let's Encrypt w backendzie dla przyszłych instalacji wieloklubowych (multi-tenancy) na niestandardowych domenach.
2393. **FE — Responsywny podgląd tablicy wyników na żywo (Live Scoreboard Responsive Grid)** — Szablon tablicy wyników zoptymalizowany pod kątem wyświetlania zarówno na wielkich telebimach w halach, jak i na małych ekranach tabletów sędziowskich.
2394. **BE — System kolejkowania zadań w tle oparty na SQLite (LiteQueue Worker)** — Prosty, lekki system kolejkowy w Rust wykorzystujący bazę SQLite jako bazę zadań (e-maile, powiadomienia, generowanie PDF) bez potrzeby instalacji Redisa.
2395. **FE — Wygodne filtrowanie i wyszukiwanie w logach audytowych (Audit Log Smart Search)** — Filtry w panelu superadmina umożliwiające natychmiastowe wyszukanie operacji według identyfikatora zasobu lub typu akcji (np. "tylko usunięcia wyników").
2396. **BE — API do integracji z wagami pomostowymi (Scale API Axum Endpoint)** — Endpoint umożliwiający automatyczny odczyt wagi zawodnika bezpośrednio z certyfikowanej wagi elektronicznej podczas ważenia przedstartowego.
2397. **FE — Dynamiczny widget pogody na stronie głównej klubu (Nuxt Weather Widget)** — Integracja z API pogodowym wyświetlająca aktualne warunki w Rudzie Śląskiej na publicznej stronie głównej sekcji.
2398. **BE — Optymalizacja transakcji przy masowym zatwierdzaniu płatności (SQL Bulk Payment Approval Optimizer)** — Zoptymalizowane zapytanie SQL grupujące transakcje w celu uniknięcia blokowania bazy danych SQLite (SQLite database lock) przy zatwierdzaniu składek.
2399. **FE — Płynne animacje przejść między trasami (Nuxt Page Transition Animations)** — Wdrożenie eleganckich, dyskretnych animacji typu "fade-in" i "slide" podczas poruszania się po panelach użytkownika.
2400. **BE — Automatyczne generowanie dokumentacji API w formacie OpenAPI (Axum Utoipa Auto-Exporter)** — Skrypt automatycznie eksportujący plik openapi.json przy każdym udanym zbudowaniu backendu, gwarantujący wieczną aktualność typów.
2401. **FE — System tagowania postów w aktualnościach (News Tagging & Filtering System)** — Filtrowanie wiadomości na stronie głównej według kategorii (np. "Juniorzy", "Zawody", "Ogłoszenia zarządu") z ładnymi etykietami.
2402. **BE — Walidacja formatu numeru konta bankowego (IBAN Validator Utility)** — Funkcja w Rust weryfikująca poprawność wprowadzonego numeru konta klubu przed wygenerowaniem szablonu przelewu dla zawodników.
2403. **FE — Wizualny kreator ankiet klubowych (Interactive Club Survey Builder)** — Panel dla administratorów umożliwiający łatwe tworzenie pytań jedno- i wielokrotnego wyboru dla zawodników z podglądem na żywo.
2404. **BE — System wersjonowania planów treningowych (Training Plan Version Control)** — Zapisywanie historii edycji planu przez trenera, umożliwiające szybkie przywrócenie poprzedniej wersji obciążeń w razie potrzeby.
2405. **FE — Optymalizacja wskaźnika INP dla formularza wyników (INP Optimization for Results Form)** — Refaktoryzacja obsługi zdarzeń wejściowych w formularzu w celu zminimalizowania opóźnień interakcji na słabszych urządzeniach.
2406. **BE — Integracja z zewnętrznym kalendarzem Google Calendar (Google Calendar API Sync)** — Dwukierunkowa synchronizacja wydarzeń klubowych i zawodów z publicznym kalendarzem Google sekcji.
2407. **FE — Interaktywny wykres rozkładu kategorii wagowych (Weight Category Distribution Chart)** — Wykres kołowy przedstawiający procentowy udział zawodników w poszczególnych kategoriach wagowych w klubie.
2408. **BE — Automatyczne powiadomienie o wygaśnięciu tokenów odświeżania (JWT Refresh Token Revocation)** — Bezpieczne usuwanie nieaktywnych i przestarzałych tokenów z bazy danych w celu optymalizacji jej rozmiaru.
2409. **FE — Estetyczny widżet z cytatem motywacyjnym (Motivational Weightlifting Quotes)** — Dyskretna sekcja na dashboardzie zawodnika wyświetlająca inspirujące cytaty legend podnoszenia ciężarów przy każdym logowaniu.
2410. **BE — Sprawdzanie dostępności domenu klubu (Domain Availability Checker Backend)** — Narzędzie pomocnicze dla superadmina monitorujące poprawność konfiguracji DNS i rekordów CNAME dla instancji klubowych.
2411. **FE — System oceniania trudności treningu (Visual RPE Scale Picker)** — Ładna, interaktywna skala RPE (Borg Scale) z ikonami przedstawiającymi poziom zmęczenia przy uzupełnianiu dziennika.
2412. **BE — Walidacja unikalności adresów e-mail (Case-Insensitive Email Uniqueness Constraint)** — Wdrożenie unikalnego indeksu SQLite ignorującego wielkość liter w adresach e-mail w celu zapobiegania duplikacji kont.
2413. **FE — Dynamiczny podgląd formatowania Markdown w ogłoszeniach (Live Markdown Editor Preview)** — Edytor ogłoszeń dla adminów z podziałem ekranu na kod Markdown i wyrenderowany w czasie rzeczywistym estetyczny dokument HTML.
2414. **BE — Zabezpieczenie przed atakami typu SQL Injection w dynamicznych filtrach (SQL Injection Prevention Check)** — Audyt i refaktoryzacja wszystkich dynamicznych zapytań SQL w Rust pod kątem poprawnego bindowania parametrów.
2415. **FE — Optymalizacja LCP dla banera na stronie głównej (LCP Hero Image Optimization)** — Wdrożenie technologii modern image formats (AVIF/WebP) oraz prefetchowania zasobów dla głównego zdjęcia na stronie klubu.
2416. **BE — Eksport bazy danych w formacie bezpiecznym dla RODO (GDPR-Compliant SQL Dump Utility)** — Narzędzie generujące zrzut bazy danych z automatyczną anonimizacją wszystkich danych osobowych zawodników.
2417. ~~**FE — Wizualna oś czasu historii klubu (Interactive Club History Timeline)** — Elegancko animowana sekcja "O nas" na publicznej stronie, przedstawiająca kamienie milowe CKS Slavia od momentu założenia.~~ *(wdrożone: `ClubHistoryTimeline.vue`, sekcja na `/`, pełna oś na `/o-klubie`, dane w `clubHistoryMilestones.ts`.)*
2418. **BE — System powiadomień o niskim poziomie pamięci dyskowej (Low Disk Space Alert Worker)** — Worker monitorujący wolne miejsce na serwerze SQLite/Turso i wysyłający alerty e-mail do administratorów IT.
2419. **FE — Wygodne filtrowanie galerii zdjęć według roku i zawodów (Gallery Smart Search & Tags)** — Możliwość szybkiego odnalezienia zdjęć z konkretnych Mistrzostw Polski za pomocą tagów i filtrowania chronologicznego.
2420. **BE — Integracja z systemami analitycznymi chroniącymi prywatność (Plausible Analytics API Integration)** — Bezpieczne pobieranie statystyk ruchu na publicznej stronie www i wyświetlanie ich w panelu admina bez naruszania RODO.
2421. **FE — Interaktywny wykres porównawczy Sinclaira dla grupy (Sinclair Group Scatter Plot)** — Wykres punktowy pokazujący stosunek wagi ciała do punktów Sinclaira dla wszystkich zawodników z danej grupy treningowej.
2422. **BE — Blokada wielokrotnego wysyłania tego samego formularza (Request Debouncer Middleware)** — Warstwa pośrednia w Rust odrzucająca identyczne żądania POST wysłane w odstępie krótszym niż 2 sekundy (ochrona przed double-submit).
2423. **FE — System zgłaszania sugestii dotyczących aplikacji (In-App Feedback Widget)** — Dyskretny formularz w rogu ekranu umożliwiający szybkie przesłanie opinii lub propozycji funkcji bezpośrednio do zespołu deweloperskiego.
2424. **BE — Automatyczne generowanie miniaturek wideo (Video Thumbnail Generator Backend)** — Proces w Rust automatycznie wycinający pierwszą klatkę z przesłanego wideo techniki i zapisujący ją jako plik JPG do szybkiego podglądu.
2425. **FE — Responsywny układ tabeli wyników na smartfonach (Responsive Tables Flex Container)** — Dostosowanie szerokich tabel z wynikami zawodów do urządzeń mobilnych poprzez zamianę wierszy w ładne, pionowe karty.
2426. **BE — Audyt zgodności nagłówków bezpieczeństwa (HTTP Security Headers Middleware)** — Wymuszenie dodawania nagłówków Content-Security-Policy, X-Frame-Options i Referrer-Policy do każdej odpowiedzi z serwera Axum.
2427. **FE — Formularz zapisu do klubu z walidacją na żywo (Live Validation Sign-up Form)** — Nowoczesny formularz rekrutacyjny dla nowych adeptów z natychmiastowym sprawdzaniem poprawności wpisywanych pól (np. format telefonu).
2428. **BE — Pamięć podręczna dla najpopularniejszych zapytań publicznych (Redis-less In-Memory Cache)** — Prosty moduł cache'ujący w pamięci RAM serwera najczęstsze zapytania publiczne (np. lista aktualności) w celu redukcji zapytań do SQLite.
2429. **FE — Estetyczny widżet z odliczaniem do kolejnego startu (Countdown to Next Competition)** — Widget na dashboardzie prezentujący dni, godziny i minuty pozostałe do najbliższych zawodów z kalendarza klubu.
2430. **BE — Weryfikacja spójności typów TS z modelami Rust (TypeScript Definitions Validator)** — Narzędzie sprawdzające podczas budowania, czy wygenerowane typy TypeScript są w 100% zgodne ze strukturami danych w Rust.
2431. **FE — Optymalizacja renderowania długich list zawodników (Virtual Scroll for Athlete List)** — Zastosowanie techniki virtual scrolling w celu płynnego przewijania setek profili zawodników bez obciążania pamięci przeglądarki.
2432. **BE — Bezpieczny import danych finansowych ze Stripe (Stripe Webhook Handler Axum)** — Endpoint w Rust odbierający i weryfikujący podpisy cyfrowe webhooków od Stripe w celu automatycznego księgowania składek.
2433. **FE — Dynamiczny generator banerów z ogłoszeniami (Emergency Alert Banner Component)** — Łatwo włączany przez adminów baner na samej górze strony informujący o nagłych wydarzeniach (np. zamknięcie hali w dni świąteczne).
2434. **BE — Automatyczna optymalizacja indeksów bazy danych SQLite (VACUUM & ANALYZE Nightly Worker)** — Codzienny nocny proces dbający o wydajność bazy danych poprzez defragmentację i aktualizację statystyk zapytań SQL.
2435. **FE — Nowoczesne animacje ładowania przycisków (Loading Spinners and Shimmer Buttons)** — Dodanie drobnych animacji ładowania wewnątrz przycisków akcji, aby dać użytkownikowi wyraźny sygnał, że jego żądanie jest przetwarzane.

### Inicjatywy pozakodowe (Klub, trening i organizacja) — pomysły 2436–2500

2436. **ORG — Klubowy dzień otwarty dla mieszkańców (Slavia Open Day)** — Cykliczna impreza promocyjna połączona z darmowymi warsztatami techniki rwania i podrzutu dla mieszkańców Rudy Śląskiej i okolic.
2437. **ORG — Wymiana oświetlenia nad pomostami (High-CRI Gym Lighting)** — Modernizacja oświetlenia hali treningowej na lampy o wysokim współczynniku oddawania barw (CRI > 90), co diametralnie poprawi jakość nagrań wideo do analizy techniki.
2438. **ORG — Program partnerski z lokalnymi szkołami (School Weightlifting Outreach)** — Pokazy podnoszenia ciężarów w szkołach podstawowych i średnich w celu zachęcenia młodzieży do rozpoczęcia treningów w sekcji juniorskiej CKS Slavia.
2439. **ORG — Dedykowane pakiety sponsorskie dla firm (Sponsor Package Tiers)** — Przygotowanie profesjonalnych ofert marketingowych (pakiety Brązowy, Srebrny, Złoty) dla lokalnych przedsiębiorców chcących wesprzeć klub.
2440. **ORG — Klubowy podcast o historii podnoszenia ciężarów (Slavia Podcast Series)** — Nagrywanie wywiadów z byłymi mistrzami klubu, trenerami i działaczami, publikowanych na YouTube i Spotify w celu budowania marki.
2441. **ORG — Strefa regeneracji i fizjoterapii na sali (Recovery Corner Setup)** — Wydzielenie i wyposażenie specjalnego kącika na siłowni z rolerami, pistoletami do masażu, gumami do flossingu i stołem do masażu.
2442. **ORG — Zakup certyfikowanego zestawu startowego ciężarów (IWF Certified Plate Set)** — Pozyskanie profesjonalnego, certyfikowanego przez IWF kompletu gryfów i talerzy dedykowanego wyłącznie do podejść rekordowych i zawodów wewnętrznych.
2443. **ORG — Cykl warsztatów z psychologii sportu (Mindset Workshops)** — Spotkania z psychologiem sportowym dla zawodników kadry klubu, skupiające się na radzeniu sobie ze stresem przedstartowym i koncentracji.
2444. **ORG — Wewnętrzna Liga Śląska CKS Slavia (Internal Club League)** — Organizacja cyklicznych, comiesięcznych zawodów wewnętrznych z punktacją Sinclaira w celu monitorowania formy i budowania rywalizacji.
2445. **ORG — Ekologiczna strefa nawadniania w klubie (Eco Hydration Station)** — Montaż profesjonalnego dystrybutora z filtrowaną wodą pitną i zachęcenie zawodników do używania wielorazowych bidonów klubowych.
2446. **ORG — Warsztaty dietetyczne ze zbijania wagi (Weight-Cutting Seminar)** — Praktyczne szkolenie prowadzone przez dietetyk sportową na temat bezpiecznego i zdrowego regulowania masy ciała przed zawodami.
2447. **ORG — Standaryzowane procedury czyszczenia gryfów (Barbell Maintenance Routine)** — Wprowadzenie cotygodniowego protokołu czyszczenia radełkowania gryfów szczotkami mosiężnymi i oliwienia łożysk w celu przedłużenia żywotności sprzętu.
2448. **ORG — Klubowe koszulki i bluzy z autorskim designem (Premium Slavia Merch)** — Zaprojektowanie i produkcja wysokiej jakości odzieży treningowej z nowoczesną identyfikacją wizualną CKS Slavia dla zawodników i kibiców.
2449. **ORG — Stworzenie tablicy pamiątkowej rekordów (Physical Hall of Fame Board)** — Montaż dużej, estetycznej tablicy na ścianie hali z wypisanymi aktualnymi rekordami klubu w różnych kategoriach wiekowych i wagowych.
2450. **ORG — Spotkania integracyjne po zawodach (Post-Competition Team Integration)** — Tradycja wspólnych wyjść lub ognisk dla zawodników, trenerów i wolontariuszy po zakończeniu głównych startów w sezonie.
2451. **ORG — Współpraca z lokalnym centrum medycyny sportowej (Sports Medicine Center Partnership)** — Wypracowanie stałej ścieżki szybkich badań lekarskich dla zawodników klubu w celu sprawnego przedłużania licencji PZPC.
2452. **ORG — Profesjonalna sesja zdjęciowa kadry (Professional Athlete Photoshoot)** — Zorganizowanie profesjonalnego dnia zdjęciowego na hali w celu pozyskania wysokiej jakości materiałów do publicznych profili i mediów społecznościowych.
2453. **ORG — Bezpłatne porady fizjoterapeutyczne raz w miesiącu (Monthly Physio Assessment)** — Dyżur zaprzyjaźnionego fizjoterapeuty na sali, podczas którego zawodnicy mogą skonsultować drobne dolegliwości i otrzymać zestaw ćwiczeń naprawczych.
2454. **ORG — Standardy techniczne PZPC dla młodych adeptów (Federation Technical Standards)** — Wdrożenie w klubie oficjalnego, wielostopniowego sistema oceny techniki dla dzieci (np. zaliczenie rwania samym gryfem przed wejściem na ciężary).
2455. **ORG — Klubowy system wyróżnień "Zawodnik Miesiąca" (Athlete of the Month Award)** — Wyróżnianie zawodnika nie tylko za wyniki sportowe, ale też za zaangażowanie, frekwencję i pomoc w życiu klubu (nagroda w postaci akcesoriów).
2456. **ORG — Zakup stojaków i luster do korekcji techniki (Mirror Feedback Stations)** — Rozmieszczenie luster przed wybranymi pomostami treningowymi w sposób umożliwiający zawodnikowi samodzielną kontrolę postawy w fazie rozgrzewki.
2457. **ORG — Tablica ogłoszeń w fizycznej formie na hali (Physical Club Notice Board)** — Estetyczna gablota informacyjna na korytarzu klubu dla osób rzadziej korzystających z aplikacji mobilnej (np. starsi działacze, rodzice dzieci).
2458. **ORG — Program wolontariatu podczas zawodów (Slavia Volunteer Crew)** — Stworzenie zorganizowanej grupy wolontariuszy (młodzież klubowa, sympatycy) do pomocy przy organizacji zawodów (obsługa techniczna, logistyka, pomoc stolikowa).
2459. **ORG — Edukacja antydopingowa dla rodziców juniorów (Antidoping Seminar for Parents)** — Spotkanie informacyjne na temat procedur antydopingowych, bezpiecznej suplementacji i listy substancji zabronionych WADA.
2460. **ORG — Dedykowane tabliczki kredowe na pomostach (Chalkboard Platform Labels)** — Małe tabliczki kredowe przy każdym pomoście do zapisywania aktualnie realizowanych serii i obciążeń przez ćwiczących.
2461. **ORG — Partnerstwo z lokalną firmą cateringową (Dietary Meal-Prep Partnership)** — Zniżki dla członków klubu na zakup zbilansowanej diety pudełkowej u lokalnego dostawcy cateringu dietetycznego.
2462. **ORG — Szkolenia sędziowskie dla zawodników (Referee Training Courses)** — Zachęcanie i dofinansowywanie kursów sędziowskich PZPC dla starszych zawodników w celu zwiększania liczby uprawnionych sędziów w klubie.
2463. **ORG — Wspólne wyjazdy kibiców na Mistrzostwa Polski (Supporters Bus Trip)** — Organizowanie zorganizowanego transportu i biletów dla klubowej społeczności chcącej kibicować reprezentantom Slavii na wyjazdach.
2464. **ORG — Audyt poziomu hałasu na sali (Gym Noise and Vibration Audit)** — Profesjonalne pomiary drgań i hałasu przy zrzucaniu ciężarów oraz wdrożenie nowoczesnych mat wibroizolacyjnych pod pomosty.
2465. **ORG — Przewodnik dla debiutantów na zawodach (Rookie Weightlifting Guide)** — Wydrukowana broszura (i PDF) wyjaśniająca krok po kroku procedurę zawodów: od ważenia, przez podawanie podejść, po ceremonię dekoracji.
2466. **ORG — System zbierania i recyklingu zużytych pasków treningowych (Straps Recycling Bin)** — Ekologiczny pojemnik na zużyty sprzęt parciany/skórzany, który można naprawić lub przeznaczyć do celów treningowych dla początkujących grupy dziecięcej.
2467. **ORG — Klubowa biblioteczka książek sportowych (Slavia Book Library)** — Półka na hali z literaturą dotyczącą teorii sportu, biomechaniki, periodyzacji treningowej i biografii wybitnych sztangistów.
2468. **ORG — Badania wad postawy u dzieci z Rudy Śląskiej (Postural Screenings for Kids)** — Akcja społeczna klubu polegająca na bezpłatnych badaniach postawy dla dzieci ze szkół podstawowych prowadzonych przez klubowych trenerów i fizjoterapeutów.
2469. **ORG — Przygotowanie strefy dla mediów i prasy (Media Zone Setup)** — Zapewnienie odpowiedniego miejsca, dostępu do prądu i szybkiego Wi-Fi dla dziennikarzy i fotografów podczas relacjonowania zawodów.
2470. **ORG — Standaryzacja oznaczeń twardości gryfów (Barbell Stiffness Labels)** — Kolorowe opaski na końcach gryfów ułatwiające zawodnikom szybką identyfikację ich przeznaczenia (np. gryfy bardziej sprężyste do podrzutu vs sztywniejsze do przysiadów).
2471. **ORG — Strefa dla dzieci i rodzin zawodników (Family Active Corner)** — Bezpieczny kącik zabaw dla dzieci, w którym mogą przebywać pod okiem bliskich, podczas gdy rodzic odbywa sesję treningową.
2472. **ORG — Zbiórki charytatywne organizowane przez klub (Slavia Charity Events)** — Zaangażowanie społeczności klubowej w lokalne akcje pomocowe (np. pomoc schroniskom, szlachetna paczka) pod szyldem CKS Slavia.
2473. **ORG — Szkolenie z pierwszej pomocy dla kadry trenerskiej (First Aid Training for Coaches)** — Obowiązkowy, coroczny certyfikowany kurs udzielania pierwszej pomocy przedmedycznej dla wszystkich trenerów pracujących na sali.
2474. **ORG — Estetyczne i higieniczne strefy magnezji (Chalk Box Upgrades)** — Wymiana starych pojemników na magnezję na nowoczesne, zamknięte stacje ograniczające pylenie i ułatwiające utrzymanie czystości wokół pomostów.
2475. **ORG — Filmy promocyjne z treningów na social media (Gym Hype Videos)** — Regularna produkcja krótkich, dynamicznych rolek (Reels/TikTok) pokazujących ciężką pracę na treningach w celu budowania wizerunku nowoczesnego klubu.
2476. **ORG — Profesjonalny stojak na pasy treningowe (Organized Belt Rack)** — Zamontowanie ściennego wieszaka ułatwiającego segregację i przechowywanie pasów ciężarowych według rozmiarów.
2477. **ORG — Warsztaty z techniki przysiadów dla amatorów (Squat Masterclass for Amateurs)** — Płatne warsztaty techniczne dla osób trenujących rekreacyjnie lub crossfit, stanowiące dodatkowe źródło przychodu dla klubu.
2478. **ORG — Procedura powitalna dla nowych członków (New Member Welcome Package)** — Wręczanie każdemu nowemu zawodnikowi pakietu startowego (naklejka klubowa, informator, plan pierwszych kroków w Slavia).
2479. **ORG — Pomiary elastyczności pomostów treningowych (Platform Elasticity Audit)** — Regularna kontrola stanu technicznego legarów pod pomostami w celu zapewnienia równego i bezpiecznego amortyzowania uderzeń.
2480. **ORG — Zewnętrzny baner reklamowy na budynku (Club Outdoor Banner)** — Montaż wielkoformatowej, estetycznej reklamy zewnętrznej informującej o działalności klubu i godzinach otwarcia.
2481. **ORG — Konkurs na najlepszy plakat zawodów (Competition Poster Contest)** — Zaangażowanie lokalnej społeczności artystycznej lub młodzieży w projektowanie plakatów promujących klubowe turnieje.
2482. **ORG — Standaryzowane procedury ważenia przed zawodami (Official Weigh-in Protocol)** — Wprowadzenie rygorystycznego, zgodnego z przepisami IWF protokołu ważenia (zamknięte pomieszczenie, obecność sędziego tej samej płci) dla zawodów wewnętrznych.
2483. **ORG — System nagradzania za pomoc w sprzątaniu sali (Clean Gym Points)** — Drobne upominki lub punkty w lojalnościówce dla najmłodszych grup za dbanie o porządek na pomoście po zakończonych zajęciach.
2484. **ORG — Dofinansowanie obozów letnich dla najuboższych juniorów (Summer Camp Sponsorship)** — Stworzenie funduszu stypendialnego umożliwiającego wyjazd na obóz sportowy dzieciom z rodzin w trudnej sytuacji finansowej.
2485. **ORG — Zakup kamery szerokokątnej do stałego nagrywania sali (Static Analysis Camera)** — Montaż stałej kamery nad głównym pomostem umożliwiającej trenerowi podgląd i analizę prób pod różnymi kątami bez przestawiania telefonu.
2486. **ORG — Współpraca z psychodietetykiem (Sports Psychodietetics Partnership)** — Porady z zakresu relacji z jedzeniem, szczególnie istotne dla zawodników borykających się z ciągłym kontrolowaniem wagi startowej.
2487. **ORG — Tabliczki z zasadami savoir-vivre na siłowni (Physical Gym Etiquette Signs)** — Estetyczne grafiki przypominające o odkładaniu ciężarów na miejsce, czyszczeniu gryfów z krwi/potu i szacunku do współćwiczących.
2488. **ORG — Zakup profesjonalnej szafki medycznej (Advanced First Aid Station)** — Wyposażenie sali w kompletną, łatwo dostępną szafkę pierwszej pomocy z lodem w sprayu, opaskami uciskowymi, szynami Kramera i środkami dezynfekującymi.
2489. **ORG — System testowy wytrzymałości pasów (Belt Durability Testing)** — Okresowe sprawdzanie szwów i klamer w pasach treningowych będących na wyposażeniu klubu pod kątem bezpieczeństwa użytkowania.
2490. **ORG — Klubowy dzień sportu dla rodzin (Slavia Family Fun Day)** — Piknik sportowo-rekreacyjny z łatwymi konkurencjami sprawnościowymi dla całych rodzin zrzeszonych w klubie.
2491. **ORG — Szkolenie z social media dla kadry klubu (Social Media Training for Staff)** — Krótkie warsztaty z robienia dobrych zdjęć, pisania angażujących postów i relacjonowania zawodów na żywo dla trenerów i adminów.
2492. **ORG — Przygotowanie profesjonalnego tła do wywiadów (Press Wall Backdrop)** — Zakup ścianki reklamowej z logotypami klubu i sponsorów do robienia zdjęć zawodnikom po dekoracji medalowej.
2493. **ORG — System okresowej kalibracji wag (Weighing Scale Calibration Schedule)** — Wygodne wdrożenie procedury sprawdzania dokładności wag klubowych za pomocą odważników wzorcowych co 6 miesięcy.
2494. **ORG — Poradnik suplementacji sportowej dla juniorów (Junior Supplementation Guidebook)** — Opracowanie rzetelnego, opartego na dowodach naukowych kompendium wiedzy o suplementach (kreatyna, białko, witaminy) dla młodych zawodników.
2495. **ORG — System zgłoszeń pomysłów do skrzynki fizycznej (Physical Suggestion Box)** — Drewniana skrzynka na sali, do której zawodnicy mogą wrzucać anonimowe karteczki z pomysłami na usprawnienie działania klubu.
2496. **ORG — Zakup nowoczesnych gum oporowych do rozgrzewki (Warm-up Resistance Bands Kit)** — Wyposażenie sali w komplet profesjonalnych gum o różnych stopniach oporu do mobilizacji stawów biodrowych i barkowych.
2497. **ORG — Warsztaty z techniki podrzutu dla kobiet (Female Olympic Lifting Workshops)** — Specjalistyczne warsztaty nakierowane na popularyzację podnoszenia ciężarów wśród kobiet, prowadzone przez utytułowane zawodniczki klubu.
2498. **ORG — Program mentorski starszych zawodników dla młodzieży (Senior-Junior Mentorship)** — Parowanie doświadczonych zawodników z sekcją młodszą w celu wsparcia technicznego, mentalnego i pomocy w adaptacji w klubie.
2499. **ORG — Regularny przegląd techniczny pomostów amortyzujących (Drop Zone Safety Audits)** — Kwartalny przegląd gumowych mat amortyzujących pod kątem pęknięć i zużycia materiału tłumiącego uderzenia sztangi.
2500. **ORG — Uroczysta gala podsumowania roku sportowego (Slavia Annual Sports Gala)** — Eleganckie wydarzenie na koniec roku, podczas którego wręczane są statuetki dla najlepszych zawodników, podziękowania dla sponsorów i wolontariuszy.

### Kolejna pula propozycji (Sport-Tech 4.0: 2501–3000)

Zbiór kolejnych 500 szczegółowych pomysłów na rozwój ekosystemu CKS Slavia Ruda Śląska, zoptymalizowany pod kątem aktualnego stanu baz kodu (np. zintegrowanych flag funkcji w `experimentalFeaturesCatalog.ts`, orzeczeń lekarskich w `PlayersManager.vue` czy eksportu ICS w `calendar_export.rs`). Podzielony na aplikację mobilną Flutter (2501–2665), platformę web/API Axum + Nuxt (2666–2835) oraz pozakodowe inicjatywy klubowe (2836–3000).

### Aplikacja mobilna (Flutter/Mobile) — pomysły 2501–2665

2501. **MOB — Tryb ciemny dla pomostów (Dimmed Lifting Mode)** — Specjalny motyw ekranu treningu redukujący jasność do minimum, aby nie razić oczu podczas leżenia na ławeczce pod sztangą.
2502. **MOB — Automatyczny podgląd powtórzeń w zwolnionym tempie (Auto Slo-Mo Highlight)** — Moduł kamery automatycznie wykrywający moment oderwania sztangi i spowalniający wideo do 0.25x w tym kluczowym fragmencie.
2503. **MOB — Skanowanie kodów QR obecności w ciemności (QR Scanner Flash Auto-On)** — Automatyczne włączanie latarki telefonu przez skaner QR, gdy czujnik światła wykryje słabe oświetlenie w sali.
2504. **MOB — Przycisk szybkiego dodawania magnezji (Quick Chalk Tap)** — Wirtualny przycisk na ekranie serii rejestrujący czas i potrzebę użycia magnezji jako korelacji z jakością chwytu.
2505. **MOB — Widget stanu zdrowia dłoni (Hand Care Tracker)** — Moduł w recovery journalu pozwalający na rejestrowanie odcisków i uszkodzeń skóry na dłoniach z przypomnieniem o pielęgnacji.
2506. **MOB — Powiadomienie o zmianie trenera prowadzącego (Coach Change Alert)** — Powiadomienie push wysyłane natychmiast po zmianie przypisanego trenera w systemie z krótkim powitaniem.
2507. **MOB — Integracja z inteligentnymi wagami Tanita/Xiaomi (Smart Scale Bluetooth Sync)** — Bezpośrednie parowanie aplikacji przez Bluetooth w celu automatycznego importu składu ciała (tłuszcz, woda, mięśnie) do porannego raportu.
2508. **MOB — Szybkie udostępnianie postu na czacie (Chat Post Share)** — Opcja udostępniania aktualności klubowych bezpośrednio do aktywnej grupy czatu jednym kliknięciem.
2509. **MOB — Dynamiczne ikony aplikacji (Adaptive App Icon Presets)** — Wybór alternatywnych ikon aplikacji na pulpicie telefonu (np. ikona retro z logo Slavii, ikona złota dla mistrzów).
2510. **MOB — Dźwięk pomyślnego zapisu serii (Successful Lift Sound)** — Opcjonalny, przyjemny sygnał dźwiękowy (np. uderzenie w gong lub dźwięk IWF "trzy białe światła") po odznaczeniu udanej serii.
2511. **MOB — Lokalne powiadomienia o rozgrzewce (Local Warm-up Reminders)** — Powiadomienia push wyzwalane lokalnie na 15 minut przed zaplanowaną godziną treningu z motywacyjnym hasłem.
2512. **MOB — Szybkie przełączanie jednostek w kalkulatorze (Sinclair Unit Quick Toggle)** — Przełącznik kg/lbs w kalkulatorze Sinclaira dla zawodników trenujących za granicą lub na obozach ze sprzętem w funtach.
2513. **MOB — Eksport statystyk tonażu do CSV (Tonnage Export CSV)** — Możliwość wygenerowania i wysłania pliku CSV z historią tonażu bezpośrednio na e-mail zawodnika z poziomu aplikacji.
2514. **MOB — Integracja z Apple Watch Workouts (Watch Workout Sync)** — Pobieranie danych o tętnie i spalonych kaloriach podczas treningów siłowych zapisanych w systemowej aplikacji Apple.
2515. **MOB — Skaner kodów kreskowych odżywek (Supplement Barcode Scanner)** — Skanowanie kodów z opakowań białek/kreatyn w celu automatycznego uzupełnienia dziennika suplementacji.
2516. **MOB — Szybkie zgłaszanie uszkodzeń pomostu (Platform Damage Quick Report)** — Moduł aparatu pozwalający szybko zrobić zdjęcie pękniętej gumy lub deski i wysłać zgłoszenie bezpośrednio do administracji.
2517. **MOB — Widget z najbliższymi zawodami (Next Comp Lockscreen Widget)** — Lockscreen widget na iOS/Android prezentujący liczbę dni do kolejnego oficjalnego startu sekcji.
2518. **MOB — Weryfikacja biometryczna przed płatnością (Biometric Payment Auth)** — Wymóg FaceID/TouchID przed zatwierdzeniem ręcznego zgłoszenia składki członkowskiej w aplikacji.
2519. **MOB — Wykresy wibracyjne tętna (Haptic Heart Rate Charts)** — Delikatne wibracje urządzenia podczas przesuwania palcem po wykresie tętna, oddające jego intensywność.
2520. **MOB — Dynamiczne dopasowanie wielkości czcionki (Accessibility Font Resizer)** — Suwak w ustawieniach aplikacji pozwalający na niezależne zwiększenie rozmiaru tekstu dla lepszej czytelności na pomoście.
2521. **MOB — Lista kontrolna przed wyjazdem na obóz (Camp Packing Checklist)** — Interaktywna lista rzeczy do spakowania (pas, maści, taśmy, buty startowe, dokumenty) z opcją odhaczania.
2522. **MOB — Szybki zapis nastroju emoji (Emoji Mood Logger)** — Szybki wybór jednej z 5 emotikon w recovery journalu reprezentującej samopoczucie psychiczne zawodnika.
2523. **MOB — Tryb offline dla galerii klubowej (Offline Gallery Viewer)** — Przechowywanie miniaturek zdjęć z galerii klubowej w pamięci podręcznej telefonu do przeglądania bez internetu.
2524. **MOB — Podgląd wideo techniki w oknie PIP (Picture-in-Picture Video)** — Opcja odtwarzania nagranej techniki w małym, pływającym oknie podczas uzupełniania dziennika treningowego.
2525. **MOB — Widget z aktualnym tonażem tygodnia (Weekly Tonnage Home Widget)** — Widget prezentujący sumaryczny tonaż podniesiony w bieżącym tygodniu w porównaniu do poprzedniego.
2526. **MOB — Skaner badań lekarskich PDF (OCR Medical PDF Parser)** — Skanowanie papierowego orzeczenia lekarskiego i automatyczne wyodrębnianie daty ważności za pomocą lokalnego OCR.
2527. **MOB — Powiadomienia push o nowych komentarzach trenera (Push Notification on Comment)** — Natychmiastowe powiadomienie zawodnika, gdy trener skomentuje jego wpis w dzienniku lub nagranie wideo.
2528. **MOB — Wybór ścieżki dźwiękowej do treningu (In-App Spotify Stub)** — Dyskretny widget sterowania odtwarzaczem muzycznym (Spotify/Apple Music) bezpośrednio z poziomu ekranu treningu.
2529. **MOB — System odznak za frekwencję (Attendance Badge Notification)** — Animowane powiadomienie pełnoekranowe po zdobyciu nowej odznaki za 100% obecności w miesiącu.
2530. **MOB — Inteligentne podpowiedzi ciężarów rozgrzewkowych (Warm-up Weight Suggester)** — Automatyczne wyliczanie serii rozgrzewkowych (np. 50%, 60%, 70% ciężaru docelowego) na podstawie pierwszego ćwiczenia z planu.
2531. **MOB — System alarmowy o odwodnieniu (Dehydration Alert Trigger)** — Powiadomienie push wysyłane, gdy zawodnik w porannym raporcie zaznaczy bardzo ciemny kolor moczu (wskazanie na odwodnienie).
2532. **MOB — Szybki dostęp do regulaminu klubu (Quick Rules Access)** — Dedykowana zakładka w menu bocznym zawierająca statut CKS Slavia i regulamin korzystania z hali sportowej.
2533. **MOB — Skanowanie kodów QR na pasach treningowych (Gear NFC Scanner)** — Przypisywanie pasów klubowych do profilu zawodnika na czas treningu poprzez skan etykiety.
2534. **MOB — Udostępnianie planu jako dynamiczny link (Universal Link Plan Share)** — Generowanie linków typu `slavia://plan/{id}`, które po kliknięciu na telefonie innego zawodnika otwierają udostępniony plan.
2535. **MOB — Widget z pozycją w rankingu (Rank Home Widget)** — Widget prezentujący aktualne miejsce zawodnika w klubowym rankingu Sinclaira.
2536. **MOB — Automatyczny zapis szkicu przy rozładowaniu baterii (Low Battery Draft Save)** — Automatyczne zapisanie wszystkich niezapisanych serii w dzienniku lokalnym, gdy poziom baterii spadnie poniżej 5%.
2537. **MOB — Haptic feedback przy błędach formularza (Haptic Form Validation)** — Zróżnicowane wibracje urządzenia (np. potrójne krótkie wibracje) przy próbie zapisu pustego pola.
2538. **MOB — Skaner QR dla zaproszeń na zawody (QR Event Invitation Scanner)** — Skanowanie biletów/zaproszeń na zawody organizowane przez klub bezpośrednio przez aplikację mobilną.
2539. **MOB — Integracja z Google Fit (Google Fit Steps Sync)** — Pobieranie kroków i aktywności kardio z systemu Android jako uzupełnienie danych regeneracyjnych.
2540. **MOB — Dziennik rozciągania i mobilności (Mobility Routine Log)** — Osobna sekcja w dzienniku do zaznaczania wykonanych sesji rozciągania po treningu głównym.
2541. **MOB — Animowana tablica rekordów w aplikacji (Animated PR Screen)** — Efekt deszczu konfetti i specjalna animacja przy otworciu ekranu z nowo dodanym rekordem życiowym.
2542. **MOB — Widget statusu obecności w miesiącu (Attendance Monthly Widget)** — Widget pokazujący procent obecności na treningach w bieżącym miesiącu (np. w formie estetycznego pierścienia).
2543. **MOB — Szybki wybór kategorii wagowej PZPC (PZPC Weight Class Spinner)** — Rolka wyboru kategorii wagowych dostosowująca się dynamicznie do wybranej płci i grupy wiekowej zawodnika.
2544. **MOB — Detekcja braku aktywności podczas serii (Rest Timer Reminder)** — Powiadomienie push przypominające o rozpoczęciu kolejnej serii, jeśli telefon nie wykryje ruchu przez ponad 5 minut.
2545. **MOB — Integracja z inteligentnymi opaskami WHOOP (Whoop API Integration)** — Import parametrów regeneracji (WHOOP Recovery Score, Strain) bezpośrednio do wykresów gotowości treningowej.
2546. **MOB — Skaner kodów QR na plakatach klubowych (Promo QR Scanner)** — Skaner wbudowany w aplikację do odczytywania kodów rabatowych lub informacji z plakatów w Rudzie Śląskiej.
2547. **MOB — Podgląd tonażu ćwiczenia na przestrzeni czasu (PR Exercise Tonnage Chart)** — Szybki wykres historyczny prezentujący tonaż dla konkretnego ćwiczenia (np. przysiad tyłem) bezpośrednio pod formularzem serii.
2548. **MOB — Widget z saldem składek (Balance Home Widget)** — Widget prezentujący aktualny stan rozliczeń z klubem (nadpłata / zaległość).
2549. **MOB — Inteligentne grupowanie wideo techniki (Video Gallery Folder Categorizer)** — Automatyczne segregowanie nagrań techniki w galerii telefonu na foldery odpowiadające bojom (Rwanie, Podrzut, Przysiad).
2550. **MOB — Dźwiękowe powiadomienia o ważnych ogłoszeniach (Emergency Announcement Sound)** — Unikalny, głośny dźwięk powiadomienia push zarezerwowany wyłącznie dla ogłoszeń oznaczonych jako krytyczne.
2551. **MOB — Podgląd wyników rywali w czasie rzeczywistym (Live Competitor PR View)** — Możliwość obserwowania zgłoszonych rekordów innych zawodników z tej samej kategorii wagowej w celu motywacji.
2552. **MOB — System monitorowania poziomu zmęczenia oczu (Eye Strain Reducer)** — Automatyczne włączenie filtra ciepłych barw UI przy wykryciu długiego patrzenia w ekran w ciemnym pomieszczeniu siłowni.
2553. **MOB — Lokalne archiwum wiadomości czatu (Local Chat SQLite Archive)** — Przechowywanie historii czatu w lokalnej bazie danych w celu błyskawicznego wczytywania konwersacji bez opóźnień sieciowych.
2554. **MOB — Wybór formatu daty w aplikacji (Date Format Customizer)** — Możliwość zmiany prezentacji dat (np. DD.MM.YYYY vs YYYY-MM-DD) w zależności od preferencji zawodnika.
2555. **MOB — Widget z ostatnim wpisem w dzienniku (Last Journal Entry Widget)** — Szybki podgląd ostatnio wykonanego treningu bezpośrednio z ekranu głównego telefonu.
2556. **MOB — Autowykrywanie kąta nagrania techniki (Camera Angle Pitch Detector)** — Wykorzystanie żyroskopu telefonu w ekranie nagrywania w celu poinformowania użytkownika, czy telefon stoi idealnie pionowo.
2557. **MOB — Skanowanie certyfikatów medycznych kodem QR (Medical QR Verification)** — Możliwość weryfikacji ważności orzeczenia lekarskiego poprzez zeskanowanie kodu QR z dokumentu lekarza sportowego.
2558. **MOB — Tryb oszczędzania transferu danych (Data Saver Mode)** — Opcja wyłączenia automatycznego pobierania wideo techniki przy połączeniu przez dane komórkowe.
2559. **MOB — Widget z motywacją na dziś (Daily Motivational Widget)** — Widget prezentujący codziennie nowe hasło motywacyjne lub złotą myśl legend ciężarów.
2560. **MOB — Skaner kodów QR na dyplomach (Diploma QR Code Scanner)** — Skanowanie kodu QR z dyplomu zdobytego na zawodach Slavii w celu automatycznego dodania go do wirtualnej gabloty trofeów.
2561. **MOB — Haptic feedback przy zmianie ćwiczenia (Haptic Exercise Transition)** — Krótka, wyraźna wibracja informująca o przejściu do kolejnego ćwiczenia w aktywnym planie treningowym.
2562. **MOB — Dynamiczne dopasowanie koloru interfejsu (Dynamic Material You Palette)** — Dopasowanie kolorystyki aplikacji do tapety systemowej na urządzeniach z systemem Android 12+.
2563. **MOB — Widget z listą obecnych na sali (Who is Lifting Home Widget)** — Dyskretny widget pokazujący liczbę zawodników aktualnie zameldowanych na sali za pomocą QR.
2564. **MOB — Integracja z systemami Oura Ring (Oura Sleep Sync)** — Pobieranie wskaźników snu i temperatury ciała z pierścienia Oura w celu optymalizacji obciążeń treningowych.
2565. **MOB — Wyszukiwanie ćwiczeń po tagach technicznych (Tag Search)** — Możliwość wyszukiwania ćwiczeń w bazie po tagach takich jak "dynamika", "akcesoria", "siła chwytu".
2566. **MOB — Widget z odliczeniem do Mistrzostw Polski (Championship Countdown Widget)** — Widget z zegarem odliczającym czas do najważniejszego startu sezonu dla kadry klubu.
2567. **MOB — Automatyczne wznawianie przerwanych nagrań (Video Recording Resume)** — Automatyczne wznawianie nagrywania wideo techniki, jeśli zostanie ono przerwane przez przychodzące połączenie telefoniczne.
2568. **MOB — System odznak za udostępnianie wyników (Social Share Badges)** — Odznaki w profilu przyznawane za regularne dzielenie się swoimi sukcesami na Instagramie/Facebooku.
2569. **MOB — Widget z planem posiłków przedtreningowych (Pre-workout Meal Widget)** — Szybki podgląd zalecanego posiłku i suplementacji na 2 godziny przed planowanym treningiem.
2570. **MOB — Skaner QR do zapisu do sekcji (Sign-up QR Code Scanner)** — Skaner QR dla nowych adeptów umożliwiający błyskawiczne przejście do formularza rejestracji w klubie.
2571. **MOB — Haptic feedback przy osiągnięciu PR (PR Haptic Celebration)** — Wyjątkowa, silna sekwencja wibracji urządzenia celebrująca pobicie rekordu życiowego.
2572. **MOB — Integracja z aplikacją Fitbit (Fitbit API Integration)** — Synchronizacja danych o tętnie spoczynkowym i aktywności z urządzeń Fitbit.
2573. **MOB — Widget z saldem punktów lojalnościowych (Loyalty Points Widget)** — Widget prezentujący liczbę punktów zdobytych za frekwencję, pomoc w klubie i zakupy mercha.
2574. **MOB — Skaner kodów QR na legitymacjach członkowskich (Member ID QR Scanner)** — Możliwość szybkiego potwierdzenia członkostwa w klubie poprzez okazanie i zeskanowanie kodu QR z legitymacji.
2575. **MOB — Automatyczny zapis wideo w chmurze w tle (Background Video Cloud Upload)** — Wysyłanie nagrań techniki na serwer w tle, co pozwala na kontynuowanie treningu bez czekania na zakończenie wysyłki.
2576. **MOB — Widget z prognozą pogody na zawody (Competition Weather Widget)** — Widget pokazujący warunki pogodowe w mieście, w którym odbędą się najbliższe zawody wyjazdowe.
2577. **MOB — Haptic feedback przy odliczaniu stopera (Haptic Metronome Tick)** — Krótkie wibracje na każdą sekundę kończącego się czasu odpoczynku między seriami.
2578. **MOB — Widget z historią ostatnich PR (Recent PRs Home Widget)** — Widget prezentujący listę ostatnich rekordów życiowych pobitych przez zawodnika lub jego grupę.
2579. **MOB — Skaner kodów QR na szafkach klubowych (Locker QR Code Scanner)** — Przypisywanie szafki w szatni do profilu zawodnika na czas treningu w celu ułatwienia zarządzania kluczykami.
2580. **MOB — Integracja z aplikacją Yazio/MyFitnessPal (Nutrition Logs Sync)** — Import spożytych kalorii i makroskładników bezpośrednio do wykresów regeneracyjnych w aplikacji Slavia.
2581. **MOB — Widget z wyzwaniem tonażowym (Tonnage Challenge Progress Widget)** — Widget prezentujący postęp w aktualnym wyzwaniu tonażowym klubu.
2582. **MOB — Skaner kodów QR na biletach wstępu (Ticket QR Code Scanner)** — Skanowanie biletów na wydarzenia i zawody organizowane przez klub bezpośrednio przez aplikację.
2583. **MOB — Haptic feedback przy zatwierdzaniu obecności (Haptic Check-in Confirmation)** — Przyjemna wibracja potwierdzająca pomyślne zameldowanie się na sali za pomocą kodu QR.
2584. **MOB — Widget ze statystykami Sinclaira grupy (Group Sinclair Stats Widget)** — Widget pokazujący średnią punktację Sinclaira dla całej grupy treningowej zawodnika.
2585. **MOB — Skaner kodów QR na sprzęcie fizjoterapeutycznym (Physio Equipment QR Scanner)** — Dostęp do instruktaży wideo i zasad bezpieczeństwa korzystania z urządzeń do regeneracji po zeskanowaniu kodu.
2586. **MOB — Integracja z systemami Polar Flow (Polar Heart Rate Sync)** — Pobieranie precyzyjnych danych o tętnie z pasów telemetrycznych Polar.
2587. **MOB — Widget z przypomnieniem o badaniach (Medical Exam Reminder Widget)** — Widget pokazujący liczbę dni pozostałych do wygaśnięcia ważności badań lekarskich.
2588. **MOB — Skaner kodów QR na plakatach sponsorskich (Sponsor Discount QR Scanner)** — Dostęp do dedykowanych zniżek od sponsorów klubu po zeskanowaniu kodu z tablicy sponsorskiej.
2589. **MOB — Haptic feedback przy błędnym skanowaniu QR (Haptic QR Error)** — Długa, ostrzegawcza wibracja w przypadku nieudanego skanowania kodu QR obecności.
2590. **MOB — Widget ze statystykami tonażu grupy (Group Tonnage Widget)** — Widget pokazujący sumaryczny tonaż podniesiony przez całą grupę treningową w bieżącym tygodniu.
2591. **MOB — Skaner kodów QR na koszulkach klubowych (Merch Authenticator QR Scanner)** — Skanowanie kodu QR z metki oficjalnego mercha w celu potwierdzenia jego oryginalności i odblokowania specjalnej odznaki.
2592. **MOB — Integracja z aplikacją Strava (Strava Activity Sync)** — Import aktywności biegowych i rowerowych jako dodatkowych danych o obciążeniu tlenowym zawodnika.
2593. **MOB — Widget z listą zadań od trenera (Coach Todo List Widget)** — Szybki podgląd zadań technicznych i organizacyjnych przypisanych przez trenera na dany tydzień.
2594. **MOB — Skaner kodów QR na dyplomach uznania (Honor QR Code Scanner)** — Dodawanie dyplomów za wybitne zasługi dla klubu do cyfrowego profilu zawodnika.
2595. **MOB — Haptic feedback przy wysyłaniu wiadomości (Haptic Message Sent)** — Subtelna wibracja potwierdzająca pomyślne wysłanie wiadomości na czacie klubowym.
2596. **MOB — Widget z podsumowaniem regeneracji (Recovery Score Home Widget)** — Widget prezentujący zagregowany wynik gotowości treningowej na podstawie snu, tętna i samopoczucia.
2597. **MOB — Skaner kodów QR na obciążeniach (Plate Calibration QR Scanner)** — Dostęp do danych o dokładnej, skalibrowanej wadze danego talerza treningowego po zeskanowaniu kodu QR.
2598. **MOB — Integracja z aplikacją Withings (Withings Smart Scale Sync)** — Import wagi i składu ciała z wag i urządzeń Withings.
2599. **MOB — Widget z historią składek członkowskich (Fee History Home Widget)** — Szybki podgląd historii ostatnich opłat członkowskich i statusu bieżącego miesiąca.
2600. **MOB — Skaner kodów QR na biletach parkingowych (Club Parking QR Scanner)** — Możliwość walidacji darmowego parkowania dla członków klubu pod halą sportową poprzez zeskanowanie kodu.
2601. **MOB — Haptic feedback przy usunięciu wpisu (Haptic Delete Confirmation)** — Wyraźna, podwójna wibracja ostrzegawcza przy usuwaniu serii lub wpisu z dziennika treningowego.
2602. **MOB — Widget ze statystykami obecności grupy (Group Attendance Widget)** — Widget pokazujący średnią frekwencję grupy treningowej w bieżącym miesiącu.
2603. **MOB — Skaner kodów QR na dyplomach ukończenia kursów (Course QR Code Scanner)** — Dodawanie certyfikatów z ukończonych kursów trenerskich/instruktorskich do profilu kadry.
2604. **MOB — Integracja z aplikacją Suunto (Suunto Activity Sync)** — Synchronizacja danych treningowych i regeneracyjnych z zegarków Suunto.
2605. **MOB — Widget ze statystykami spalonych kalorii (Calorie Burn Home Widget)** — Widget prezentujący szacowaną liczbę kalorii spalonych podczas treningów w bieżącym tygodniu.
2606. **MOB — Skaner kodów QR na kartach wstępu na basen (Pool Access QR Scanner)** — Integracja z lokalnym basenem i weryfikacja zniżek regeneracyjnych dla zawodników Slavii.
2607. **MOB — Haptic feedback przy dodawaniu nowego ćwiczenia (Haptic Add Exercise)** — Krótka wibracja potwierdzająca pomyślne dodanie ćwiczenia spoza planu do aktywnej sesji.
2608. **MOB — Widget ze statystykami Sinclaira klubu (Club Sinclair Stats Widget)** — Widget pokazujący średnią punktację Sinclaira dla całego klubu w porównaniu do innych sekcji na Śląsku.
2609. **MOB — Skaner kodów QR na opaskach startowych (Event Wristband QR Scanner)** — Błyskawiczna rejestracja zawodnika w strefie rozgrzewkowej na zawodach po zeskanowaniu kodu z opaski.
2610. **MOB — Integracja z aplikacją Wahoo (Wahoo Sensor Sync)** — Pobieranie danych o tętnie z pasów telemetrycznych i sensorów Wahoo.
2611. **MOB — Widget ze statystykami tonażu klubu (Club Tonnage Home Widget)** — Widget pokazujący sumaryczny tonaż podniesiony przez wszystkich zawodników klubu w bieżącym miesiącu.
2612. **MOB — Skaner kodów QR na plakatach charytatywnych (Charity QR Scanner)** — Możliwość szybkiego wsparcia akcji charytatywnych organizowanych przez klub poprzez zeskanowanie kodu.
2613. **MOB — Haptic feedback przy zatwierdzeniu planu (Haptic Plan Approved)** — Wibracja celebrująca pomyślne zatwierdzenie tygodniowego planu treningowego przez trenera.
2614. **MOB — Widget ze statystykami obecności klubu (Club Attendance Monthly Widget)** — Widget pokazujący średnią frekwencję całego klubu w bieżącym miesiącu.
2615. **MOB — Skaner kodów QR na dyplomach za rekordy (PR Diploma QR Scanner)** — Skanowanie dyplomów potwierdzających pobicie rekordu klubu w celu automatycznej aktualizacji statystyk.
2616. **MOB — Integracja z aplikacją Coros (Coros Activity Sync)** — Pobieranie danych o treningach i regeneracji z zegarków sportowych Coros.
2617. **MOB — Widget ze statystykami spalonych kalorii grupy (Group Calorie Burn Widget)** — Widget pokazujący średnią liczbę kalorii spalonych przez całą grupę treningową w bieżącym tygodniu.
2618. **MOB — Skaner kodów QR na kartach wstępu do sauny (Sauna Access QR Scanner)** — Weryfikacja wejść na saunę regeneracyjną dla członków klubu.
2619. **MOB — Haptic feedback przy dodawaniu nowej serii (Haptic Add Series)** — Subtelna wibracja potwierdzająca dodanie kolejnej serii do ćwiczenia w dzienniku.
2620. **MOB — Widget ze statystykami Sinclaira sekcji młodzieżowej (Youth Sinclair Widget)** — Widget pokazujący postępy i ranking punktacji Sinclaira w sekcjach juniorskich klubu.
2621. **MOB — Skaner kodów QR na opaskach rozgrzewkowych (Warm-up Wristband QR Scanner)** — Weryfikacja dostępu do pomostów rozgrzewkowych dla trenerów i zawodników.
2622. **MOB — Integracja z aplikacją Hammerhead (Hammerhead Activity Sync)** — Pobieranie danych o aktywnościach kolarskich z komputerów rowerowych Hammerhead.
2623. **MOB — Widget ze statystykami tonażu sekcji młodzieżowej (Youth Tonnage Widget)** — Widget pokazujący sumaryczny tonaż podniesiony przez juniorów w bieżącym miesiącu.
2624. **MOB — Skaner kodów QR na plakatach ekologicznych (Eco QR Scanner)** — Udział w klubowych akcjach ekologicznych i zbieranie punktów za recykling.
2625. **MOB — Haptic feedback przy zatwierdzeniu RPE (Haptic RPE Logged)** — Krótka wibracja potwierdzająca pomyślne zapisanie oceny zmęczenia (RPE) po treningu.
2626. **MOB — Widget ze statystykami obecności sekcji młodzieżowej (Youth Attendance Widget)** — Widget pokazujący frekwencję w grupach juniorskich i dziecięcych w bieżącym miesiącu.
2627. **MOB — Skaner kodów QR na dyplomach za zasługi (Merit Diploma QR Scanner)** — Skanowanie dyplomów za wybitne zasługi dla rozwoju podnoszenia ciężarów na Śląsku.
2628. **MOB — Integracja z aplikacją Whoop (Whoop Strain Sync)** — Import danych o dziennym obciążeniu organizmu (Strain) z opasek Whoop.
2629. **MOB — Widget ze statystykami spalonych kalorii sekcji młodzieżowej (Youth Calorie Widget)** — Widget pokazujący średnią liczbę kalorii spalonych przez juniorów w bieżącym tygodniu.
2630. **MOB — Skaner kodów QR na kartach wstępu na krioterapię (Cryo Access QR Scanner)** — Weryfikacja wejść na zabiegi krioterapii regeneracyjnej dla zawodników kadry.
2631. **MOB — Haptic feedback przy dodawaniu notatki (Haptic Add Note)** — Subtelna wibracja potwierdzająca pomyślne zapisanie notatki technicznej do ćwiczenia.
2632. **MOB — Widget ze statystykami Sinclaira sekcji kobiecej (Female Sinclair Widget)** — Widget pokazujący postępy i ranking punktacji Sinclaira w sekcji kobiecej klubu.
2633. **MOB — Skaner kodów QR na opaskach sędziowskich (Referee Wristband QR Scanner)** — Błyskawiczna weryfikacja uprawnień sędziowskich podczas oficjalnych zawodów klubowych.
2634. **MOB — Integracja z aplikacją MyFitnessPal (MyFitnessPal Weight Sync)** — Automatyczny import wagi ciała z aplikacji MyFitnessPal do profilu zawodnika.
2635. **MOB — Widget ze statystykami tonażu sekcji kobiecej (Female Tonnage Widget)** — Widget pokazujący sumaryczny tonaż podniesiony przez zawodniczki sekcji kobiecej w bieżącym miesiącu.
2636. **MOB — Skaner kodów QR na plakatach promujących zdrowie (Health Promo QR Scanner)** — Dostęp do materiałów edukacyjnych o zdrowiu i profilaktyce kontuzji po zeskanowaniu kodu.
2637. **MOB — Haptic feedback przy zatwierdzeniu wagi (Haptic Bodyweight Logged)** — Krótka wibracja potwierdzająca pomyślne zapisanie porannej masy ciała.
2638. **MOB — Widget ze statystykami obecności sekcji kobiecej (Female Attendance Widget)** — Widget pokazujący frekwencję w sekcji kobiecej klubu w bieżącym miesiącu.
2639. **MOB — Skaner kodów QR na dyplomach za udział w obozach (Camp Certificate QR Scanner)** — Dodawanie certyfikatów z obozów sportowo-kondycyjnych do profilu zawodnika.
2640. **MOB — Integracja z aplikacją Garmin Connect (Garmin RHR Sync)** — Automatyczny import tętna spoczynkowego z urządzeń Garmin.
2641. **MOB — Widget ze statystykami spalonych kalorii sekcji kobiecej (Female Calorie Widget)** — Widget pokazujący średnią liczbę kalorii spalonych przez zawodniczki w bieżącym tygodniu.
2642. **MOB — Skaner kodów QR na kartach wstępu na masaż (Massage Access QR Scanner)** — Weryfikacja wejść na masaże sportowe i relaksacyjne organizowane w klubie.
2643. **MOB — Haptic feedback przy dodawaniu zdjęcia (Haptic Add Image)** — Subtelna wibracja potwierdzająca pomyślne przypisanie zdjęcia do profilu lub wpisu w dzienniku.
2644. **MOB — Widget ze statystykami Sinclaira sekcji męskiej (Male Sinclair Widget)** — Widget pokazujący postępy i ranking punktacji Sinclaira w sekcji męskiej klubu.
2645. **MOB — Skaner kodów QR na opaskach prasowych (Press Wristband QR Scanner)** — Weryfikacja akredytacji prasowych i fotograficznych podczas wydarzeń sportowych.
2646. **MOB — Integracja z aplikacją Fitbit (Fitbit Sleep Sync)** — Import szczegółowych faz snu z urządzeń Fitbit w celu oceny jakości regeneracji nocnej.
2647. **MOB — Widget ze statystykami tonażu sekcji męskiej (Male Tonnage Widget)** — Widget pokazujący sumaryczny tonaż podniesiony przez zawodników sekcji męskiej w bieżącym miesiącu.
2648. **MOB — Skaner kodów QR na plakatach antydopingowych (Antidoping QR Scanner)** — Błyskawiczny dostęp do bazy leków zabronionych po zeskanowaniu kodu z plakatu informacyjnego.
2649. **MOB — Haptic feedback przy zatwierdzeniu nastroju (Haptic Mood Logged)** — Krótka wibracja potwierdzająca pomyślne zapisanie samopoczucia w recovery journalu.
2650. **MOB — Widget ze statystykami obecności sekcji męskiej (Male Attendance Widget)** — Widget pokazujący frekwencję w sekcji męskiej klubu w bieżącym miesiącu.
2651. **MOB — Skaner kodów QR na dyplomach za rekordy życiowe (PR Diploma QR Code Scanner)** — Skanowanie oficjalnych dyplomów PR wydawanych przez klub w celu weryfikacji wyniku.
2652. **MOB — Integracja z aplikacją Withings (Withings Sleep Sync)** — Import danych o strukturze snu z sensorów i mat Withings.
2653. **MOB — Widget ze statystykami spalonych kalorii sekcji męskiej (Male Calorie Widget)** — Widget pokazujący średnią liczbę kalorii spalonych przez zawodników w bieżącym tygodniu.
2654. **MOB — Skaner kodów QR na kartach wstępu na saunę fińską (Finnish Sauna QR Scanner)** — Weryfikacja wejść na saunę fińską w ramach odnowy biologicznej kadry.
2655. **MOB — Haptic feedback przy dodawaniu wideo (Haptic Add Video)** — Subtelna wibracja potwierdzająca pomyślne dodanie nagrania wideo techniki do serii treningowej.
2656. **MOB — Widget ze statystykami Sinclaira sekcji weteranów (Masters Sinclair Widget)** — Widget pokazujący postępy i ranking punktacji Sinclaira w sekcji Masters (weteranów) klubu.
2657. **MOB — Skaner kodów QR na opaskach vip (VIP Wristband QR Scanner)** — Weryfikacja dostępu do strefy VIP i cateringu podczas uroczystych zawodów CKS Slavia.
2658. **MOB — Integracja z aplikacją Polar Flow (Polar Sleep Sync)** — Import danych o regeneracji nocnej Nightly Recharge z platformy Polar.
2659. **MOB — Widget ze statystykami tonażu sekcji weteranów (Masters Tonnage Widget)** — Widget pokazujący sumaryczny tonaż podniesiony przez weteranów w bieżącym miesiącu.
2660. **MOB — Skaner kodów QR na plakatach o rozciąganiu (Stretching QR Scanner)** — Dostęp do instruktaży wideo ćwiczeń rozciągających i mobilizacyjnych po treningu.
2661. **MOB — Haptic feedback przy zatwierdzeniu suplementacji (Haptic Supplement Logged)** — Krótka wibracja potwierdzająca pomyślne odznaczenie codziennej porcji suplementów.
2662. **MOB — Widget ze statystykami obecności sekcji weteranów (Masters Attendance Widget)** — Widget pokazujący frekwencję w sekcji Masters (weteranów) klubu w bieżącym miesiącu.
2663. **MOB — Skaner kodów QR na dyplomach za zasługi trenerskie (Coaching Merit QR Scanner)** — Skanowanie dyplomów za wybitne osiągnięcia w szkoleniu młodzieży ciężarowej.
2664. **MOB — Integracja z aplikacją Apple Health (Apple Health Sleep Sync)** — Automatyczny import faz i długości snu z systemowej bazy Apple Health.
2665. **MOB — Widget ze statystykami spalonych kalorii sekcji weteranów (Masters Calorie Widget)** — Widget pokazujący średnią liczbę kalorii spalonych przez weteranów w bieżącym tygodniu.

### Technologie web i API (Backend/Frontend) — pomysły 2666–2835

2666. **FE/BE — Weryfikacja statusu transakcji Stripe (Stripe Transaction Validator)** — Endpoint sprawdzający status transakcji płatniczych w Stripe przed zatwierdzeniem składki zawodnika.
2667. **FE — Płynne przewijanie do sekcji wyników (Smooth Scroll to Results Table)** — Automatyczne, łagodne scrollowanie ekranu do tabeli z rezultatami po kliknięciu przycisku wyszukiwania w panelu publicznym.
2668. **BE — Automatyczne odrzucanie spamu na czacie (Chat Spam Control Middleware)** — Warstwa pośrednia w Rust wykrywająca i blokująca wiadomości czatu zawierające podejrzane linki lub powtarzające się frazy.
2669. **FE — Responsywny kalkulator proporcji (Responsive Ratios Calculator UI)** — Przystosowanie interaktywnego kalkulatora proporcji siłowych do bezbłędnego wyświetlania na małych smartfonach.
2670. **BE — Skompresowany format eksportu danych RODO (GDPR Zip Archiver)** — Pakowanie danych profilowych, historii płatności i treningów do jednego, skompresowanego pliku ZIP chronionego hasłem przed pobraniem.
2671. **FE — Podpowiedzi tekstowe dla ról (Role Tooltips in Admin Panel)** — Małe, estetyczne podpowiedzi (Tooltips) wyjaśniające uprawnienia poszczególnych ról przy edycji konta w panelu AdminsManager.
2672. **BE — Monitorowanie opóźnień zapytań SQL (SQL Query Latency Monitor)** — Worker logujący wszystkie zapytania do SQLite/Turso, których czas wykonania przekracza 150ms, w celu identyfikacji brakujących indeksów.
2673. **FE — Interaktywny podgląd wykresu tonażu (Interactive Tonnage Line Chart)** — Wykres liniowy w Nuxt prezentujący sumaryczny tonaż z opcją najechania myszką (Tooltip) w celu wyświetlenia szczegółowych ćwiczeń z danego dnia.
2674. **BE — API do synchronizacji odznak (Badges Synchronization Endpoint)** — Endpoint w Rust sprawdzający warunki przyznania odznak (np. frekwencja >90%, nowy rekord PR) i automatycznie aktualizujący stan w bazie.
2675. **FE — Formularz edycji odznak zawodnika (Edit Athlete Badges Modal)** — Panel dla administratora umożliwiający ręczne przyznawanie lub odbieranie odznak specjalnych (np. "Zasłużony dla klubu").
2676. **BE — Dynamiczne CSP dla zewnętrznych modeli AI (Dynamic Content Security Policy)** — Skonfigurowanie nagłówków CSP w Axum pozwalających na bezpieczne pobieranie wag modeli MoveNet/TensorFlow bezpośrednio z serwerów Google.
2677. **FE — Filtrowanie postów na blogu po autorach (Blog Posts Author Filter)** — Możliwość szybkiego odnalezienia artykułów napisanych przez konkretnego trenera za pomocą dropdownu na publicznej stronie.
2678. **BE — Endpoint do sprawdzania orzeczeń lekarskich (Medical Certification API)** — Endpoint w Rust pozwalający na pobranie statusu badań lekarskich wszystkich zawodników z ostrzeżeniami o wygasających terminach.
2679. **FE — Tryb kafelkowy na liście zawodników (Athlete Grid View Toggle)** — Przełącznik w panelu administratora pozwalający na zmianę widoku z tabeli na siatkę kart z dużymi zdjęciami profilowymi zawodników.
2680. **BE — System powiadomień mailowych o braku badań (Email Alert for Expiring Medicals)** — Automatyczny worker wysyłający przypomnienia e-mail do zawodników na 30 dni przed końcem ważności badań lekarskich.
2681. **FE — Dynamiczny wykres kołowy obecności (Monthly Attendance Donut Chart)** — Wizualizacja frekwencji zawodnika w danym miesiącu w formie estetycznego wykresu kołowego z podziałem na obecności, usprawiedliwienia i nieobecności.
2682. **BE — Automatyczne łączenie duplikatów zawodników (Merge Duplicate Athletes Endpoint)** — Bezpieczna transakcja SQL pozwalająca na połączenie dwóch omyłkowo utworzonych rekordów zawodników z zachowaniem całej historii treningów i wyników.
2683. **FE — Przycisk szybkiego wyciszenia powiadomień (Mute Notifications Button)** — Opcja wyciszenia powiadomień push i e-mail na określony czas (np. 1 godzina, 1 dzień, 1 tydzień) bezpośrednio z profilu.
2684. **BE — Weryfikacja podpisu webhooka Stripe (Stripe Webhook Signature Verification)** — Bezpieczna weryfikacja autentyczności przesyłanych powiadomień o płatnościach w celu zapobiegania atakom typu spoofing.
2685. **FE — Interaktywna mapa dojazdu na zawody (Google Maps API Embed)** — Integracja interaktywnej mapy Google na karcie wydarzenia w kalendarzu, prezentującej trasę i czas dojazdu z siedziby klubu.
2686. **BE — API do masowego wysyłania ogłoszeń (Mass Announcement Broadcast API)** — Zoptymalizowany endpoint Axum wysyłający powiadomienia push i e-maile do wszystkich zarejestrowanych członków klubu jednocześnie.
2687. **FE — Dynamiczny wskaźnik siły hasła (Interactive Password Strength Meter)** — Wizualny pasek i podpowiedzi techniczne podczas rejestracji lub zmiany hasła, pomagające użytkownikowi stworzyć bezpieczne hasło.
2688. **BE — Worker verifikujący kody TOTP (TOTP Verification Code Pruner)** — Nocny proces czyszczący z bazy danych zużyte lub wygasłe jednorazowe tokeny 2FA w celu zachowania higieny bazy danych.
2689. **FE — Responsywna galeria wideo techniki (Responsive Video Grid UI)** — Dostosowanie siatki wideo z nagraniami prób technicznych do płynnego wyświetlania na smartfonach i tabletach.
2690. **BE — Endpoint do weryfikacji poprawności importu CSV (CSV Import Dry-Run API)** — Endpoint pozwalający na przetestowanie importu danych bez zapisywania ich do bazy danych, zwracający listę potencjalnych błędów.
2691. **FE — System polubień pod postami w aktualnościach (News Likes & Reactions UI)** — Interaktywne przyciski reakcji (kciuk w górę, brawa, serce) pod postami z natychmiastowym zliczaniem w czasie rzeczywistym.
2692. **BE — API do rejestrowania reakcji (Reactions API Endpoint)** — Zoptymalizowany endpoint w Rust zapisujący i agregujący reakcje użytkowników pod aktualnościami i ogłoszeniami.
2693. **FE — Wykres rozkładu wyników Sinclaira w klubie (Sinclair Bell Curve Chart)** — Wykres rozkładu normalnego (krzywa Gaussa) prezentujący pozycję zawodnika na tle średniej punktacji całego klubu.
2694. **BE — Szyfrowanie plików wideo na serwerze (At-Rest Encryption for Media Files)** — Automatyczne szyfrowanie przesyłanych nagrań techniki przed zapisem na dysk sieciowy (S3) w celu ochrony prywatności zawodników.
2695. **FE — Formularz zgłaszania wniosków o urlop sportowy (Leave of Absence Form UI)** — Moduł pozwalający zawodnikowi na złożenie oficjalnego wniosku o czasowe zwolnienie ze składek (np. z powodu kontuzji) z załącznikiem medycznym.
2696. **BE — API do zatwierdzania urlopów sportowych (Leave of Absence Approval Backend)** — Endpoint w Rust dla administratorów do akceptacji lub odrzucenia wniosków o urlop sportowy z automatyczną pauzą składek.
2697. **FE — Płynne animacje otwierania modali (Smooth Modal Transitions)** — Wdrożenie estetycznych i szybkich przejść CSS dla wszystkich okien modalnych w systemie w celu nadania premium charakteru.
2698. **BE — Monitorowanie zużycia pamięci RAM przez proces backendu (Process RSS Memory Tracker)** — Cykliczne logowanie zużycia pamięci RAM (Resident Set Size) przez Axum w celu szybkiego wykrywania wycieków pamięci.
2699. **FE — Interaktywny kreator szablonów wiadomości czatu (Chat Message Templates UI)** — Panel dla trenerów umożliwiający tworzenie, edycję i szybkie wstawianie gotowych szablonów wiadomości na czacie.
2700. **BE — Endpoint do masowego pobierania danych rozliczeniowych (Bulk Invoice Export API)** — Generowanie skompresowanej paczki ZIP z fakturami/potwierdzeniami opłat za wybrany okres dla celów księgowych klubu.
2701. **FE — Dynamiczny wykres tonażu skumulowanego (Cumulative Tonnage Chart UI)** — Wykres prezentujący łączny tonaż podniesiony od początku roku z prognozą osiągnięcia celu rocznego.
2702. **BE — API do walidacji poprawności danych Sinclaira (Sinclair Validation Audit)** — Skrypt weryfikujący, czy zapisane w bazie punkty Sinclaira zgadzają się z aktualnymi współczynnikami IWF na dany rok.
2703. **FE — Formularz przypisywania ról sędziowskich (Referee Credentials Manager UI)** — Panel pozwalający na dodawanie i weryfikację uprawnień sędziowskich (klasa sędziowska, data ważności licencji) członków klubu.
2704. **BE — Endpoint do sprawdzania uprawnień sędziowskich (Referee Audit API)** — Endpoint zwracający listę sędziów z aktualnymi uprawnieniami gotowych do obsługi zawodów.
2705. **FE — Estetyczny widżet z prezentacją sponsorów (Sponsor Carousel Component)** — Płynnie animowana karuzela logotypów sponsorów na publicznej stronie głównej sekcji CKS Slavia.
2706. **BE — Zabezpieczenie przed atakami typu Brute Force na kodach TOTP (TOTP Rate Limiter)** — Restrykcyjny licznik prób weryfikacji kodu 2FA blokujący adres IP po 3 nieudanych próbach.
2707. **FE — Formularz rejestracji na wewnętrzne zawody (Competition Sign-up Form)** — Moduł pozwalający zawodnikowi na zgłoszenie udziału w zawodach wewnętrznych z podaniem planowanej wagi startowej i podejść.
2708. **BE — API do obsługi zgłoszeń startowych (Competition Registration API)** — Endpoint w Rust rejestrujący zgłoszenia zawodników, weryfikujący kategorie wagowe i generujący listę startową.
2709. **FE — Płynny pasek postępu ładowania strony (Nuxt Loading Bar Customizer)** — Wdrożenie dopasowanego kolorystycznie, dynamicznego paska na samej górze ekranu informującego o ładowaniu kolejnej podstrony.
2710. **BE — Logowanie zmian konfiguracji systemu (Config Audit Trail)** — Rejestrowanie w tabeli audit_logs każdej modyfikacji zmiennych systemowych lub stałych konfiguracyjnych klubu.
2711. **FE — Interaktywny podgląd toru sztangi w 3D (ThreeJS Barbell Path Viewer)** — Eksperymentalny komponent w Nuxt wykorzystujący bibliotekę Three.js do wizualizacji toru sztangi w przestrzeni trójwymiarowej.
2712. **BE — API do eksportu współczynników Sinclaira (Sinclair Coefficients API)** — Endpoint zwracający aktualne, oficjalne współczynniki Sinclaira dla mężczyzn i kobiet pobierane z bazy SQLite.
2713. **FE — Formularz zgłaszania zapotrzebowania na sprzęt (Gear Request Form)** — Moduł pozwalający trenerom na składanie wniosków o zakup nowego sprzętu (np. pasów, gryfów, magnezji) do zarządu klubu.
2714. **BE — API do zarządzania wnioskami sprzętowymi (Gear Purchase Approval API)** — Endpointy do obsługi statusu wniosków zakupowych (oczekujący, zatwierdzony, zrealizowany) z powiadomieniami push.
2715. **FE — Wykres rozkładu tonażu na partie mięśniowe (Muscle Group Volume Distribution Chart)** — Wykres kołowy prezentujący procentowy udział objętości treningowej na poszczególne boje i partie ciała zawodnika.
2716. **BE — API do analizy rozkładu tonażu (Tonnage Analysis Engine)** — Algorytm w Rust kategoryzujący ćwiczenia z planu i obliczający rozkład objętości na podstawie historii serii.
2717. **FE — Wygodne filtrowanie czatu po statusie przeczytania (Unread Chat Messages Filter)** — Przycisk na liście wątków czatu pozwalający natychmiast wyświetlić tylko te rozmowy, w których są nowe wiadomości.
2718. **BE — Automatyczne odznaczanie wiadomości jako przeczytane (Auto Mark Chat Read API)** — Zoptymalizowany endpoint aktualizujący status przeczytania wiadomości w tle po otwarciu okna czatu.
2719. **FE — Formularz zapisu na obozy sportowe (Sport Camp Registration UI)** — Moduł prezentujący szczegóły nadchodzącego obozu (cena, termin, program) z formularzem zapisu i płatnością zaliczki.
2720. **BE — API do obsługi rezerwacji na obozy (Camp Booking Manager API)** — Endpointy w Rust kontrolujące limit miejsc, zapisy i status wpłat zaliczek na wyjazdy klubowe.
2721. **FE — Dynamiczny wykres gotowości treningowej (Daily Readiness Trend UI)** — Wykres liniowy prezentujący postęp wskaźnika gotowości (RPE, sen, zmęczenie) na przestrzeni ostatnich 30 dni.
2722. **BE — Endpoint do weryfikacji poprawności integracji z wagami (Smart Scale Integration Endpoint)** — API odbierające i walidujące surowe dane telemetryczne z wag pomiarowych.
2723. **FE — Formularz edycji danych ubezpieczeniowych (Insurance Details Manager UI)** — Panel w profilu zawodnika pozwalający na wprowadzenie numeru polisy ubezpieczeniowej i daty ważności ubezpieczenia sportowego.
2724. **BE — API do kontroli ubezpieczeń zawodników (Insurance Safety Audit API)** — Endpoint dla administratora zwracający listę zawodników bez ważnego ubezpieczenia NNW przed wyjazdem na zawody.
2725. **FE — Płynne skalowanie elementów interfejsu (Tailwind Fluid Typography Preset)** — Wdrożenie responsywnych reguł typograficznych, które płynnie dostosowują rozmiar nagłówków do wielkości ekranu.
2726. **BE — Monitorowanie czasu odpowiedzi zewnętrznych integracji (External API Latency Logger)** — Worker rejestrujący czas odpowiedzi zewnętrznych serwisów (POLADA, Stripe, Cloudinary) z automatycznym fallbackiem przy awarii.
2727. **FE — Formularz rezerwacji fizjoterapeutycznej (Physiotherapist Reservation UI)** — Interfejs z wyborem wolnych godzin, terapeuty i typu zabiegu (masaż, kinesiotaping, rehabilitacja) z podglądem na żywo.
2728. **BE — API do rezerwacji fizjoterapii (Physio Booking Engine)** — System rezerwacji w Rust blokujący podwójne terminy i wysyłający przypomnienia SMS do zawodnika i terapeuty.
2729. **FE — Wykres historii wagi ciała w profilu (Weight History Trend Chart)** — Interaktywny wykres liniowy prezentujący zmiany masy ciała zawodnika na przestrzeni roku z zaznaczonymi granicami kategorii wagowej.
2730. **BE — API do weryfikacji limitów wagowych (Weight Limit Validation API)** — Algorytm sprawdzający, czy poranny pomiar wagi zawodnika nie przekracza dopuszczalnej tolerancji startowej.
2731. **FE — Formularz zgłaszania nieobecności na treningu (Attendance Excuse Form)** — Szybki moduł pozwalający zawodnikowi na podanie powodu nieobecności (choroba, praca) i załączenie zdjęcia usprawiedliwienia.
2732. **BE — API do zatwierdzania usprawiedliwień (Excuse Approval API)** — Endpoint w Rust umożliwiający trenerowi zatwierdzenie nieobecności zawodnika z automatyczną aktualizacją statystyk frekwencji.
2733. **FE — Płynny suwak wyboru obciążenia (Fluid Load Slider Input)** — Alternatywny element interfejsu w dzienniku treningowym pozwalający na płynne dobieranie ciężaru na sztandze za pomocą suwaka.
2734. **BE — Logowanie zmian statusu płatności (Payment Status Audit Trail)** — Rejestrowanie każdej zmiany statusu składki (np. z "Pending" na "Approved") z identyfikatorem administratora dokonującego zmiany.
2735. **FE — Interaktywna prezentacja wyników Sinclaira (Sinclair Leaderboard UI)** — Nowoczesny, publiczny ranking zawodników klubu CKS Slavia z możliwością sortowania według płci i kategorii wiekowych.
2736. **BE — API do generowania rankingu Sinclaira (Sinclair Leaderboard API)** — Zoptymalizowany endpoint Axum pobierający najlepsze historyczne rezultaty zawodników i przeliczający je na punkty Sinclaira w ułamku sekundy.
2737. **FE — Formularz zgłaszania zapotrzebowania na magnezję (Chalk Order Form)** — Proste narzędzie pozwalające dyżurnemu zawodnikowi na sali zgłosić niski stan magnezji w pojemnikach jednym kliknięciem.
2738. **BE — API do monitorowania zużycia magnezji (Chalk Consumption Monitor)** — System powiadomień dla administracji o konieczności uzupełnienia zapasów magnezji na hali.
2739. **FE — Wykres historii wejść do strefy rwania (PR Strength Progression Chart)** — Porównawczy wykres liniowy prezentujący roczny postęp w rwaniu, podrzucie i dwuboju na jednym ekranie.
2740. **BE — API do eksportu rekordów życiowych (PR History API)** — Endpoint w Rust zwracający pełną chronologiczną historię rekordów zawodnika z oznaczeniem daty i miejsca ich pobicia.
2741. **FE — Formularz zgłaszania uwag do planu treningowego (Plan Feedback Form)** — Dyskretna sekcja pod planem treningowym na dany dzień, umożliwiająca zawodnikowi napisanie komentarza dla trenera.
2742. **BE — API do obsługi komentarzy do planu (Plan Comments API)** — Endpointy do zapisu i odczytu uwag zawodników z automatycznym oznaczeniem jako nieprzeczytane w panelu trenera.
2743. **FE — Płynne animacje ładowania wykresów (Chart Entrance Animations)** — Eleganckie, łagodne animowanie linii i słupków wykresów podczas wchodzenia na ekrany statystyk.
2744. **BE — Monitorowanie spójności danych ubezpieczeń (Insurance Expiry Audit Worker)** — Cykliczny worker SQL sprawdzający polisy zawodników i automatycznie generujący powiadomienia o zbliżającym się końcu ochrony.
2745. **FE — Formularz zgłoszeniowy dla wolontariuszy (Volunteer Registration UI)** — Moduł pozwalający sympatykom klubu na zapisanie się do pomocy przy organizacji najbliższych zawodów z wyborem preferowanej roli.
2746. **BE — API do zarządzania wolontariuszami (Volunteer Coordinator API)** — Endpointy w Rust umożliwiające przydzielanie wolontariuszy do zadań (np. obsługa nagłośnienia, pomoc w biurze zawodów).
2747. **FE — Wykres rozkładu intensywności treningowej (Intensity Distribution Donut)** — Wykres kołowy prezentujący procentowy udział serii wykonanych w poszczególnych przedziałach intensywności (np. 80-90% CM).
2748. **BE — API do kalkulacji stref intensywności (Intensity Calculator Engine)** — Algorytm w Rust obliczający strefy obciążeń na podstawie aktualnych rekordów życiowych zawodnika.
2749. **FE — Wygodny panel szybkiego kontaktu z trenerem (Coach Quick Contact Panel)** — Pływająca sekcja na dashboardzie zawodnika z szybkim przejściem do czatu, e-maila lub telefonu przypisanego trenera.
2750. **BE — API do sprawdzania przypisań trenerskich (Coach Assignment API)** — Endpointy do pobierania i aktualizacji struktury przypisań zawodników do poszczególnych trenerów sekcji.
2751. **FE — Dynamiczny wykres frekwencji rocznej (Annual Attendance Heatmap)** — Estetyczna wizualizacja obecności w formie siatki dni roku (podobnej do GitHub Contributions) prezentująca regularność treningów.
2752. **BE — API do generowania siatki frekwencji (Attendance Heatmap API)** — Endpoint w Rust agregujący dane o obecności zawodnika i zwracający je w formacie ułatwiającym renderowanie siatki rocznej.
2753. **FE — Formularz zgłaszania wniosków o dofinansowanie startów (Funding Request Form)** — Moduł pozwalający zawodnikom kadry na wnioskowanie o pokrycie kosztów opłat startowych lub dojazdu na zawody rangi mistrzowskiej.
2754. **BE — API do zarządzania dofinansowaniami (Funding Request Manager API)** — Endpointy do obsługi statusu wniosków finansowych z automatycznym generowaniem potwierdzeń PDF dla księgowości.
2755. **FE — Wykres stosunku tonażu do Sinclaira (Tonnage vs Sinclair Scatter Plot)** — Wykres korelacji pokazujący wpływ sumarycznej objętości treningowej na ostateczny wynik sportowy zawodnika.
2756. **BE — API do analizy korelacji tonażu (Tonnage Correlation Engine)** — Moduł statystyczny w Rust badający korelacje między parametrami treningowymi a przyrostem formy.
2757. **FE — Formularz zgłaszania propozycji zakupowych mercha (Merch Design Suggestion UI)** — Narzędzie do przesyłania pomysłów i grafik na nowe koszulki, bluzy i akcesoria klubowe z opcją głosowania.
2758. **BE — API do obsługi głosowań na merch (Merch Voting API)** — Endpointy do zliczania głosów i komentarzy społeczności pod nowymi projektami klubowej odzieży.
2759. **FE — Płynne przejścia między profilami zawodników (Smooth Athlete Profile Transitions)** — Szybkie wczytywanie i eleganckie renderowanie danych po zmianie profilu zawodnika na liście kadry.
2760. **BE — Monitorowanie spójności danych licencyjnych (License Expiry Audit Worker)** — Asynchroniczny proces w Rust sprawdzający ważność licencji PZPC zawodników i wysyłający przypomnienia o konieczności przedłużenia.
2761. **FE — Formularz zapisu na warsztaty techniczne (Workshop Sign-up UI)** — Interfejs prezentujący szczegóły nadchodzących szkoleń (np. "Masterclass Rwania") z opcją rezerwacji miejsca i płatności.
2762. **BE — API do obsługi warsztatów technicznych (Workshop Reservation API)** — Endpointy kontrolujące limity uczestników, status płatności i wysyłające wejściówki QR na e-mail.
2763. **FE — Wykres rozkładu czasu spędzonego pod sztangą (Time Under Tension Chart)** — Wizualizacja szacowanego czasu trwania serii w fazie koncentrycznej i ekscentrycznej dla głównych bojów.
2764. **BE — API do kalkulacji czasu pod napięciem (TUT Calculation Engine)** — Algorytm szacujący czas trwania serii na podstawie liczby powtórzeń i zdefiniowanego tempa ćwiczenia.
2765. **FE — Wyszukiwanie w archiwum aktualności po tagach (News Archive Tag Search)** — Szybkie filtrowanie historycznych wpisów blogowych za pomocą interaktywnych, kolorowych tagów.
2766. **BE — API do tagowania aktualności (News Tagging API)** — Endpointy do dynamicznego przypisywania i pobierania tagów powiązanych z postami klubowymi.
2767. **FE — Formularz rezerwacji sauny klubowej (Sauna Booking UI)** — Interfejs z kalendarzem wolnych godzin sauny fińskiej dedykowanej do regeneracji po ciężkich treningach.
2768. **BE — API do rezerwacji sauny (Sauna Reservation Engine)** — System kontroli dostępu do sauny, ograniczający liczbę osób w danej sesji w celu zapewnienia komfortu.
2769. **FE — Wykres postępu w testach sprawności ogólnej (General Fitness PR Chart)** — Wizualizacja wyników w ćwiczeniach uzupełniających (np. wyskok dosiężny, bieg wahadłowy) na przestrzeni sezonu.
2770. **BE — API do rejestrowania testów sprawnościowych (Fitness Tests API)** — Endpointy do zapisu i odczytu parametrów sprawności ogólnej zawodników sekcji młodzieżowych.
2771. **FE — Formularz zgłaszania wniosków o ubezpieczenie grupowe (Group Insurance Enrollment Form)** — Moduł pozwalający na przesyłanie niezbędnych dokumentów i zgód do rocznego ubezpieczenia sportowego klubu.
2772. **BE — API do obsługi ubezpieczeń grupowych (Group Insurance Manager API)** — Endpointy w Rust generujące zestawienia dla ubezpieczyciela i kontrolujące terminy ważności polis.
2773. **FE — Płynne animacje w menu nawigacyjnym (Fluid Navigation Sidebar Animations)** — Wykorzystanie biblioteki Framer Motion / GSAP w celu nadania wyjątkowej płynności ruchom bocznego menu.
2774. **BE — Monitorowanie obciążenia bazy danych SQLite (SQLite WAL Size Monitor)** — Worker sprawdzający rozmiar pliku zapisu z wyprzedzeniem (Write-Ahead Log) i automatycznie wyzwalający proces checkpoint w godzinach nocnych.
2775. **FE — Formularz zgłaszania opinii o obozach (Camp Feedback Survey UI)** — Anonimowa ankieta dla uczestników obozów sportowych Slavii, pozwalająca ocenić zakwaterowanie, wyżywienie i jakość treningów.
2776. **BE — API do obsługi ankiet obozowych (Camp Surveys API)** — Endpointy do zapisu anonimowych odpowiedzi z automatyczną agregacją wyników w panelu administratora.
2777. **FE — Wykres rozkładu tonażu na dni tygodnia (Daily Tonnage Distribution Chart)** — Wykres słupkowy prezentujący obciążenie tonażowe w poszczególne dni, ułatwiający ocenę falowania intensywności planu.
2778. **BE — API do kalkulacji falowania obciążeń (Microcycle Wave Calculator)** — Algorytm analizujący mikrotakt treningowy i weryfikujący zgodność z założeniami periodyzacji sportowej.
2779. **FE — Formularz zgłaszania propozycji do rankingu (Rank Nomination Form)** — Moduł pozwalający na zgłaszanie wybitnych wyników uzyskanych poza oficjalnymi zawodami w celu wpisania ich do galerii sławy.
2780. **BE — API do weryfikacji nominacji do rankingu (Rank Nomination API)** — Endpointy w Rust dla trenerów do zatwierdzania i weryfikacji poprawności zgłoszonych rekordów.
2781. **FE — Wykres postępu technicznego w ocenie trenera (Technical Score Progression Chart)** — Wizualny wykres prezentujący punktową ocenę techniki rwania i podrzutu wystawianą przez trenera.
2782. **BE — API do oceniania techniki (Technical Assessment API)** — Endpointy pozwalające trenerom na ocenę poszczególnych faz boju (np. start, pierwsze pociągnięcie, podsiad) zawodnika.
2783. **FE — Formularz rezerwacji sprzętu do analizy VBT (VBT Sensor Rental Form)** — Panel pozwalający na rezerwację klubowych enkoderów liniowych do pomiaru prędkości sztangi.
2784. **BE — API do rezerwacji enkoderów VBT (VBT Inventory API)** — System kontroli wypożyczeń sensorów VBT, blokujący rezerwacje w przypadku braku dostępnego sprzętu na stanie.
2785. **FE — Wykres tętna spoczynkowego na przestrzeni czasu (RHR Trend Chart)** — Wykres liniowy prezentujący tętno spoczynkowe, kluczowe dla monitorowania stanu przetrenowania zawodnika.
2786. **BE — API do rejestrowania tętna spoczynkowego (RHR Log API)** — Endpointy w Rust do zapisu i odczytu parametrów pracy serca w spoczynku pobieranych z urządzeń wearable.
2787. **FE — Formularz zgłaszania wniosków o stypendium klubowe (Scholarship Application Form)** — Moduł pozwalający zawodnikom z wybitnymi wynikami na składanie wniosków o miesięczne stypendia sportowe.
2788. **BE — API do zarządzania stypendiami (Scholarship Manager API)** — Endpointy do obsługi statusu wniosków stypendialnych z automatycznym generowaniem dokumentacji dla zarządu.
2789. **FE — Wykres stosunku tonażu do masy ciała (Tonnage to Bodyweight Ratio Chart)** — Wykres prezentujący względną objętość treningową zawodnika, ułatwiający porównywanie obciążeń in different weight categories.
2790. **BE — API do kalkulacji względnej objętości (Relative Tonnage Engine)** — Algorytm w Rust obliczający stosunek podniesionych kilogramów do masy ciała zawodnika w poszczególnych mikrocyklach.
2791. **FE — Formularz rezerwacji strefy regeneracji (Recovery Zone Booking UI)** — Interfejs do rezerwacji czasu korzystania z klubowych nogawek kompresyjnych i pistoletów do masażu.
2792. **BE — API do rezerwacji strefy regeneracji (Recovery Zone API)** — System zarządzania harmonogramem korzystania z urządzeń do odnowy biologicznej w klubie.
2793. **FE — Wykres historii wyników w punktach Sinclaira (Sinclair Progression Chart)** — Wizualny wykres prezentujący postęp punktowy zawodnika na przestrzeni całej kariery w klubie.
2794. **BE — API do eksportu historii Sinclaira (Sinclair History API)** — Endpointy w Rust zwracające historię punktacji Sinclaira zawodnika na podstawie wszystkich zatwierdzonych wyników zawodów.
2795. **FE — Formularz zgłaszania zapotrzebowania na taśmy (Athletic Tape Request Form)** — Narzędzie do szybkiego zgłaszania braku taśm sportowych do owijania kciuków (hak) na sali treningowej.
2796. **BE — API do monitorowania zużycia taśm (Tape Inventory Monitor)** — System powiadomień dla administracji o konieczności zamówienia taśm sportowych dla zawodników.
2797. **FE — Wykres rozkładu tonażu na typy ćwiczeń (Exercise Type Volume Donut)** — Wykres kołowy prezentujący procentowy udział ćwiczeń klasycznych, olimpijskich i pomocniczych w planie treningowym.
2798. **BE — API do kategoryzacji ćwiczeń (Exercise Categorizer Engine)** — Algorytm w Rust klasyfikujący ćwiczenia z bazy pod kątem ich wpływu na biomechanikę rwania i podrzutu.
2799. **FE — Wygodny panel szybkiego kontaktu z fizjoterapeutą (Physio Quick Contact Panel)** — Pływająca sekcja na dashboardzie zawodnika z szybkim przejściem do rezerwacji terminów i kontaktu z terapeutą.
2800. **BE — API do sprawdzania dostępności fizjoterapeuty (Physio Availability API)** — Endpointy w Rust do pobierania wolnych terminów w kalendarzu pracy klubowego fizjoterapeuty.
2801. **FE — Dynamiczny wykres frekwencji miesięcznej (Monthly Attendance Progress Circle)** — Estetyczny pierścień postępu pokazujący frekwencję zawodnika w bieżącym miesiącu z celem 100%.
2802. **BE — API do kalkulacji frekwencji miesięcznej (Monthly Attendance Calculator)** — Endpoint w Rust obliczający procent obecności zawodnika na zaplanowanych treningach w danym miesiącu.
2803. **FE — Formularz zgłaszania wniosków o dofinansowanie sprzętu (Gear Funding Request Form)** — Moduł pozwalający zawodnikom kadry na wnioskowanie o dofinansowanie zakupu buty startowych lub pasów.
2804. **BE — API do obsługi dofinansowań sprzętowych (Gear Funding Manager API)** — Endpointy do obsługi statusu wniosków finansowych z automatycznym generowaniem potwierdzeń dla księgowości.
2805. **FE — Wykres stosunku tonażu do punktów Sinclaira grupy (Group Tonnage vs Sinclair Chart)** — Wykres korelacji pokazujący wpływ sumarycznej objętości treningowej na średni wynik sportowy całej grupy treningowej.
2806. **BE — API do analizy korelacji tonażu grupy (Group Tonnage Correlation Engine)** — Moduł statystyczny w Rust badający korelacje między parametrami treningowymi a przyrostem formy całej grupy.
2807. **FE — Formularz zgłaszania propozycji logotypów (Logo Design Suggestion UI)** — Narzędzie do przesyłania pomysłów i grafik na nowe logotypy okazjonalne klubu z opcją głosowania.
2808. **BE — API do obsługi głosowań na logotypy (Logo Voting API)** — Endpointy do zliczania głosów i komentarzy społeczności pod nowymi projektami graficznymi.
2809. **FE — Płynne przejścia między profilami trenerów (Smooth Coach Profile Transitions)** — Szybkie wczytywanie i eleganckie renderowanie danych po zmianie profilu trenera na liście kadry szkoleniowej.
2810. **BE — Monitorowanie spójności danych licencyjnych trenerów (Coach License Expiry Worker)** — Asynchroniczny proces w Rust sprawdzający ważność licencji trenerskich PZPC i wysyłający przypomnienia o konieczności przedłużenia.
2811. **FE — Formularz zapisu na obozy kondycyjne (Conditioning Camp Registration UI)** — Interfejs prezentujący szczegóły nadchodzących obozów kondycyjnych z opcją rezerwacji miejsca i płatności.
2812. **BE — API do obsługi obozów kondycyjnych (Conditioning Camp Reservation API)** — Endpointy kontrolujące limity uczestników, status płatności i wysyłające wejściówki QR na e-mail.
2813. **FE — Wykres rozkładu czasu spędzonego na rozciąganiu (Stretching Time Chart)** — Wizualizacja czasu spędzonego na rozciąganiu i mobilizacji po treningu w poszczególnych mikrocyklach.
2814. **BE — API do kalkulacji czasu rozciągania (Stretching Time Calculation Engine)** — Algorytm szacujący czas trwania sesji mobilizacyjnych na podstawie historii wpisów w dzienniku.
2815. **FE — Wyszukiwanie w archiwum ogłoszeń po tagach (Announcement Archive Tag Search)** — Szybkie filtrowanie historycznych ogłoszeń klubowych za pomocą interaktywnych, kolorowych tagów.
2816. **BE — API do tagowania ogłoszeń (Announcement Tagging API)** — Endpointy do dynamicznego przypisywania i pobierania tagów powiązanych z ogłoszeniami klubowymi.
2817. **FE — Formularz rezerwacji sauny parowej (Steam Sauna Booking UI)** — Interfejs z kalendarzem wolnych godzin sauny parowej dedykowanej do regeneracji po ciężkich treningach.
2818. **BE — API do rezerwacji sauny parowej (Steam Sauna Reservation Engine)** — System kontroli dostępu do sauny, ograniczający liczbę osób w danej sesji w celu zapewnienia komfortu.
2819. **FE — Wykres postępu w testach siły maksymalnej (Max Strength PR Chart)** — Wizualizacja wyników w ćwiczeniach siły maksymalnej (np. przysiad, martwy ciąg, wyciskanie) na przestrzeni sezonu.
2820. **BE — API do rejestrowania testów siłowych (Max Strength Tests API)** — Endpointy do zapisu i odczytu parametrów siły maksymalnej zawodników sekcji męskiej i kobiecej.
2821. **FE — Formularz zgłaszania wniosków o ubezpieczenie indywidualne (Individual Insurance Form)** — Moduł pozwalający na przesyłanie niezbędnych dokumentów i zgód do rocznego ubezpieczenia sportowego zawodnika.
2822. **BE — API do obsługi ubezpieczeń indywidualnych (Individual Insurance Manager API)** — Endpointy w Rust generujące zestawienia dla ubezpieczyciela i kontrolujące terminy ważności polis.
2823. **FE — Płynne animacje w menu ustawień (Fluid Settings Menu Animations)** — Wykorzystanie biblioteki Framer Motion / GSAP w celu nadania wyjątkowej płynności ruchom menu ustawień profilu.
2824. **BE — Monitorowanie obciążenia bazy danych SQLite (SQLite WAL Defragmentation Worker)** — Worker sprawdzający stopień defragmentacji bazy danych SQLite i automatycznie wyzwalający proces VACUUM w godzinach nocnych.
2825. **FE — Formularz zgłaszania opinii o treningach (Training Feedback Survey UI)** — Anonimowa ankieta dla uczestników treningów Slavii, pozwalająca ocenić jakość prowadzenia zajęć i stan sprzętu.
2826. **BE — API do obsługi ankiet treningowych (Training Surveys API)** — Endpointy do zapisu anonimowych odpowiedzi z automatyczną agregacją wyników w panelu administratora.
2827. **FE — Wykres rozkładu tonażu na ćwiczenia olimpijskie (Olympic Volume Chart)** — Wykres słupkowy prezentujący obciążenie tonażowe w ćwiczeniach olimpijskich (rwanie i podrzut) w poszczególnych mikrocyklach.
2828. **BE — API do kalkulacji objętości olimpijskiej (Olympic Volume Calculator)** — Algorytm analizujący plan treningowy i weryfikujący zgodność z założeniami periodyzacji sportowej w podnoszeniu ciężarów.
2829. **FE — Formularz zgłaszania propozycji do galerii sławy (Hall of Fame Nomination Form)** — Moduł pozwalający na zgłaszanie wybitnych wyników sportowych w celu wpisania ich do wirtualnej galerii sławy klubu.
2830. **BE — API do weryfikacji nominacji do galerii sławy (Hall of Fame Nomination API)** — Endpointy w Rust dla zarządu klubu do zatwierdzania i weryfikacji poprawności zgłoszonych rekordów.
2831. **FE — Wykres postępu mobilności w ocenie fizjoterapeuty (Mobility Score Progression Chart)** — Wizualny wykres prezentujący punktową ocenę mobilności stawów biodrowych i barkowych wystawianą przez fizjoterapeutę.
2832. **BE — API do oceniania mobilności (Mobility Assessment API)** — Endpointy pozwalające fizjoterapeutom na ocenę zakresów ruchomości stawów zawodników.
2833. **FE — Formularz rezerwacji sprzętu do krioterapii (Cryo Equipment Rental Form)** — Panel pozwalający na rezerwację klubowych urządzeń do krioterapii miejscowej (np. po urazach).
2834. **BE — API do rezerwacji urządzeń krioterapeutycznych (Cryo Inventory API)** — System kontroli rezerwacji sprzętu do krioterapii, blokujący terminy w przypadku braku dostępnego sprzętu na stanie.
2835. **FE — Wykres tętna maksymalnego w bojach (Max Heart Rate Chart)** — Wykres liniowy prezentujący maksymalne wartości tętna zarejestrowane podczas serii maksymalnych (PR).

### Inicjatywy pozakodowe (Klub, trening i organizacja) — pomysły 2836–3000

2836. **ORG — Klubowy system motywacyjny "Gryf Miesiąca" (Barbell of the Month)** — Comiesięczna nagroda w postaci vouchera na suplementy dla zawodnika o najwyższej frekwencji i postępie Sinclaira.
2837. **ORG — Modernizacja nawierzchni sali (Rubber Platform Liners)** — Wymiana amortyzujących mat gumowych na pomostach treningowych na maty o zwiększonej gęstości, redukujące odbicie sztangi i hałas.
2838. **ORG — Cykl wykładów z historii podnoszenia ciężarów w Rudzie Śląskiej (Local Lifting History)** — Prelekcje i wystawy pamiątek dawnych mistrzów Slavii dla młodzieży i mieszkańców Śląska.
2839. **ORG — Strefa odpoczynku i integracji (Athlete Lounge Setup)** — Wyposażenie kącika z sofami, ekspresem do kawy, czasopismami branżowymi i telewizorem do analizy startów w grupie.
2840. **ORG — Klubowy dzień dziecka z podnoszeniem ciężarów (Kids Barbell Day)** — Gry i zabawy ogólnorozwojowe z elementami techniki dwuboju na wesoło (np. z użyciem lekkich plastikowych gryfów).
2841. **ORG — Zakup profesjonalnych stojaków na obciążenia (Mobile Plate Tree Racks)** — Mobilne stojaki na talerze treningowe przy każdym pomoście, ułatwiające utrzymanie porządku na sali.
2842. **ORG — Współpraca z psychologiem sportowym (Sport Psychologist Consultations)** — Regularne dyżury psychologa na sali, pomagającego zawodnikom w radzeniu sobie ze stresem startowym i presją wyniku.
2843. **ORG — Wewnętrzny turniej "Pierwszy Krok Slavia" (Rookie Club Tournament)** — Zawody z uproszczoną oceną techniczną dedykowane wyłącznie dla osób trenujących krócej niż 6 miesięcy.
2844. **ORG — Instalacja profesjonalnych tablic kredowych (PR Chalkboards)** — Zamontowanie tablic przy każdym pomoście do bieżącego zapisywania celów treningowych i aktualnych rekordów życiowych.
2845. **ORG — Badania diagnostyczne wad postawy (Postural Screenings)** — Bezpłatne, profilaktyczne badania kręgosłupa i stóp dla dzieci i młodzieży z lokalnych szkół podstawowych.
2846. **ORG — Zakup nowoczesnych pasów telemetrycznych (Heart Rate Monitors Kit)** — Zestaw pasów do pomiaru tętna do wypożyczenia przez zawodników na czas treningu o charakterze kondycyjnym.
2847. **ORG — Procedura dezynfekcji i konserwacji pasów (Belt Sanitation Routine)** — Regularne czyszczenie i odświeżanie skórzanych oraz neoprenowych pasów treningowych będących na wyposażeniu klubu.
2848. **ORG — Klubowe plecaki i torby sportowe (Official Slavia Backpacks)** — Produkcja i dystrybucja pojemnych, profesjonalnych plecaków z dedykowanymi przegrodami na buty startowe i pas.
2849. **ORG — Tablica chwały z autografami mistrzów (Champions Autograph Wall)** — Wydzielone miejsce na ścianie klubu, gdzie zawodnicy zdobywający medale Mistrzostw Polski mogą złożyć swój podpis.
2850. **ORG — Cykliczne seminaria z techniki przysiadów i ciągów (Squat and Pull Masterclasses)** — Otwarte, płatne szkolenia techniczne dla entuzjastów trójboju, crossfitu i kulturystyki z Rudy Śląskiej.
2851. **ORG — Współpraca z lekarzem medycyny sportowej (Sports Doctor Partnership)** — Szybka, dedykowana ścieżka badań okresowych dla zawodników Slavii w celu sprawnego wyrabiania licencji startowych.
2852. **ORG — Klubowy kalendarz ścienny (Annual Slavia Wall Calendar)** — Wydanie eleganckiego kalendarza ze zdjęciami kadry i terminami najważniejszych startów w sezonie.
2853. **ORG — Bezpłatne konsultacje fizjoterapeutyczne (Monthly Injury Clinics)** — Dedykowane godziny konsultacji dla zawodników odczuwających dolegliwości bólowe, połączone z zaleceniami rehabilitacyjnymi.
2854. **ORG — Wdrożenie standardów IWF w sędziowaniu (IWF Referee Standards Training)** — Szkolenie dla wewnętrznych sędziów z zakresu najnowszych interpretacji przepisów IWF (np. kontakt sztangi z udem).
2855. **ORG — Klubowa gablota z pucharami i medalami (Slavia Trophy Cabinet)** — Podświetlana, estetyczna witryna w strefie wejściowej, prezentująca historyczne i aktualne trofea sekcji.
2856. **ORG — Zakup stojaków pod sztangę z regulacją wysokości (Adjustable Squat Stands)** — Zastąpienie starych stojaków nowoczesnymi stojakami z precyzyjną, hydrauliczną regulacją wysokości gryfu.
2857. **ORG — Klubowa biblioteczka sportowa (Athlete Book Exchange)** — Półka z literaturą sportową, biomechaniką i biografiami wybitnych sztangistów dostępna dla wszystkich członków.
2858. **ORG — Program wolontariatu dla młodzieży (Youth Volunteer Program)** — Angażowanie młodszych zawodników w pomoc przy organizacji zawodów w celu budowania poczucia odpowiedzialności.
2859. **ORG — Szkolenie z bezpiecznego zrzucania ciężarów (Safe Barbell Dropping Seminar)** — Praktyczne zajęcia dla początkujących na temat bezpiecznej techniki puszania sztangi w rwaniu i podrzucie.
2860. **ORG — Tabliczki z nazwami pomostów (Platform Named Labels)** — Nazwanie pomostów treningowych imionami najwybitniejszych zawodników w historii klubu CKS Slavia.
2861. **ORG — Partnerstwo z lokalnym sklepem ze zdrową żywnością (Healthy Food Discounts)** — Dedykowane zniżki na zakupy zdrowej żywności, orzechów i suplementów dla członków klubu z legitymacją.
2862. **ORG — Dofinansowanie kursów trenerskich dla starszych zawodników (Coaching Course Scholarships)** — Program wsparcia dla zawodników kończących karierę startową, chcących rozwijać się jako trenerzy Slavii.
2863. **ORG — Wspólne wyjazdy na obozy zimowe (Winter Weightlifting Camp)** — Organizacja tygodniowego obozu w górach łączącego treningi siłowe z regeneracją i sportami zimowymi.
2864. **ORG — Audyt wibracji i tłumienia hałasu na sali (Noise and Vibration Safety Audit)** — Profesjonalne pomiary drgań i hałasu przy zrzucaniu sztang, wdrożenie dodatkowych mat wygłuszających.
2865. **ORG — Broszura "Pierwszy Start" (Rookie Competition Guidebook)** — Drukowany przewodnik dla debiutantów wyjaśniający procedury zawodów, zasady ważenia i podawania podejść.
2866. **ORG — Ekologiczna zbiórka zużytego sprzętu (Gear Recycling Drive)** — Zbiórka zużytych pasów, butów czy owijek w celu ich renowacji i przekazania najmłodszym adeptom.
2867. **ORG — Zakup profesjonalnych wałków i piłek do masażu (Mobility Tools Upgrade)** — Wyposażenie sali w kompletny zestaw rollerów, piłeczek lacrosse i gum oporowych do rozgrzewki i mobilizacji.
2868. **ORG — Badania składu ciała metodą bioimpedancji (BIA Body Composition Tests)** — Kwartalne pomiary poziomu tkanki tłuszczowej i masy mięśniowej dla zawodników kadry w celu optymalizacji diety.
2869. **ORG — Przygotowanie profesjonalnego stanowiska sędziowskiego (Official Referee Table Setup)** — Zakup estetycznych stolików sędziowskich z systemem sygnalizacji świetlnej (białe/czerwone światła).
2870. **ORG — Kolorowe oznaczenie twardości gryfów (Barbell Stiffness Color Rings)** — Zastosowanie silikonowych opasek na końcach gryfów ułatwiających identyfikację ich elastyczności.
2871. **ORG — Kącik dla rodzin zawodników (Family Waiting Area)** — Bezpieczne miejsce z krzesełkami i zabawkami dla dzieci, umożliwiające bliskim oczekiwanie na zakończenie treningu.
2872. **ORG — Zbiórki charytatywne pod szyldem Slavii (Charity Lifting Challenges)** — Organizacja zawodów tonażowych, z których dochód (np. 1 gr za każdy podniesiony kilogram) przeznaczany jest na cele charytatywne.
2873. **ORG — Obowiązkowy kurs pierwszej pomocy dla trenerów (CPR Certification for Coaches)** — Coroczne szkolenie z zakresu reanimacji i obsługi defibrylatora AED dla całej kadry szkoleniowej.
2874. **ORG — Modernizacja pojemników na magnezję (Dust-Free Chalk Boxes)** — Wymiana starych pojemników na specjalnie zaprojektowane skrzynie ograniczające pylenie magnezji na sali.
2875. **ORG — Regularna produkcja filmów promocyjnych (Slavia Media Content Production)** — Nagrywanie i montaż krótkich rolek i filmów z treningów w celu budowania wizerunku nowoczesnej sekcji.
2876. **ORG — Profesjonalny ścienny stojak na pasy (Gym Belt Organizer)** — Zamontowanie wieszaka ułatwiającego segregację i przechowywanie pasów ciężarowych według rozmiarów.
2877. **ORG — Warsztaty z techniki podrzutu dla zawodników crossfit (Clean & Jerk Masterclass)** — Płatne szkolenia techniczne stanowiące dodatkowe źródło finansowania działalności statutowej klubu.
2878. **ORG — Pakiet powitalny dla nowych członków (New Member Welcome Package)** — Wręczanie każdemu nowemu zawodnikowi koszulki klubowej, shakera i informatora o zasadach panujących na sali.
2879. **ORG — Pomiary elastyczności pomostów startowych (Platform Elasticity Audit)** — Regularna kontrola stanu technicznego pomostów w celu zapewnienia równego i bezpiecznego amortyzowania uderzeń.
2880. **ORG — Instalacja zewnętrznego baneru reklamowego (Outdoor Advertising Banner)** — Montaż wielkoformatowej reklamy na elewacji budynku, informującej o naborach do sekcji podnoszenia ciężarów.
2881. **ORG — Konkurs na projekt oficjalnego plakatu zawodów (Competition Poster Contest)** — Zaangażowanie młodzieży z rudzkich szkół artystycznych w projektowanie plakatów promujących klubowe turnieje.
2882. **ORG — Wdrożenie IWF-owskiego protokołu ważenia (IWF Weight Protocol)** — Wprowadzenie rygorystycznych procedur ważenia (zamknięte pomieszczenie, obecność sędziego) na zawodach wewnętrznych.
2883. **ORG — System nagradzania za pomoc w sprzątaniu (Clean Gym Points)** — Program motywacyjny dla najmłodszych grup, uczący dbania o porządek na pomoście po zakończonym treningu.
2884. **ORG — Stypendia na obozy letnie dla juniorów (Summer Camp Scholarships)** — Stworzenie funduszu wspierającego wyjazdy na obozy sportowe dla dzieci z rodzin w trudnej sytuacji materialnej.
2885. **ORG — Zakup kamery szerokokątnej do analizy techniki (Wide-Angle Technique Camera)** — Montaż stałej kamery nad głównym pomostem startowym, umożliwiającej precyzyjne nagrywanie prób z boku i z przodu.
2886. **ORG — Współpraca z psychodietetykiem sportowym (Sports Dietetics Consultations)** — Porady z zakresu relacji z jedzeniem, szczególnie istotne dla zawodników borykających się z ciągłym kontrolowaniem wagi startowej.
2887. **ORG — Tabliczki z zasadami savoir-vivre na siłowni (Gym Etiquette Signs)** — Estetyczne grafiki przypominające o odkładaniu ciężarów na miejsce, czyszczeniu gryfów z krwi/potu i szacunku do współćwiczących.
2888. **ORG — Zakup profesjonalnej szafki medycznej (Advanced First Aid Cabinet)** — Wyposażenie sali w kompletną, łatwo dostępną szafkę pierwszej pomocy z lodem w sprayu, opaskami uciskowymi i środkami dezynfekującymi.
2889. **ORG — Okresowe badania wytrzymałości pasów treningowych (Belt Safety Testing)** — Sprawdzanie szwów, klamer i zapięć pasów będących na wyposażeniu klubu w celu zapewnienia bezpieczeństwa.
2890. **ORG — Rodzinny piknik sportowo-rekreacyjny (Slavia Family Picnic)** — Organizacja letniego spotkania dla rodzin zawodników z łatwymi konkurencjami sprawnościowymi i grillem.
2891. **ORG — Szkolenie z social media dla kadry klubu (Social Media Training for Coaches)** — Warsztaty z robienia dobrych zdjęć, pisania angażujących postów i relacjonowania zawodów na żywo dla trenerów.
2892. **ORG — Zakup ścianki reklamowej do wywiadów (Official Press Backdrop)** — Ścianka z logotypami klubu i sponsorów do robienia zdjęć zawodnikom po dekoracjach medalowych.
2893. **ORG — Procedura okresowej kalibracji wag (Scale Calibration Schedule)** — Sprawdzanie dokładności wag klubowych za pomocą certyfikowanych odważników wzorcowych co 6 miesięcy.
2894. **ORG — Poradnik suplementacji sportowej dla juniorów (Junior Nutrition Guide)** — Opracowanie rzetelnego, opartego na badaniach kompendium wiedzy o suplementach (kreatyna, białko, witaminy) dla młodych zawodników.
2895. **ORG — Fizyczna skrzynka na pomysły na hali (Suggestion Box)** — Drewniana skrzynka na sali, do której zawodnicy mogą wrzucać anonimowe karteczki z pomysłami na usprawnienie działania klubu.
2896. **ORG — Zakup nowoczesnych gum oporowych do rozgrzewki (Resistance Bands Upgrade)** — Wyposażenie sali w komplet gum o różnych stopniach oporu do mobilizacji stawów biodrowych i barkowych.
2897. **ORG — Warsztaty z techniki podrzutu dla kobiet (Female Weightlifting Workshops)** — Specjalistyczne warsztaty nakierowane na popularyzację podnoszenia ciężarów wśród kobiet, prowadzone przez utytułowane zawodniczki klubu.
2898. **ORG — Program mentorski starszych zawodników dla młodzieży (Athlete Mentorship)** — Parowanie doświadczonych zawodników z sekcją młodszą w celu wsparcia technicznego, mentalnego i pomocy w adaptacji w klubie.
2899. **ORG — Kwartalny przegląd gumowych mat amortyzujących (Drop Zone Safety Audit)** — Kontrola stanu technicznego gumowych mat pod kątem pęknięć i zużycia materiału tłumiącego uderzenia sztangi.
2900. **ORG — Roczna gala podsumowania roku sportowego (Slavia Annual Gala)** — Eleganckie wydarzenie na koniec roku, podczas którego wręczane są statuetki dla najlepszych zawodników, podziękowania dla sponsorów i wolontariuszy.
2901. **ORG — Klubowy system wyróżnień "Technik Miesiąca" (Technical Mastery Award)** — Nagradzanie zawodnika, który w danym miesiącu wykazał się największą dbałością o poprawność techniczną wykonywanych bojów.
2902. **ORG — Zakup dedykowanych gryfów do rwania (Snatch Barbells Upgrade)** — Doposażenie sali w gryfy o zwiększonej sprężystości, dedykowane specjalnie do treningu rwania.
2903. **ORG — Program partnerski z lokalnymi fizjoterapeutami (Physio Referral Program)** — Zapewnienie zawodnikom klubu priorytetowych terminów i zniżek na zabiegi rehabilitacyjne u zaprzyjaźnionych specjalistów.
2904. **ORG — Szkolenie z zakresu przeciwdziałania kontuzjom kolan (Knee Injury Prevention Seminar)** — Warsztaty prowadzone przez fizjoterapeutę na temat wzmacniania więzadeł i prawidłowej biomechaniki przysiadu.
2905. **ORG — Klubowy system wypożyczania wałków (Foam Roller Loan System)** — Umożliwienie zawodnikom wypożyczania rollerów do domu w celu kontynuowania regeneracji po ciężkich mikrotaktach.
2906. **ORG — Zakup profesjonalnego stojaka na magnezję (Ergonomic Chalk Station)** — Mobilna, wysoka stacja magnezji zapobiegająca rozsypywaniu się proszku i ułatwiająca nanoszenie na dłonie.
2907. **ORG — Współpraca z lokalnymi dietetykami (Nutritionist Partnership)** — Zniżki dla członków klubu na indywidualne plany dietetyczne i analizy składu ciała.
2908. **ORG — Wewnętrzny turniej "Slavia Masters Cup" (Masters Club Tournament)** — Zawody dedykowane dla zawodników powyżej 35 roku życia z przelicznikiem Meltzer-Faber.
2909. **ORG — Instalacja tablicy z aktualnościami na korytarzu (Notice Board Upgrade)** — Nowoczesna, magnetyczna tablica informacyjna prezentująca bieżące komunikaty i listy startowe.
2910. **ORG — Badania wydolnościowe dla zawodników kadry (Cardiorespiratory Fitness Tests)** — Okresowe testy VO2max w celu monitorowania poziomu wydolności tlenowej i beztlenowej zawodników.
2911. **ORG — Zakup nowoczesnych pasów neoprenowych (Neoprene Lifting Belts)** — Doposażenie sali w lżejsze pasy neoprenowe, idealne do treningu ćwiczeń uzupełniających.
2912. **ORG — Procedura konserwacji zamków do sztangi (Barbell Collar Maintenance)** — Regularne czyszczenie i smarowanie zacisków sprężynowych oraz zacisków IWF w celu zapewnienia stabilności obciążenia.
2913. **ORG — Klubowa odzież casualowa (Official Slavia Streetwear)** — Zaprojektowanie i produkcja wysokiej jakości bluz, czapek i koszulek do noszenia na co dzień.
2914. **ORG — Tablica rekordów Śląska na ścianie (Silesian Records Board)** — Estetyczna tablica prezentująca aktualne rekordy Śląska w podnoszeniu ciężarów z wyróżnieniem zawodników Slavii.
2915. **ORG — Cykl wykładów z anatomii funkcjonalnej (Functional Anatomy Lectures)** — Szkolenie dla trenerów i zawodników na temat biomechaniki układu ruchu w podnoszeniu ciężarów.
2916. **ORG — Współpraca z lekarzem ortopedą (Orthopedic Specialist Partnership)** — Zapewnienie szybkiej diagnostyki obrazowej (USG, rezonans) dla zawodników w przypadku nagłych urazów.
2917. **ORG — Klubowy planer treningowy w formie papierowej (Slavia Paper Planner)** — Wydanie dedykowanego notesu do odręcznego zapisywania serii treningowych dla tradycjonalistów.
2918. **ORG — Warsztaty z rolowania i automasażu (Self-Myofascial Release Workshop)** — Praktyczne szkolenie z technik uwalniania powięziowego za pomocą rollerów i piłek.
2919. **ORG — Wdrożenie sędziowania na zawodach wewnętrznych (Official Referee Rules)** — Wprowadzenie obowiązku sędziowania prób przez licencjonowanych sędziów podczas ligi klubowej.
2920. **ORG — Klubowa gablota z pamiątkami historycznymi (Slavia History Cabinet)** — Prezentacja dawnych legitymacji, medali i wycinków prasowych z początków działalności CKS Slavia.
2921. **ORG — Zakup stojaków pod sztangę do martwego ciągu (Deadlift Jacks Upgrade)** — Ułatwienie nakładania i zdejmowania ciężarów poprzez zakup profesjonalnych podnośników do gryfów.
2922. **ORG — Klubowa wymiana sprzętu treningowego (Gear Swap Day)** — Cykliczne wydarzenie, podczas którego zawodnicy mogą wymienić się nieużywanymi butami, pasami czy koszulkami.
2923. **ORG — Program edukacyjny dla młodzieży szkolnej (Weightlifting Education in Schools)** — Lekcje wychowania fizycznego prowadzone przez trenerów Slavii w celu promocji dyscypliny.
2924. **ORG — Szkolenie z zakresu bezpiecznego podnoszenia ciężarów przez dzieci (Youth Safety Seminar)** — Warsztaty dla rodziców na temat wpływu treningu oporowego na rozwój kośćca dzieci.
2925. **ORG — Tabliczki z instrukcją obsługi stoperów (Timer Instruction Labels)** — Czytelne grafiki ułatwiające zawodnikom samodzielne konfigurowanie stoperów przerw na pomostach.
2926. **ORG — Partnerstwo z lokalną siłownią partnerską (Partner Gym Discounts)** — Możliwość bezpłatnego korzystania z sauny lub basenu w partnerskim obiekcie dla kadry klubu.
2927. **ORG — Dofinansowanie kursów sędziowskich dla starszych zawodników (Referee Course Scholarships)** — Program wsparcia dla osób chcących uzyskać licencję sędziego podnoszenia ciężarów.
2928. **ORG — Wspólne wyjazdy na zawody międzynarodowe (International Tournaments Trips)** — Organizowanie wyjazdów kibiców na Mistrzostwa Europy lub Świata w celu wspierania reprezentantów Polski.
2929. **ORG — Audyt poziomu natężenia oświetlenia na sali (Gym Lighting Safety Audit)** — Profesjonalne pomiary natężenia światła na pomostach w celu zapewnienia optymalnych warunków do treningu.
2930. **ORG — Przewodnik po przepisach antydopingowych (Anti-Doping Regulations Guide)** — Opracowanie broszury informującej o prawach i obowiązkach zawodnika podczas kontroli antydopingowej.
2931. **ORG — Ekologiczny program oszczędzania energii na sali (Green Gym Program)** — Wdrożenie zasad redukcji zużycia prądu (wyłączanie nieużywanego oświetlenia, klimatyzacji) w klubie.
2932. **ORG — Zakup profesjonalnych gum do rozciągania (Heavy Duty Mobility Bands)** — Doposażenie sali w grube gumy oporowe dedykowane do trakcji stawów biodrowych i barkowych.
2933. **ORG — Badania profilaktyczne kardiologiczne (Electrocardiogram Screenings)** — Bezpłatne badania EKG dla zawodników wyczynowych w celu wykluczenia ukrytych wad serca.
2934. **ORG — Przygotowanie profesjonalnego nagłośnienia zawodów (Official Sound System Setup)** — Zakup bezprzewodowych mikrofonów i głośników o dużej mocy do obsługi spikerskiej turniejów.
2935. **ORG — Kolorowe oznaczenie twardości gryfów startowych (Competition Barbell Rings)** — Zastosowanie złotych i srebrnych oznaczeń na gryfach przeznaczonych wyłącznie do oficjalnych startów.
2936. **ORG — Strefa kibica podczas zawodów wyjazdowych (Away Comp Fan Zone)** — Organizowanie wspólnego oglądania transmisji live z Mistrzostw Polski na dużym ekranie na hali.
2937. **ORG — Obowiązkowy kurs psychologii sportu dla trenerów (Psychology Course for Coaches)** — Szkolenie z zakresu motywowania zawodników, radzenia sobie z porażką i budowania pewności siebie.
2938. **ORG — Modernizacja stacji magnezji (Ergonomic Chalk Station Upgrade)** — Zakup profesjonalnych, wysokich misek na magnezję zapobiegających pyleniu proszku.
2939. **ORG — Regularne relacje live na social media (Slavia Live Streams)** — Transmitowanie na żywo treningów kadry i zawodów wewnętrznych w celu popularyzacji klubu.
2940. **ORG — Profesjonalny ścienny wieszak na owijki (Wrist Wraps Organizer)** — Zamontowanie ściennego stojaka ułatwiającego suszenie i przechowywanie owijek na nadgarstki.
2941. **ORG — Warsztaty z techniki rwania dla trójboistów (Snatch Masterclass for Powerlifters)** — Płatne szkolenia techniczne stanowiące dodatkowe źródło dochodu dla klubu.
2942. **ORG — Pakiet startowy dla juniorów (Youth Welcome Package)** — Wręczanie każdemu młodemu zawodnikowi bidonu, worka na buty i koszulki treningowej CKS Slavia.
2943. **ORG — Pomiary sprężystości pomostów rozgrzewkowych (Warm-up Platform Elasticity Audit)** — Regularna kontrola stanu technicznego pomostów w strefie rozgrzewkowej.
2944. **ORG — Instalacja zewnętrznego kasetonu podświetlanego (LED Logo Sign)** — Montaż podświetlanego logo klubu nad wejściem głównym na halę sportową.
2945. **ORG — Konkurs na najlepsze zdjęcie z treningu (Gym Photo Contest)** — Zaangażowanie społeczności klubowej w tworzenie materiałów promocyjnych (nagrody w postaci mercha).
2946. **ORG — Wdrożenie procedur IWF-owskiego ważenia (IWF Weight Protocol Implementation)** — Wymóg przeprowadzania oficjalnego ważenia na kalibrowanej wadze przed każdym turniejem klubowym.
2947. **ORG — System nagradzania za pomoc w konserwacji sprzętu (Barbell Care Points)** — Program motywacyjny dla zawodników dbających o czystość i stan techniczny gryfów.
2948. **ORG — Stypendia na obozy zimowe dla juniorów (Winter Camp Scholarships)** — Stworzenie funduszu wspierającego wyjazdy na obozy kondycyjne dla dzieci z rodzin o niskich dochodach.
2949. **ORG — Zakup kamery o wysokim klatkażu do analizy techniki (High-Speed Technique Camera)** — Zakup kamery nagrywającej w 240 kl./s w celu analizy fazy podrzutu klatka po klatce.
2950. **ORG — Współpraca z fizjoterapeutą dziecięcym (Pediatric Physiotherapy Partnership)** — Specjalistyczne konsultacje wad postawy dla najmłodszych grup treningowych.
2951. **ORG — Tabliczki z zasadami bezpieczeństwa przy asekuracji (Spotting Safety Signs)** — Czytelne grafiki przypominające o zasadach bezpiecznej asekuracji podczas przysiadów.
2952. **ORG — Zakup profesjonalnego defibrylatora AED (AED Defibrillator Upgrade)** — Wyposażenie hali w automatyczny defibrylator zewnętrzny z czytelnym oznaczeniem na ścianie.
2953. **ORG — Okresowe badania elastyczności pasów startowych (Competition Belt Safety Testing)** — Sprawdzanie stanu technicznego pasów IWF przed dopuszczeniem do startu w zawodach mistrzowskich.
2954. **ORG — Rodzinny turniej sprawnościowy (Slavia Family Games)** — Organizacja zawodów sprawnościowych (biegi, skoki, rzuty) dla zawodników i ich rodziców.
2955. **ORG — Szkolenie z social media dla zawodników kadry (Social Media Training for Athletes)** — Warsztaty z zakresu budowania marki osobistej i bezpiecznego korzystania z mediów społecznościowych.
2956. **ORG — Zakup tablicy reklamowej sponsorskiej (Sponsor Board Upgrade)** — Estetyczna tablica z logotypami sponsorów umieszczona w centralnym punkcie hali treningowej.
2957. **ORG — Procedura okresowej konserwacji pomostów (Platform Wood Maintenance)** — Regularne cyklinowanie i lakierowanie drewnianych części pomostów startowych.
2958. **ORG — Poradnik suplementacji sportowej dla kobiet (Female Supplement Guide)** — Opracowanie zaleceń suplementacyjnych dostosowanych do kobiecej fizjologii i potrzeb treningowych.
2959. **ORG — Skrzynka na zgłoszenia awarii sprzętu (Gear Repair Box)** — Drewniana skrzynka, do której zawodnicy mogą wrzucać zgłoszenia o pękniętych matach, uszkodzonych zamkach czy luźnych stojakach.
2960. **ORG — Zakup nowoczesnych gum oporowych do rozgrzewki (Warm-up Loops Upgrade)** — Wyposażenie sali w mniejsze gumy typu mini-band do aktywacji pośladków przed przysiadami.
2961. **ORG — Warsztaty z techniki podrzutu dla zawodników crossfit (Female Olympic Lifting Workshops)** — Płatne warsztaty dwuboju olimpijskiego dedykowane specjalnie dla kobiet trenujących crossfit.
2962. **ORG — Program mentorski starszych zawodników dla młodzieży (Senior-Junior Mentorship Program)** — Oficjalny system opieki doświadczonych zawodników nad młodymi adeptami rozpoczynającymi treningi.
2963. **ORG — Kwartalny przegląd gumowych mat amortyzujących (Drop Zone Safety Audits Program)** — Kwalifikowane audyty stanu nawierzchni amortyzującej w strefach zrzutu ciężarów.
2964. **ORG — Roczne podsumowanie sezonu sportowego (Slavia Annual Gala Dinner)** — Uroczysta kolacja dla zawodników, trenerów, działaczy i sponsorów podsumowująca osiągnięcia minionego roku.
2965. **ORG — Klubowy system wyróżnień "Kolega Miesiąca" (Sportsmanship Award)** — Nagradzanie zawodnika, który w danym miesiącu wykazał się największą pomocą i szacunkiem wobec innych na sali.
2966. **ORG — Zakup dedykowanych gryfów do podrzutu (Clean & Jerk Barbells Upgrade)** — Doposażenie sali w gryfy o zwiększonej twardości, idealne do dynamicznych powtórzeń w podrzucie.
2967. **ORG — Program partnerski z lokalnymi saunami (Sauna Referral Program)** — Zapewnienie zawodnikom priorytetowych terminów i zniżek na seanse saunowe w zaprzyjaźnionych obiektach.
2968. **ORG — Szkolenie z zakresu przeciwdziałania kontuzjom barków (Shoulder Injury Prevention Seminar)** — Warsztaty prowadzone przez fizjoterapeutę na temat wzmacniania stożka rotatorów i mobilności obręczy barkowej.
2969. **ORG — Klubowy system wypożyczania gum (Mobility Bands Loan System)** — Umożliwienie zawodnikom wypożyczania gum oporowych do domu w celu rozgrzewki przedtreningowej.
2970. **ORG — Zakup profesjonalnego stojaka na magnezję (Mobile Chalk Station Upgrade)** — Mobilna miska magnezji na kółkach zapobiegająca rozsypywaniu się proszku po całej sali.
2971. **ORG — Współpraca z lokalnymi dietetykami klinicznymi (Clinical Dietitian Partnership)** — Zniżki dla członków klubu na konsultacje dietetyczne i badania nietolerancji pokarmowych.
2972. **ORG — Wewnętrzny turniej "Slavia Youth Cup" (Youth Club Tournament)** — Zawody dedykowane dla dzieci poniżej 15 roku życia z uproszczoną punktacją techniczną.
2973. **ORG — Instalacja tablicy z aktualnościami na hali (Gym Notice Board Upgrade)** — Nowoczesna gablota informacyjna prezentująca bieżące komunikaty i rekordy klubu.
2974. **ORG — Badania wydolnościowe dla zawodników sekcji Masters (Masters VO2max Tests)** — Okresowe testy sprawnościowe w celu monitorowania zdrowia kardiologicznego starszych zawodników.
2975. **ORG — Zakup nowoczesnych pasów skórzanych (Premium Leather Lifting Belts)** — Doposażenie sali w grube, skórzane pasy trójbojowe i ciężarowe z klamrą szybkiego zapinania.
2976. **ORG — Procedura konserwacji gryfów startowych (Competition Barbell Maintenance)** — Regularne czyszczenie i oliwienie gryfów startowych w celu przedłużenia ich żywotności.
2977. **ORG — Klubowa odzież sportowa dla kobiet (Official Slavia Female Activewear)** — Zaprojektowanie i produkcja profesjonalnych legginsów, topów i spodenek treningowych.
2978. **ORG — Tablica rekordów Polski na ścianie (National Records Board)** — Estetyczna tablica prezentująca aktualne rekordy Polski w dwuboju z wyróżnieniem zawodników CKS Slavia.
2979. **ORG — Cykl wykładów z teorii treningu sportowego (Principles of Strength Training)** — Szkolenie dla zawodników na temat planowania obciążeń i periodyzacji treningowej.
2980. **ORG — Współpraca z lekarzem neurologiem (Neurological Specialist Partnership)** — Zapewnienie szybkiej diagnostyki w przypadku bólów kręgosłupa czy drętwienia kończyn u zawodników.
2981. **ORG — Klubowy dziennik treningowy w formie aplikacji (Slavia Digital Planner)** — Wdrożenie dedykowanego systemu planowania i zapisu treningów dla wszystkich grup ćwiczących.
2982. **ORG — Warsztaty z technik rozciągania powięziowego (Fascial Stretching Workshop)** — Praktyczne szkolenie z zaawansowanych technik zwiększania elastyczności mięśni i powięzi.
2983. **ORG — Wdrożenie sędziowania elektronicznego na zawodach (Electronic Referee System)** — Zakup tabletów sędziowskich i oprogramowania do automatycznego zliczania głosów sędziów.
2984. **ORG — Klubowa gablota z pucharami weteranów (Masters Trophy Cabinet)** — Prezentacja pucharów i medali zdobytych przez sekcję weteranów CKS Slavia.
2985. **ORG — Zakup stojaków pod sztangę do przysiadów ze sztangą z tyłu (Back Squat Stands)** — Zastąpienie starych stojaków stabilnymi stojakami z regulacją szerokości rozstawu.
2986. **ORG — Klubowy system wymiany książek (Book Club Exchange)** — Półka z książkami o tematyce sportowej, psychologii i rozwoju osobistym w strefie odpoczynku.
2987. **ORG — Program edukacyjny dla młodzieży licealnej (Weightlifting Education in High Schools)** — Pokazy techniki dwuboju i prelekcje o korzyściach płynących ze sportów siłowych w szkołach średnich.
2988. **ORG — Szkolenie z zakresu bezpiecznego treningu siłowego seniorów (Masters Strength Seminar)** — Warsztaty dla starszych osób na temat profilaktyki osteoporozy i wzmacniania mięśni głębokich.
2989. **ORG — Tabliczki z instrukcją obsługi stoperów (Gym Timer Instruction Labels)** — Czytelne instrukcje konfigurowania interwałowych stoperów treningowych na pomostach.
2990. **ORG — Partnerstwo z lokalną siłownią partnerską (Partner Gym Sauna Discounts)** — Możliwość korzystania z sauny i odnowy biologicznej w partnerskim klubie fitness na preferencyjnych warunkach.
2991. **ORG — Dofinansowanie kursów trenerskich dla weteranów (Masters Coaching Scholarships)** — Program wsparcia dla starszych zawodników chcących uzyskać uprawnienia instruktorskie.
2992. **ORG — Wspólne wyjazdy na zawody ligowe (League Competition Supporters Trip)** — Organizowanie transportu dla kibiców na starty drużynowe Slavii w Ekstralidze podnoszenia ciężarów.
2993. **ORG — Audyt poziomu natężenia oświetlenia na pomoście startowym (Competition Lighting Safety Audit)** — Pomiary oświetlenia w celu zapewnienia optymalnych warunków dla sędziów i zawodników podczas turniejów.
2994. **ORG — Przewodnik po substancjach zabronionych (Prohibited List Pocket Guide)** — Opracowanie kieszonkowej wersji listy zabronionych substancji POLADA/WADA dla zawodników klubu.
2995. **ORG — Ekologiczny program recyklingu wody (Green Gym Water Saving)** — Instalacja perlatorów w kranach i prysznicach w celu ograniczenia zużycia wody na hali.
2996. **ORG — Zakup profesjonalnych gum oporowych do trakcji stawów (Joint Traction Bands)** — Doposażenie sali w grube gumy dedykowane do mobilizacji stawu skokowego i biodrowego.
2997. **ORG — Badania profilaktyczne kardiologiczne (Masters Electrocardiogram Screenings)** — Bezpłatne badania EKG dla zawodników powyżej 35 roku życia przed startem w sezonie weteranów.
2998. **ORG — Przygotowanie profesjonalnego nagłośnienia hali (Gym Sound System Setup)** — Montaż głośników ściennych w celu odtwarzania dynamicznej muzyki treningowej na całej hali.
2999. **ORG — Kolorowe oznaczenie twardości gryfów treningowych (Training Barbell Rings)** — Zastosowanie kolorowych pierścieni na końcach gryfów ułatwiających ich segregację na stojakach.
3000. **ORG — Jubileuszowa gala podsumowania stulecia klubu (Slavia Centenary Sports Gala)** — Uroczyste wydarzenie celebrujące 100-lecie powstania sekcji ciężarowej CKS Slavia z wręczeniem odznaczeń państwowych i klubowych dla zasłużonych.

---

*Ten plik służy do planowania; nie wiąże się automatycznie z backlogiem ani commitami. Aktualizuj po większych zmianach w produkcie.*
