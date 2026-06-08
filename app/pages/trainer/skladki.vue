<script setup lang="ts">
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'
import MembershipStatusColumns from '~/components/payments/MembershipStatusColumns.vue'
import MembershipYearGrid from '~/components/payments/MembershipYearGrid.vue'
import type { Athlete, AthletePaymentOverviewRow, PaymentMonthStatusRow, PendingPaymentRow } from '~/types/models'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import { formatPln } from '~/utils/formatCurrency'
import { membershipYearStats, MONTHLY_FEE_PLN, monthLabelPl } from '~/utils/paymentSemantics'

definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Składki klubowe — Panel trenera',
  robots: 'noindex, nofollow'
})

const apiFetch = useApi()
const toast = useToast()

const month = ref(new Date().toISOString().slice(0, 7))
const currentYear = new Date().getFullYear()
const calendarMonth = new Date().getMonth() + 1
const canPreviewNextYear = computed(() => calendarMonth >= 11)
const allowedYears = computed(() => (canPreviewNextYear.value ? [currentYear, currentYear + 1] : [currentYear]))
const year = ref<number>(currentYear)
const selectedAthleteId = ref<string>('')
const yearLoading = ref(false)
const yearRows = ref<PaymentMonthStatusRow[]>([])
const athleteSearch = ref('')
const approvingId = ref<string | null>(null)
const rejectingId = ref<string | null>(null)

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
const pendingList = computed(() => (Array.isArray(pendingPayments.value) ? pendingPayments.value : []))

const pendingOnly = computed(() => rows.value.filter(r => r.has_pending && !r.has_approved))
const approvedOnly = computed(() => rows.value.filter(r => r.has_approved))
const noneOnly = computed(() => rows.value.filter(r => !r.has_pending && !r.has_approved))

const standingOrderIds = computed(() => {
  const ids = new Set<string>()
  for (const a of athletes.value || []) {
    if (a.has_standing_order) ids.add(a.id)
  }
  return ids
})

const standingOrderAthletes = computed(() =>
  (athletes.value || []).filter(a => a.has_standing_order && a.is_active !== false)
)

const selectedAthlete = computed(() =>
  (athletes.value || []).find(a => a.id === selectedAthleteId.value) ?? null
)

const yearStats = computed(() => membershipYearStats(yearRows.value))

const monthOverviewLabel = computed(() => monthLabelPl(month.value))

async function approvePayment(id: string) {
  approvingId.value = id
  try {
    await apiFetch(apiRoutes.payments.approve(id), { method: 'PATCH' })
    toast.add({ title: 'Zatwierdzono płatność', color: 'success' })
    await Promise.all([refreshPending(), refreshOverview(), refreshYearTable()])
  } catch (e) {
    toast.add({ title: 'Nie udało się zatwierdzić', description: getApiErrorMessage(e), color: 'error' })
  } finally {
    approvingId.value = null
  }
}

async function rejectPayment(id: string) {
  rejectingId.value = id
  try {
    await apiFetch(apiRoutes.payments.reject(id), { method: 'PATCH' })
    toast.add({ title: 'Odrzucono zgłoszenie', color: 'success' })
    await Promise.all([refreshPending(), refreshOverview(), refreshYearTable()])
  } catch (e) {
    toast.add({ title: 'Nie udało się odrzucić', description: getApiErrorMessage(e), color: 'error' })
  } finally {
    rejectingId.value = null
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
  amount_pln: MONTHLY_FEE_PLN,
  note: ''
})

const addingApproved = ref(false)

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
  addingApproved.value = true
  try {
    await apiFetch(apiRoutes.payments.createApprovedForAthlete(addApprovedPaymentForm.athlete_id), {
      method: 'POST',
      body: {
        month: addApprovedPaymentForm.month,
        amount_pln: addApprovedPaymentForm.amount_pln != null ? Number(addApprovedPaymentForm.amount_pln) : null,
        note: addApprovedPaymentForm.note
      }
    })
    toast.add({
      title: 'Dodano płatność',
      description: `Kwota zostanie rozbita na miesiące po ${formatPln(MONTHLY_FEE_PLN)}.`,
      color: 'success'
    })
    addApprovedPaymentForm.note = ''
    await Promise.all([refreshOverview(), refreshYearTable()])
  } catch (e) {
    toast.add({ title: 'Nie udało się dodać', description: getApiErrorMessage(e), color: 'error' })
  } finally {
    addingApproved.value = false
  }
}

function selectAthleteFromOverview(athleteId: string) {
  selectedAthleteId.value = athleteId
}

function selectMonthFromGrid(m: string) {
  month.value = m
  void refreshOverview()
}
</script>

