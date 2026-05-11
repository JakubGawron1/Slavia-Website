// https://nuxt.com/docs/api/configuration/nuxt-config
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readPackageJsonVersion(): string {
  const path = fileURLToPath(new URL('./package.json', import.meta.url))
  const pkg = JSON.parse(readFileSync(path, 'utf-8')) as { version?: string }
  return pkg.version?.trim() || '0.0.0'
}

/** Etykieta w UI — jak w package.json, z prefiksem `v`. */
function formatPublicAppVersion(raw: string): string {
  return raw.startsWith('v') ? raw : `v${raw}`
}

const packageJsonVersion = readPackageJsonVersion()

/** Publiczny URL aplikacji: jawna zmienna albo automatycznie na Vercel (Preview/Production). */
function resolvePublicSiteUrl(): string {
  const explicit = (process.env.NUXT_PUBLIC_SITE_URL || '').trim()
  if (explicit) {
    return explicit
  }
  const vercel = (process.env.VERCEL_URL || '').trim()
  if (vercel) {
    return `https://${vercel}`
  }
  return 'http://localhost:3000'
}

/**
 * ISR na `/` poza prod wyłączone: `payloadCache` tworzy się już przy dowolnym ISR w projekcie
 * (`NUXT_RUNTIME_PAYLOAD_EXTRACTION`); przy zapisie dla URL `/` unstorage rozjeżdża mount
 * `cache:nuxt:payload` → próba zapisu na `.nuxt/cache/nuxt/payload` i `EISDIR` na Windows.
 * Nie używać tu `import.meta.dev` — w kontekście ładowania `nuxt.config` bywa undefined.
 */
const devDisableRootIsr = process.env.NODE_ENV !== 'production'

