<script setup lang="ts">
import type { OpsEvent } from '~/types/models'

definePageMeta({ middleware: 'trainer' })

const apiFetch = useApi()
const filter = ref<'all' | 'results' | 'attendance' | 'recovery'>('all')
const search = ref('')

const { data: events, refresh, pending } = await useAsyncData(
  'trainer-event-feed',
  () => apiFetch<OpsEvent[]>('/api/system/event-feed').catch(() => []),
  { default: () => [] }
)

function formatAt(s: string) {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

function sourceLabel(src: string) {
  if (src === 'results') return 'Wyniki'
  if (src === 'attendance') return 'Obecność'
  if (src === 'recovery') return 'Regeneracja'
  return src || 'inne'
}

const filtered = computed(() => {
  const list = events.value || []
  if (filter.value === 'all') return list
  return list.filter(e => e.source === filter.value)
})

const filteredAndSearched = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return filtered.value
  return filtered.value.filter(e => {
    const hay = `${e.title} ${e.detail} ${e.source} ${e.at}`.toLowerCase()
    return hay.includes(q)
  })
})
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="trainer"
      title="Feed wydarzeń"
      icon="i-lucide-list-collapse"
      description="Log aktywności systemu (wyniki, obecność, regeneracja)."
    >
      <template #actions>
        <UButton size="sm" variant="outline" icon="i-lucide-refresh-cw" :loading="pending" @click="() => void refresh()">
          Odśwież
        </UButton>
      </template>
    </PanelPageHeader>

    <UCard class="slavia-page-card mb-5">
      <div class="grid gap-3 md:grid-cols-12 md:items-center">
        <div class="flex flex-wrap gap-2 md:col-span-8">
          <UButton
            size="sm"
            :variant="filter === 'all' ? 'solid' : 'outline'"
            @click="filter = 'all'"
          >
            Wszystkie
          </UButton>
          <UButton
            size="sm"
            :variant="filter === 'results' ? 'solid' : 'outline'"
            icon="i-lucide-trophy"
            @click="filter = 'results'"
          >
            Wyniki
          </UButton>
          <UButton
            size="sm"
            :variant="filter === 'attendance' ? 'solid' : 'outline'"
            icon="i-lucide-user-check"
            @click="filter = 'attendance'"
          >
            Obecność
          </UButton>
          <UButton
            size="sm"
            :variant="filter === 'recovery' ? 'solid' : 'outline'"
            icon="i-lucide-heart-pulse"
            @click="filter = 'recovery'"
          >
            Regeneracja
          </UButton>
        </div>

        <div class="md:col-span-4">
          <UInput
            v-model="search"
            size="lg"
            icon="i-lucide-search"
            placeholder="Szukaj w tytule i szczegółach…"
            class="w-full"
          />
        </div>
      </div>
    </UCard>

    <div class="mb-3 flex items-center justify-between gap-2 text-xs text-muted">
      <span>
        Widoczne: <span class="font-mono font-bold text-highlighted">{{ filteredAndSearched.length }}</span>
      </span>
      <span v-if="search.trim()">
        Filtr tekstu: <span class="font-mono">{{ search.trim() }}</span>
      </span>
    </div>

    <div class="space-y-3">
      <UCard
        v-for="(e, idx) in filteredAndSearched"
        :key="`${e.source}-${e.at}-${idx}`"
        class="overflow-hidden"
        :ui="{ body: 'p-0' }"
      >
        <div class="grid gap-3 p-4 sm:p-5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <UBadge
                size="xs"
                variant="subtle"
                :color="e.source === 'results' ? 'warning' : (e.source === 'attendance' ? 'primary' : (e.source === 'recovery' ? 'success' : 'neutral'))"
              >
                {{ sourceLabel(e.source) }}
              </UBadge>
              <span class="font-mono text-muted">{{ formatAt(e.at) }}</span>
            </div>
          </div>
          <div class="min-w-0">
            <p class="text-base font-bold text-highlighted">
              {{ e.title }}
            </p>
            <p class="mt-1 text-sm text-muted whitespace-pre-wrap wrap-break-word">
              {{ e.detail }}
            </p>
          </div>
        </div>
      </UCard>

      <UAlert
        v-if="filteredAndSearched.length === 0 && (events?.length || 0) > 0"
        icon="i-lucide-search-x"
        title="Brak wyników"
        description="Nie znaleziono zdarzeń dla wybranych filtrów."
        color="neutral"
        variant="subtle"
      />
      <UAlert
        v-else-if="filteredAndSearched.length === 0 && (events?.length || 0) === 0 && !pending"
        icon="i-lucide-inbox"
        title="Brak zdarzeń"
        description="System nie zwrócił żadnych wpisów do feedu."
        color="neutral"
        variant="subtle"
      />
    </div>
  </PanelPageLayout>
</template>
