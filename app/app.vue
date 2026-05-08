<script setup lang="ts">
import { resolveAuthProfilePhotoSrc } from '~/utils/profilePhoto'

const auth = useAuth()
const route = useRoute()
const appearance = useSlaviaAppearance()
const clubNotificationBellOn = useExperimentalFlag('club_notification_bell')
/** Krótki splash tylko przy pierwszym paint — długi overlay blokował interakcję i powodował „trzeba odświeżyć”. */
const isAppLoading = ref(true)
const config = useRuntimeConfig()

onMounted(async () => {
  if (import.meta.client && auth.token.value) {
    await auth.fetchMe()
  }
  appearance.hydrate()
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

const title = 'CKS Slavia Ruda Śląska — podnoszenie ciężarów'
const description = 'Klub sportowy Slavia Ruda Śląska: zawodnicy, wyniki i społeczność skupiona wokół sportów siłowych.'
const siteUrl = computed(() => (config.public.siteUrl as string).replace(/\/$/, ''))
const socialImage = computed(() => `${siteUrl.value}/logo.png`)
const appReleaseLabel = computed(() => String(config.public.appVersion ?? ''))

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
    { name: 'theme-color', content: '#0f172a' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
  ],
  link: [
    { rel: 'icon', type: 'image/png', href: '/logo.png' },
    { rel: 'apple-touch-icon', href: '/logo.png' }
  ],
  htmlAttrs: {
    lang: 'pl'
  }
})

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
  twitterCard: 'summary_large_image'
})

async function logout() {
  auth.logout()
  await navigateTo('/')
}

async function goBack() {
  if (!import.meta.client) return
  if (window.history.length > 1) {
    window.history.back()
    return
  }
  await navigateTo('/')
}

/** Pływający „wstecz”: tylko gdy jest sensowny wpis w historii (np. `/` po deep linku z jednym wpisem — bez przycisku). */
const showFloatingBack = ref(false)

function syncFloatingBackVisibility() {
  if (!import.meta.client) return
  showFloatingBack.value = window.history.length > 1
}

onMounted(() => {
  syncFloatingBackVisibility()
})

watch(
  () => route.fullPath,
  () => {
    nextTick(() => syncFloatingBackVisibility())
  }
)
</script>

<template>
  <UApp>
    <!-- Bez overflow-x na tym wrapperze: html/body już mają clip — podwójny clip ucinał obramowania / końcówki belki nawigacji (np. „Aktualności”). -->
    <div class="transition-opacity duration-300 ease-out min-w-0 opacity-100">
      <ClubSiteHeader>
        <template #actions>
          <div class="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <template v-if="auth.isLoggedIn.value">
              <ClubNotificationBell v-if="clubNotificationBellOn" />
              <NuxtLink
                :to="dashboardLink"
                class="flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-primary/25 transition-colors hover:bg-primary/10 sm:hidden"
                :aria-label="`Panel: ${auth.user.value?.username ?? ''}`"
              >
                <UAvatar
                  :src="navAvatarSrc"
                  :alt="auth.user.value?.username"
                  size="xs"
                  class="ring-1 ring-primary/30"
                />
              </NuxtLink>
              <div class="hidden items-center gap-3 sm:flex sm:gap-4">
                <NuxtLink
                  :to="dashboardLink"
                  class="group flex max-w-[11rem] items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 transition-all hover:bg-primary/14 ring-1 ring-primary/22 lg:max-w-[14rem] lg:px-4"
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

      <UButton
        v-if="showFloatingBack"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        size="lg"
        square
        class="fixed z-70 rounded-full border border-default/70 bg-background/92 text-highlighted shadow-lg shadow-black/10 backdrop-blur-md ring-2 ring-primary/22 transition-colors hover:bg-primary/12 hover:text-primary hover:ring-primary/45 touch-manipulation left-[max(0.75rem,env(safe-area-inset-left))] top-[calc(env(safe-area-inset-top,0)+5.15rem)] sm:left-[max(1rem,env(safe-area-inset-left))] sm:top-[calc(env(safe-area-inset-top,0)+5.35rem)] lg:top-[calc(env(safe-area-inset-top,0)+5rem)] dark:shadow-black/25"
        aria-label="Wstecz"
        @click="goBack"
      />

      <UMain class="slavia-safe-x">
        <NuxtPage />
      </UMain>

      <UFooter
        class="border-t border-default bg-muted/5 py-8 slavia-safe-bottom slavia-safe-x lg:py-10"
        :ui="{ container: 'flex flex-col gap-8 md:flex-row md:items-center md:justify-between lg:gap-12' }"
      >
        <template #left>
          <div class="flex flex-col gap-2">
            <p class="text-sm font-bold text-highlighted uppercase tracking-widest">
              CKS Slavia Ruda Śląska
            </p>
            <div class="flex flex-col text-xs text-muted">
              <a
                href="https://maps.app.goo.gl/zqGy466nizCv45c57"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 hover:text-highlighted transition-colors"
              >
                <UIcon
                  name="i-lucide-map-pin"
                  class="size-3"
                />
                ul. Konopnickiej 13, 41-700 Ruda Śląska
              </a>
              <span class="flex items-center gap-2"><UIcon
                name="i-lucide-calendar"
                class="size-3"
              /> Treningi: Pn, Śr, Pt (15:00 - 18:00)</span>
            </div>
          </div>
        </template>

        <template #right>
          <div class="flex w-full flex-col gap-2 text-left md:w-auto md:items-end md:text-right">
            <p class="text-xs text-muted">
              © {{ new Date().getFullYear() }} Slavia Ruda Śląska.
            </p>
            <p class="text-[10px] text-muted/50">
              Realizacja: Neution Studio · Jakub Gawron · Dawid Węgrzyn
            </p>
            <p
              class="text-[10px] font-mono text-muted/70"
              aria-label="Wersja aplikacji"
            >
              Wersja {{ appReleaseLabel }}
            </p>
          </div>
        </template>
      </UFooter>
    </div>
  </UApp>
</template>

<style>
/* Globalne przejścia stron */
.page-enter-active,
.page-leave-active {
  transition: all 0.4s ease-out;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
  filter: blur(4px);
}
</style>
