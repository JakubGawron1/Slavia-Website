<script setup lang="ts">
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'
import type { KlubHubContext } from '~/composables/useKlubHub'

const props = withDefaults(
  defineProps<{
    context?: KlubHubContext | null
    class?: string
  }>(),
  {
    context: null,
    class: ''
  }
)

const { copy, featuredStats, quickLinks, hasQuickLinks, pending, hubPath } = useKlubHub(props.context)
</script>

<template>
  <section
    class="klub-hub-section"
    :class="props.class"
    aria-label="Hub klubu"
  >
    <div class="overflow-hidden rounded-2xl border border-default/60 bg-card/80 shadow-sm ring-1 ring-default/20 backdrop-blur-sm">
      <div class="relative border-b border-default/50 bg-linear-to-br from-primary/10 via-emerald-500/8 to-sky-500/6 px-4 py-4 sm:px-5 sm:py-5">
        <div
          class="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/12 blur-3xl"
          aria-hidden="true"
        />
        <div class="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
              Strefa klubu
            </p>
            <h2 class="mt-1 text-lg font-black text-highlighted sm:text-xl">
              {{ copy.headline }}
            </h2>
            <p class="mt-1 max-w-xl text-sm text-muted">
              {{ copy.subline }}
            </p>
          </div>
          <UButton
            :to="hubPath"
            color="primary"
            variant="soft"
            size="sm"
            trailing-icon="i-lucide-arrow-right"
            class="shrink-0 self-start sm:self-center"
          >
            {{ copy.cta }}
          </UButton>
        </div>
      </div>

      <div class="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardKpiCard
          v-for="card in featuredStats"
          :key="card.label"
          :label="card.label"
          :value="pending ? '…' : card.value"
          :icon="card.icon"
          :tone="card.tone"
          :hint="card.hint"
          :to="card.to"
          size="compact"
        />
      </div>

      <div
        v-if="hasQuickLinks"
        class="border-t border-default/40 px-4 py-3 sm:px-5"
      >
        <p class="mb-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
          Szybkie wejścia
        </p>
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="link in quickLinks"
            :key="link.to"
            :to="link.to"
            class="inline-flex min-h-9 items-center gap-2 rounded-xl border border-default/60 bg-muted/8 px-3 py-1.5 text-sm font-bold text-highlighted transition-colors hover:border-primary/30 hover:bg-primary/8 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-current/10"
              :class="link.bg && link.color ? `${link.bg} ${link.color}` : 'bg-primary/10 text-primary'"
            >
              <UIcon :name="link.icon" class="size-3.5" />
            </span>
            <span class="truncate">{{ link.title }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
