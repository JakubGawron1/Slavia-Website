<script setup lang="ts">
import type { Athlete, AthletePaymentOverviewRow, PaymentMonthStatusRow, PendingPaymentRow } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Składki klubowe — Panel trenera',
  robots: 'noindex, nofollow'
})

const apiFetch = useApi()
const toast = useToast()

const month = ref(new Date().toISOString().slice(0, 7))
const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const canPreviewNextYear = computed(() => currentMonth >= 11)
const allowedYears = computed(() => (canPreviewNextYear.value ? [currentYear, currentYear + 1] : [currentYear]))
const year = ref<number>(currentYear)
const selectedAthleteId = ref<string>('')
const yearLoading = ref(false)
const yearRows = ref<PaymentMonthStatusRow[]>([])

const { data: athletes } = await useAsyncData(
  'trainer-athletes-for-fees',
  async (): Promise<Athlete[]> => {
    try {
      return await apiFetch<Athlete[]>('/api/athletes/admin')
    } catch {
      return await apiFetch<Athlete[]>('/api/athletes').catch(() => [])
    }
  }
)

watch(
  () => athletes.value,
  (list) => {
    if (!selectedAthleteId.value && Array.isArray(list) && list.length > 0) {
      selectedAthleteId.value = list[0]!.id
    }
  },
  { immediate: true }
)

const monthLabelPl = (yyyyMm: string) => {
  const mm = Number.parseInt(String(yyyyMm || '').slice(5, 7), 10)
  const months = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ]
  return months[(mm - 1)] || yyyyMm
}

function rowStatusLabel(r: PaymentMonthStatusRow) {
  if (r.is_paid) return 'Opłacone'
  if (r.has_pending) return 'Oczekuje'
  if (r.is_overdue) return 'Nieopłacone'
  return 'Brak'
}

function rowStatusColor(r: PaymentMonthStatusRow) {
  if (r.is_paid) return 'success'
  if (r.is_overdue) return 'error'
  if (r.has_pending) return 'warning'
  return 'neutral'
}

async function refreshYearTable() {
  const aid = selectedAthleteId.value
  if (!aid) {
    yearRows.value = []
    return
  }
  if (!allowedYears.value.includes(year.value)) {
    year.value = allowedYears.value[0]!
  }
  yearLoading.value = true
  try {
    const q = `?year=${encodeURIComponent(String(year.value))}`
    const rows = await apiFetch<PaymentMonthStatusRow[]>(`${apiRoutes.payments.athleteYear(aid)}${q}`).catch(() => [])
    yearRows.value = Array.isArray(rows) ? rows : []
  } finally {
    yearLoading.value = false
  }
}

watch([selectedAthleteId, year], () => {
  void refreshYearTable()
})

const { data: overview, refresh: refreshOverview } = await useAsyncData(
  () => `payments-overview-${month.value}`,
  async (): Promise<AthletePaymentOverviewRow[]> => {
    const q = month.value ? `?month=${encodeURIComponent(month.value)}` : ''
    return await apiFetch<AthletePaymentOverviewRow[]>(`${apiRoutes.payments.overview}${q}`).catch(() => [])
  }
)

const { data: pendingPayments, refresh: refreshPending } = await useAsyncData(
  'payments-pending',
  async (): Promise<PendingPaymentRow[]> =>
    apiFetch<PendingPaymentRow[]>(apiRoutes.payments.pending).catch(() => [])
)

const rows = computed(() => (Array.isArray(overview.value) ? overview.value : []))

const pendingOnly = computed(() => rows.value.filter(r => r.has_pending && !r.has_approved))
const approvedOnly = computed(() => rows.value.filter(r => r.has_approved))
const noneOnly = computed(() => rows.value.filter(r => !r.has_pending && !r.has_approved))

/** Mapa id → flaga przelewu stałego, używana do dekoracji ikoną w kartach statusów. */
const standingOrderById = computed(() => {
  const map = new Map<string, boolean>()
  for (const a of athletes.value || []) {
    if (a.has_standing_order) map.set(a.id, true)
  }
  return map
})

