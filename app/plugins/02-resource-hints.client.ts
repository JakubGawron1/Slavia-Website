/**
 * Preconnect / dns-prefetch do API i CDN — szybsze pierwsze zapytania po hydracji.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const apiBase = String(config.public.apiBase ?? '').trim()
  if (!apiBase) return

  let origin = ''
  try {
    origin = new URL(apiBase).origin
  } catch {
    return
  }

  useHead({
    link: [
      { rel: 'dns-prefetch', href: origin, key: 'dns-prefetch-api' },
      { rel: 'preconnect', href: origin, crossorigin: 'anonymous', key: 'preconnect-api' }
    ]
  })
})
