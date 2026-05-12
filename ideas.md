# Slavia — pomysły na rozwój (frontend + ekosystem)

Zbiór propozycji po przeglądzie kodu (`Slavia-frontend`, typy tras z `api.ts`, narzędzia eksperymentalne, backend w repozytorium Rust). Kolejność i realizacja według Waszej kadry. Numery są **jednolite w całym pliku**, żeby łatwo się na nie powoływać.

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
21. **Powiązanie wpisu konkursowego ze zgłoszeniem** — przy pending flow — czytelny status w timeline zawodnika (`/api/results/…`, submissions).
22. **Kalkulator Sinclair** (`/kalkulator-sinclair`) — przyciski „wpisz jako scenariusz rankingowy” przy edycji wyniku (tylko podgląd, bez auto-zapisu jeśli to ryzykowne prawnie).

---

## Kalendarz, obecności, integracje

23. **Eksport wydarzenia do kalendarza** — ICS dla pojedynczego zawodów oraz — jeśli sensownie — dla serii jednostek treningowych.
24. **Check-in QR / kiosk** — skrót for trenera na jednostce: kod na telefon prowadzącego → zawodnik skanuje i zapisuje obecność (wymaga decyzji czy bez logowania, czy tylko zalogowany Athlete).

---

## Czat, powiadomienia, aktualności

25. **Wyszukiwarka po treści czatu** — po stronie wątku (filtrowanie lokalnie załadowanych wiadomości lub endpoint z zapytaniem, jeśli backend rozszerzony).
26. **Szablony komunikatów powtarzalnych** — dla kadry („przypominam składki do 10.”) wklejana do czatu lub powiadomień klubowych.
27. **Changelog przyjazny użytkownikowi** — krótka struktura „dla zawodnika / trenera” (`/admin/changelog` lub publiczny fragment strony www).

---

## Wydajność i dostępność frontendu

28. **Dalszy podział kodu przy analizie sztangi** — już jest `defineAsyncComponent` dla `BarbellPathAnalyzer`; rozważyć osobny chunk dla `@tensorflow/tfjs` + modeli i dokument „pierwsze pobranie ~X MB”.
29. **Przegląd `routeRules`** — ISR/SWR wyłączone przy trasach chronionych (już dobrze opisane w `nuxt.config`); cykliczny audyt nowych tras `noindex`.
30. **Obrazy LCP na stronie głównej i galerii** — jawne rozmiary, `loading="lazy"` tam gdzie nie above-the-fold; opcjonalnie integracja ze zewnętrznym CDN obrazów.
31. **Core Web Vitals** — prostą stronę superadmin/developer lub CI krok Lighthouse (tylko na `/`, `/logowanie` publicznych) jako regresyjny smoke.

---

## Backend, dane, DevEx

32. **Indeksy pod listy** — m.in. `(athlete_id, status, …)` dla wyników i płatności miesiąc/status; potwierdzenie przez `EXPLAIN QUERY PLAN`.
33. **Idempotencja schedulerów** — jawny constraint lub jednoznaczny „UPSERT” przy auto-składce (`standing_order`), metryki w logach („ile pominięto duplikatów”).
34. **Kontrakt API** — OpenAPI z Axum (lub utrzymywane ręcznie) → generacja typów TypeScript w CI (`PaymentStatusResponse` itd.).
35. **E2E krytycznych ścieżek** — Playwright: logowanie, zgłoszenie składki, przegląd profilu; rozszerzenie o 2FA i batch approve gdy są już w UI.
36. **Rate limiting** — domknięcie na kolejnych POST (zagłoszenia, upload, masa operacji kadry) dokumentowane przy endpointach.

---

## Bezpieczeństwo i zgodność

37. **Eksport danych na żądanie** — uproszczony self-service dla użytkownika (zakres: profil + składki + komunikacja), spójny z `docs/polityka-retencji-danych.md`.
38. **Audit log dla admina** — czytelna lista z `/api/system/audit-logs` z filtrami (aktor, typ, data) bez wchodzenia tylko w dev tools.

---

## Aplikacja mobilna i spójność kanałów

