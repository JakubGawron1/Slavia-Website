<script setup lang="ts">
type Tone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'

const props = defineProps<{
  title: string
  description: string
  icon: string
  to: string | { path: string, hash?: string }
  tone?: Tone
  /** Pełne klasy Tailwind (tło + kolor ikony); nadpisuje styl z `tone` dla kwadratu z ikoną. */
  iconWrapperClass?: string | null
  badge?: string | number | null
}>()

const tone = computed<Tone>(() => props.tone ?? 'neutral')

const iconBgClass = computed(() => {
  if (tone.value === 'primary') return 'bg-primary/15 text-primary'
  if (tone.value === 'success') return 'bg-success/14 text-success'
  if (tone.value === 'warning') return 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
  if (tone.value === 'error') return 'bg-red-500/15 text-red-600 dark:text-red-400'
  if (tone.value === 'info') return 'bg-info/14 text-info'
  return 'bg-muted/25 text-highlighted'
})

const resolvedIconWrapClass = computed(() => {
  const custom = props.iconWrapperClass?.trim()
  if (custom) return `${custom} ring-1 ring-inset ring-current/12`
  return iconBgClass.value
})

const ringClass = computed(() => {
  if (tone.value === 'primary') return 'ring-primary/20 hover:ring-primary/40'
  if (tone.value === 'success') return 'ring-success/25 hover:ring-success/45'
  if (tone.value === 'warning') return 'ring-amber-500/20 hover:ring-amber-500/40'
  if (tone.value === 'error') return 'ring-red-500/20 hover:ring-red-500/40'
  if (tone.value === 'info') return 'ring-info/25 hover:ring-info/45'
  return 'ring-default/25 hover:ring-primary/25'
})
</script>

<template>
  <NuxtLink
    :to="to"
    class="group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-default/60 bg-card p-5 shadow-sm ring-1 ring-transparent transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    :class="ringClass"
  >
    <div class="flex min-h-0 flex-1 items-start justify-between gap-3">
      <div class="flex min-w-0 items-start gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl" :class="resolvedIconWrapClass">
          <UIcon :name="icon" class="size-5" />
        </div>
        <div class="min-w-0">
          <p class="font-bold text-highlighted transition-colors group-hover:text-primary">
            {{ title }}
          </p>
          <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
            {{ description }}
          </p>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <UBadge v-if="badge != null && badge !== ''" color="neutral" variant="subtle" size="sm" class="font-mono">
          {{ badge }}
        </UBadge>
        <UIcon
          name="i-lucide-arrow-up-right"
          class="size-5 text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
        />
      </div>
    </div>
  </NuxtLink>
</template>

