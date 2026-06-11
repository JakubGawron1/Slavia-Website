<script setup lang="ts">

definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Superadmin — Audit Logi',
  robots: 'noindex, nofollow'
})

interface AuditLogRow {
  id: string
  actor_user_id?: string
  actor_username?: string
  actor_role?: string
  category: string
  action: string
  target_type?: string
  target_id?: string
  details?: string
  created_at: string
}

const api = useApi()
const { data: logs, pending, refresh } = await useAsyncData<AuditLogRow[]>(
  'system-audit-logs',
  () => api<AuditLogRow[]>('/api/system/audit-logs').catch(() => [])
)

const q = ref('')
const selectedCategory = ref<string | null>(null)

const categories = computed(() => {
  const list = logs.value
  if (!Array.isArray(list)) return []
  const cats = new Set(list.map(l => l.category))
  return Array.from(cats).sort().map(c => ({ label: c, value: c }))
})

const filteredLogs = computed(() => {
  const list = logs.value
  if (!Array.isArray(list)) return []
  return list.filter(log => {
    const matchesSearch = !q.value || 
      log.action.toLowerCase().includes(q.value.toLowerCase()) ||
      log.details?.toLowerCase().includes(q.value.toLowerCase()) ||
      log.actor_user_id?.toLowerCase().includes(q.value.toLowerCase()) ||
      log.actor_username?.toLowerCase().includes(q.value.toLowerCase())
    
    const matchesCategory = !selectedCategory.value || log.category === selectedCategory.value
    
    return matchesSearch && matchesCategory
  })
})

function formatDetails(details?: string) {
  if (!details) return '—'
  try {
    const obj = JSON.parse(details)
    return JSON.stringify(obj, null, 2)
  } catch {
    return details
  }
}

const columns = [
  { accessorKey: 'created_at', id: 'created_at', header: 'Data' },
  { id: 'actor', header: 'Aktor' },
  { accessorKey: 'category', id: 'category', header: 'Kategoria' },
  { accessorKey: 'action', id: 'action', header: 'Akcja' },
  { id: 'target', header: 'Cel' },
  { id: 'details', header: 'Szczegóły' }
]

function formatDateTime(iso?: string) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return new Intl.DateTimeFormat('pl-PL', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(d)
  } catch {
    return iso
  }
}
</script>

<template>
  <PanelPageLayout padding="compact">
    <PanelPageHeader
      area="superadmin"
      tone="superadmin"
      eyebrow="System Audit"
      title="Logi systemowe"
      icon="i-lucide-history"
      description="Historia zmian w systemie: zatwierdzanie płatności, edycja zawodników, logowania i inne operacje administracyjne."
      :breadcrumbs="[
        { label: 'SuperAdmin', to: '/superadmin', icon: 'i-lucide-shield-check' },
        { label: 'Logi audytu', icon: 'i-lucide-history' }
      ]"
    >
      <template #actions>
        <UButton
          icon="i-lucide-refresh-cw"
          variant="soft"
          color="neutral"
          size="lg"
          :loading="pending"
          @click="() => refresh()"
        >
          Odśwież
        </UButton>
      </template>
    </PanelPageHeader>

    <PanelLoadingState
      v-if="pending"
      label="Wczytywanie logów audytu…"
    />

    <template v-else>
      <PanelDataToolbar
        v-if="logs?.length"
        :summary="`${filteredLogs.length} z ${logs.length} wpisów`"
        sticky
      >
        <template #filters>
          <UFormField label="Szukaj" class="w-full sm:w-72">
            <UInput
              v-model="q"
              icon="i-lucide-search"
              placeholder="Akcja, szczegóły, aktor…"
              size="lg"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Kategoria" class="w-full sm:w-52">
            <USelect
              v-model="selectedCategory"
              placeholder="Wszystkie kategorie"
              :items="[{ label: 'Wszystkie kategorie', value: null }, ...categories]"
              size="lg"
              class="w-full"
            />
          </UFormField>
        </template>
      </PanelDataToolbar>

      <SlaviaEmptyState
        v-if="!logs?.length"
        icon="i-lucide-database"
        title="Brak logów audytu"
        description="Gdy w systemie pojawią się operacje administracyjne, wpisy zostaną zapisane tutaj."
      />

      <SlaviaEmptyState
        v-else-if="!filteredLogs.length"
        icon="i-lucide-filter-x"
        title="Brak wyników"
        description="Zmień filtr kategorii lub wpisz inną frazę wyszukiwania."
      />

      <UCard
        v-else
        class="overflow-hidden rounded-2xl border-default/70 shadow-sm ring-1 ring-default/20"
        :ui="{ body: 'p-0' }"
      >
        <div class="slavia-data-table overflow-x-auto">
          <UTable
            :data="filteredLogs"
            :columns="columns"
            class="w-full"
          >
        <template #created_at-cell="{ row }">
          <span class="whitespace-nowrap text-xs tabular-nums text-muted">
            {{ formatDateTime(row.original.created_at) }}
          </span>
        </template>

        <template #actor-cell="{ row }">
          <div class="flex flex-col">
            <span class="text-sm font-medium text-highlighted">{{ row.original.actor_username || row.original.actor_user_id || 'System' }}</span>
            <span v-if="row.original.actor_username && row.original.actor_user_id" class="text-[10px] tabular-nums text-muted opacity-50">{{ row.original.actor_user_id.slice(0, 8) }}…</span>
            <span class="text-[10px] uppercase tracking-wider text-muted">{{ row.original.actor_role }}</span>
          </div>
        </template>

        <template #category-cell="{ row }">
          <UBadge variant="subtle" color="neutral" size="xs" class="capitalize">
            {{ row.original.category }}
          </UBadge>
        </template>

        <template #action-cell="{ row }">
          <span class="text-sm font-semibold text-primary">{{ row.original.action }}</span>
        </template>

        <template #target-cell="{ row }">
          <div v-if="row.original.target_type" class="flex flex-col">
            <span class="text-[11px] text-muted">{{ row.original.target_type }}</span>
            <span class="font-mono text-xs">{{ row.original.target_id }}</span>
          </div>
          <span v-else class="text-muted">—</span>
        </template>

        <template #details-cell="{ row }">
          <UPopover v-if="row.original.details" mode="hover">
            <UButton
              variant="link"
              color="neutral"
              size="xs"
              label="Pokaż szczegóły"
              class="p-0 underline"
            />
            <template #content>
              <div class="max-w-xs p-4">
                <pre class="overflow-auto text-[10px] leading-tight text-default">{{ formatDetails(row.original.details) }}</pre>
              </div>
            </template>
          </UPopover>
          <span v-else class="text-muted">—</span>
        </template>
          </UTable>
        </div>
      </UCard>
    </template>
  </PanelPageLayout>
</template>