const standingOrderAthletes = computed(() =>
  (athletes.value || []).filter(a => a.has_standing_order && a.is_active !== false)
)

async function approvePayment(id: string) {
  try {
    await apiFetch(apiRoutes.payments.approve(id), { method: 'PATCH' })
    toast.add({ title: 'Zatwierdzono płatność', color: 'success' })
    await refreshPending()
    await refreshOverview()
  } catch (e) {
    toast.add({ title: 'Nie udało się zatwierdzić', description: getApiErrorMessage(e), color: 'error' })
  }
}

async function rejectPayment(id: string) {
  try {
    await apiFetch(apiRoutes.payments.reject(id), { method: 'PATCH' })
    toast.add({ title: 'Odrzucono zgłoszenie', color: 'success' })
    await refreshPending()
    await refreshOverview()
  } catch (e) {
    toast.add({ title: 'Nie udało się odrzucić', description: getApiErrorMessage(e), color: 'error' })
  }
}

const addApprovedPaymentForm = reactive<{
  athlete_id: string | null
  month: string
  amount_pln: number | null
  note: string
}>({
  athlete_id: null,
  month: month.value,
  amount_pln: 50,
  note: ''
})

watch(month, (m) => {
  addApprovedPaymentForm.month = m
})

watch(
  () => athletes.value,
  (list) => {
    if (!addApprovedPaymentForm.athlete_id && Array.isArray(list) && list.length > 0) {
      addApprovedPaymentForm.athlete_id = list[0]!.id
    }
  },
  { immediate: true }
)

async function createApprovedPayment() {
  if (!addApprovedPaymentForm.athlete_id) return
  try {
    await apiFetch(apiRoutes.payments.createApprovedForAthlete(addApprovedPaymentForm.athlete_id), {
      method: 'POST',
      body: {
        month: addApprovedPaymentForm.month,
        amount_pln: addApprovedPaymentForm.amount_pln != null ? Number(addApprovedPaymentForm.amount_pln) : null,
        note: addApprovedPaymentForm.note
      }
    })
    toast.add({ title: 'Dodano płatność', description: 'Kwota zostanie rozbita na miesiące po 50 zł.', color: 'success' })
    addApprovedPaymentForm.note = ''
    await refreshOverview()
  } catch (e) {
    toast.add({ title: 'Nie udało się dodać', description: getApiErrorMessage(e), color: 'error' })
  }
}
</script>

