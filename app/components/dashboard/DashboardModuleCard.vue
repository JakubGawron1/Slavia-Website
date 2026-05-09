<script setup lang="ts">
type Tone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'

const props = defineProps<{
  title: string
  description: string
  icon: string
  to: string | { path: string, hash?: string }
  tone?: Tone
  badge?: string | number | null
}>()

const tone = computed<Tone>(() => props.tone ?? 'neutral')

const iconBgClass = computed(() => {
  if (tone.value === 'primary') return 'bg-primary/15 text-primary'
  if (tone.value === 'success') return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
  if (tone.value === 'warning') return 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
  if (tone.value === 'error') return 'bg-red-500/15 text-red-600 dark:text-red-400'
  if (tone.value === 'info') return 'bg-sky-500/15 text-sky-700 dark:text-sky-400'
  return 'bg-muted/25 text-highlighted'
})

const ringClass = computed(() => {
  if (tone.value === 'primary') return 'ring-primary/20 hover:ring-primary/40'
  if (tone.value === 'success') return 'ring-emerald-500/20 hover:ring-emerald-500/40'
  if (tone.value === 'warning') return 'ring-amber-500/20 hover:ring-amber-500/40'
  if (tone.value === 'error') return 'ring-red-500/20 hover:ring-red-500/40'
  if (tone.value === 'info') return 'ring-sky-500/20 hover:ring-sky-500/40'
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
        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl" :class="iconBgClass">
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

