import type { Router } from 'vue-router'

export function iconForDevRoute(path: string) {
  if (path === '/') return 'i-lucide-home'
  if (path.startsWith('/superadmin')) return 'i-lucide-crown'
  if (path.startsWith('/admin')) return 'i-lucide-shield'
  if (path.startsWith('/trainer')) return 'i-lucide-dumbbell'
  if (path.startsWith('/athlete')) return 'i-lucide-user'
  if (path.startsWith('/aktualnosci')) return 'i-lucide-newspaper'
  if (path.startsWith('/ogloszenia')) return 'i-lucide-megaphone'
  if (path.startsWith('/galeria')) return 'i-lucide-images'
  if (path.startsWith('/kalendarz')) return 'i-lucide-calendar'
  if (path.startsWith('/kontakt')) return 'i-lucide-message-square'
  if (path.startsWith('/logowanie')) return 'i-lucide-log-in'
  if (path.includes('konto=1') || path.includes('#ustawienia-konta')) return 'i-lucide-user-cog'
  return 'i-lucide-link'
}

export function isInspectableDevRoute(path: string): boolean {
  if (!path.startsWith('/')) return false
  if (path.startsWith('/__')) return false
  if (path.startsWith('/_nuxt')) return false
  if (path.includes('pathMatch')) return false
  return true
}

export function devRouteMapGroupTitle(path: string): string {
  if (path === '/') return 'Trasy (auto): /'
  const seg = path.split('/').filter(Boolean)[0] || 'inne'
  return `Trasy (auto): /${seg}`
}

export type DevRouteLink = { to: string, label: string, description: string, icon: string }

export type DevRouteGroup = {
  title: string
  description: string
  links: DevRouteLink[]
}

export function buildAutoRouteGroups(router: Router): DevRouteGroup[] {
  const records = router.getRoutes().filter(r => isInspectableDevRoute(String(r.path || '')))
  const descriptionByPath = new Map<string, string>()
  for (const r of records) {
    const p = String(r.path || '')
    if (!descriptionByPath.has(p)) {
      const named = typeof r.name === 'string' && r.name.trim() ? r.name.trim() : ''
      descriptionByPath.set(p, named || 'Wygenerowane z routera Nuxt')
    }
  }
  const paths = [...descriptionByPath.keys()].sort((a, b) => a.localeCompare(b, 'pl'))

  const byTitle = new Map<string, DevRouteLink[]>()
  for (const p of paths) {
    const title = devRouteMapGroupTitle(p)
    const link: DevRouteLink = {
      to: p,
      label: p,
      description: descriptionByPath.get(p) || 'Wygenerowane z routera Nuxt',
      icon: iconForDevRoute(p)
    }
    const list = byTitle.get(title) || []
    list.push(link)
    byTitle.set(title, list)
  }

  return [...byTitle.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pl'))
    .map(([title, links]) => ({
      title,
      description: 'Lista tras z `router.getRoutes()` (w tym ścieżki z parametrami, np. `:slug`).',
      links: links.sort((x, y) => x.to.localeCompare(y.to, 'pl'))
    }))
}

export function routeChipLabel(to: string) {
  const t = String(to || '')
  if (!t) return '—'
  if (t === '/') return '/'
  const nice = t.replace(/^\/+/, '')
  return nice.length > 28 ? `${nice.slice(0, 26)}…` : nice
}
