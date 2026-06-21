/** Publiczny profil `/athlete/imie--uuid` — sync z `isAthletePublicProfileRoute`. */
const ATHLETE_PUBLIC_PROFILE_OFFLINE_DENY_PATTERN = /^\/athlete\/[^/]*--[^/]*\/?$/

export function buildPwaConfig(
  packageJsonVersion: string,
  formatPublicAppVersion: (raw: string) => string,
  _isProd: boolean
) {
  return {
    registerType: 'autoUpdate' as const,
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
      navigateFallbackDenylist: [
        /^\/api\//,
        /^\/dev-sw/,
        /^\/_nuxt/,
        ATHLETE_PUBLIC_PROFILE_OFFLINE_DENY_PATTERN,
        /^\/trainer/,
        /^\/admin/,
        /^\/superadmin/
      ],
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
          urlPattern: ({ url }: { url: URL }) => {
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
        },
        {
          urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/panel/'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'slavia-athlete-panel-api',
            networkTimeoutSeconds: 10,
            expiration: { maxEntries: 32, maxAgeSeconds: 600 }
          }
        }
      ]
    },
    devOptions: {
      // SW w dev podawał przestarzały shell (gołe przyciski, brak danych po hydracji).
      enabled: false,
      type: 'module',
      navigateFallback: '/',
      suppressWarnings: true
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600
    }
  }
}
