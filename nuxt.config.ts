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

const publicSiteUrl = resolvePublicSiteUrl()
const isProd = process.env.NODE_ENV === 'production'

/**
 * ISR na `/` poza prod wyłączone: `payloadCache` + unstorage → `EISDIR` na Windows przy dev.
 * Nie używać `import.meta.dev` w kontekście ładowania `nuxt.config`.
 */
const devDisableRootIsr = !isProd

/** Trasy panelu — CSR (SPA), bez SSR, bez prerenderu i bez cache CDN. */
const panelNoStore = {
  ssr: false as const,
  prerender: false as const,
  headers: { 'cache-control': 'private, no-store' }
}

/** Publiczny BFF — krótki cache na Vercel (zgodny z ISR list). */
const publicBffCache = {
  headers: {
    'cache-control': 'public, s-maxage=60, stale-while-revalidate=300'
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2026-05-09',

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vercel/analytics/nuxt',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    '@vite-pwa/nuxt'
  ],

  site: {
    url: publicSiteUrl,
    name: 'CKS Slavia Ruda Śląska',
    description: 'Klub sportowy Slavia Ruda Śląska: zawodnicy, wyniki i społeczność skupiona wokół sportów siłowych.',
    defaultLocale: 'pl'
  },

  robots: {
    disallow: [
      '/athlete',
      '/athlete/**',
      '/trainer',
      '/trainer/**',
      '/admin',
      '/admin/**',
      '/superadmin',
      '/superadmin/**',
      '/chat',
      '/profil',
      '/attendance',
      '/powiadomienia',
      '/dziennik',
      '/ogloszenia'
    ]
  },

  sitemap: {
    zeroRuntime: true,
    exclude: [
      '/athlete/**',
      '/trainer/**',
      '/admin/**',
      '/superadmin/**',
      '/chat',
      '/profil',
      '/attendance',
      '/powiadomienia',
      '/dziennik',
      '/ogloszenia',
      '/banned'
    ],
    defaults: {
      changefreq: 'weekly',
      priority: 0.8
    }
  },

  devtools: { enabled: !isProd },

  typescript: {
    typeCheck: false
  },

  sourcemap: {
    client: process.env.NUXT_SOURCEMAP === '1',
    server: process.env.NUXT_SOURCEMAP === '1'
  },

  experimental: {
    /** Payload przy ISR/SSG — mniejszy HTML, szybsza hydracja (prod). */
    payloadExtraction: isProd,
    defaults: {
      nuxtLink: {
        /** Prefetch tylko po hover/focus — mniej równoległych chunków przy starcie. */
        prefetch: true,
        prefetchOn: { interaction: true, visibility: false }
      }
    }
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
    head: {
      charset: 'utf-8',
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'preload', href: '/logo.png', as: 'image', type: 'image/png' }
      ]
    }
  },

  nitro: {
    /** Na Vercel: preset `vercel` (ISR, serverless, edge cache). Lokalnie: domyślny node-server. */
    preset: process.env.NITRO_PRESET || (process.env.VERCEL ? 'vercel' : undefined),
    /** Vercel: natywne ISR zamiast legacy `static`/`swr` w Build Options API. */
    future: {
      nativeSWR: true
    },
    sourceMap: process.env.NUXT_SOURCEMAP === '1',
    compressPublicAssets: true,
    minify: isProd,
    prerender: {
      crawlLinks: true,
      concurrency: 6,
      failOnError: false,
      routes: [
        '/',
        '/zawodnicy',
        '/galeria',
        '/aktualnosci',
        '/kalendarz',
        '/kontakt',
        '/logowanie',
        '/kalkulator-proporcji',
        '/kalkulator-sinclair',
        '/kalkulator-max-pr',
        '/klub/wyzwania',
        '/o-klubie'
      ],
      ignore: [
        '/athlete',
        '/athlete/**',
        '/trainer',
        '/trainer/**',
        '/admin',
        '/admin/**',
        '/superadmin',
        '/superadmin/**',
        '/chat',
        '/profil',
        '/attendance',
        '/powiadomienia',
        '/dziennik',
        '/dziennik/**',
        '/ogloszenia',
        '/api',
        '/dev-sw.js'
      ]
    }
  },

  /**
   * Renderowanie hybrydowe (Vercel):
   * - SSG: `prerender: true` + nitro.prerender
   * - ISR: publiczne listy / blog (`isr` + opcjonalnie prerender)
   * - SSR: domyślnie na trasach bez reguły
   * - CSR (SPA): panele po zalogowaniu (`ssr: false`)
   */
  routeRules: {
    '/api/public/**': publicBffCache,

    '/': devDisableRootIsr ? { isr: false, prerender: true } : { isr: 600, prerender: true },
    '/zawodnicy': { isr: 900, prerender: true },
    '/galeria': { isr: 1800, prerender: true },
    '/aktualnosci': { isr: 600, prerender: true },
    '/aktualnosci/**': { isr: 600 },
    '/klub/**': { isr: 900 },

    '/kalendarz': { isr: 900, prerender: true },
    '/kontakt': { prerender: true },
    '/logowanie': { prerender: true },
    '/banned': { prerender: true },
    '/kalkulator-proporcji': { prerender: true },
    '/kalkulator-sinclair': { prerender: true },
    '/kalkulator-max-pr': { prerender: true },

    '/ogloszenia': { ...panelNoStore },

    '/athlete/**': panelNoStore,
    '/trainer/**': panelNoStore,
    '/admin/**': panelNoStore,
    '/superadmin/**': panelNoStore,
    '/chat': panelNoStore,
    '/profil': panelNoStore,
    '/attendance': panelNoStore,
    '/powiadomienia': panelNoStore,
    '/dziennik': panelNoStore
  },

  pwa: {
    registerType: 'autoUpdate',
    includeAssets: ['logo.png', 'favicon.ico', 'manifest.webmanifest'],
    manifest: {
      name: 'CKS Slavia Ruda Śląska',
      short_name: 'Slavia',
      description: `Aplikacja klubu sportowego CKS Slavia Ruda Śląska: zawodnicy, kalendarz, wyniki i powiadomienia. Wersja ${formatPublicAppVersion(packageJsonVersion)}`,
      theme_color: '#140a0f',
      background_color: '#140a0f',
      display: 'standalone',
      lang: 'pl',
      start_url: '/',
      scope: '/',
      icons: [
        { src: '/logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ]
    },
    workbox: {
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api\//, /^\/dev-sw/, /^\/_nuxt/, /^\/athlete/, /^\/trainer/, /^\/admin/, /^\/superadmin/],
      globPatterns: ['**/*.{js,css,html,ico,woff2,webmanifest}'],
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-stylesheets',
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-webfonts',
            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }
          }
        },
        {
          urlPattern: ({ url }) => {
            const p = url.pathname
            return p.startsWith('/api/public/')
              || p.startsWith('/api/athletes')
              || p.startsWith('/api/posts')
              || p.startsWith('/api/gallery')
              || p.startsWith('/api/announcements')
              || p.startsWith('/api/competitions')
              || p.startsWith('/api/results/public-board')
          },
          handler: 'NetworkFirst',
          options: {
            cacheName: 'slavia-public-api',
            networkTimeoutSeconds: 8,
            expiration: { maxEntries: 64, maxAgeSeconds: 300 }
          }
        }
      ]
    },
    devOptions: {
      enabled: !isProd,
      type: 'module',
      navigateFallback: '/',
      suppressWarnings: true
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600
    }
  },

  css: ['~/assets/css/main.css', '~/assets/scss/slavia.scss'],

  /**
   * `components/panel/Public*.vue` — bez prefiksu `Panel` w nazwie (np. `PublicPageLayout`, nie `PanelPublicPageLayout`).
   * Pliki `Panel*.vue` w tym samym katalogu nadal rejestrują się jako `PanelPageLayout` itd.
   */
  components: [
    '~/components',
    {
      path: '~/components/panel',
      pathPrefix: false
    }
  ],

  runtimeConfig: {
    blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN || '',
    githubApiToken: process.env.GITHUB_TOKEN || process.env.GITHUB_API_TOKEN || '',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
      apiBaseLeapcell: process.env.NUXT_PUBLIC_API_BASE_URL_LEAPCELL || process.env.NUXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
      apiBaseRender:
        process.env.NUXT_PUBLIC_API_BASE_URL_RENDER
        || process.env.NUXT_PUBLIC_API_BASE_URL
        || 'http://127.0.0.1:8000',
      siteUrl: publicSiteUrl,
      experimentalKillSwitch: process.env.NUXT_PUBLIC_EXPERIMENTAL_KILL_SWITCH || '',
      appVersion: formatPublicAppVersion(packageJsonVersion),
      featureAthleteCompare: process.env.NUXT_PUBLIC_FEATURE_ATHLETE_COMPARE !== '0',
      featuresJson: process.env.NUXT_PUBLIC_FEATURES_JSON || '',
      mobileGithubRepo:
        process.env.NUXT_PUBLIC_MOBILE_GITHUB_REPO || 'JakubGawron1/Slavia-Mobile',
      /** Baza URL zdjęć z repo Slavia-cms (raw GitHub lub GitHub Pages). */
      cmsBaseUrl: (process.env.NUXT_PUBLIC_CMS_BASE_URL || '').replace(/\/$/, '')
    }
  },

  vite: {
    build: {
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1600,
      modulePreload: { polyfill: false }
    },
    optimizeDeps: {
      include: [
        'date-fns',
        'date-fns/locale'
      ]
    }
  }
})
