<script setup lang="ts">
import { apiRoutes } from '~/config/api'

/** Odpowiedź GET /api/system/worker-cron-runs — camelCase z backendu Serde */
export interface WorkerCronRunDto {
  workerId: string
  finishedAt: string
  durationMs: number
  ok: boolean
  summary: string | null
}

definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Superadmin — workery cron (czasy przebiegu)',
  robots: 'noindex, nofollow'
})

const api = useApi()
const toast = useToast()

const { data: rows, pending, refresh } = await useAsyncData<WorkerCronRunDto[]>(
  'superadmin-worker-cron-runs',
  () => api<WorkerCronRunDto[]>(apiRoutes.system.workerCronRuns).catch((e) => {
    toast.add({
      title: 'Nie udało się pobrać danych',
      description: String((e as { data?: { message?: string } })?.data?.message ?? 'Sprawdź token i rolę SuperAdmin oraz wersję backendu.'),
      color: 'error'
    })
    return []
  }),
)

async function refreshRows() {
  await refresh()
}

function fmtMs(ms: number) {
  if (ms < 1000) {
    return `${ms} ms`
  }
  return `${(ms / 1000).toFixed(2)} s`
}

function workerHuman(id: string) {
  const map: Record<string, string> = {
    standing_order_scheduler: 'Auto-składki (scheduler okresowy)',
    standing_order_catchup_startup: 'Auto-składki (catch-up przy starcie)',
    chat_pruner_scheduler: 'Czat — usuwanie starych wątków (scheduler)',
    chat_pruner_catchup_startup: 'Czat — pruner przy starcie'
  }
  return map[id] ?? id
}
</script>

<template>
  <UContainer class="py-8 md:py-12">
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wider text-primary">
          Operacje · telemetria
        </p>
        <h1 class="mt-2 text-3xl font-black tracking-tight text-highlighted">
          Workery w tle (cron)
        </h1>
        <p class="mt-2 max-w-3xl text-sm text-muted">
          Ostatnie przebiegi zadań okresowych w procesie backendu. Wyświetlany czas to
          <strong class="text-highlighted">czas ściany (wall-clock)</strong> pojedynczego przebiegu — przybliżenie kosztu pracy workerów względem DB,
          nie surowe zużycie CPU (SUP #2299 — panel na www).
        </p>
      </div>
      <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" @click="refreshRows">
        Odśwież
      </UButton>
    </div>

    <UCard class="rounded-2xl">
      <div v-if="pending" class="flex justify-center py-16">
        <UIcon name="i-lucide-loader-circle" class="size-10 animate-spin text-primary" />
      </div>

      <div v-else-if="!(rows?.length)" class="py-12 text-center text-muted">
        Brak zarejestrowanych przebiegów — uruchomią się po pierwszym takcie schedulerów lub po restarcie backendu.
      </div>

      <div v-else class="-mx-2 overflow-x-auto sm:mx-0">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr class="border-b border-default text-xs uppercase tracking-wide text-muted">
              <th class="px-3 py-3 font-semibold">
                Worker
              </th>
              <th class="px-3 py-3 font-semibold">
                Koniec (UTC)
              </th>
              <th class="px-3 py-3 font-semibold">
                Czas
              </th>
              <th class="px-3 py-3 font-semibold">
                Wynik
              </th>
              <th class="px-3 py-3 font-semibold">
                Szczegół
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in rows"
              :key="`${r.workerId}-${r.finishedAt}-${r.durationMs}`"
              class="border-b border-default/60 hover:bg-muted/30"
            >
              <td class="px-3 py-3 font-mono text-xs text-highlighted">
                {{ workerHuman(r.workerId) }}
              </td>
              <td class="px-3 py-3 text-muted">
                {{ r.finishedAt }}
              </td>
              <td class="px-3 py-3 tabular-nums">
                {{ fmtMs(r.durationMs) }}
              </td>
              <td class="px-3 py-3">
                <UBadge :color="r.ok ? 'success' : 'error'" variant="subtle" size="sm">
                  {{ r.ok ? 'OK' : 'Błąd' }}
                </UBadge>
              </td>
              <td class="max-w-md px-3 py-3 whitespace-pre-wrap font-mono text-xs text-muted">
                {{ r.summary ?? '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <p class="mt-6 text-xs text-muted">
      Zarejestrowane zadania: cykliczna auto-składka (standing order),
      usuwanie nieaktywnych wątków czatu oraz jednorazowe „catch-up” przy starcie serwisu.
    </p>
  </UContainer>
</template>
