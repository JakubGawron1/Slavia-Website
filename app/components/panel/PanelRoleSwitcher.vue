<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  dashboards: Array<{ label: string, to: string, icon: string }>
}>()
</script>

<template>
  <div
    v-if="dashboards.length"
    class="rounded-2xl border border-default/70 bg-muted/10 p-4 shadow-sm ring-1 ring-default/25 sm:p-5"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-wider text-muted">
          {{ title ?? 'Inne panele na tym koncie' }}
        </p>
        <p class="mt-1 text-sm text-muted">
          {{ description ?? 'Masz więcej ról — możesz przełączyć dashboard.' }}
        </p>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <UButton
          v-for="d in dashboards"
          :key="d.to"
          :to="d.to"
          :icon="d.icon"
          variant="outline"
          color="neutral"
          size="lg"
          class="min-h-11 justify-center"
        >
          {{ d.label }}
        </UButton>
      </div>
    </div>
  </div>
</template>