<template>
  <UContainer class="py-8 md:py-14">
    <div class="mb-6">
      <p class="text-sm font-medium uppercase tracking-wider text-primary">Panel trenera</p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">Składki klubowe</h1>
      <p class="mt-2 max-w-2xl text-sm text-muted">
        Widok miesiąca: <span class="font-mono">{{ month }}</span>. Statusy: opłacone, oczekujące, brak wpłaty.
      </p>
    </div>

    <UCard class="mb-6 border-default/70">
      <div class="grid gap-3 md:grid-cols-12 md:items-end">
        <UFormField label="Miesiąc" class="md:col-span-3">
          <UInput v-model="month" type="month" class="w-full" @change="() => refreshOverview()" />
        </UFormField>
        <UFormField label="Dodaj zatwierdzoną płatność" class="md:col-span-4">
          <USelect
            v-model="addApprovedPaymentForm.athlete_id"
            :items="[{ label: 'Wybierz zawodnika', value: null }, ...((athletes || []).map(a => ({ label: a.full_name, value: a.id })))]"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Kwota (PLN)" description="Domyślnie 50; nadpłata przechodzi na kolejne miesiące." class="md:col-span-3">
          <UInputNumber v-model="addApprovedPaymentForm.amount_pln" :min="1" :step="1" class="w-full" />
        </UFormField>
        <div class="md:col-span-2">
          <UButton class="w-full" icon="i-lucide-check" :disabled="!addApprovedPaymentForm.athlete_id" @click="createApprovedPayment">
            Dodaj
          </UButton>
        </div>
        <UFormField label="Opis" description="Opcjonalnie" class="md:col-span-12">
          <UInput v-model="addApprovedPaymentForm.note" placeholder="np. gotówka / przelew" class="w-full" />
        </UFormField>
      </div>
    </UCard>

    <UCard class="mb-6 border-default/70">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div class="min-w-0">
          <h2 class="text-lg font-semibold text-highlighted">
            Składki zawodnika (rok)
          </h2>
          <p class="mt-1 text-sm text-muted">
            Wybierz zawodnika i rok — zobaczysz status 12 miesięcy.
          </p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <UFormField label="Zawodnik" size="xs" class="min-w-64">
            <USelect
              v-model="selectedAthleteId"
              :items="(athletes || []).map(a => ({ label: a.full_name, value: a.id }))"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Rok" size="xs" class="w-40">
            <USelect
              v-if="allowedYears.length > 1"
              v-model="year"
              :items="allowedYears.map(y => ({ label: String(y), value: y }))"
              class="w-full"
            />
            <UInput
              v-else
              :model-value="String(allowedYears[0])"
              disabled
              size="sm"
              class="w-full"
            />
          </UFormField>
          <UButton size="sm" variant="soft" icon="i-lucide-refresh-cw" :loading="yearLoading" @click="refreshYearTable">
            Odśwież
          </UButton>
        </div>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[720px] text-sm">
          <thead class="border-b border-default bg-muted/20">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-muted">Miesiąc</th>
              <th class="px-4 py-3 text-left font-semibold text-muted">Status</th>
              <th class="px-4 py-3 text-left font-semibold text-muted">Termin</th>
              <th class="px-4 py-3 text-right font-semibold text-muted">Szybki podgląd</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-if="yearLoading">
              <td colspan="4" class="px-4 py-10 text-center text-muted">
                <UIcon name="i-lucide-loader-2" class="inline size-6 animate-spin" />
              </td>
            </tr>
            <tr v-else-if="yearRows.length === 0">
              <td colspan="4" class="px-4 py-10 text-center text-muted">
                Brak danych dla tego roku.
              </td>
            </tr>
            <tr v-for="r in yearRows" v-else :key="r.month" class="hover:bg-muted/10 transition-colors">
              <td class="px-4 py-3">
                <span class="font-semibold text-highlighted">{{ monthLabelPl(r.month) }}</span>
                <span class="ml-2 font-mono text-[11px] text-muted">{{ r.month }}</span>
              </td>
              <td class="px-4 py-3">
                <UBadge :color="rowStatusColor(r)" variant="subtle">
                  {{ rowStatusLabel(r) }}
                </UBadge>
              </td>
              <td class="px-4 py-3 text-muted font-mono text-[11px]">
                {{ r.due_date }}
              </td>
              <td class="px-4 py-3 text-right">
                <UButton
                  size="xs"
                  variant="outline"
                  color="neutral"
                  icon="i-lucide-eye"
                  @click="month = r.month; refreshOverview()"
                >
                  Ustaw miesiąc
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <UCard class="mb-6 border-success/30 bg-success/5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="rounded-full bg-success/15 p-2">
            <UIcon name="i-lucide-repeat" class="size-5 text-success" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-highlighted">Przelewy stałe</h2>
            <p class="text-sm text-muted">
              {{ standingOrderAthletes.length }}
              {{ standingOrderAthletes.length === 1 ? 'zawodnik ma' : 'zawodników ma' }}
              włączony przelew stały — system <strong>co miesiąc</strong> automatycznie zaznacza
              im składkę jako opłaconą. Włączasz to w panelu zawodnika.
            </p>
          </div>
        </div>
        <UButton
          to="/trainer/zawodnicy"
          size="sm"
          variant="soft"
          color="primary"
          icon="i-lucide-users"
        >
          Zarządzaj
        </UButton>
      </div>
      <div v-if="standingOrderAthletes.length > 0" class="mt-4 flex flex-wrap gap-2">
        <UBadge
          v-for="a in standingOrderAthletes"
          :key="a.id"
          color="success"
          variant="subtle"
          class="gap-1"
        >
          <UIcon name="i-lucide-repeat" class="size-3" />
          {{ a.full_name }}
        </UBadge>
      </div>
    </UCard>

    <div class="grid gap-4 lg:grid-cols-3">
      <UCard class="border-default/70">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-lg font-semibold text-highlighted">Brak wpłaty</h2>
          <UBadge color="error" variant="subtle">{{ noneOnly.length }}</UBadge>
        </div>
        <div class="mt-3 space-y-2">
          <div v-for="r in noneOnly" :key="r.athlete_id" class="flex items-center justify-between rounded-xl border border-default/60 px-3 py-2">
            <span class="flex items-center gap-1.5 truncate text-sm text-highlighted">
              <UIcon
                v-if="standingOrderById.get(r.athlete_id)"
                name="i-lucide-repeat"
                class="size-3.5 shrink-0 text-success"
              />
              {{ r.full_name }}
            </span>
            <UBadge color="error" variant="subtle" size="xs">nieopł.</UBadge>
          </div>
          <p v-if="noneOnly.length === 0" class="text-sm text-muted">Brak.</p>
        </div>
      </UCard>

      <UCard class="border-default/70">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-lg font-semibold text-highlighted">Oczekujące</h2>
          <UBadge color="warning" variant="subtle">{{ pendingOnly.length }}</UBadge>
        </div>
        <div class="mt-3 space-y-2">
          <div v-for="r in pendingOnly" :key="r.athlete_id" class="flex items-center justify-between rounded-xl border border-default/60 px-3 py-2">
            <span class="flex items-center gap-1.5 truncate text-sm text-highlighted">
              <UIcon
                v-if="standingOrderById.get(r.athlete_id)"
                name="i-lucide-repeat"
                class="size-3.5 shrink-0 text-success"
              />
              {{ r.full_name }}
            </span>
            <UBadge color="warning" variant="subtle" size="xs">pending</UBadge>
          </div>
          <p v-if="pendingOnly.length === 0" class="text-sm text-muted">Brak.</p>
        </div>
      </UCard>

      <UCard class="border-default/70">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-lg font-semibold text-highlighted">Opłacone</h2>
          <UBadge color="success" variant="subtle">{{ approvedOnly.length }}</UBadge>
        </div>
        <div class="mt-3 space-y-2">
          <div v-for="r in approvedOnly" :key="r.athlete_id" class="flex items-center justify-between rounded-xl border border-default/60 px-3 py-2">
            <span class="flex items-center gap-1.5 truncate text-sm text-highlighted">
              <UIcon
                v-if="standingOrderById.get(r.athlete_id)"
                name="i-lucide-repeat"
                class="size-3.5 shrink-0 text-success"
              />
              {{ r.full_name }}
            </span>
            <UBadge color="success" variant="subtle" size="xs">{{ r.approved_amount_pln }} zł</UBadge>
          </div>
          <p v-if="approvedOnly.length === 0" class="text-sm text-muted">Brak.</p>
        </div>
      </UCard>
    </div>

    <div class="mt-8 rounded-2xl border border-default bg-card p-6">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-xl font-semibold text-highlighted">Zgłoszenia do weryfikacji</h2>
        <UButton size="sm" variant="soft" icon="i-lucide-refresh-cw" @click="() => { refreshPending(); refreshOverview() }">
          Odśwież
        </UButton>
      </div>
      <div v-if="!pendingPayments || pendingPayments.length === 0" class="text-sm text-muted">
        Brak zgłoszeń w statusie oczekującym.
      </div>
      <div v-else class="space-y-3">
        <div v-for="p in pendingPayments" :key="p.id" class="flex flex-col gap-3 rounded-xl border border-default/60 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <p class="font-medium text-highlighted">{{ p.athlete_name }}</p>
            <p class="text-sm text-muted">
              Miesiąc: <span class="font-mono">{{ p.month }}</span>
              <span v-if="p.amount_pln != null"> · Kwota: <span class="font-mono">{{ p.amount_pln }}</span> PLN</span>
              <span v-if="p.note && p.note.trim()"> · {{ p.note }}</span>
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            <UButton size="sm" icon="i-lucide-check" @click="approvePayment(p.id)">Zatwierdź</UButton>
            <UButton size="sm" color="error" variant="soft" icon="i-lucide-x" @click="rejectPayment(p.id)">Odrzuć</UButton>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>

