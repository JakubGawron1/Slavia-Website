<script setup lang="ts">
import type { HomeChampionRow } from '~/data/homePageContent'
import { athleteProfilePath } from '~/utils/slug'

defineProps<{
  champions: HomeChampionRow[]
}>()
</script>

<template>
  <section
    v-if="champions.length > 0"
    class="slavia-public-section slavia-public-section--band"
  >
    <UContainer>
      <PublicSectionHead
        eyebrow="Mistrzowie klubu"
        eyebrow-accent="amber"
        :title="`Top ${champions.length} Sinclair`"
        lead="Aktualne podium klubowe według punktów Sinclair (wzór IWF 2025–2028) — niezależne od kategorii wagowej i płci."
      />

      <div class="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3 sm:items-end sm:gap-6">
        <NuxtLink
          v-for="p in champions"
          :key="`pod-${p.id}`"
          :to="athleteProfilePath(p.full_name, p.id)"
          class="group relative overflow-hidden rounded-3xl border border-default/60 bg-linear-to-b from-card to-card/80 p-5 text-center shadow-sm ring-1 ring-default/30 transition-all hover:-translate-y-1 hover:shadow-xl"
          :class="{
            'order-1 sm:order-2 sm:scale-105 sm:border-amber-500/40 sm:ring-amber-500/30 sm:shadow-lg': p === champions[0],
            'order-2 sm:order-1 sm:border-slate-400/30 sm:ring-slate-400/20': p === champions[1],
            'order-3 sm:order-3 sm:border-amber-700/30 sm:ring-amber-700/20': p === champions[2]
          }"
        >
          <div
            class="absolute inset-x-0 top-0 h-1.5 rounded-t-3xl"
            :class="{
              'bg-linear-to-r from-amber-300 via-amber-500 to-amber-300': p === champions[0],
              'bg-linear-to-r from-slate-300 via-slate-400 to-slate-300': p === champions[1],
              'bg-linear-to-r from-amber-600 via-amber-700 to-amber-600': p === champions[2]
            }"
          />
          <div class="relative mx-auto mt-3 size-24 sm:size-28">
            <UAvatar
              :src="p.image_url || undefined"
              :alt="p.full_name"
              size="3xl"
              class="size-full ring-4 ring-card shadow-lg"
            />
            <div
              class="absolute -bottom-2 -right-2 flex size-9 items-center justify-center rounded-full text-sm font-black text-white shadow-lg ring-4 ring-card"
              :class="{
                'bg-amber-500': p === champions[0],
                'bg-slate-500': p === champions[1],
                'bg-amber-700': p === champions[2]
              }"
            >
              {{ p === champions[0] ? '1' : p === champions[1] ? '2' : '3' }}
            </div>
          </div>
          <p class="mt-5 text-base font-black text-highlighted group-hover:text-primary">
            {{ p.full_name }}
          </p>
          <p class="mt-1 text-xs text-muted">
            {{ p.weightCategory || '—' }}
          </p>
          <div class="mt-4 flex items-center justify-center gap-3 text-sm">
            <span class="rounded-full bg-muted/30 px-3 py-1 font-mono font-bold text-highlighted tabular-nums">
              {{ p.total }} kg
            </span>
            <span class="rounded-full bg-amber-500/15 px-3 py-1 font-mono font-black text-amber-700 tabular-nums dark:text-amber-300">
              {{ p.sinclair }}
            </span>
          </div>
        </NuxtLink>
      </div>

      <div class="slavia-public-section-cta">
        <UButton
          to="/zawodnicy"
          size="lg"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-arrow-right"
          class="font-bold"
        >
          Pełny ranking i lista zawodników
        </UButton>
      </div>
    </UContainer>
  </section>
</template>
