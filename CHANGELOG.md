# Changelog - Slavia Frontend

## [3.2.5] - 2026-05-19

### Wydajność (design-2.0 / Vercel)
- **Build**: większy heap Node (`--max-old-space-size=8192`), wyłączone devtools/PWA w prod, mniejszy precache Workbox.
- **SSG/ISR**: `prerender: false` dla paneli; crawler nie generuje `/athlete`, `/ogloszenia` itd.; preset Nitro `vercel` na CI.
- **BFF** `/api/public/*` — publiczne GET z cache CDN (`s-maxage` + SWR); strony używają `usePublicLazyFetch`.
- **Zawodnicy**: jeden request `public-board` zamiast N× wyników per zawodnik.
- **Kalendarz**: dane z BFF pod SSR/SSG (wcześniej tylko klient).
- **Prefetch**: linki tylko po interakcji (bez visibility).

### Naprawione
- **Strony publiczne**: przyciski „Dodaj” dla kadry przy niepustych listach; większe odstępy od krawędzi ekranu.
- **Nuxt**: auto-import komponentów Public* z panel/ bez prefiksu Panel.

### Ulepszenia
- **Scroll-to-top** — pływający przycisk na stronach publicznych.
- **Aktualności — wpis** — Kopiuj link / Udostępnij; meta OG/Twitter.
- **Strona błędu** — skróty do aktualności, zawodników, galerii i kontaktu.

## [3.2.4] - 2026-05-19

Zob. wpis v3.2.4-dev w panelu admina (changelog UI) oraz commit 4d15b5f.
