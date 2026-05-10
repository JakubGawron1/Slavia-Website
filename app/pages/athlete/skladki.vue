<script setup lang="ts">
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import type { PaymentMonthStatusRow, PaymentStatusResponse } from '~/types/models'

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Składka klubowa — Panel zawodnika',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()

const paymentStatus = ref<PaymentStatusResponse | null>(null)
const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const canPreviewNextYear = computed(() => currentMonth >= 11)
const allowedYears = computed(() => (canPreviewNextYear.value ? [currentYear, currentYear + 1] : [currentYear]))
const year = ref<number>(currentYear)
const loadingYear = ref(false)
const yearRows = ref<PaymentMonthStatusRow[]>([])

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
  if (!auth.canAccessAthletePortal.value || !auth.isAthlete.value) {
    yearRows.value = []
    return
  }
  // twarde ograniczenie wyboru roku w UI
  if (!allowedYears.value.includes(year.value)) {
    year.value = allowedYears.value[0]!
  }
  loadingYear.value = true
  try {
    const q = `?year=${encodeURIComponent(String(year.value))}`
    const rows = await apiFetch<PaymentMonthStatusRow[]>(`${apiRoutes.payments.myYear}${q}`).catch(() => [])
    yearRows.value = Array.isArray(rows) ? rows : []
  } finally {
    loadingYear.value = false
  }
}

const paymentForm = reactive<{
  month: string
  amount_pln: number | null
  note: string
}>({
  month: new Date().toISOString().slice(0, 7),
  amount_pln: 50,
  note: ''
})

async function refreshPaymentStatus() {
  if (!auth.canAccessAthletePortal.value || !auth.isAthlete.value) {
    paymentStatus.value = null
    return
  }
  const q = paymentForm.month ? `?month=${encodeURIComponent(paymentForm.month)}` : ''
  paymentStatus.value = await apiFetch<PaymentStatusResponse>(`${apiRoutes.payments.myStatus}${q}`).catch(() => null)
}

async function submitMembershipPayment() {
  if (!auth.canAccessAthletePortal.value) {
    toast.add({ title: 'Brak dostępu', description: 'Ta sekcja wymaga dostępu do panelu zawodnika.', color: 'warning' })
    return
  }
  if (!auth.isAthlete.value) {
    toast.add({ title: 'Brak roli zawodnika', description: 'Tylko konto z rolą Athlete może zgłaszać płatności.', color: 'warning' })
    return
  }
  try {
    const amount = paymentForm.amount_pln != null ? Number(paymentForm.amount_pln) : null
    await apiFetch(apiRoutes.payments.my, {
      method: 'POST',
      body: {
        month: paymentForm.month,
        // 0/ujemne traktujemy jak „nie podano” (backend ma domyślne 50 PLN przy zatwierdzeniu).
        amount_pln: amount != null && Number.isFinite(amount) && amount > 0 ? amount : null,
        note: paymentForm.note
      }
    })
    toast.add({
      title: 'Zgłoszono płatność',
      description: 'Zgłoszenie trafiło do weryfikacji przez kadrę.',
      color: 'success'
    })
    paymentForm.note = ''
    await refreshPaymentStatus()
  } catch (e) {
    toast.add({
      title: 'Błąd zgłoszenia płatności',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

onMounted(() => {
  void refreshPaymentStatus()
  void refreshYearTable()
})

const membershipMonthBadge = computed(() => {
  if (!paymentStatus.value) return null
  const ps = paymentStatus.value
  if (ps.is_paid) return { color: 'success' as const, label: 'Opłacona' }
  if (ps.is_overdue) return { color: 'error' as const, label: 'Nieopłacona' }
  if (ps.has_standing_order === true) return { color: 'info' as const, label: 'Przelew stały' }
  return { color: 'warning' as const, label: 'Niepotwierdzona' }
})
</script>

<template>
  <UContainer class="py-8 md:py-14">
    <div class="mb-6">
      <p class="text-sm font-medium uppercase tracking-wider text-primary">Panel zawodnika</p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">Składka klubowa</h1>
      <p class="mt-2 max-w-2xl text-sm text-muted">
        Składka miesięczna to <span class="font-bold">50 zł</span>. Jeśli zapłacisz więcej, nadpłata przechodzi na kolejne miesiące (po zatwierdzeniu przez kadrę).
      </p>
    </div>

    <UAlert
      v-if="auth.isAthlete.value && paymentStatus && paymentStatus.is_overdue && !paymentStatus.is_paid"
      icon="i-lucide-alert-triangle"
      title="Brak opłaconej składki"
      :description="`Nie masz zatwierdzonej płatności za ${paymentStatus.month}. Termin płatności to 10.${paymentStatus.month.slice(5,7)}.${paymentStatus.month.slice(0,4)}.`"
      color="error"
      variant="subtle"
      class="mb-4 rounded-2xl"
    />

    <UCard class="rounded-2xl border-default/70">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-black text-highlighted">Status</h2>
        <UBadge
          v-if="membershipMonthBadge"
          :color="membershipMonthBadge.color"
          variant="subtle"
        >
          {{ membershipMonthBadge.label }}
        </UBadge>
      </div>

      <div class="mt-5 grid gap-4 sm:grid-cols-3">
        <UFormField label="Miesiąc">
          <UInput v-model="paymentForm.month" type="month" size="lg" class="w-full" @change="refreshPaymentStatus" />
        </UFormField>
        <UFormField label="Kwota (PLN)" description="Domyślnie 50; możesz wpisać więcej.">
          <UInputNumber v-model="paymentForm.amount_pln" :min="1" :step="1" size="lg" class="w-full" />
        </UFormField>
        <UFormField label="Opis" description="Opcjonalnie">
          <UInput v-model="paymentForm.note" size="lg" class="w-full" placeholder="np. składka maj / przelew" />
        </UFormField>
      </div>

      <div class="mt-5 flex flex-wrap items-center gap-2">
        <UButton color="primary" variant="soft" size="lg" icon="i-lucide-banknote" @click="submitMembershipPayment">
          Zgłoś płatność
        </UButton>
        <UButton color="neutral" variant="ghost" size="lg" icon="i-lucide-refresh-cw" @click="refreshPaymentStatus">
          Odśwież
        </UButton>
        <p v-if="paymentStatus" class="text-xs text-muted">Termin: {{ paymentStatus.due_date }}</p>
      </div>
    </UCard>

    <UCard class="mt-6 rounded-2xl border-default/70">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div class="min-w-0">
          <h2 class="text-lg font-black text-highlighted">
            Opłacone miesiące (rok)
          </h2>
          <p class="mt-1 text-sm text-muted">
            Widok roczny pokazuje: opłacone (Approved), oczekujące (Pending) i brak wpłaty.
          </p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
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
          <UButton size="sm" variant="soft" icon="i-lucide-refresh-cw" :loading="loadingYear" @click="refreshYearTable">
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
              <th class="px-4 py-3 text-right font-semibold text-muted">Akcje</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-if="loadingYear">
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
                  icon="i-lucide-arrow-right"
                  @click="paymentForm.month = r.month; refreshPaymentStatus()"
                >
                  Ustaw w formularzu
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </UContainer>
</template>

