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

/**
 * Dokumentacja zewnętrzna — nie da się jej wyprowadzić z routera aplikacji.
 */
/**
 * Dokumentacja stosu — Node, paczki, backend Rust, styl.
 */
export const DEV_TOOL_STACK_GROUP: DevToolLinkGroup = {
  title: 'Stack i narzędzia developerskie',
  description: 'Wersje zależą od repo — te linki to oficjalna dokumentacja komponentów (nowa karta).',
  links: [
    {
      to: 'https://nodejs.org/docs/',
      label: 'Node.js',
      description: 'Runtime — lokalnie i na CI',
      icon: 'i-lucide-box'
    },
    {
      to: 'https://pnpm.io/workspaces',
      label: 'pnpm',
      description: 'Zależności i skrypty (frontend)',
      icon: 'i-lucide-package'
    },
    {
      to: 'https://nuxt.com/docs/getting-started/testing',
      label: 'Nuxt — Testing',
      description: 'Unit / runtime testy modułu',
      icon: 'i-lucide-flask-conical'
    },
    {
      to: 'https://doc.rust-lang.org/book/',
      label: 'The Rust Book',
      description: 'Backend (Axum) w osobnym repozytorium',
      icon: 'i-lucide-memory-stick'
    },
    {
      to: 'https://tokio.rs/',
      label: 'Tokio',
      description: 'Async runtime używany przez serwer HTTP',
      icon: 'i-lucide-zap'
    },
    {
      to: 'https://tailwindcss.com/docs/',
      label: 'Tailwind CSS',
      description: 'Style (`@tailwindcss` + Nuxt UI)',
      icon: 'i-lucide-palette'
    }
  ]
}

export const DEV_TOOL_EXTERNAL_DOCS_GROUP: DevToolLinkGroup = {
  title: 'Dokumentacja zewnętrzna',
  description: 'Przydatne przy pracy z frontem, PWA i przeglądarką. Otwiera się w nowej karcie.',
  links: [
    {
      to: 'https://nuxt.com/docs',
      label: 'Nuxt',
      description: 'Framework aplikacji',
      icon: 'i-lucide-book-open'
    },
    {
      to: 'https://ui.nuxt.com/',
      label: 'Nuxt UI',
      description: 'Komponenty interfejsu',
      icon: 'i-lucide-panels-top-left'
    },
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
    }
  ]
}

/**
 * Ścieżki bez osobnego wpisu w `router.getRoutes()` (np. kotwice na tej samej stronie).
 * Główna mapa buduje się automatycznie — tu tylko jawne wyjątki.
 */
export const DEV_TOOL_ROUTE_SUPPLEMENT: DevToolLinkGroup[] = [
  {
    title: 'Uzupełnienie (poza routerem)',
    description: 'Router zna tylko ścieżki plików w `app/pages/`; fragmenty `#…` są wspólne z istniejącą trasą.',
    links: [
      {
        to: '/zawodnicy#wyniki-zawodow',
        label: '/zawodnicy#wyniki-zawodów',
        description: 'Kotwica do sekcji wyników na stronie Zawodnicy',
        icon: 'i-lucide-medal'
      }
    ]
  }
]
