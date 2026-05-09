<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

type Tone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'

const props = defineProps<{
  label: string
  value: string | number
  icon: string
  tone?: Tone
  hint?: string | null
  to?: RouteLocationRaw | string
}>()

const tone = computed<Tone>(() => props.tone ?? 'neutral')

const iconClass = computed(() => {
  if (tone.value === 'primary') return 'bg-primary/12 text-primary ring-primary/20'
  if (tone.value === 'success') return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20'
  if (tone.value === 'warning') return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-500/20'
  if (tone.value === 'error') return 'bg-red-500/15 text-red-600 dark:text-red-400 ring-red-500/20'
  if (tone.value === 'info') return 'bg-sky-500/15 text-sky-700 dark:text-sky-400 ring-sky-500/20'
  return 'bg-muted/30 text-highlighted ring-default/30'
})
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to || undefined"
    class="block h-full min-h-0 focus:outline-none"
  >
    <UCard
      class="h-full min-h-0 rounded-2xl border-default/70 shadow-sm ring-1 ring-default/30 transition-colors"
      :class="to ? 'cursor-pointer hover:bg-muted/10' : ''"
    >
      <div class="flex items-start gap-4 sm:items-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl ring-1" :class="iconClass">
          <UIcon :name="icon" class="size-6" />
        </div>
        <div class="min-w-0">
          <p class="text-[11px] font-bold uppercase tracking-wider text-muted">
            {{ label }}
          </p>
          <p class="truncate text-2xl font-black tabular-nums text-highlighted">
            {{ value }}
          </p>
          <p v-if="hint" class="mt-0.5 line-clamp-1 text-[11px] text-muted">
            {{ hint }}
          </p>
        </div>
      </div>
    </UCard>
  </component>
</template>

