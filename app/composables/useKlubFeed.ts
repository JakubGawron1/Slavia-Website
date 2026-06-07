import type { KlubFeedItem } from '~/types/klubFeed'
import { blogPostPath, slugify } from '~/utils/slug'
import { PUBLIC_ROUTES } from '~/config/klubRoutes'

export function useKlubFeed() {
  const { data, pending, error, refresh } = usePublicLazyFetch<KlubFeedItem[]>('club/feed', {
    key: 'klub-feed',
    default: () => [],
    staleTimeMs: 120_000
  })

  const items = computed(() => data.value ?? [])

  function feedHref(item: KlubFeedItem) {
    if (item.kind === 'post') {
      return blogPostPath(slugify(item.title), item.id)
    }
    if (item.kind === 'announcement') {
      return PUBLIC_ROUTES.ogloszenia
    }
    return PUBLIC_ROUTES.kalendarz
  }

  function feedIcon(item: KlubFeedItem) {
    if (item.kind === 'post') return 'i-lucide-newspaper'
    if (item.kind === 'announcement') return 'i-lucide-megaphone'
    return 'i-lucide-calendar-days'
  }

  function feedKindLabel(item: KlubFeedItem) {
    if (item.kind === 'post') return 'Aktualność'
    if (item.kind === 'announcement') return 'Ogłoszenie'
    return 'Wydarzenie'
  }

  function feedBadgeColor(item: KlubFeedItem) {
    if (item.kind === 'post') return 'warning' as const
    if (item.kind === 'announcement') return 'secondary' as const
    return 'info' as const
  }

  return {
    items,
    pending,
    error,
    refresh,
    feedHref,
    feedIcon,
    feedKindLabel,
    feedBadgeColor
  }
}
