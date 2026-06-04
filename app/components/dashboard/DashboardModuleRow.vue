<script setup lang="ts">
type Tone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'

const props = defineProps<{
  title: string
  description: string
  icon: string
  to: string
  tone?: Tone
  iconWrapperClass?: string | null
}>()

const tone = computed<Tone>(() => props.tone ?? 'neutral')

const iconBgClass = computed(() => {
  if (tone.value === 'primary') return 'bg-primary/14 text-primary'
  if (tone.value === 'success') return 'bg-success/14 text-success'
  if (tone.value === 'warning') return 'bg-amber-500/14 text-amber-700 dark:text-amber-400'
  if (tone.value === 'error') return 'bg-red-500/14 text-red-600 dark:text-red-400'
  if (tone.value === 'info') return 'bg-info/14 text-info'
  return 'bg-muted/20 text-highlighted'
})

const iconWrapClass = computed(() => {
  const custom = props.iconWrapperClass?.trim()
  if (custom) return `${custom} ring-1 ring-inset ring-current/10`
  return iconBgClass.value
})
</script>

<template>
  <NuxtLink
    :to="to"
    class="group flex min-h-11 items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition duration-200 hover:border-primary/20 hover:bg-primary/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  >
    <span
      class="flex size-9 shrink-0 items-center justify-center rounded-lg"
      :class="iconWrapClass"
    >
      <UIcon :name="icon" class="size-4" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block truncate text-sm font-bold text-highlighted transition-colors group-hover:text-primary">
        {{ title }}
      </span>
      <span class="block truncate text-xs text-muted">
        {{ description }}
      </span>
    </span>
    <UIcon
      name="i-lucide-chevron-right"
      class="size-4 shrink-0 text-muted/50 transition group-hover:translate-x-0.5 group-hover:text-primary"
    />
  </NuxtLink>
</template>
