/** Mapuje ścieżkę aplikacji na klucz strony CMS (per trasa). */
export function cmsRoutePageName(path: string): string {
  const normalized = (path.split('?')[0] ?? path).replace(/\/$/, '') || '/'
  if (normalized === '/') return 'home'

  const segments = normalized.slice(1).split('/').filter(Boolean)
  const staticName = segments.join('-')

  // Dynamiczne trasy — stabilny prefiks + slug (np. aktualnosci-foo-bar)
  if (segments.length >= 2) {
    const [head, ...rest] = segments
    if (head === 'aktualnosci' && rest[0] && rest[0] !== 'nowy' && rest[0] !== 'redaguj') {
      return `aktualnosci-${rest.join('-')}`
    }
    if (head === 'athlete' && rest[0] && rest[0] !== 'dziennik') {
      return `athlete-${rest.join('-')}`
    }
    if (head === 'trainer' && rest[0] === 'dziennik' && rest[1]) {
      return `trainer-dziennik-${rest.slice(1).join('-')}`
    }
  }

  return staticName
}
