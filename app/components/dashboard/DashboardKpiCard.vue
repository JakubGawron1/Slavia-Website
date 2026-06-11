<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

type Tone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'

const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    icon: string
    tone?: Tone
    hint?: string | null
    to?: RouteLocationRaw | string
    /** Kompaktowy wariant na dashboardzie zawodnika */
    size?: 'default' | 'compact'
  }>(),
  {
    tone: undefined,
    hint: undefined,
    to: undefined,
    size: 'default'
  }
)

const tone = computed<Tone>(() => props.tone ?? 'neutral')

const iconClass = computed(() => {
  if (tone.value === 'primary') return 'bg-primary/12 text-primary ring-primary/20'
  if (tone.value === 'success') return 'bg-success/15 text-success ring-success/25'
  if (tone.value === 'warning') return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-500/20'
  if (tone.value === 'error') return 'bg-red-500/15 text-red-600 dark:text-red-400 ring-red-500/20'
  if (tone.value === 'info') return 'bg-info/14 text-info ring-info/22'
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
      class="h-full min-h-0 rounded-2xl border-default/70 shadow-sm ring-1 ring-default/30 transition-all duration-200"
      :class="[
        to ? 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/10 hover:shadow-md' : '',
        size === 'compact' ? 'p-0' : ''
      ]"
      :ui="size === 'compact' ? { body: 'p-3 sm:p-3.5' } : undefined"
    >
      <div
        class="flex gap-3"
        :class="size === 'compact' ? 'items-center' : 'items-start gap-4 sm:items-center'"
      >
        <div
          class="flex shrink-0 items-center justify-center rounded-xl ring-1"
          :class="[
            iconClass,
            size === 'compact' ? 'size-9' : 'h-12 w-12'
          ]"
        >
          <UIcon :name="icon" :class="size === 'compact' ? 'size-4' : 'size-6'" />
        </div>
        <div class="min-w-0 flex-1">
          <p
            class="font-bold uppercase tracking-wider text-muted"
            :class="size === 'compact' ? 'text-[10px]' : 'text-[11px]'"
          >
            {{ label }}
          </p>
          <p
            class="truncate font-black tabular-nums text-highlighted"
            :class="size === 'compact' ? 'text-xl' : 'text-2xl'"
          >
            {{ value }}
          </p>
          <p
            v-if="hint"
            class="line-clamp-2 text-muted"
            :class="size === 'compact' ? 'mt-0.5 text-[10px] leading-snug' : 'mt-0.5 line-clamp-1 text-[11px]'"
          >
            {{ hint }}
          </p>
        </div>
      </div>
    </UCard>
  </component>
</template>

