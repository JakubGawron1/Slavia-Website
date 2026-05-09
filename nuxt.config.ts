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
    sourceMap: process.env.NUXT_SOURCEMAP === '1'
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
