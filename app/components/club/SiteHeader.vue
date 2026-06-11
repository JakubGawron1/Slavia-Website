<script setup lang="ts">
const config = useRuntimeConfig()

/** Jedno źródło: `package.json` → `runtimeConfig.public.appVersion` (np. v3.0.0-dev). */
const navPreReleaseBadge = computed(() => {
  const v = String(config.public.appVersion ?? '')
  if (/\bdev\b/i.test(v)) {
    return { label: 'Dev', color: 'info' as const, title: 'Wersja rozwojowa (dev) — funkcje i API mogą się zmieniać.' }
  }
  if (/\bbeta\b/i.test(v)) {
    return { label: 'Beta', color: 'warning' as const, title: 'Aplikacja w fazie beta — funkcje i dane mogą się zmieniać.' }
  }
  return null
})
</script>

<template>
  <header
    class="slavia-site-header sticky top-0 z-50"
  >
    <!-- Belka: wstecz + marka | linki (środek, przewijane) | narzędzia + akcje. Bez overflow-hidden — clip na html/body wystarczy. -->
    <div class="mx-auto flex w-full max-w-[1440px] items-center gap-1.5 px-3 py-2 sm:gap-2 sm:px-4 sm:py-2.5 lg:min-h-[3.75rem] lg:gap-2.5 lg:px-6 lg:py-0 xl:gap-3 xl:px-8">
      <div class="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <ClubSiteHeaderBackButton />
        <div class="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <ClubBrand />
          <UBadge
            v-if="navPreReleaseBadge"
            :color="navPreReleaseBadge.color"
            variant="subtle"
            size="sm"
            class="hidden shrink-0 font-bold uppercase tracking-wide sm:inline-flex"
            :title="navPreReleaseBadge.title"
          >
            <span class="sr-only">{{ navPreReleaseBadge.title }} </span>
            {{ navPreReleaseBadge.label }}
          </UBadge>
        </div>
        <ClubSiteNav
          mode="drawer"
          class="lg:hidden"
        />
      </div>

      <div class="hidden min-w-0 flex-1 lg:block lg:px-1">
        <ClubSiteNav mode="links" />
      </div>

      <div class="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 lg:gap-1.5">
        <ClubSiteNav
          mode="tools"
          class="hidden lg:flex"
        />
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