export default defineNuxtConfig({
  // Najnowsze domyślne zachowanie Nitro / presetów modułów dla wybranej osi czasu (bump przy większych upgrade’ach Nuxt).
  compatibilityDate: '2026-05-09',

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    /** Web Analytics na Vercel — moduł: `@vercel/analytics/nuxt` (meta.name: `@vercel/analytics`). */
    '@vercel/analytics/nuxt'
  ],

  devtools: { enabled: true },

  /** Pełne sourcemapy mocno wydłużają `nuxt build` (Vite + Nitro). Wyłączone domyślnie; ustaw `NUXT_SOURCEMAP=1` przed buildem, gdy potrzebujesz map do Sentry. */
  sourcemap: {
    client: process.env.NUXT_SOURCEMAP === '1',
    server: process.env.NUXT_SOURCEMAP === '1'
  },

  nitro: {
    /** Bez map Nitro szybciej pakuje serwer (domyślnie przy wyłączonym `sourcemap.server` i tak zwykle nie są potrzebne lokalnie). */
    sourceMap: process.env.NUXT_SOURCEMAP === '1'
  },

  /**
   * Strategia pod Vercel: minimalizujemy cold starty i koszt SSR.
   *
   * Zasada bezpieczeństwa: SWR/ISR tylko dla tras, które NIE zależą od tokena/roli użytkownika.
   * W przeciwnym wypadku cache może “pomieszać” widoki publiczne i adminowe.
   */
  routeRules: {
    // Produkcja: ISR na `/`; lokalnie `import.meta.dev` — patrz `devDisableRootIsr` (payload cache + unstorage).
    '/': devDisableRootIsr ? { isr: false } : { isr: 600 },
    '/zawodnicy': { isr: 900 },
    '/galeria': { isr: 1800 },
    '/aktualnosci': { isr: 600 },
    '/aktualnosci/**': { isr: 600 },

    // Publiczne i bez danych wrażliwych → static shell.
    '/kalendarz': { static: true },
    '/kontakt': { static: true },
    '/logowanie': { static: true },
    '/banned': { static: true },
    '/kalkulator-proporcji': { static: true },
    '/kalkulator-sinclair': { static: true },

    // Trasy wymagające auth/roli → zawsze no-store (unikamy cache per-user).
    '/ogloszenia': { headers: { 'cache-control': 'private, no-store' } },

    // Strefy po auth / role → zawsze no-store (unikamy cache per-user).
    '/athlete/**': { headers: { 'cache-control': 'private, no-store' } },
    '/trainer/**': { headers: { 'cache-control': 'private, no-store' } },
    '/admin/**': { headers: { 'cache-control': 'private, no-store' } },
    '/superadmin/**': { headers: { 'cache-control': 'private, no-store' } },
    '/chat': { headers: { 'cache-control': 'private, no-store' } },
    '/profil': { headers: { 'cache-control': 'private, no-store' } },
    '/attendance': { headers: { 'cache-control': 'private, no-store' } },
    '/powiadomienia': { headers: { 'cache-control': 'private, no-store' } },
    '/dziennik': { headers: { 'cache-control': 'private, no-store' } }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN || '',
    /** Opcjonalny token dla wyższego limitu zapytań do GitHub API (tylko serwer). */
    githubApiToken: process.env.GITHUB_TOKEN || process.env.GITHUB_API_TOKEN || '',
    public: {
      /**
       * Zewnętrzny backend — tylko ten URL; brak proxy Nitro, brak kodu serwera w tym repo.
       * Ustaw w `.env`: NUXT_PUBLIC_API_BASE_URL
       */
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
      /**
       * URL backendu Leapcell (provider przełączany globalnie po stronie API).
       */
      apiBaseLeapcell: process.env.NUXT_PUBLIC_API_BASE_URL_LEAPCELL || process.env.NUXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
      /**
       * URL backendu Render (provider przełączany globalnie po stronie API).
       */
      apiBaseRender:
        process.env.NUXT_PUBLIC_API_BASE_URL_RENDER
        || process.env.NUXT_PUBLIC_API_BASE_URL
        || 'http://127.0.0.1:8000',
      /**
       * Publiczny URL strony — używany do canonical/og:url.
       */
      siteUrl: resolvePublicSiteUrl(),
      /**
       * Lista rozdzielona przecinkami: identyfikatory funkcji eksperymentalnych zawsze wyłączone na buildzie (deploy).
       * Nadpisuje localStorage i domyślne „włączone”. Zob. `app/data/experimentalFeaturesCatalog.ts`.
       *
       * Przykład: `barbell_pose_analysis,club_notification_bell`
       */
      experimentalKillSwitch: process.env.NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH || '',
      /** Z pola `version` w `package.json` (build-time); stopka — w nagłówku odznaka Dev/Beta wg `SiteHeader`. */
      appVersion: formatPublicAppVersion(packageJsonVersion),
      /**
       * Feature flag (env): `NUXT_PUBLIC_FEATURE_ATHLETE_COMPARE=0` wyłącza link do porównania zawodników.
       * Domyślnie włączone — bez zmiennej środowiskowej moduł jest widoczny.
       */
      featureAthleteCompare: process.env.NUXT_PUBLIC_FEATURE_ATHLETE_COMPARE !== '0',
      /**
       * JSON z flagami boolean (np. `{"foo":false}`). Łączy się z `usePublicFeatures()` / `usePublicFeatureFlag()`.
       * Nie wstawiaj tu sekretów — zmienna jest publiczna (bundle klienta).
       */
      featuresJson: process.env.NUXT_PUBLIC_FEATURES_JSON || '',
      /**
       * Repozytorium aplikacji mobilnej (GitHub) — `owner/repo`.
       * Używane do przycisku „Pobierz aplikację” i `/api/mobile/latest-release`.
       */
      mobileGithubRepo: process.env.NUXT_PUBLIC_MOBILE_GITHUB_REPO || ''
    }
  },
  vite: {
    build: {
      /** Liczenie gzip każdego pliku po bundlu — zbędny koszt czasu przy `pnpm build`. */
      reportCompressedSize: false,
      /** Nuxt + Tailwind + UI często przekraczają 500 kB w jednym chunku — bez ręcznego splitu Rollup i tak jest szybszy. */
      chunkSizeWarningLimit: 1600
    },
    optimizeDeps: {
      /**
       * Ikony: Nuxt Icon w trybie `local` bundluje tylko zainstalowane kolekcje (`package.json` —
       * obecnie lucide + game-icons). Nie dodawaj całego `@iconify/json` do zależności produkcyjnych.
       */
      include: [
        'date-fns',
        'date-fns/locale'
      ]
    }
  }
})
