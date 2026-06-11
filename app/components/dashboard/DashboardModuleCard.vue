<script setup lang="ts">
type Tone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'

const props = defineProps<{
  title: string
  description: string
  icon: string
  to: string
  tone?: Tone
  iconWrapperClass?: string | null
  /** Moduł wyłączony flagą panel_nav — widoczny tylko dla SuperAdmina */
  disabled?: boolean
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

const shellClass = computed(() => {
  if (props.disabled) {
    return 'border-dashed border-default/55 bg-muted/5 opacity-85 hover:border-default/70 hover:bg-muted/8'
  }
  return 'border-default/55 bg-card/90 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md'
})
</script>

<template>
  <NuxtLink
    :to="to"
    class="slavia-module-card group flex h-full min-h-[5.5rem] flex-col rounded-2xl border p-3.5 shadow-sm ring-1 ring-default/15 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-4"
    :class="shellClass"
  >
    <div class="flex items-start gap-3">
      <span
        class="flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11"
        :class="iconWrapClass"
      >
        <UIcon :name="icon" class="size-5" />
      </span>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="line-clamp-1 text-sm font-bold text-highlighted transition-colors group-hover:text-primary">
            {{ title }}
          </span>
          <UBadge
            v-if="disabled"
            color="neutral"
            variant="subtle"
            size="xs"
            icon="i-lucide-eye-off"
          >
            Wyłączony
          </UBadge>
        </div>
        <p class="mt-0.5 line-clamp-2 text-xs leading-snug text-muted">
          {{ description }}
        </p>
      </div>
      <UIcon
        name="i-lucide-arrow-up-right"
        class="size-4 shrink-0 text-muted/40 transition group-hover:text-primary"
        :class="disabled ? 'opacity-50' : ''"
      />
    </div>
  </NuxtLink>
</template>
