import { isLocalApiBase, resolvePublicApiBase } from '../../utils/resolvePublicApiBase'

/**
 * Dynamiczne URL-e do sitemap (wpisy bloga). Przy buildzie bez API zwraca pustą listę.
 */
export default defineSitemapEventHandler(async () => {
  const apiBase = await resolvePublicApiBase()
  if (isLocalApiBase(apiBase)) {
    return []
  }

  try {
    type PostRow = { slug?: string | null, published?: number | boolean }
    const posts = await $fetch<PostRow[]>(`${apiBase}/api/posts/`, {
      timeout: 8_000
    })
    return (posts || [])
      .filter(p => p.slug && (p.published === 1 || p.published === true))
      .map(p => ({
        loc: `/aktualnosci/${p.slug}`,
        changefreq: 'weekly' as const,
        priority: 0.7
      }))
  } catch {
    return []
  }
})
