<script setup lang="ts">
definePageMeta({
  middleware: 'diary-redirect'
})

useSeoMeta({
  title: 'Dziennik — Slavia',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout padding="compact" :animate="false">
    <div class="flex min-h-[50vh] items-center justify-center py-12">
      <div
        class="slavia-section-card flex max-w-sm flex-col items-center gap-4 px-8 py-10 text-center"
        role="status"
        aria-live="polite"
      >
        <span
          class="flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20"
        >
          <UIcon
            name="i-lucide-book-open"
            class="size-7"
          />
        </span>
        <div>
          <p class="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
            Dziennik treningowy
          </p>
          <p class="mt-2 text-sm font-medium text-muted">
            Przekierowanie do właściwego widoku…
          </p>
        </div>
        <UIcon
          name="i-lucide-loader-2"
          class="size-6 animate-spin text-primary"
          aria-hidden="true"
        />
      </div>
    </div>
  </PanelPageLayout>
</template>