39. **Parzystość ze stroną www** — ten sam semantyczny model składki (`has_standing_order`, `is_paid`, komunikaty), żeby uniknąć zgłoszeń „w apce inaczej niż na web”.
40. **Offline-first przy obecnościach** — kolejka zapisu przy braku sieci i synchronizacja po powrocie (jeśli mobile ma moduł obecności).

---

## Inne warto rozważyć

41. **Plany treningowe vs dziennik** — automatyczny podgląd „co było zaplanowane vs co wpisano” w jednym widoku dla trenera.
42. **Regeneracja** — agregaty tygodniowe / alerty przy zaniżonym śnie kilka dni z rzędu (etycznie jako sugestie, bez „karać” UI).
43. **Import zawodników** (`/superadmin/import`) — rozszerzenie o walidację duplikatów imion + raport częściowego powodzenia linia po linii.
44. **Międzynarodowy język UI** — i18n (Nuxt `i18n`) na start EN dla publicznego www, PL pozostaje domyślne dla kadry — decyzja produktowa.
45. **Powtarzalne zestawienia KPI klubu** — miesięczny e-mail/podsumowanie (frekwencja, składki pending, aktywni vs nieaktywni) generowane z istniejących endpointów.

---

## Sekcja 46–70

46. **Porównanie A/B toru sztangi** — tryb side-by-side lub nałożenie dwóch analiz (np. rekord życiowy vs ostatnie podejście) z automatyczną synchronizacją momentu startu (przekroczenie progu $v_y$).
47. **IndexedDB dla analiz wideo** — zapisywanie samych metryk i miniatur analiz lokalnie w przeglądarce, aby zawodnik miał dostęp do historii swoich „torów” bez przesyłania plików na serwer.
48. **Eksport toru jako „Story/Post”** — generator grafiki/krótkiego klipu z naniesioną trajektorią i kluczowymi statystykami (V-max, wychylenie w poziomie) gotowy do udostępnienia w mediach społecznościowych.
49. **Integracja Sinclair w formularzu wyników** — przycisk „Oblicz i wstaw” w formularzu zgłaszania wyniku; automatyczne pobranie wagi z profilu i przeliczenie punktów Sinclair na żywo.
50. **Walidacja PB (Personal Best)** — ostrzeżenie (soft-block) przy próbie zgłoszenia wyniku nierealistycznie wyższego (np. o 30%) od obecnego rekordu życiowego zapisanego w systemie.
51. **[ZAKOŃCZONE] Audit Log UI dla Superadmina** — dedykowany widok w panelu administracyjnym Nuxt dla `/api/system/audit-logs` — kto, co i kiedy zmienił. Wyświetla przyjazne nazwy użytkowników zamiast UUID.
52. **Saldo i automatyczne przypomnienia** — widget z bieżącym stanem konta zawodnika w dashboardzie i automatyczne powiadomienie push/e-mail 8. dnia miesiąca dla osób z zaległościami.
53. **Generowanie kontraktu API (OpenAPI)** — wdrożenie `utoipa` po stronie Rusta, aby automatycznie generować typy TypeScript i unikać błędów synchronizacji modeli danych między frontendem a backendem.
54. **Idempotentne składki (Database level)** — unikalny constraint na parze `athlete_id + period` w tabeli płatności, zapobiegający duplikatom przy błędach sieciowych lub wielokrotnym uruchomieniu schedulera.
55. **[ZAKOŃCZONE] System osiągnięć (Badges)** — wirtualne odznaki za staż, frekwencję oraz kamienie milowe Sinclaira i wyniki w bojach. Zawiera interaktywny modal z listą poziomów.
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
66. **Grupowe wyzwania (Community Challenges)** — grywalizacja dla całej społeczności, np. „Total Tonnage Challenge” — kto w danym miesiącu przerzuci łącznie najwięcej ton na treningach.
67. **Szybkie ankiety po-treningowe (RPE)** — wyskakujący widżet po zakończeniu sesji: „Jak oceniasz trudność (1–10)?” oraz „Czy odczuwasz ból?”, dla lepszej kontroli obciążeń przez trenera.
68. **Raporty dla Związku (PZPC)** — automatyczne generowanie dokumentacji, zestawień wyników i licencji w formatach wymaganych przez krajowy związek podnoszenia ciężarów.
69. **Tryb „Competition Mode” (High Contrast)** — specjalny motyw graficzny o bardzo wysokim kontraście, zoptymalizowany pod ekrany mobilne używane w ostrym świetle na pomostach zewnętrznych.
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
103. **System Głosowań Klubowych** — demokratyczne ankiety dla członków klubu w sprawach organizacyjnych (np. wybór nowego sprzętu czy miejsca integracji).
104. **Athlete Resume / Media Kit** — automatycznie generowany profil publiczny dla zawodników kadry (osiągnięcia, trendy PB, Sinclair) do wysyłki dla sponsorów.
105. **Wirtualne Zawody Międzyklubowe** — współdzielona tablica wyników z innymi klubami korzystającymi z platformy Slavia w celu zdalnej rywalizacji.
106. **Barbell Acceleration Profile** — szczegółowy wykres przyspieszenia sztangi w poszczególnych fazach ciągu i podrzutu (identyfikacja martwych punktów).
107. **QR Equipment Guide** — skanowanie kodu QR na maszynie lub gryfie, aby zobaczyć jego historię, wagę oraz wideo z instrukcją techniczną.
108. **Automatyczne Podsumowanie Roku (Slavia Wrapped)** — generowana na koniec roku interaktywna statystyka dla każdego zawodnika (łączny tonaż, liczba PR-ów, frekwencja).
109. **Multi-library Barbell Lab (Superadmin)** — [W REALIZACJI] Zaawansowany poligon do porównywania MediaPipe, TF.js i OpenCV w warunkach rzeczywistych.
110. **Auto-Calibration OpenCV** — automatyczne skalowanie pikseli na metry poprzez wykrywanie standardowej średnicy talerza (450mm) bez udziału użytkownika.

