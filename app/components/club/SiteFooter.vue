<script setup lang="ts">
import type { MobileReleaseInfo } from '~/types/models'

const config = useRuntimeConfig()
const apiFetch = useApi()

/** Lazy po kliencie — footer nie blokuje SSG/ISR. */
const { data: latestRelease } = await useAsyncData<MobileReleaseInfo | null>(
  'latest-mobile-release',
  () => apiFetch<MobileReleaseInfo>('/api/system/mobile-releases/latest').catch(() => null),
  { server: false, lazy: true, default: () => null }
)

const appReleaseLabel = computed(() => String(config.public.appVersion ?? ''))
</script>

<template>
  <footer
    class="border-t border-default bg-muted/5 py-8 slavia-safe-bottom slavia-safe-x lg:py-10"
  >
    <div class="mx-auto flex max-w-[1440px] flex-col gap-8 md:flex-row md:items-center md:justify-between lg:gap-12">
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
          <span class="flex items-center gap-2">
            <UIcon
              name="i-lucide-calendar"
              class="size-3"
            />
            Treningi: Pn, Śr, Pt (15:00 - 18:00)
          </span>
        </div>
        <div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
          <NuxtLink
            to="/o-klubie"
            class="font-semibold text-primary underline-offset-2 hover:underline"
          >
            O klubie
          </NuxtLink>
          <NuxtLink
            to="/klub/wyzwania"
            class="font-semibold text-primary underline-offset-2 hover:underline"
          >
            Wyzwania miesiąca
          </NuxtLink>
          <NuxtLink
            to="/zawodnicy"
            class="font-semibold text-primary underline-offset-2 hover:underline"
          >
            Zawodnicy
          </NuxtLink>
          <NuxtLink
            to="/kalendarz"
            class="font-semibold text-primary underline-offset-2 hover:underline"
          >
            Kalendarz
          </NuxtLink>
        </div>
        <div v-if="latestRelease" class="mt-2 flex items-center gap-4">
          <UButton
            :to="latestRelease.download_url"
            target="_blank"
            size="xs"
            color="primary"
            variant="soft"
            icon="i-lucide-smartphone"
            class="font-black uppercase tracking-widest text-[9px]"
          >
            Pobierz Aplikację (Android)
          </UButton>
          <span class="text-[9px] font-bold text-muted uppercase tracking-tighter">
            Wersja {{ latestRelease.version }}
          </span>
        </div>
      </div>

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
    </div>
  </footer>
</template>
