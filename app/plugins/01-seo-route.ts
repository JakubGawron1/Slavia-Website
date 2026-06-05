/**
 * Canonical + robots dla tras bez własnego `useSlaviaSeo` / `useSeoMeta`.
 */
import { isSlaviaPrivateRoute, useSlaviaCanonicalPath, useSlaviaSiteUrl } from '~/composables/useSlaviaSeo'

export default defineNuxtPlugin(() => {
  const route = useRoute()
  const siteUrl = useSlaviaSiteUrl()

  const syncRouteSeo = () => {
    const privateRoute = isSlaviaPrivateRoute(route.path)
    const canonical = `${siteUrl}${useSlaviaCanonicalPath(route.path)}`

    useHead({
      link: privateRoute
        ? []
        : [{ rel: 'canonical', key: 'canonical', href: canonical }]
    })

    if (privateRoute) {
      useSeoMeta({ robots: 'noindex, nofollow', ogUrl: canonical })
    }
  }

  watch(() => route.fullPath, syncRouteSeo, { immediate: true })
})
