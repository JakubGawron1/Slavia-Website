1. Introduction

Dokument zawiera pełną listę pomysłów rozwojowych dla ekosystemu Slavia (WWW + Mobile + Backend + AI). Zawiera priorytety (P1/P2/P3), złożoność (S/M/L), opis funkcji, propozycję implementacji, ryzyka, sekcję „Delivered” (wdrożone) oraz roadmapę 2026–2027.

2. Delivered Features (Archive)

✔️ Audit Log UI✔️ Sinclair Calculator✔️ Competition Mode (High Contrast)✔️ Monthly KPI Dashboard✔️ Club Votes✔️ Athlete Resume / Media Kit✔️ Slavia Wrapped✔️ ICS Export (Athlete Calendar)✔️ OpenAPI generation✔️ Idempotent payments✔️ Badges System✔️ Quick Actions (mobile)✔️ Logout-all✔️ Bug report template (mobile)✔️ Challenges MVP✔️ Plan vs Journal comparison✔️ Public athlete profile (share mode)✔️ Developer tools (SEO, CWV, route rules)

3. Core UX & Platform

3.1 User Onboarding

Priorytet: P1Złożoność: MOpis: Pierwsze logowanie prowadzi użytkownika przez konfigurację profilu, wybór roli i pierwszy moduł.Implementacja: Nuxt wizard + backend flag.Ryzyka: pominięcie przez użytkownika.

3.2 Global Search

Priorytet: P1Złożoność: MOpis: Jedna wyszukiwarka dla zawodników, wydarzeń, aktualności, czatu.Implementacja: Unified endpoint + ACL.Ryzyka: wydajność.

3.3 Public Athlete Profile (SEO)

Priorytet: P2Złożoność: MOpis: Publiczny profil z JSON-LD, og:image, statystykami.Implementacja: Dynamic OG image.Ryzyka: prywatność.

3.4 Form State Persistence

Priorytet: P3Złożoność: SOpis: Powrót do ostatniego pola w formularzu.Implementacja: localStorage.Ryzyka: edge cases.

4. Barbell Lab & AI

4.1 Barbell Path A/B Comparison

Priorytet: P1Złożoność: LOpis: Porównanie dwóch nagrań side-by-side lub overlay.Implementacja: Dwa canvasy + synchronizacja.Ryzyka: wydajność.

4.2 Export (PNG/MP4)

Priorytet: P2Złożoność: MOpis: Eksport trajektorii + metryk jako grafika lub klip.Implementacja: Canvas + WebCodecs.Ryzyka: Safari.

4.3 Local Sessions (IndexedDB)

Priorytet: P2Złożoność: MOpis: Lokalna historia analiz bez backendu.Implementacja: IndexedDB.Ryzyka: limit pamięci.

4.4 Phase Segmentation

Priorytet: P3Złożoność: LOpis: Automatyczne wykrywanie faz boju.Implementacja: Analiza prędkości.Ryzyka: jakość nagrań.

4.5 Privacy Mode (Face Blur)

Priorytet: P2Złożoność: MOpis: Rozmycie twarzy przed eksportem.Implementacja: Face Detection + Canvas.Ryzyka: false negatives.

4.6 Auto-Calibration (Plates Detection)

Priorytet: P3Złożoność: LOpis: Wykrywanie średnicy talerza → skala pikseli.Implementacja: OpenCV.Ryzyka: oświetlenie.

5. Payments & Finance

5.1 Standing Order Timeline

Priorytet: P2Złożoność: SOpis: Historia automatycznych składek.Implementacja: Timeline + DTO.Ryzyka: korekty.

5.2 Balance Widget

Priorytet: P1Złożoność: MOpis: Saldo zawodnika + nadpłaty.Implementacja: Backend agregaty.Ryzyka: księgowość.

5.3 Auto Reminders

Priorytet: P2Złożoność: SOpis: Powiadomienia 8–10 dnia miesiąca.Implementacja: Scheduler.Ryzyka: spam.

5.4 Automatic Invoices (PDF)

Priorytet: P3Złożoność: MOpis: Generowanie potwierdzeń opłaty.Implementacja: PDFKit.Ryzyka: zgodność prawna.

6. Results & Competitions

6.1 Soft Validation

Priorytet: P1Złożoność: SOpis: Ostrzeżenia przy nietypowych wynikach.Implementacja: Heurystyki.Ryzyka: false positives.

6.2 PB Validation

Priorytet: P2Złożoność: SOpis: Ostrzeżenie przy wyniku >30% PB.Implementacja: Porównanie rekordów.Ryzyka: juniorzy.

