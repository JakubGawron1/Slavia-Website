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
  <div class="rounded-2xl border border-default bg-card p-6">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-lg font-semibold text-highlighted sm:text-xl">
        <UIcon :name="icon" class="mr-2 inline" />
        {{ title }}
        <span v-if="typeof count === 'number'" class="text-muted">({{ count }})</span>
      </h2>
      <slot name="actions" />
    </div>

    <div
      v-if="items.length === 0"
      class="rounded-xl border border-dashed border-default/70 bg-muted/10 px-4 py-8 text-center text-sm text-muted"
    >
      {{ emptyText }}
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="it in items"
        :key="it.key"
        class="flex flex-col gap-3 rounded-xl border border-default/50 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <p class="font-medium text-highlighted">
            {{ it.title }}
          </p>
          <p v-if="it.subtitle" class="text-sm text-muted">
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
      <NuxtLink :to="footerLink.to" class="text-sm font-semibold text-primary underline-offset-2 hover:underline">
        {{ footerLink.label }}
      </NuxtLink>
    </div>
  </div>
</template>

