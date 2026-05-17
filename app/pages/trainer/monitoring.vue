<script setup lang="ts">
definePageMeta({ middleware: 'trainer' })

type AuditEvent = {
  id: string
  actor_user_id?: string | null
  actor_role?: string | null
  category: string
  action: string
  target_type?: string | null
  target_id?: string | null
  details?: string | null
  created_at: string
}

type SystemMetrics = {
  athletes_count: number
  active_plans_count: number
  pending_results_count: number
  unread_notifications_count: number
  recovery_checkins_7d_count: number
  recent_events: AuditEvent[]
}

const apiFetch = useApi()

const { data, refresh, pending } = await useAsyncData(
  'trainer-system-metrics',
  () => apiFetch<SystemMetrics>('/api/system/metrics').catch(() => null),
  { default: () => null }
)

useSeoMeta({
  title: 'Monitoring — Panel trenera',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="trainer"
      title="Monitoring systemu"
      icon="i-lucide-activity"
      description="Metryki klubu: zawodnicy, plany, wyniki oczekujące i ostatnie zdarzenia."
    >
      <template #actions>
        <UButton size="sm" variant="soft" icon="i-lucide-refresh-cw" :loading="pending" @click="() => void refresh()">
          Odśwież
        </UButton>
      </template>
    </PanelPageHeader>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <UCard class="slavia-page-card"><p class="text-xs text-muted">Aktywni zawodnicy</p><p class="text-2xl font-black">{{ data?.athletes_count ?? 0 }}</p></UCard>
      <UCard class="slavia-page-card"><p class="text-xs text-muted">Aktywne plany</p><p class="text-2xl font-black">{{ data?.active_plans_count ?? 0 }}</p></UCard>
      <UCard class="slavia-page-card"><p class="text-xs text-muted">Wyniki pending</p><p class="text-2xl font-black">{{ data?.pending_results_count ?? 0 }}</p></UCard>
      <UCard class="slavia-page-card"><p class="text-xs text-muted">Nieprzeczytane powiad.</p><p class="text-2xl font-black">{{ data?.unread_notifications_count ?? 0 }}</p></UCard>
      <UCard class="slavia-page-card"><p class="text-xs text-muted">Check-iny 7 dni</p><p class="text-2xl font-black">{{ data?.recovery_checkins_7d_count ?? 0 }}</p></UCard>
    </div>

    <UCard class="slavia-page-card mt-6">
      <h2 class="text-lg font-semibold text-highlighted">Ostatnie zdarzenia</h2>
      <ul class="mt-3 space-y-2 text-sm">
        <li v-for="e in data?.recent_events || []" :key="e.id" class="rounded-lg border border-default/50 px-3 py-2">
          <span class="font-mono text-xs text-muted">{{ e.created_at }}</span>
          <span class="ml-2 font-semibold">{{ e.category }} / {{ e.action }}</span>
          <p v-if="e.details" class="mt-1 text-muted">{{ e.details }}</p>
        </li>
        <li v-if="!(data?.recent_events?.length)" class="text-muted">Brak zdarzeń.</li>
      </ul>
    </UCard>
  </PanelPageLayout>
</template>
