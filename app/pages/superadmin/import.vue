<script setup lang="ts">
definePageMeta({
  middleware: 'superadmin'
})

interface ImportRejectedSample {
  full_name: string
  reason: string
}

interface FederationImportRow {
  source: string
  urls_attempted?: number
  urls_fetched_ok?: number
  fetch_errors?: string[]
  rows_parsed?: number
  records_matched_roster?: number
  records_saved?: number
  records_duplicate_skipped?: number
  records_preview_importable?: number
  rejected_samples?: ImportRejectedSample[]
  athletes_updated: number
  new_results: number
}

const lastReport = useState<FederationImportRow[] | null>('import-last-report-full', () => null)

const fetchErrorsFlat = computed(() => {
  const r = lastReport.value
  if (!r?.length) return [] as string[]
  const out: string[] = []
  for (const row of r) {
    for (const err of row.fetch_errors ?? []) {
      out.push(`${row.source}: ${err}`)
    }
  }
  return out
})

const rejectedFlat = computed(() => {
  const r = lastReport.value
  if (!r?.length) return [] as Array<{ source: string, full_name: string, reason: string }>
  const out: Array<{ source: string, full_name: string, reason: string }> = []
  for (const row of r) {
    for (const x of row.rejected_samples ?? []) {
      out.push({ source: row.source, full_name: x.full_name, reason: x.reason })
    }
  }
  return out
})

/** Import zawodników jest wyłączony, więc widok działa tylko w trybie „podgląd bez zapisu”. */
const devMode = false

function exportJson() {
  const blob = new Blob([JSON.stringify(lastReport.value ?? [], null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `slavia-import-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function exportCsv() {
  const rows = lastReport.value ?? []
  const header = [
    'source',
    'urls_attempted',
    'urls_fetched_ok',
    'rows_parsed',
    'records_matched_roster',
    'records_saved',
    'records_duplicate_skipped',
    'records_preview_importable',
    'athletes_updated',
    'new_results',
    'fetch_errors_joined'
  ].join(';')
  const lines = rows.map((x) =>
    [
      escapeCsv(x.source),
      x.urls_attempted ?? '',
      x.urls_fetched_ok ?? '',
      x.rows_parsed ?? '',
      x.records_matched_roster ?? '',
      x.records_saved ?? '',
      x.records_duplicate_skipped ?? '',
      x.records_preview_importable ?? '',
      x.athletes_updated,
      x.new_results,
      escapeCsv((x.fetch_errors ?? []).join(' | '))
    ].join(';')
  )
  const blob = new Blob(['\ufeff' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `slavia-import-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function escapeCsv(s: string) {
  const needs = /[;\r\n"]/.test(s)
  const t = s.replace(/"/g, '""')
  return needs ? `"${t}"` : t
}

useSeoMeta({
  title: 'Import danych — SuperAdmin',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="superadmin"
      tone="superadmin"
      title="Import danych z federacji"
      icon="i-lucide-database"
      description="Import danych zawodników z federacji został wyłączony. Synchronizacja zawodów nadal działa w module kalendarza klubowego."
      :breadcrumbs="[
        { label: 'SuperAdmin', to: '/superadmin', icon: 'i-lucide-shield-check' },
        { label: 'Import danych', icon: 'i-lucide-database' }
      ]"
    />

    <UCard class="overflow-hidden rounded-2xl border-default/70 ring-1 ring-default/20">
      <template #header>
        <h2 class="text-lg font-semibold">Import zawodników z federacji</h2>
      </template>
      <UAlert
        icon="i-lucide-circle-off"
        color="warning"
        variant="subtle"
        title="Wyłączone"
        description="Ten moduł nie wykonuje już importu. Dane zawodników prowadź ręcznie w panelu. Import zawodów uruchamiaj w kalendarzu przyciskiem „Synchronizuj PZPC i PC”."
      />

      <div
        v-if="lastReport?.length"
        class="mt-6 space-y-6"
      >
        <div class="flex flex-wrap gap-2">
          <UButton
            variant="soft"
            color="neutral"
            icon="i-lucide-file-json"
            @click="exportJson"
          >
            Eksport JSON
          </UButton>
          <UButton
            variant="soft"
            color="neutral"
            icon="i-lucide-table"
            @click="exportCsv"
          >
            Eksport CSV
          </UButton>
        </div>

        <div class="slavia-data-table overflow-x-auto rounded-xl border border-default/60">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b border-default bg-muted/30 text-left text-muted">
                <th class="whitespace-nowrap px-3 py-2">
                  Źródło
                </th>
                <th class="whitespace-nowrap px-2 py-2">
                  URL OK
                </th>
                <th class="whitespace-nowrap px-2 py-2">
                  Sparsowano
                </th>
                <th class="whitespace-nowrap px-2 py-2">
                  Dopasowano
                </th>
                <th class="whitespace-nowrap px-2 py-2">
                  Zapisano
                </th>
                <th class="whitespace-nowrap px-2 py-2">
                  Duplikaty
                </th>
                <th class="whitespace-nowrap px-3 py-2">
                  Podgląd (bez zapisu)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in lastReport"
                :key="row.source"
                class="border-b border-default/60"
              >
                <td class="px-3 py-2 font-medium text-highlighted">
                  {{ row.source }}
                </td>
                <td class="px-2 py-2 tabular-nums">
                  {{ row.urls_fetched_ok ?? '—' }}/{{ row.urls_attempted ?? '—' }}
                </td>
                <td class="px-2 py-2 tabular-nums">
                  {{ row.rows_parsed ?? '—' }}
                </td>
                <td class="px-2 py-2 tabular-nums">
                  {{ row.records_matched_roster ?? row.athletes_updated }}
                </td>
                <td class="px-2 py-2 tabular-nums text-success">
                  {{ row.records_saved ?? (devMode ? row.new_results : '—') }}
                </td>
                <td class="px-2 py-2 tabular-nums">
                  {{ row.records_duplicate_skipped ?? '—' }}
                </td>
                <td class="px-3 py-2 tabular-nums">
                  {{ row.records_preview_importable ?? (!devMode ? row.new_results : '—') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="fetchErrorsFlat.length">
          <h3 class="mb-2 text-sm font-bold uppercase tracking-wide text-error">
            Ostatnie błędy sieci / HTTP
          </h3>
          <ul class="max-h-48 overflow-y-auto rounded-lg border border-error/25 bg-error/5 px-3 py-2 text-xs text-error">
            <li
              v-for="(line, i) in fetchErrorsFlat"
              :key="'fe-' + i"
              class="py-0.5 font-mono leading-snug"
            >
              {{ line }}
            </li>
          </ul>
        </div>

        <div v-if="rejectedFlat.length">
          <h3 class="mb-2 text-sm font-bold uppercase tracking-wide text-highlighted">
            Odrzucone (brak zawodnika w bazie klubu) — próbka
          </h3>
          <ul class="max-h-52 overflow-y-auto rounded-lg border border-default bg-muted/10 px-3 py-2 text-xs">
            <li
              v-for="(x, i) in rejectedFlat.slice(0, 80)"
              :key="'rej-' + i"
              class="py-1 border-b border-default/40 last:border-0"
            >
              <span class="font-semibold text-highlighted">{{ x.source }}</span>
              · {{ x.full_name }}
              <span class="text-muted">— {{ x.reason }}</span>
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <UButton to="/kalendarz" icon="i-lucide-calendar-sync" color="primary">
          Przejdź do importu zawodów
        </UButton>
      </template>
    </UCard>
  </PanelPageLayout>
</template>
