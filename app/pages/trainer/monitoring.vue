<script setup lang="ts">
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'

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

const metrics = computed(() => [
  {
    label: 'Aktywni zawodnicy',
    value: data.value?.athletes_count ?? 0,
    icon: 'i-lucide-users',
    tone: 'info' as const,
    to: '/trainer/zawodnicy'
  },
  {
    label: 'Aktywne plany',
    value: data.value?.active_plans_count ?? 0,
    icon: 'i-lucide-clipboard-list',
    tone: 'primary' as const,
    to: '/trainer/plany'
  },
  {
    label: 'Wyniki oczek.',
    value: data.value?.pending_results_count ?? 0,
    icon: 'i-lucide-clipboard-clock',
    tone: (data.value?.pending_results_count ?? 0) > 0 ? ('warning' as const) : ('neutral' as const),
    to: '/trainer/wyniki'
  },
  {
    label: 'Powiadomienia',
    value: data.value?.unread_notifications_count ?? 0,
    icon: 'i-lucide-bell',
    tone: (data.value?.unread_notifications_count ?? 0) > 0 ? ('warning' as const) : ('neutral' as const)
  },
  {
    label: 'Check-iny 7 dni',
    value: data.value?.recovery_checkins_7d_count ?? 0,
    icon: 'i-lucide-heart-pulse',
    tone: 'success' as const,
    to: '/trainer/regeneracja'
  }
])
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
        <UButton to="/trainer" variant="soft" color="neutral" size="sm" icon="i-lucide-layout-dashboard">
          Panel
        </UButton>
        <UButton size="sm" variant="soft" icon="i-lucide-refresh-cw" :loading="pending" @click="() => void refresh()">
          Odśwież
        </UButton>
      </template>
    </PanelPageHeader>

    <PanelLoadingState
      v-if="pending && !data"
      variant="cards"
      :count="5"
      label="Ładowanie metryk…"
    />

    <div
      v-else
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
    >
      <DashboardKpiCard
        v-for="m in metrics"
        :key="m.label"
        :label="m.label"
        :value="m.value"
        :icon="m.icon"
        :tone="m.tone"
        :to="m.to"
        size="compact"
      />
    </div>

    <PanelPageSection
      title="Ostatnie zdarzenia"
      icon="i-lucide-list-tree"
      description="Audit log systemu — ostatnie akcje w panelu klubu."
      class="mt-6"
    >
      <UCard class="slavia-page-card">
        <ul class="space-y-2 text-sm">
          <li
            v-for="e in data?.recent_events || []"
            :key="e.id"
            class="rounded-xl border border-default/50 bg-muted/8 px-3 py-2.5 transition-colors hover:border-primary/20"
          >
            <span class="font-mono text-xs text-muted">{{ e.created_at }}</span>
            <span class="ml-2 font-semibold text-highlighted">{{ e.category }} / {{ e.action }}</span>
            <p v-if="e.details" class="mt-1 text-muted">
              {{ e.details }}
            </p>
          </li>
          <li v-if="!(data?.recent_events?.length)" class="py-8 text-center text-muted">
            Brak zdarzeń do wyświetlenia.
          </li>
        </ul>
      </UCard>
    </PanelPageSection>
  </PanelPageLayout>
</template>
