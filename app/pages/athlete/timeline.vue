<script setup lang="ts">
definePageMeta({ middleware: 'athlete-calendar' })

type TimelineItem = {
  id: string
  kind: string
  at: string
  title: string
  detail: string
}

const apiFetch = useApi()
const rolePreviewState = useRolePreviewState()

const { data: me } = await useAsyncData('athlete-timeline-me', () => apiFetch<{ id: string }>('/api/athletes/me').catch(() => null))

const { data: items, pending, refresh } = await useAsyncData(
  'athlete-timeline-items',
  async (): Promise<TimelineItem[]> => {
    if (!me.value?.id) return []
    return apiFetch<TimelineItem[]>(`/api/athletes/${me.value.id}/timeline`).catch(() => [])
  },
  { default: () => [] }
)

function kindLabel(kind: string) {
  if (kind === 'result') return 'Wynik'
  if (kind === 'attendance') return 'Obecność'
  if (kind === 'training_log') return 'Dziennik'
  return kind
}

useSeoMeta({
  title: 'Historia treningów — Slavia',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="athlete"
      title="Historia treningów"
      icon="i-lucide-timeline"
      description="Oś czasu: wyniki, obecności i wpisy dziennika."
    >
      <template #actions>
        <UButton
          to="/athlete"
          variant="soft"
          color="neutral"
          size="sm"
          icon="i-lucide-layout-dashboard"
        >
          Panel
        </UButton>
        <UButton
          variant="soft"
          icon="i-lucide-refresh-cw"
          :loading="pending"
          @click="() => void refresh()"
        >
          Odśwież
        </UButton>
      </template>
    </PanelPageHeader>

    <UAlert
      v-if="rolePreviewState.isReadOnly.value"
      class="mb-4"
      color="warning"
      variant="subtle"
      icon="i-lucide-eye"
      title="Podgląd read-only"
      description="Oś czasu zawodnika — tylko do odczytu."
    />

    <PanelLoadingState
      v-if="pending"
      label="Ładowanie historii…"
    />

    <SlaviaEmptyState
      v-else-if="!(items || []).length"
      icon="i-lucide-timeline"
      title="Brak wpisów historii"
      description="Gdy pojawią się wyniki, obecności lub wpisy dziennika, zobaczysz je tutaj na osi czasu."
    />

    <div
      v-else
      class="space-y-3"
    >
      <UCard
        v-for="i in items"
        :key="`${i.kind}-${i.id}-${i.at}`"
        class="slavia-page-card overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      >
        <div class="px-4 py-3 sm:px-5 sm:py-4">
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <UBadge size="xs" variant="subtle" color="primary">{{ kindLabel(i.kind) }}</UBadge>
            <span class="font-mono text-muted">{{ i.at }}</span>
          </div>
          <p class="mt-1 font-semibold text-highlighted">{{ i.title }}</p>
          <p class="mt-1 text-sm text-muted">{{ i.detail }}</p>
        </div>
      </UCard>
    </div>
  </PanelPageLayout>
</template>
