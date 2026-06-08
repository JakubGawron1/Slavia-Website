<script setup lang="ts">
import type { ExerciseSubmissionDto } from '~/types/models'

defineProps<{
  submissions: ExerciseSubmissionDto[]
  pending?: boolean
}>()

function statusColor(s: ExerciseSubmissionDto['status']) {
  if (s === 'Approved') return 'success'
  if (s === 'Rejected') return 'error'
  return 'warning'
}
</script>

<template>
  <UCard>
    <h2 class="mb-3 text-lg font-semibold text-highlighted">Moje zgłoszenia</h2>
    <div v-if="pending" class="flex items-center gap-2 text-muted">
      <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
      Ładowanie…
    </div>
    <div v-else-if="submissions.length === 0" class="text-sm text-muted">
      Brak zgłoszeń. Wyślij pierwszy wynik powyżej.
    </div>
    <div v-else class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="border-b border-default text-left text-muted">
            <th class="py-2 pr-3">Data</th>
            <th class="py-2 px-3">Ćwiczenie</th>
            <th class="py-2 px-3 text-right">Wynik</th>
            <th class="py-2 px-3">Status</th>
            <th class="py-2 pl-3">Uwagi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in submissions" :key="s.id" class="border-b border-default/60 align-top">
            <td class="py-2 pr-3 font-mono text-xs text-muted">{{ s.performed_at }}</td>
            <td class="py-2 px-3 font-medium text-highlighted">{{ s.exercise_name }}</td>
            <td class="py-2 px-3 text-right font-mono font-bold text-highlighted">
              {{ s.value }} {{ s.unit }}
            </td>
            <td class="py-2 px-3">
              <UBadge size="xs" variant="subtle" :color="statusColor(s.status)">{{ s.status }}</UBadge>
            </td>
            <td class="py-2 pl-3 text-xs text-muted">
              <div v-if="s.review_note" class="mb-1">
                <span class="font-semibold">Kadra:</span> {{ s.review_note }}
              </div>
              <div v-if="s.notes">
                <span class="font-semibold">Ty:</span> {{ s.notes }}
              </div>
              <span v-if="!s.notes && !s.review_note">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
