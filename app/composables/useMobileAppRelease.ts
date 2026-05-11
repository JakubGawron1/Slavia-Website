/**
 * Najnowszy release aplikacji mobilnej z GitHub (proxy `/api/mobile/latest-release`).
 * Wymaga `NUXT_PUBLIC_MOBILE_GITHUB_REPO=właściciel/repo` w środowisku.
 */
export interface MobileLatestRelease {
  configured: boolean
  tagName?: string
  name?: string
  htmlUrl?: string
  apkDownloadUrl?: string | null
  publishedAt?: string | null
  fallbackUrl?: string
  apiError?: boolean
}

export function useMobileAppRelease() {
  const { data: mobileRelease } = useFetch<MobileLatestRelease>('/api/mobile/latest-release', {
    key: 'mobile-latest-release',
    server: true,
    default: () => ({ configured: false })
  })

  const mobileDownloadHref = computed(() => {
    if (!mobileRelease.value?.configured) return ''
    const r = mobileRelease.value
    return r.apkDownloadUrl || r.htmlUrl || r.fallbackUrl || ''
  })

  const mobileDownloadLabel = computed(() => {
    if (!mobileRelease.value?.configured) return 'Pobierz aplikację'
    return mobileRelease.value.apkDownloadUrl ? 'Pobierz aplikację (APK)' : 'Pobierz aplikację'
  })

  return { mobileRelease, mobileDownloadHref, mobileDownloadLabel }
}