<template>
  <PanelPageLayout padding="compact">
    <PanelPageHeader area="trainer" title="Składki klubowe" icon="i-lucide-banknote">
      <template #description>
        Widok <span class="font-semibold text-highlighted">{{ monthOverviewLabel }} {{ month.slice(0, 4) }}</span>
        — zatwierdzanie przelewów, szybkie wpisy i podgląd roku per zawodnik.
      </template>
      <template #actions>
        <UButton to="/trainer/zawodnicy" variant="soft" color="neutral" size="sm" icon="i-lucide-users">
          Zawodnicy
        </UButton>
      </template>
    </PanelPageHeader>

    <div class="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <DashboardKpiCard
        label="Do weryfikacji"
        :value="pendingList.length"
        icon="i-lucide-inbox"
        :tone="pendingList.length ? 'warning' : 'neutral'"
        hint="Zgłoszenia Pending"
      />
      <DashboardKpiCard
        label="Bez wpłaty"
        :value="noneOnly.length"
        icon="i-lucide-circle-off"
        :tone="noneOnly.length ? 'error' : 'success'"
        :hint="monthOverviewLabel"
      />
      <DashboardKpiCard
        label="Opłacone"
        :value="approvedOnly.length"
        icon="i-lucide-badge-check"
        tone="success"
        :hint="monthOverviewLabel"
      />
      <DashboardKpiCard
        label="Przelew stały"
        :value="standingOrderAthletes.length"
        icon="i-lucide-repeat"
        tone="info"
        hint="Auto-składka co miesiąc"
      />
    </div>

    <section
      v-if="pendingList.length"
      class="relative mb-6 overflow-hidden rounded-[1.75rem] border border-warning/30 bg-linear-to-br from-warning/14 via-card to-card p-5 shadow-lg ring-1 ring-warning/20 sm:p-6"
    >
      <div class="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-warning/20 blur-3xl" />
      <div class="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-warning">
            Kolejka weryfikacji
          </p>
          <h2 class="mt-1 text-xl font-black text-highlighted sm:text-2xl">
            Zgłoszenia do zatwierdzenia
          </h2>
          <p class="mt-2 text-sm text-muted">
            {{ pendingList.length }}
            {{ pendingList.length === 1 ? 'wpis czeka' : 'wpisów czeka' }}
            na decyzję kadry.
          </p>
        </div>
        <UButton
          size="sm"
          variant="soft"
          icon="i-lucide-refresh-cw"
          class="shrink-0"
          @click="() => { refreshPending(); refreshOverview() }"
        >
          Odśwież
        </UButton>
      </div>

      <div class="relative mt-5 space-y-3">
        <div
          v-for="p in pendingList"
          :key="p.id"
          class="flex flex-col gap-3 rounded-2xl border border-default/60 bg-background/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <p class="font-bold text-highlighted">{{ p.athlete_name }}</p>
            <p class="mt-1 text-sm text-muted">
              <span class="font-medium text-highlighted">{{ monthLabelPl(p.month) }}</span>
              <span class="font-mono text-xs"> · {{ p.month }}</span>
              <span v-if="p.amount_pln != null"> · {{ formatPln(p.amount_pln) }}</span>
            </p>
            <p v-if="p.note?.trim()" class="mt-1 text-xs text-muted">
              {{ p.note }}
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            <UButton
              size="sm"
              icon="i-lucide-check"
              :loading="approvingId === p.id"
              @click="approvePayment(p.id)"
            >
              Zatwierdź
            </UButton>
            <UButton
              size="sm"
              color="error"
              variant="soft"
              icon="i-lucide-x"
              :loading="rejectingId === p.id"
              @click="rejectPayment(p.id)"
            >
              Odrzuć
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <UCard v-else class="slavia-page-card mb-6 border-default/60">
      <div class="flex items-center gap-3 text-sm text-muted">
        <UIcon name="i-lucide-inbox" class="size-5 text-success" />
        Brak zgłoszeń w statusie oczekującym — wszystko zweryfikowane.
      </div>
    </UCard>

    <UCard class="slavia-page-card mb-6 ring-1 ring-default/30">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Widok miesiąca
          </p>
          <h2 class="mt-1 text-lg font-black text-highlighted">
            {{ monthOverviewLabel }} {{ month.slice(0, 4) }}
          </h2>
        </div>
        <UFormField label="Miesiąc" class="w-full max-w-xs">
          <UInput v-model="month" type="month" class="w-full" @change="() => refreshOverview()" />
        </UFormField>
      </div>

      <UFormField label="Szukaj zawodnika" class="mt-4 max-w-md">
        <UInput v-model="athleteSearch" icon="i-lucide-search" placeholder="Imię i nazwisko…" class="w-full" />
      </UFormField>

      <div class="mt-4 grid gap-4 lg:grid-cols-3">
        <MembershipStatusColumns
          title="Brak wpłaty"
          :rows="noneOnly"
          tone="error"
          badge-label="nieopł."
          :standing-order-ids="standingOrderIds"
          :search="athleteSearch"
          @select-athlete="selectAthleteFromOverview"
        />
        <MembershipStatusColumns
          title="Oczekujące"
          :rows="pendingOnly"
          tone="warning"
          badge-label="pending"
          :standing-order-ids="standingOrderIds"
          :search="athleteSearch"
          @select-athlete="selectAthleteFromOverview"
        />
        <MembershipStatusColumns
          title="Opłacone"
          :rows="approvedOnly"
          tone="success"
          badge-label="ok"
          :standing-order-ids="standingOrderIds"
          :search="athleteSearch"
          @select-athlete="selectAthleteFromOverview"
        />
      </div>
    </UCard>

    <UCard class="slavia-page-card mb-6 ring-1 ring-default/30">
      <p class="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
        Szybki wpis
      </p>
      <h2 class="mt-1 text-lg font-black text-highlighted">
        Dodaj zatwierdzoną płatność
      </h2>
      <p class="mt-1 text-sm text-muted">
        Gotówka lub przelew poza systemem — kwota zostanie rozbita po {{ formatPln(MONTHLY_FEE_PLN) }} na kolejne miesiące.
      </p>
      <div class="mt-4 grid gap-3 md:grid-cols-12 md:items-end">
        <UFormField label="Zawodnik" class="md:col-span-4">
          <USelect
            v-model="addApprovedPaymentForm.athlete_id"
            :items="[{ label: 'Wybierz zawodnika', value: null }, ...((athletes || []).map(a => ({ label: a.full_name, value: a.id })))]"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Miesiąc" class="md:col-span-3">
          <UInput v-model="addApprovedPaymentForm.month" type="month" class="w-full" />
        </UFormField>
        <UFormField label="Kwota" class="md:col-span-3">
          <UInputNumber v-model="addApprovedPaymentForm.amount_pln" :min="1" :step="1" class="w-full" />
        </UFormField>
        <div class="md:col-span-2">
          <UButton
            class="w-full"
            icon="i-lucide-check"
            :loading="addingApproved"
            :disabled="!addApprovedPaymentForm.athlete_id"
            @click="createApprovedPayment"
          >
            Dodaj
          </UButton>
        </div>
        <UFormField label="Opis" class="md:col-span-12">
          <UInput v-model="addApprovedPaymentForm.note" placeholder="np. gotówka / przelew" class="w-full" />
        </UFormField>
      </div>
    </UCard>

    <UCard class="slavia-page-card mb-6 border-success/30 bg-linear-to-r from-success/6 to-card">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="rounded-xl bg-success/15 p-2.5 ring-1 ring-success/25">
            <UIcon name="i-lucide-repeat" class="size-5 text-success" />
          </div>
          <div>
            <h2 class="text-lg font-black text-highlighted">Przelewy stałe</h2>
            <p class="text-sm text-muted">
              {{ standingOrderAthletes.length }}
              {{ standingOrderAthletes.length === 1 ? 'zawodnik ma' : 'zawodników ma' }}
              aktywny przelew stały — system co miesiąc automatycznie księguje składkę.
            </p>
          </div>
        </div>
        <UButton to="/trainer/zawodnicy" size="sm" variant="soft" color="primary" icon="i-lucide-users">
          Zarządzaj
        </UButton>
      </div>
      <div v-if="standingOrderAthletes.length" class="mt-4 flex flex-wrap gap-2">
        <UBadge
          v-for="a in standingOrderAthletes"
          :key="a.id"
          color="success"
          variant="subtle"
          class="cursor-pointer gap-1 transition hover:ring-1 hover:ring-success/40"
          @click="selectAthleteFromOverview(a.id)"
        >
          <UIcon name="i-lucide-repeat" class="size-3" />
          {{ a.full_name }}
        </UBadge>
      </div>
    </UCard>

    <UCard class="slavia-page-card overflow-hidden ring-1 ring-default/30">
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Historia zawodnika
          </p>
          <h2 class="mt-1 text-lg font-black text-highlighted">
            {{ selectedAthlete?.full_name || 'Wybierz zawodnika' }}
          </h2>
          <p v-if="yearRows.length" class="mt-1 text-sm text-muted">
            {{ yearStats.paid }} opłacone · {{ yearStats.pending }} oczekuje · {{ yearStats.overdue }} zaległe
          </p>
        </div>
        <UFormField label="Zawodnik" class="min-w-64">
          <USelect
            v-model="selectedAthleteId"
            :items="(athletes || []).map(a => ({ label: a.full_name, value: a.id }))"
            class="w-full"
          />
        </UFormField>
      </div>
      <MembershipYearGrid
        :rows="yearRows"
        :loading="yearLoading"
        :year="year"
        :allowed-years="allowedYears"
        :selected-month="month"
        :current-month="new Date().toISOString().slice(0, 7)"
        @select-month="selectMonthFromGrid"
        @update:year="year = $event"
      />
    </UCard>
  </PanelPageLayout>
</template>
