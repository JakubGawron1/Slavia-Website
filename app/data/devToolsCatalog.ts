/** Rzadkie uzupełnienia mapy w `/superadmin/developer` — dodawaj tylko gdy wpis nie pojawia się w routerze. */

export interface DevToolLinkItem {
  to: string
  label: string
  description: string
  icon: string
}

export interface DevToolLinkGroup {
  title: string
  description?: string
  links: DevToolLinkItem[]
}

/** Skróty do modułów superadmina i paneli — szybki dostęp poza auto-mapą tras. */
export const DEV_TOOL_SUPERADMIN_GROUP: DevToolLinkGroup = {
  title: 'Superadmin i panele',
  description: 'Najczęściej używane moduły operacyjne — nie wymagają przeszukiwania mapy tras.',
  links: [
    {
      to: '/superadmin/zawodnicy?tab=accounts',
      label: 'Konta i role',
      description: 'Administratorzy, trenerzy, zawodnicy',
      icon: 'i-lucide-shield-alert'
    },
    {
      to: '/superadmin/audit-logs',
      label: 'Logi audytu',
      description: 'Historia operacji w systemie',
      icon: 'i-lucide-history'
    },
    {
      to: '/superadmin/nawigacja-paneli',
      label: 'Nawigacja paneli',
      description: 'Feature flagi modułów per rola',
      icon: 'i-lucide-layout-grid'
    },
    {
      to: '/superadmin/workers',
      label: 'Workery cron',
      description: 'Zadania w tle backendu',
      icon: 'i-lucide-timer'
    },
    {
      to: '/superadmin/import',
      label: 'Import danych',
      description: 'Federacje i CSV',
      icon: 'i-lucide-file-up'
    },
    {
      to: '/superadmin/barbell-lab',
      label: 'Barbell Lab',
      description: 'Eksperymenty wizji / pose',
      icon: 'i-lucide-beaker'
    },
    {
      to: '/admin/changelog',
      label: 'Changelog',
      description: 'Historia wydań aplikacji',
      icon: 'i-lucide-file-text'
    },
    {
      to: '/trainer/analiza-sztangi',
      label: 'Analiza sztangi',
      description: 'Panel trenera — overlay ruchu',
      icon: 'i-lucide-scan-line'
    }
  ]
}

/**
 * Dokumentacja stosu — Node, paczki, backend Rust, styl.
 */
export const DEV_TOOL_STACK_GROUP: DevToolLinkGroup = {
  title: 'Stack projektu',
  description: 'Oficjalna dokumentacja komponentów (nowa karta). Wersje z package.json / Cargo.toml.',
  links: [
    {
      to: 'https://nuxt.com/docs/4.x/getting-started/introduction',
      label: 'Nuxt 4',
      description: 'Framework aplikacji (SSR, ISR, BFF)',
      icon: 'i-lucide-book-open'
    },
    {
      to: 'https://ui.nuxt.com/',
      label: 'Nuxt UI v4',
      description: 'Komponenty interfejsu (UButton, UCard…)',
      icon: 'i-lucide-panels-top-left'
    },
    {
      to: 'https://vuejs.org/guide/introduction.html',
      label: 'Vue 3',
      description: 'Reactivity, composables, SFC',
      icon: 'i-lucide-component'
    },
    {
      to: 'https://tailwindcss.com/docs/',
      label: 'Tailwind CSS v4',
      description: 'Utility classes + @tailwindcss/vite',
      icon: 'i-lucide-palette'
    },
    {
      to: 'https://pnpm.io/',
      label: 'pnpm',
      description: 'Zależności i skrypty (frontend)',
      icon: 'i-lucide-package'
    },
    {
      to: 'https://playwright.dev/docs/intro',
      label: 'Playwright',
      description: 'E2E smoke (`pnpm test:e2e`)',
      icon: 'i-lucide-flask-conical'
    },
    {
      to: 'https://openapi-ts.dev/',
      label: 'openapi-typescript',
      description: 'Typy z embed OpenAPI backendu',
      icon: 'i-lucide-braces'
    },
    {
      to: 'https://doc.rust-lang.org/book/',
      label: 'The Rust Book',
      description: 'Backend Axum — repo Slavia-backend',
      icon: 'i-lucide-memory-stick'
    },
    {
      to: 'https://docs.rs/axum/latest/axum/',
      label: 'Axum',
      description: 'Router HTTP i handlery REST',
      icon: 'i-lucide-server'
    },
    {
      to: 'https://docs.turso.tech/libsql',
      label: 'libSQL / Turso',
      description: 'Baza SQLite (lokalnie + zdalnie)',
      icon: 'i-lucide-database'
    }
  ]
}

export const DEV_TOOL_EXTERNAL_DOCS_GROUP: DevToolLinkGroup = {
  title: 'PWA, przeglądarka i deploy',
  description: 'Przydatne przy debugowaniu cache, PWA i wydajności.',
  links: [
    {
      to: 'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API',
      label: 'MDN: Service Worker',
      description: 'Cykl życia SW i cache',
      icon: 'i-lucide-globe'
    },
    {
      to: 'https://web.dev/explore/progressive-web-apps',
      label: 'web.dev — PWA',
      description: 'Instalacja i jakość PWA',
      icon: 'i-lucide-smartphone'
    },
    {
      to: 'https://developer.chrome.com/docs/devtools/',
      label: 'Chrome DevTools',
      description: 'Sieć, wydajność, Lighthouse',
      icon: 'i-lucide-wrench'
    },
    {
      to: 'https://pagespeed.web.dev/',
      label: 'PageSpeed Insights',
      description: 'Audyt CWV (LCP, CLS, INP)',
      icon: 'i-lucide-gauge'
    },
    {
      to: 'https://vercel.com/docs',
      label: 'Vercel',
      description: 'Deploy frontendu, ISR, env',
      icon: 'i-lucide-cloud'
    }
  ]
}

/**
 * Ścieżki bez osobnego wpisu w `router.getRoutes()` (np. kotwice na tej samej stronie).
 */
export const DEV_TOOL_ROUTE_SUPPLEMENT: DevToolLinkGroup[] = [
  {
    title: 'Kotwice i uzupełnienia',
    description: 'Fragmenty URL współdzielone z trasą bazową.',
    links: [
      {
        to: '/zawodnicy#wyniki-zawodow',
        label: '/zawodnicy#wyniki-zawodów',
        description: 'Sekcja wyników na stronie Zawodnicy',
        icon: 'i-lucide-medal'
      },
      {
        to: '/api/mobile/latest-release',
        label: 'BFF: APK mobile',
        description: 'Proxy GitHub Releases (JSON)',
        icon: 'i-lucide-smartphone'
      }
    ]
  }
]
