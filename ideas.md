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
24. **Check-in QR / kiosk** — skrót dla trenera na jednostce: kod na telefon prowadzącego → zawodnik skanuje i zapisuje obecność (wymaga decyzji czy bez logowania, czy tylko zalogowany Athlete).

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

*Ten plik służy do planowania; nie wiąże się automatycznie z backlogiem ani commitami. Aktualizuj po większych zmianach w produkcie (np. nowy moduł API).*
