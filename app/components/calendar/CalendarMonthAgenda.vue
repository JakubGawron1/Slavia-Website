<script setup lang="ts">
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

export type CalendarAgendaEvent = {
  key: string
  title: string
  subtitle?: string
  chipClass: string
  icon: string
}

export type CalendarAgendaRow = {
  day: Date
  events: CalendarAgendaEvent[]
}

withDefaults(
  defineProps<{
    rows: CalendarAgendaRow[]
    title?: string
    emptyTitle?: string
    emptyDescription?: string
    canAddOnDay?: boolean
  }>(),
  {
    title: 'Agenda miesiąca',
    emptyTitle: 'Brak wydarzeń w tym miesiącu',
    emptyDescription: 'Przełącz miesiąc lub zmień filtry.'
  }
)

const emit = defineEmits<{
  select: [day: Date, event: CalendarAgendaEvent]
  addDay: [day: Date]
}>()
</script>

<template>
  <UCard class="rounded-2xl border-default/70 shadow-sm">
    <div class="flex items-center justify-between gap-2">
      <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
        {{ title }}
      </p>
      <UBadge variant="subtle" color="neutral">
        {{ rows.length }}
      </UBadge>
    </div>

    <div class="mt-3 space-y-2">
      <div
        v-for="row in rows"
        :key="row.day.toISOString()"
        class="rounded-xl border border-default/60 bg-muted/10 p-3"
      >
        <div class="flex items-center justify-between gap-2">
          <p class="font-bold text-highlighted">
            {{ format(row.day, 'EEEE · dd.MM', { locale: pl }) }}
          </p>
          <UButton
            v-if="canAddOnDay"
            size="xs"
            variant="ghost"
            icon="i-lucide-plus"
            @click="emit('addDay', row.day)"
          />
        </div>
        <div class="mt-2 space-y-1">
          <button
            v-for="ev in row.events"
            :key="ev.key"
            type="button"
            class="flex w-full items-start justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-all hover:brightness-110"
            :class="ev.chipClass"
            @click="emit('select', row.day, ev)"
          >
            <span class="min-w-0">
              <span class="block truncate font-bold">
                {{ ev.title }}
              </span>
              <span v-if="ev.subtitle" class="block truncate opacity-70">
                {{ ev.subtitle }}
              </span>
            </span>
            <UIcon
              :name="ev.icon"
              class="size-4 shrink-0 opacity-80"
            />
          </button>
        </div>
      </div>

      <UAlert
        v-if="rows.length === 0"
        icon="i-lucide-inbox"
        :title="emptyTitle"
        :description="emptyDescription"
        color="neutral"
        variant="subtle"
      />
    </div>
  </UCard>
</template>
