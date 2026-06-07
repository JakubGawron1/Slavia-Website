// https://nuxt.com/docs/api/configuration/nuxt-config

import { buildPwaConfig } from './config/pwa'

import { prerenderIgnore, prerenderRoutes } from './config/prerender'

import { buildRouteRules } from './config/routeRules'

import {

  formatPublicAppVersion,

  readPackageJsonVersion,

  resolveBuildTimeApiBase,

  resolvePublicSiteUrl

} from './config/site'



const packageJsonVersion = readPackageJsonVersion()

const publicSiteUrl = resolvePublicSiteUrl()

const isProd = process.env.NODE_ENV === 'production'

const buildApiBase = resolveBuildTimeApiBase()

const buildApiLeapcell = (process.env.NUXT_PUBLIC_API_BASE_URL_LEAPCELL || buildApiBase).replace(/\/$/, '')

const buildApiRender = (process.env.NUXT_PUBLIC_API_BASE_URL_RENDER || buildApiBase).replace(/\/$/, '')



/**

 * ISR na `/` poza prod wyłączone: `payloadCache` + unstorage → `EISDIR` na Windows przy dev.

 * Nie używać `import.meta.dev` w kontekście ładowania `nuxt.config`.

 */

const devDisableRootIsr = !isProd



export default defineNuxtConfig({

  compatibilityDate: '2026-05-09',

  future: {

    compatibilityVersion: 4

  },



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

      '/profil',

      '/dziennik',

      '/klub/obecnosc',

      '/klub/czat',

      '/klub/powiadomienia',

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

      '/profil',

      '/dziennik',

      '/klub/obecnosc',

      '/klub/czat',

      '/klub/powiadomienia',

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

    /** Lokalnie: `NUXT_TYPECHECK=1 pnpm dev`. CI zawsze uruchamia `pnpm typecheck`. */

    typeCheck: process.env.NUXT_TYPECHECK === '1'

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

    /** nuxt-site-config / Nitro dev — jawna zależność, inaczej pnpm nie rozwiązuje z `.nuxt/dev`. */

    externals: {

      inline: ['@nuxt/devalue']

    },

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

      routes: [...prerenderRoutes],

      ignore: [...prerenderIgnore]

    },

    /** On-demand ISR: nagłówek x-prerender-revalidate (panel SuperAdmin → purge cache). */

    vercel: {

      config: {

        bypassToken: process.env.VERCEL_ISR_BYPASS_TOKEN || ''

      }

    }

  },



  /**

   * Renderowanie hybrydowe (Vercel):

   * - SSG: `prerender: true` + nitro.prerender

   * - ISR: publiczne listy / blog (`isr` + opcjonalnie prerender)

   * - SSR: domyślnie na trasach bez reguły

   * - CSR (SPA): panele po zalogowaniu (`ssr: false`)

   */

  routeRules: buildRouteRules(devDisableRootIsr),



  pwa: buildPwaConfig(packageJsonVersion, formatPublicAppVersion, isProd) as Record<string, unknown>,



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

    },

    {

      path: '~/components/dev',

      pathPrefix: false

    },

    {

      path: '~/components/dev/sections',

      pathPrefix: false

    },

    {

      path: '~/components/trainer',

      pathPrefix: false

    }

  ],



  runtimeConfig: {

    blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN || '',

    /** Sekret do wymuszenia revalidacji ISR (Vercel) — tylko server-side. */

    vercelIsrBypassToken: process.env.VERCEL_ISR_BYPASS_TOKEN || '',

    githubApiToken: process.env.GITHUB_TOKEN || process.env.GITHUB_API_TOKEN || '',

    public: {

      apiBase: buildApiBase,

      apiBaseLeapcell: buildApiLeapcell,

      apiBaseRender: buildApiRender,

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


