<script setup lang="ts">
import { resolveAuthProfilePhotoSrc } from '~/utils/profilePhoto'

const auth = useAuth()
const route = useRoute()
const appearance = useSlaviaAppearance()
const clubNotificationBellOn = useExperimentalFlag('club_notification_bell')
const devViewportIframePreviewOn = useExperimentalFlag('dev_viewport_iframe_preview')
/** Krótki splash tylko przy pierwszym paint — długi overlay blokował interakcję i powodował „trzeba odświeżyć”. */
const isAppLoading = ref(true)
const config = useRuntimeConfig()

const DEV_LS_MOBILE_PREVIEW = 'slavia-dev-mobile-preview'
const DEV_LS_MOBILE_PREVIEW_WIDTH = 'slavia-dev-mobile-preview-width'

function applyDevMobilePreviewFromStorage() {
  if (!import.meta.client) return
  // Podgląd iframe (DevViewportPreview) zastępuje ten stary CSS-only tryb,
  // ale zostawiamy kompatybilność, jeśli ktoś ma zapisane ustawienia w LS.
  const raw = localStorage.getItem(DEV_LS_MOBILE_PREVIEW)
  const on = raw === '1' || raw === 'true'
  document.documentElement.classList.toggle('slavia-dev-mobile-preview', on)

  const width = (localStorage.getItem(DEV_LS_MOBILE_PREVIEW_WIDTH) || '').trim()
  if (width) {
    document.documentElement.style.setProperty('--slavia-dev-mobile-width', width)
  } else {
    document.documentElement.style.removeProperty('--slavia-dev-mobile-width')
  }
}

onMounted(async () => {
  if (import.meta.client && auth.token.value) {
    await auth.fetchMe()
  }
  appearance.hydrate()
  applyDevMobilePreviewFromStorage()
  requestAnimationFrame(() => {
    isAppLoading.value = false
  })
})

watch(
  () => auth.token.value,
  async (t) => {
    if (!import.meta.client) {
      return
    }
    if (t) {
      await auth.fetchMe()
    }
    appearance.hydrate()
  }
)

watch(isAppLoading, (loading) => {
  if (!import.meta.client) return
  document.documentElement.classList.toggle('overflow-hidden', loading)
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.documentElement.classList.remove('overflow-hidden')
})

const dashboardLink = computed(() => {
  if (auth.isSuperAdmin.value) return '/superadmin'
  if (auth.isAdmin.value) return '/admin'
  if (auth.isTrainer.value) return '/trainer'
  return '/athlete'
})

/** Zdjęcie w navbarze: `avatar_url` konta lub zdjęcie profilu sportowego zawodnika. */
const navAvatarSrc = computed(() => resolveAuthProfilePhotoSrc(auth.user.value ?? undefined))

const colorMode = useColorMode()

const themeColor = computed(() =>
  colorMode.value === 'dark' ? '#140a0f' : '#faf7f6'
)

const title = 'CKS Slavia Ruda Śląska — podnoszenie ciężarów'
const description = 'Klub sportowy Slavia Ruda Śląska: zawodnicy, wyniki i społeczność skupiona wokół sportów siłowych.'
const siteUrl = computed(() => (config.public.siteUrl as string).replace(/\/$/, ''))
const socialImage = computed(() => `${siteUrl.value}/logo.png`)

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogSiteName: 'CKS Slavia Ruda Śląska',
  ogLocale: 'pl_PL',
  ogUrl: siteUrl,
  ogImage: socialImage,
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: socialImage,
  twitterCard: 'summary_large_image',
  robots: 'index, follow'
})

/** Canonical dla tras publicznych (panele nadpisują plugin `01-seo-route`). */
watch(
  () => route.path,
  (path) => {
    if (isSlaviaPrivateRoute(path)) return
    useHead({
      link: [{ rel: 'canonical', key: 'canonical', href: `${siteUrl.value}${path === '/' ? '' : path}` }]
    })
  },
  { immediate: true }
)

async function logout() {
  auth.logout()
  await navigateTo('/')
}

const { items: notifications, refresh: refreshNotifications } = useNotifications()
const unreadCount = computed(() => (notifications.value || []).filter(n => !n.is_read).length)