---

## Aplikacja mobilna (Flutter) — pomysły rozszerzeń (111–210)

111. **Widget iOS / Android z najbliższym startem** — data, miasto, kategoria z `Moje starty` bez otwierania apki.
112. **Skróty Siri / Asystent Google** — „pokaż moje treningi w Slavia”, „otwórz czat z trenerem”.
113. **Live Activities (iOS)** — odliczanie do ważenia lub rozpoczęcia zawodów z kalendarza.
114. **Tiles Wear OS** — skrót do dziennika treningów lub listy powiadomień na zegarku.
115. **Pełna parzystość motywów z WWW** — te same presety i tryb jasny/ciemny co `profil` na stronie.
116. **Deep linki uniwersalne** — `https://…/athlete/…` otwiera profil w aplikacji, jeśli zainstalowana (Android App Links / iOS Universal Links).
117. **Udostępnianie wyniku jako grafika** — PNG z totalem i Sinclarem do Stories (jak pomysły www, ale natywny share sheet).
118. **Tryb „trening” (Focus / DND)** — jednym przyciskiem wyciszenie powiadomień poza alarmami i czatem klubowym.
119. **Lokalne szkice wpisów dziennika** — zapis offline przed synchronizacją przy słabej sieci na sali.
120. **Kolejka żądań offline** — ponawianie nieudanych PATCH/POST przy odzyskaniu sieci (obecności, dziennik).
121. **Biometryczne odblokowanie** — Face ID / odcisk po wygaśnięciu sesji zamiast ponownego hasła przy każdym powrocie.
122. **PIN klubowy** — szybkie logowanie dla współdzielonego tabletu rodzinnego (dziecko zawodnika).
123. **Tryb kontrastu i rozmiaru czcionki** — osobno od systemu, dla treningu w pełnym słońcu.
124. **Wibracje i dźwięki UX** — konfigurowalne: wyłączenie haptyki przy każdym tapie.
125. **Zdjęcie z aparatu → załącznik do czatu** — kompresja i limit rozmiaru przed wysłaniem.
126. **Nagrywanie notatek głosowych** — plik audio do wątku z trenerem (jeśli backend/dysk pozwoli).
127. **Podgląd PDF z zawodów** — wbudowany viewer dla regulaminów z linków w ogłoszeniach.
128. **Mapy i nawigacja** — otwarcie miejsca zawodów w Google Maps / Apple Maps z karty startu.
129. **Dodawanie startu do kalendarza urządzenia** — eksport ICS z ekranu szczegółów zawodów.
130. **Powiadomienia grupowane po typie** — „Slavia: czat”, „Slavia: klub” dla mniejszego szumu.
131. **Ciche godziny powiadomień push** — nie budzić po 22:00 oprócz wiadomości oznaczonych pilnymi.
132. **Badge z liczbą nieprzeczytanych** — synchronizacja z API powiadomień i czatu.
133. **Szybki filtr zawodników** — po kategorii wagowej, płci, roku — rozszerzenie listy kadry.
134. **Porównanie dwóch zawodników (mobile)** — uproszczony widok jak `/zawodnicy/porównanie` na małym ekranie.
135. **Eksport listy startowej do CSV** — z ekranu przydziału zawodów (trener).
136. **Skan QR z zaproszenia** — jeśli klub generuje kody do wydarzeń lub profili.
137. **Tryb „gość” na demonstracji** — demo bez logowania z mockowanymi danymi na targach.
138. **Język aplikacji** — i18n: PL domyślnie, EN dla zawodników dwujęzycznych.
139. **Duży przycisk „Zgłoś problem”** — zbiera wersję apki, model telefonu, ostatni błąd sieci (bez danych medycznych).
140. **Log diagnostyczny (opcjonalny)** — eksport dla devów po zgodzie użytkownika.
141. **Bezpieczne wylogowanie ze wszystkich urządzeń** — jeśli backend udostępni endpoint revokacji tokenów.
142. **Tryb oszczędzania danych** — mniejsze obrazy awatarów, wyłączone autopodglądy wideo w czacie.
143. **Automatyczne czyszczenie cache obrazów** — limit MB dla urządzeń z małą pamięcią.
144. **Android split APK / App Bundle** — optymalizacja rozmiaru pobrania per ABI (już częściowo przez Flutter).
145. **Obsługa foldables** — układ dwukolumnowy na tablecie / składanym telefonie dla listy + szczegółów.
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
158. **Status „online” w czacie** — jeśli backend wyśle presence (bez naruszania prywatności — wyłączalne).
159. **Reakcje na wiadomości** — emoji potwierdzenia jak w Messengerze (wymaga API).
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
185. **Szyfrowanie lokalnej bazy** — jeśli kiedyś przechowywane będą dane wrażliwe offline.
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
199. **Flutter isolates dla ciężkich kalkulacji** — proporcje / Sinclair bez blokowania UI przy dużych zbiorach.
200. **Crashlytics / Sentry** — produkcyjne zbieranie wyjątków z wersją builda.
201. **Feature flags z backendu** — włączanie eksperymentalnych ekranów bez nowego APK.
202. **Minimum SDK policy** — dokument: wspierane wersje Android/iOS vs funkcje (np. Live Activities).
203. **Polityka prywatności in-app** — link do dokumentu klubu i zgody na analitykę.
204. **Edukacja RODO** — krótki modal przy pierwszym logowaniu o celach przetwarzania.
205. **Szczegóły sesji sieciowej** — dev menu: czas odpowiedzi API (tylko build debug).
206. **Automatyczne logowanie po resetcie hasła** — deep link z maila do ustawienia hasła w WebView lub przeglądarce.
207. **Obsługa split-screen Android** — resize bez crashy przy obracaniu i zmianie szerokości.
208. **Testy integracyjne login flow** — `integration_test` na emulatorze CI.
209. **Szablon issue GitHub** — „Mobile bug” z polami: wersja, urządzenie, krok reprodukcji.
210. **Roadmapa publiczna** — synchronizacja wybranych numerów z tego pliku z changelogiem apki w sklepie.

---

*Ten plik służy do planowania; nie wiąże się automatycznie z backlogiem ani commitami. Aktualizuj po większych zmianach w produkcie.*
