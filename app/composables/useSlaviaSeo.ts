/**
 * Spójne SEO per trasa: canonical, robots, OG — uzupełnia globalne meta z `app.vue`.
 */
export type SlaviaSeoOptions = {
  title?: string
  description?: string
  /** Jawny URL obrazu OG (domyślnie logo klubu). */
  ogImage?: string
  /** `true` → noindex (panele, konto). */
  noindex?: boolean
  /** Nadpisanie robots, np. `index, follow`. */
  robots?: string
}

const PRIVATE_ROUTE_PREFIXES = [
  '/athlete',
  '/trainer',
  '/admin',
  '/superadmin',
  '/chat',
  '/profil',
  '/attendance',
  '/powiadomienia',
  '/dziennik',
  '/ogloszenia'
] as const

export function isSlaviaPrivateRoute(path: string): boolean {
  return PRIVATE_ROUTE_PREFIXES.some(p => path === p || path.startsWith(`${p}/`))
}

export function useSlaviaSiteUrl(): string {
  const config = useRuntimeConfig()
  return String(config.public.siteUrl ?? '').replace(/\/$/, '')
}

export function useSlaviaCanonicalPath(path?: string): string {
  const route = useRoute()
  const p = path ?? route.path
  if (p === '/' || p === '') return ''
  return p.startsWith('/') ? p : `/${p}`
}

export function useSlaviaSeo(opts: SlaviaSeoOptions = {}) {
  const siteUrl = useSlaviaSiteUrl()
  const route = useRoute()
  const path = useSlaviaCanonicalPath()
  const privateRoute = opts.noindex ?? isSlaviaPrivateRoute(route.path)
  const canonical = `${siteUrl}${path}`
  const defaultOg = `${siteUrl}/logo.png`

  const robots = opts.robots ?? (privateRoute ? 'noindex, nofollow' : 'index, follow')

  useSeoMeta({
    title: opts.title,
    description: opts.description,
    robots,
    ogUrl: canonical,
    ogImage: opts.ogImage ?? defaultOg,
    twitterImage: opts.ogImage ?? defaultOg
  })

  useHead({
    link: privateRoute
      ? []
      : [{ rel: 'canonical', key: 'canonical', href: canonical }]
  })
}
