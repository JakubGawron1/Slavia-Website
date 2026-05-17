<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: string
    badge?: string
    badgeColor?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'
    tone?: 'default' | 'danger' | 'accent'
  }>(),
  { badgeColor: 'neutral', tone: 'default' }
)
const sectionClass = computed(() => {
  if (props.tone === 'danger') return 'rounded-2xl border border-error/45 bg-error/5 p-6 shadow-sm ring-1 ring-error/20 sm:p-7'
  if (props.tone === 'accent') return 'relative overflow-hidden rounded-2xl border border-primary/30 bg-linear-to-br from-primary/10 via-card to-card p-6 shadow-sm ring-1 ring-primary/20 sm:p-7'
  return 'rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7'
})
</script>
<template>
  <section :class="sectionClass">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="flex min-w-0 items-start gap-3">
        <div v-if="icon" class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <UIcon :name="icon" class="size-5" />
        </div>
        <div class="min-w-0">
          <h2 class="text-base font-bold text-highlighted">{{ title }}</h2>
          <p v-if="description" class="mt-1 text-sm leading-relaxed text-muted">{{ description }}</p>
        </div>
      </div>
      <UBadge v-if="badge" variant="soft" :color="badgeColor" size="xs" class="shrink-0 uppercase tracking-wide">{{ badge }}</UBadge>
    </div>
    <div class="mt-5"><slot /></div>
  </section>
</template>
