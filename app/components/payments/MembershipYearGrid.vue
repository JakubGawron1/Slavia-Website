<script setup lang="ts">
import type { PaymentMonthStatusRow } from '~/types/models'
import {
  membershipYearStats,
  monthLabelPl,
  paymentMonthRowMeta
} from '~/utils/paymentSemantics'

const props = withDefaults(
  defineProps<{
    rows: PaymentMonthStatusRow[]
    loading?: boolean
    year: number
    allowedYears: number[]
    selectedMonth?: string | null
    currentMonth?: string | null
  }>(),
  {
    loading: false,
    selectedMonth: null,
    currentMonth: null
  }
)

const emit = defineEmits<{
  'select-month': [month: string]
  'update:year': [year: number]
}>()

const stats = computed(() => membershipYearStats(props.rows))

const toneShell: Record<string, string> = {
  success: 'border-success/45 bg-linear-to-br from-success/16 to-success/5 ring-success/20',
  error: 'border-error/45 bg-linear-to-br from-error/14 to-error/5 ring-error/20',
  warning: 'border-warning/45 bg-linear-to-br from-warning/14 to-warning/5 ring-warning/20',
  neutral: 'border-default/55 bg-muted/10 ring-default/20'
}

const toneIcon: Record<string, string> = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  neutral: 'text-muted'
}

function tileClass(r: PaymentMonthStatusRow) {
  const meta = paymentMonthRowMeta(r)
  const isSelected = props.selectedMonth === r.month
  const isCurrent = props.currentMonth === r.month
  return [
    toneShell[meta.tone],
    isSelected ? 'ring-2 ring-primary shadow-md shadow-primary/10' : 'ring-1',
    isCurrent && !isSelected ? 'ring-2 ring-primary/40' : '',
    'hover:scale-[1.02] active:scale-[0.98]'
  ]
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          Widok roczny
        </p>
        <p class="mt-1 text-xl font-black text-highlighted sm:text-2xl">
          {{ year }}
        </p>
        <div v-if="rows.length" class="mt-2 flex flex-wrap gap-2">
          <UBadge color="success" variant="subtle" size="sm">{{ stats.paid }} opłacone</UBadge>
          <UBadge v-if="stats.pending" color="warning" variant="subtle" size="sm">{{ stats.pending }} oczekuje</UBadge>
          <UBadge v-if="stats.overdue" color="error" variant="subtle" size="sm">{{ stats.overdue }} zaległe</UBadge>
        </div>
      </div>
      <UFormField label="Rok" size="xs" class="w-40 shrink-0">
        <USelect
          v-if="allowedYears.length > 1"
          :model-value="year"
          :items="allowedYears.map(y => ({ label: String(y), value: y }))"
          class="w-full"
          @update:model-value="emit('update:year', $event as number)"
        />
        <UInput
          v-else
          :model-value="String(allowedYears[0])"
          disabled
          size="sm"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      <div v-if="loading" class="col-span-full flex justify-center py-14">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
      </div>
      <button
        v-for="r in rows"
        v-else
        :key="r.month"
        type="button"
        class="group flex flex-col rounded-2xl border p-3 text-left transition-all duration-200 sm:p-4"
        :class="tileClass(r)"
        @click="emit('select-month', r.month)"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
              {{ monthLabelPl(r.month, true) }}
            </p>
            <p class="truncate text-sm font-black text-highlighted sm:text-base">
              {{ monthLabelPl(r.month) }}
            </p>
          </div>
          <UIcon
            :name="paymentMonthRowMeta(r).icon"
            class="size-5 shrink-0 transition-transform group-hover:scale-110"
            :class="toneIcon[paymentMonthRowMeta(r).tone]"
          />
        </div>
        <p class="mt-2 text-[11px] font-semibold" :class="toneIcon[paymentMonthRowMeta(r).tone]">
          {{ paymentMonthRowMeta(r).label }}
        </p>
        <p class="mt-0.5 font-mono text-[10px] text-muted">
          do {{ r.due_date.slice(8, 10) }}.{{ r.due_date.slice(5, 7) }}
        </p>
      </button>
      <p v-if="!loading && rows.length === 0" class="col-span-full py-10 text-center text-sm text-muted">
        Brak danych dla tego roku.
      </p>
    </div>
  </div>
</template>
