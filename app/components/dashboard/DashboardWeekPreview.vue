<script setup lang="ts">
import type { MyCalendarEntry } from '~/types/models'

const props = defineProps<{
  entry: MyCalendarEntry | null
  daysUntil: number | null
}>()

const eventDate = computed(() => props.entry?.competition?.date?.slice(0, 10) ?? null)
const eventTitle = computed(() => props.entry?.competition?.title?.trim() || 'Wydarzenie')
const eventLocation = computed(() => props.entry?.competition?.location?.trim() || null)
const isTraining = computed(() => (props.entry?.competition?.category ?? '').toLowerCase() === 'training')

const countdownLabel = computed(() => {
  const d = props.daysUntil
  if (d === null) return null
  if (d === 0) return 'Dzisiaj'
  if (d === 1) return 'Jutro'
  return `Za ${d} dni`
})

const formattedDate = computed(() => {
  if (!eventDate.value) return '—'
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date(eventDate.value))
  } catch {
    return eventDate.value
  }
})
</script>

<template>
  <div class="slavia-week-preview slavia-page-card overflow-hidden p-0">
    <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div class="flex min-w-0 items-start gap-4">
        <span
          class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-info/12 text-info ring-1 ring-info/25"
        >
          <UIcon
            :name="isTraining ? 'i-lucide-dumbbell' : 'i-lucide-calendar-days'"
            class="size-6"
          />
        </span>
        <div class="min-w-0">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
            Najbliższe w kalendarzu
          </p>
          <template v-if="entry">
            <h3 class="mt-1 truncate text-lg font-black text-highlighted">
              {{ eventTitle }}
            </h3>
            <p class="mt-0.5 text-sm text-muted capitalize">
              {{ formattedDate }}
              <span v-if="eventLocation"> · {{ eventLocation }}</span>
            </p>
          </template>
          <p v-else class="mt-1 text-sm text-muted">
            Brak zaplanowanych startów — sprawdź kalendarz klubu.
          </p>
        </div>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        <UBadge
          v-if="countdownLabel"
          :color="daysUntil === 0 ? 'warning' : 'primary'"
          variant="soft"
          size="md"
          class="font-bold"
        >
          {{ countdownLabel }}
        </UBadge>
        <UButton
          to="/athlete/kalendarz"
          size="sm"
          variant="soft"
          color="primary"
          trailing-icon="i-lucide-arrow-right"
        >
          Kalendarz
        </UButton>
      </div>
    </div>
  </div>
</template>
