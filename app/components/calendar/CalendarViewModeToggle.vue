<script setup lang="ts">
import type { CalendarViewMode } from '~/composables/useCalendarViewMode'

const model = defineModel<CalendarViewMode>({ required: true })
</script>

<template>
  <div
    class="flex gap-1 rounded-xl border border-default/60 bg-muted/10 p-1"
    role="group"
    aria-label="Widok kalendarza"
  >
    <UButton
      size="sm"
      :variant="model === 'agenda' ? 'solid' : 'ghost'"
      color="neutral"
      icon="i-lucide-list"
      @click="model = 'agenda'"
    >
      Agenda
    </UButton>
    <UButton
      size="sm"
      :variant="model === 'grid' ? 'solid' : 'ghost'"
      color="neutral"
      icon="i-lucide-calendar-days"
      @click="model = 'grid'"
    >
      Kalendarz
    </UButton>
  </div>
</template>
