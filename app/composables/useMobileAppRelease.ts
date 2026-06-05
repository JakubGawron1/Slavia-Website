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

const MOBILE_RELEASE_KEY = 'mobile-latest-release'

function readPayloadCache(nuxtApp: ReturnType<typeof useNuxtApp>, key: string) {
  const bucket = nuxtApp.payload?.data
  if (!bucket || !Object.prototype.hasOwnProperty.call(bucket, key)) {
    return undefined
  }
  return bucket[key] as MobileLatestRelease
}

export function useMobileAppRelease() {
  const { data: mobileRelease } = useAsyncData(
    MOBILE_RELEASE_KEY,
    () => $fetch<MobileLatestRelease>('/api/mobile/latest-release'),
    {
      default: (): MobileLatestRelease => ({ configured: false }),
      getCachedData(key, nuxtApp) {
        return readPayloadCache(nuxtApp, key)
      }
    }
  )

  const mobileDownloadHref = computed(() => {
    if (!mobileRelease.value?.configured) return ''
    const r = mobileRelease.value
    return r.apkDownloadUrl || r.htmlUrl || r.fallbackUrl || ''
  })

  const mobileDownloadLabel = computed(() => {
    if (!mobileRelease.value?.configured) return 'Pobierz aplikację'
    return mobileRelease.value.apkDownloadUrl ? 'Pobierz aplikację (APK)' : 'Pobierz aplikację'
  })

  const mobileReleaseApiError = computed(() => mobileRelease.value?.apiError === true)

  const mobileReleaseHint = computed(() => {
    if (!mobileRelease.value?.configured) return ''
    if (mobileRelease.value.apiError) {
      return 'Nie udało się pobrać szczegółów z GitHub — link prowadzi do strony wydań. Spróbuj ponownie później.'
    }
    if (!mobileRelease.value.tagName?.trim()) {
      return 'Brak tagu wydania — użyj linku do strony GitHub Releases.'
    }
    return ''
  })

  return {
    mobileRelease,
    mobileDownloadHref,
    mobileDownloadLabel,
    mobileReleaseApiError,
    mobileReleaseHint
  }
}