const faviconUrl = computed(() => {
  if (!unreadCount.value) return '/logo.png'
  const countStr = unreadCount.value > 9 ? '9+' : String(unreadCount.value)
  // Simple badge SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="15" fill="#0f172a" />
    <path d="M16 2L18.5 10H26.5L20 15L22.5 23L16 18L9.5 23L12 15L5.5 10H13.5L16 2Z" fill="#38bdf8" opacity="0.3" />
    <circle cx="24" cy="8" r="8" fill="#ef4444" />
    <text x="24" y="11" font-family="sans-serif" font-size="9" font-weight="900" fill="white" text-anchor="middle">${countStr}</text>
  </svg>`.trim()
  return `data:image/svg+xml;base64,${btoa(svg)}`
})

onMounted(() => {
  if (auth.isLoggedIn.value) {
    void refreshNotifications()
  }
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
    { name: 'theme-color', content: themeColor },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,100..900;1,100..900&family=Outfit:wght@100..900&display=swap' },
    { rel: 'manifest', href: '/manifest.webmanifest' },
    { rel: 'icon', type: unreadCount.value ? 'image/svg+xml' : 'image/png', href: faviconUrl },
    { rel: 'apple-touch-icon', href: '/logo.png' }
  ],
  htmlAttrs: {
    lang: 'pl'
  }
})
</script>

<template>
  <UApp>
    <ClubSlaviaAthleticsBackdrop />
    <Transition name="slavia-app-boot">
      <div
        v-if="isAppLoading"
        class="fixed inset-0 z-100 flex flex-col items-center justify-center gap-5 bg-background/96 backdrop-blur-md"
        aria-hidden="true"
      >
        <img
          src="/logo.png"
          alt=""
          class="h-14 w-auto drop-shadow-lg motion-safe:animate-pulse sm:h-16"
        >
        <div class="h-0.5 w-28 overflow-hidden rounded-full bg-muted/40">
          <div class="slavia-deco-barbell h-full w-full rounded-full bg-primary/80" />
        </div>
      </div>
    </Transition>
    <NuxtLoadingIndicator :color="'var(--ui-primary)'" />
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-200 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:ring-2 focus:ring-offset-2 focus:ring-white"
    >Przejdź do treści</a>
    <ClubWelcomeOnboarding />
    <DevViewportPreview v-if="devViewportIframePreviewOn" />
    <!-- Bez overflow-x na tym wrapperze: html/body już mają clip — podwójny clip ucinał obramowania / końcówki belki nawigacji (np. „Aktualności”). -->
    <div class="relative z-1 transition-opacity duration-300 ease-out min-w-0 opacity-100">
      <ClubSiteHeader>
        <template #actions>
          <div class="flex shrink-0 items-center gap-1 sm:gap-1.5 lg:gap-2">
            <ClubGlobalSearch />
            <template v-if="auth.isLoggedIn.value">
              <ClubNotificationBell v-if="clubNotificationBellOn" />
              <NuxtLink
                :to="dashboardLink"
                class="flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-primary/25 transition-all duration-200 hover:bg-primary/12 hover:ring-primary/40 sm:hidden"
                :aria-label="`Panel: ${auth.user.value?.username ?? ''}`"
              >
                <UAvatar
                  :src="navAvatarSrc"
                  :alt="auth.user.value?.username"
                  size="xs"
                  class="ring-1 ring-primary/30"
                />
              </NuxtLink>
              <div class="hidden items-center gap-2 sm:flex lg:gap-2.5">
                <NuxtLink
                  :to="dashboardLink"
                  class="group hidden max-w-40 items-center gap-2 rounded-full bg-primary/8 px-2.5 py-1.5 shadow-sm ring-1 ring-primary/25 transition-all duration-200 hover:bg-primary/14 xl:flex xl:max-w-48"
                >
                  <UAvatar
                    :src="navAvatarSrc"
                    :alt="auth.user.value?.username"
                    size="xs"
                    class="ring-1 ring-primary/20 shrink-0"
                  />
                  <span class="truncate text-sm font-semibold text-highlighted group-hover:text-primary">
                    {{ auth.user.value?.username }}
                  </span>
                </NuxtLink>
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-log-out"
                  class="text-muted hover:text-error shrink-0"
                  @click="logout"
                />
              </div>
            </template>
            <template v-else>
              <UButton
                to="/logowanie"
                icon="i-lucide-log-in"
                color="neutral"
                variant="ghost"
                size="lg"
                square
                class="rounded-xl sm:hidden"
                aria-label="Zaloguj się"
              />
              <UButton
                to="/logowanie"
                icon="i-lucide-log-in"
                size="sm"
                variant="solid"
                class="hidden font-bold sm:inline-flex"
              >
                Zaloguj się
              </UButton>
            </template>
            <UColorModeButton />
          </div>
        </template>
      </ClubSiteHeader>

      <UMain
        id="main-content"
        tabindex="-1"
        class="slavia-safe-x outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <NuxtPage />
      </UMain>

      <ClubSiteFooter />
    </div>
  </UApp>
</template>


