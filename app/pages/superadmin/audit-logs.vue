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
  <UContainer class="max-sm:px-3 py-6 sm:py-8 md:py-14 lg:py-16">
    <header class="relative mb-8 overflow-hidden rounded-2xl border border-default/60 bg-linear-to-br from-card via-muted/10 to-transparent px-4 py-6 shadow-sm ring-1 ring-white/5 max-sm:rounded-[1.35rem] sm:mb-10 sm:rounded-[1.75rem] sm:px-6 sm:py-8 md:mb-12 md:px-10 md:py-10 dark:from-elevated dark:via-card/80">
      <div class="pointer-events-none absolute right-0 top-0 size-40 translate-x-1/4 -translate-y-1/4 rounded-full bg-primary/10 blur-3xl" />
      <div class="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div class="min-w-0 max-w-3xl space-y-3">
          <div class="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            <UIcon name="i-lucide-history" class="size-3.5" />
            System Audit
          </div>
          <h1 class="text-2xl font-black tracking-tight text-highlighted sm:text-3xl md:text-4xl">
            Logi systemowe
          </h1>
          <p class="max-w-2xl text-[15px] leading-relaxed text-muted md:text-base">
            Historia zmian w systemie: zatwierdzanie płatności, edycja zawodników, logowania i inne operacje administracyjne.
          </p>
        </div>
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
      </div>
    </header>

    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
      <UInput
        v-model="q"
        icon="i-lucide-search"
        placeholder="Szukaj w akcjach, szczegółach..."
        class="w-full sm:max-w-xs"
        size="lg"
      />
      <USelect
        v-model="selectedCategory"
        placeholder="Wszystkie kategorie"
        :items="[{ label: 'Wszystkie kategorie', value: null }, ...categories]"
        class="w-full sm:max-w-[200px]"
        size="lg"
      />
    </div>

    <UCard class="overflow-hidden border-default/60 shadow-sm" :ui="{ body: 'p-0' }">
      <UTable
        :data="filteredLogs"
        :columns="columns"
        :loading="pending"
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

      <div v-if="!filteredLogs.length && !pending" class="flex flex-col items-center justify-center py-20 text-center">
        <UIcon name="i-lucide-database-zap" class="mb-4 size-12 text-muted/30" />
        <p class="text-muted">Nie znaleziono logów spełniających kryteria.</p>
      </div>
    </UCard>
  </UContainer>
</template>
