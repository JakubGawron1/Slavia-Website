<script setup lang="ts">
import type { Player } from '~/types/models'

defineProps<{
  players: Player[]
  loading?: boolean
}>()

const columns = [
  {
    accessorKey: 'full_name',
    header: 'Zawodnik'
  },
  {
    accessorKey: 'birth_year',
    header: 'Rok ur.',
    meta: { class: { th: 'text-center', td: 'text-center tabular-nums' } }
  },
  {
    accessorKey: 'weight_category',
    header: 'Kategoria',
    meta: { class: { th: 'text-center', td: 'text-center' } }
  },
  {
    accessorKey: 'best_snatch_kg',
    header: 'Rwanie (kg)',
    meta: { class: { th: 'text-center', td: 'text-center tabular-nums' } }
  },
  {
    accessorKey: 'best_clean_jerk_kg',
    header: 'Podrzut (kg)',
    meta: { class: { th: 'text-center', td: 'text-center tabular-nums' } }
  },
  {
    accessorKey: 'total_kg',
    header: 'Suma (kg)',
    meta: { class: { th: 'text-center', td: 'text-center tabular-nums' } }
  }
]
</script>

<template>
  <UCard
    :ui="{
      body: 'p-0 sm:p-0'
    }"
  >
    <UTable
      :data="players"
      :columns="columns"
      :loading="loading"
      empty="Brak zawodników do wyświetlenia."
      :ui="{
        td: 'max-w-[12rem] sm:max-w-none align-middle',
        th: 'text-muted font-semibold uppercase tracking-wide text-xs'
      }"
      class="min-w-[640px]"
    />
  </UCard>
</template>
