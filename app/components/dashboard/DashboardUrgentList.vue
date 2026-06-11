<script setup lang="ts">
defineProps<{
  title: string
  icon: string
  count?: number | null
  emptyText: string
  items: Array<{
    key: string
    title: string
    subtitle?: string | null
    badge?: { label: string, color?: 'primary' | 'neutral' | 'success' | 'warning' | 'error' | 'info' } | null
    primaryAction?: { label: string, onClick: () => void } | null
    secondaryAction?: { label: string, onClick: () => void, color?: 'error' | 'neutral' } | null
  }>
  footerLink?: { label: string, to: string } | null
}>()
</script>

<template>
  <div class="h-full rounded-2xl border border-default/70 bg-card p-5 shadow-sm ring-1 ring-default/30 sm:p-6">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-2.5">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/12 text-warning ring-1 ring-warning/20">
          <UIcon :name="icon" class="size-5" />
        </span>
        <h2 class="text-lg font-bold tracking-tight text-highlighted sm:text-xl">
          {{ title }}
          <span v-if="typeof count === 'number'" class="font-semibold text-muted">({{ count }})</span>
        </h2>
      </div>
      <slot name="actions" />
    </div>

    <SlaviaEmptyState
      v-if="items.length === 0"
      icon="i-lucide-inbox"
      :title="emptyText"
      compact
    />

    <div v-else class="space-y-2.5">
      <div
        v-for="it in items"
        :key="it.key"
        class="flex flex-col gap-3 rounded-xl border border-default/55 bg-muted/15 p-4 transition-colors hover:border-primary/25 hover:bg-muted/25 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <p class="font-semibold text-highlighted">
            {{ it.title }}
          </p>
          <p v-if="it.subtitle" class="mt-0.5 text-sm text-muted">
            {{ it.subtitle }}
          </p>
          <UBadge
            v-if="it.badge"
            class="mt-2"
            size="xs"
            variant="subtle"
            :color="it.badge.color || 'neutral'"
          >
            {{ it.badge.label }}
          </UBadge>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2">
          <UButton
            v-if="it.primaryAction"
            size="sm"
            class="min-h-10 shrink-0"
            @click="it.primaryAction.onClick"
          >
            {{ it.primaryAction.label }}
          </UButton>
          <UButton
            v-if="it.secondaryAction"
            size="sm"
            :color="it.secondaryAction.color || 'neutral'"
            variant="soft"
            class="min-h-10 shrink-0"
            @click="it.secondaryAction.onClick"
          >
            {{ it.secondaryAction.label }}
          </UButton>
        </div>
      </div>
    </div>

    <div v-if="footerLink" class="mt-5 border-t border-default/50 pt-4">
      <NuxtLink
        :to="footerLink.to"
        class="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-2 hover:underline"
      >
        {{ footerLink.label }}
        <UIcon name="i-lucide-arrow-right" class="size-4" />
      </NuxtLink>
    </div>
  </div>
</template>