6.3 Live Scoreboard

Priorytet: P3Złożoność: LOpis: Publiczny widok zawodów na żywo.Implementacja: WebSockets.Ryzyka: stabilność.

7. Calendar & Attendance

7.1 QR Check-in

Priorytet: P1Złożoność: MOpis: Trener generuje QR → zawodnik skanuje → obecność.Implementacja: Token + scanner.Ryzyka: nadużycia.

7.2 Offline Attendance (Mobile)

Priorytet: P2Złożoność: MOpis: Kolejka zapisów przy braku sieci.Implementacja: Local queue.Ryzyka: konflikty.

8. Communication & Community

8.1 Chat Search

Priorytet: P2Złożoność: MOpis: Wyszukiwanie po treści wiadomości.Implementacja: Local filtering lub backend index.Ryzyka: prywatność.

8.2 Message Templates

Priorytet: P3Złożoność: SOpis: Szybkie wklejki dla trenerów.Implementacja: Local presets.Ryzyka: niskie.

8.3 Reactions & Presence

Priorytet: P3Złożoność: MOpis: Emoji + status online.Implementacja: WebSockets.Ryzyka: prywatność.

9. Performance & DevEx

9.1 TensorFlow Chunk Splitting

Priorytet: P2Złożoność: MOpis: Oddzielny chunk dla TF.js i modeli.Implementacja: Nuxt build config.Ryzyka: cache.

9.2 Indexes for Lists

Priorytet: P1Złożoność: SOpis: Indeksy pod wyniki, płatności, obecności.Implementacja: SQL migrations.Ryzyka: brak.

9.3 E2E Tests

Priorytet: P2Złożoność: MOpis: Playwright: logowanie, składki, profil.Implementacja: CI pipeline.Ryzyka: flaky tests.

10. Security & Compliance

10.1 Data Export

Priorytet: P2Złożoność: MOpis: Self-service eksport danych użytkownika.Implementacja: ZIP: profil + płatności + komunikacja.Ryzyka: RODO.

11. Mobile (Flutter)

11.1 Live Activities (iOS)

Priorytet: P3Złożoność: MOpis: Odliczanie do startu / ważenia.Implementacja: ActivityKit.Ryzyka: iOS.

11.2 Offline Journal

Priorytet: P2Złożoność: MOpis: Lokalne szkice wpisów.Implementacja: Isar/Hive.Ryzyka: konflikty.

11.3 Biometric Unlock

Priorytet: P2Złożoność: SOpis: FaceID/TouchID po wygaśnięciu sesji.Implementacja: local_auth.Ryzyka: urządzenia.

12. Sport-Tech 2.0 / AI / Recovery

12.1 VBT Lite

Priorytet: P1Złożoność: LOpis: Pomiar prędkości sztangi z wideo.Implementacja: Optical flow + MoveNet.Ryzyka: FPS.

12.2 Recovery Insights

Priorytet: P2Złożoność: MOpis: Analiza snu, RPE, objętości.Implementacja: HealthKit/Google Fit.Ryzyka: prywatność.

12.3 Weak Link Analysis

Priorytet: P3Złożoność: LOpis: Statystyczne wskazanie najsłabszego ćwiczenia.Implementacja: Regresja.Ryzyka: małe próbki.

13. New Ideas 2026+

13.1 3D Barbell Reconstruction

Priorytet: P3Złożoność: LOpis: Rekonstrukcja 3D toru z dwóch kamer.Implementacja: Triangulacja.Ryzyka: trudne.

13.2 Injury Radar (Predictive AI)

Priorytet: P3Złożoność: LOpis: Model przewidujący ryzyko kontuzji.Implementacja: ML.Ryzyka: etyka.

13.3 Marketplace

Priorytet: P2Złożoność: MOpis: Merch + suplementy + integracja z saldem.Implementacja: Koszyk + płatności.Ryzyka: logistyka.

14. Roadmap 2026–2027

Q2 2026 (P1)

Global Search

Balance Widget

QR Check-in

VBT Lite (MVP)

Barbell A/B (MVP)

Q3 2026 (P1/P2)

Offline Attendance

Local Sessions (IndexedDB)

Chat Search

Auto Reminders

TensorFlow chunk split

Q4 2026 (P2)

Privacy Mode

Automatic Invoices

Recovery Insights

PB Validation

E2E Tests

2027 (P2/P3)

Live Scoreboard

Weak Link Analysis

Marketplace

3D Barbell Reconstruction

Injury Radar