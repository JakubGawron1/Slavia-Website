// https://nuxt.com/docs/api/configuration/nuxt-config
import { mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
const nitroPayloadCacheBase = resolve(process.cwd(), '.nuxt', 'cache', 'nuxt', 'payload')

// Windows+dev: Nitro potrafi próbować zapisać payload cache (ISR) zanim katalog istnieje.
try {
  mkdirSync(nitroPayloadCacheBase, { recursive: true })
} catch {
  // ignore
}

export default defineNuxtConfig({
  // Najnowsze domyślne zachowanie Nitro / presetów modułów dla wybranej osi czasu (bump przy większych upgrade’ach Nuxt).
  compatibilityDate: '2026-05-03',

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: { enabled: true },

  /** Pełne sourcemapy mocno wydłużają `nuxt build` (Vite + Nitro). Wyłączone domyślnie; ustaw `NUXT_SOURCEMAP=1` przed buildem, gdy potrzebujesz map do Sentry. */
  sourcemap: {
    client: process.env.NUXT_SOURCEMAP === '1',
    server: process.env.NUXT_SOURCEMAP === '1'
  },

  nitro: {
    /** Bez map Nitro szybciej pakuje serwer (domyślnie przy wyłączonym `sourcemap.server` i tak zwykle nie są potrzebne lokalnie). */
    sourceMap: process.env.NUXT_SOURCEMAP === '1',
    /**
     * Dev-only stabilizacja na Windows: ustawiamy jawnie storage dla payload cache (ISR),
     * żeby zapisy nie waliły `ENOENT` na relatywnej ścieżce.
     */
    storage: {
      payload: {
        driver: 'fs',
        base: nitroPayloadCacheBase
      }
    }
  },

  /**
   * Strategia pod Vercel: minimalizujemy cold starty i koszt SSR.
   *
   * Zasada bezpieczeństwa: SWR/ISR tylko dla tras, które NIE zależą od tokena/roli użytkownika.
   * W przeciwnym wypadku cache może “pomieszać” widoki publiczne i adminowe.
   */
  routeRules: {
    // Publiczne i identyczne dla wszystkich → ISR (najszybciej na Vercel: cache HTML, mniej cold startów).
    '/': { isr: 600 },
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
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      /**
       * Lista rozdzielona przecinkami: identyfikatory funkcji eksperymentalnych zawsze wyłączone na buildzie (deploy).
       * Nadpisuje localStorage i domyślne „włączone”. Zob. `app/data/experimentalFeaturesCatalog.ts`.
       *
       * Przykład: `barbell_pose_analysis,club_notification_bell`
       */
      experimentalKillSwitch: process.env.NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH || '',
      /** Z pola `version` w `package.json` (build-time); stopka i nagłówek (Beta jeśli w nazwie jest „beta”). */
      appVersion: formatPublicAppVersion(packageJsonVersion)
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
      include: [
        'date-fns',
        'date-fns/locale'
      ]
    }
  }
})
