<script setup lang="ts">
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'
import MembershipYearGrid from '~/components/payments/MembershipYearGrid.vue'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import type { Athlete, PaymentMonthStatusRow, PaymentStatusResponse } from '~/types/models'
import { formatPln } from '~/utils/formatCurrency'
import {
  athletePaymentKpiFromStatus,
  daysUntilDueDate,
  hasStandingOrder,
  membershipMonthBadgeFromStatus,
  MONTHLY_FEE_PLN,
  monthLabelPl,
  showPre10PaymentAthleteReminder,
  suggestedTransferTitle
} from '~/utils/paymentSemantics'

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Składka klubowa — Panel zawodnika',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const rolePreviewState = useRolePreviewState()
const apiFetch = useApi()
const toast = useToast()
const terms = useSlaviaCopy()

const paymentStatus = ref<PaymentStatusResponse | null>(null)
const athleteProfile = ref<Athlete | null>(null)
const currentMonth = new Date().toISOString().slice(0, 7)
const {
  year,
  allowedYears,
  yearRows,
  loadingYear,
  yearStats,
  refreshYearTable
} = useMembershipYearGrid(async (y) => {
  if (!auth.canAccessAthletePortal.value || !rolePreviewState.viewingAthletePortal.value) return []
  const q = `?year=${encodeURIComponent(String(y))}`
  return await apiFetch<PaymentMonthStatusRow[]>(`${apiRoutes.payments.myYear}${q}`).catch(() => [])
})
const submitting = ref(false)
const paymentFormRef = ref<HTMLElement | null>(null)
const PAY_HIDE_LS = 'slavia_hide_payment_reminder'
const hidePaymentReminderLocal = ref(false)

function syncPaymentReminderFromStorage() {
  if (!import.meta.client) return
  try {
    hidePaymentReminderLocal.value = localStorage.getItem(PAY_HIDE_LS) === '1'
  } catch {
    /* ignore */
  }
}

const paymentForm = reactive<{
  month: string
  amount_pln: number | null
  note: string
}>({
  month: currentMonth,
  amount_pln: MONTHLY_FEE_PLN,
  note: ''
})

async function loadAthleteProfile() {
  if (!auth.canAccessAthletePortal.value || !rolePreviewState.viewingAthletePortal.value) {
    athleteProfile.value = null
    return
  }
  athleteProfile.value = await apiFetch<Athlete | null>('/api/athletes/me').catch(() => null)
}

async function refreshPaymentStatus() {
  if (!auth.canAccessAthletePortal.value || !rolePreviewState.viewingAthletePortal.value) {
    paymentStatus.value = null
    return
  }
  const q = paymentForm.month ? `?month=${encodeURIComponent(paymentForm.month)}` : ''
  paymentStatus.value = await apiFetch<PaymentStatusResponse>(`${apiRoutes.payments.myStatus}${q}`).catch(() => null)
}

async function refreshAll() {
  await Promise.all([refreshPaymentStatus(), refreshYearTable()])
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
  if (hasStandingOrder(paymentStatus.value)) {
    toast.add({
      title: 'Masz przelew stały',
      description: 'Składka jest księgowana automatycznie — ręczne zgłoszenie nie jest potrzebne.',
      color: 'info'
    })
    return
  }
  submitting.value = true
  try {
    const amount = paymentForm.amount_pln != null ? Number(paymentForm.amount_pln) : null
    await apiFetch(apiRoutes.payments.my, {
      method: 'POST',
      body: {
        month: paymentForm.month,
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
    await refreshAll()
  } catch (e) {
    toast.add({
      title: 'Błąd zgłoszenia płatności',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}

function selectMonthFromGrid(month: string) {
  paymentForm.month = month
  void refreshPaymentStatus()
  paymentFormRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const transferTitle = computed(() =>
  suggestedTransferTitle(paymentForm.month, athleteProfile.value?.full_name)
)

async function copyTransferTitle() {
  try {
    await navigator.clipboard.writeText(transferTitle.value)
    toast.add({ title: 'Skopiowano tytuł przelewu', color: 'success' })
  } catch {
    toast.add({ title: 'Nie udało się skopiować', color: 'warning' })
  }
}

watch(() => paymentForm.month, () => {
  void refreshPaymentStatus()
})

onMounted(() => {
  syncPaymentReminderFromStorage()
  void loadAthleteProfile()
  void refreshAll()
})

const membershipMonthBadge = computed(() => {
  if (!paymentStatus.value) return null
  return membershipMonthBadgeFromStatus(paymentStatus.value, terms.paymentStandingOrder())
})

const paymentKpi = computed(() => {
  if (!paymentStatus.value) {
    return { value: '—', tone: 'info' as const, hint: 'Ładowanie…' }
  }
  return athletePaymentKpiFromStatus(paymentStatus.value, terms.paymentStandingOrder())
})

const daysToDue = computed(() => {
  if (!paymentStatus.value?.due_date) return null
  return daysUntilDueDate(paymentStatus.value.due_date)
})

const dueHint = computed(() => {
  if (!paymentStatus.value) return null
  if (paymentStatus.value.is_paid) return 'Zatwierdzona wpłata w systemie'
  const d = daysToDue.value
  if (d == null) return `Termin: ${paymentStatus.value.due_date}`
  if (d < 0) return `${Math.abs(d)} dni po terminie`
  if (d === 0) return 'Termin dzisiaj'
  return `Pozostało ${d} dni do terminu`
})

const showPre10Reminder = computed(() =>
  showPre10PaymentAthleteReminder({
    isAthlete: auth.isAthlete.value,
    hiddenInBrowserStorage: hidePaymentReminderLocal.value,
    paymentStatus: paymentStatus.value
  })
)

const standingOrderTimeline = computed(() => {
  if (!paymentStatus.value?.has_standing_order) return []
  return yearRows.value
    .filter(r => r.is_paid)
    .map(r => ({
      month: r.month,
      label: monthLabelPl(r.month),
      description: 'Auto-składka (przelew stały)'
    }))
    .reverse()
})

const canSubmitPayment = computed(() =>
  auth.isAthlete.value
  && !rolePreviewState.isReadOnly.value
  && !hasStandingOrder(paymentStatus.value)
  && !paymentStatus.value?.is_paid
)
</script>

<template>
  <PanelPageLayout padding="compact">
    <UAlert
      v-if="rolePreviewState.isReadOnly.value"
      class="mb-4"
      color="warning"
      variant="subtle"
      icon="i-lucide-eye"
      title="Podgląd read-only"
      description="Widzisz składki tego zawodnika — zgłaszanie wpłat jest wyłączone."
    />

    <PanelPageHeader area="athlete" title="Składka klubowa" icon="i-lucide-banknote">
      <template #description>
        Miesięczna składka <span class="font-bold">{{ formatPln(MONTHLY_FEE_PLN) }}</span> — termin
        <span class="font-bold">10.</span> dnia miesiąca. Nadpłata przechodzi na kolejne miesiące po zatwierdzeniu przez kadrę.
      </template>
      <template #actions>
        <UButton to="/athlete" variant="soft" color="neutral" icon="i-lucide-layout-dashboard" size="sm">
          Panel zawodnika
        </UButton>
      </template>
    </PanelPageHeader>

    <PanelDashboardGrid
      v-if="paymentStatus"
      variant="kpi"
      class="mb-6"
    >
      <DashboardKpiCard
        label="Kwota miesięczna"
        :value="formatPln(MONTHLY_FEE_PLN)"
        icon="i-lucide-wallet"
        tone="primary"
        :hint="monthLabelPl(paymentForm.month)"
      />
      <DashboardKpiCard
        label="Status bieżący"
        :value="paymentKpi.value"
        icon="i-lucide-badge-check"
        :tone="paymentKpi.tone"
        :hint="paymentKpi.hint"
      />
      <DashboardKpiCard
        label="Opłacone w roku"
        :value="`${yearStats.paid}/${yearStats.total || 12}`"
        icon="i-lucide-calendar-check"
        :tone="yearStats.overdue ? 'warning' : 'success'"
        :hint="yearStats.pending ? `${yearStats.pending} oczekuje na weryfikację` : `${year}`"
      />
    </PanelDashboardGrid>

    <PanelCalloutBanner
      v-if="paymentStatus?.is_overdue && !paymentStatus.is_paid"
      tone="error"
      icon="i-lucide-alert-triangle"
      title="Zaległa składka"
      :description="`Brak zatwierdzonej wpłaty za ${monthLabelPl(paymentStatus.month)}. Termin minął ${paymentStatus.due_date}.`"
      class="mb-6"
    >
      <template #actions>
        <UButton
          color="error"
          size="sm"
          trailing-icon="i-lucide-arrow-down"
          @click="paymentFormRef?.scrollIntoView({ behavior: 'smooth' })"
        >
          Zgłoś płatność
        </UButton>
      </template>
    </PanelCalloutBanner>

    <PanelCalloutBanner
      v-else-if="showPre10Reminder && paymentStatus"
      tone="warning"
      icon="i-lucide-bell"
      title="Zbliża się termin składki"
      :description="`Do ${paymentStatus.due_date} — zgłoś przelew, aby kadra mogła go szybko zatwierdzić.`"
      class="mb-6"
    />

    <PanelCalloutBanner
      v-if="paymentStatus?.has_standing_order"
      tone="primary"
      icon="i-lucide-repeat"
      title="Przelew stały aktywny"
      description="System co miesiąc automatycznie księguje składkę. Nie musisz zgłaszać wpłat ręcznie."
      class="mb-6"
    />

    <div class="mb-6 grid gap-4 lg:grid-cols-5 lg:items-stretch">
      <section class="slavia-page-card relative flex flex-col overflow-hidden rounded-[1.75rem] border border-primary/25 bg-linear-to-br from-primary/10 via-card to-card p-5 ring-1 ring-primary/15 lg:col-span-2">
        <div class="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary/15 blur-3xl" />
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          Jak zapłacić
        </p>
        <h2 class="mt-1 text-lg font-black text-highlighted">
          Dane przelewu
        </h2>
        <ul class="mt-4 space-y-3 text-sm text-muted">
          <li class="flex gap-2">
            <UIcon name="i-lucide-banknote" class="mt-0.5 size-4 shrink-0 text-primary" />
            <span>Kwota: <strong class="text-highlighted">{{ formatPln(paymentForm.amount_pln ?? MONTHLY_FEE_PLN) }}</strong> (domyślnie {{ formatPln(MONTHLY_FEE_PLN) }})</span>
          </li>
          <li class="flex gap-2">
            <UIcon name="i-lucide-calendar-clock" class="mt-0.5 size-4 shrink-0 text-primary" />
            <span>Termin: <strong class="text-highlighted">10.</strong> dzień miesiąca{{ dueHint ? ` · ${dueHint}` : '' }}</span>
          </li>
          <li class="flex gap-2">
            <UIcon name="i-lucide-file-text" class="mt-0.5 size-4 shrink-0 text-primary" />
            <span class="min-w-0">
              Tytuł przelewu:
              <code class="mt-1 block break-all rounded-lg bg-muted/30 px-2 py-1 text-xs text-highlighted">{{ transferTitle }}</code>
            </span>
          </li>
        </ul>
        <UButton
          class="mt-auto pt-4"
          size="sm"
          variant="soft"
          icon="i-lucide-copy"
          @click="copyTransferTitle"
        >
          Kopiuj tytuł
        </UButton>
      </section>

      <section
        ref="paymentFormRef"
        class="slavia-page-card flex flex-col rounded-[1.75rem] border border-default/70 p-5 ring-1 ring-default/25 lg:col-span-3"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
              Zgłoszenie wpłaty
            </p>
            <h2 class="mt-1 text-lg font-black text-highlighted">
              Po przelewie — wyślij do weryfikacji
            </h2>
          </div>
          <UBadge
            v-if="membershipMonthBadge"
            :color="membershipMonthBadge.color"
            variant="subtle"
            size="lg"
            class="font-bold"
          >
            {{ membershipMonthBadge.label }}
          </UBadge>
        </div>

        <div class="mt-5 grid gap-4 sm:grid-cols-3 sm:items-end">
          <UFormField label="Miesiąc" class="min-w-0">
            <UInput
              v-model="paymentForm.month"
              type="month"
              size="md"
              class="membership-fee-input w-full"
            />
          </UFormField>
          <UFormField label="Kwota (PLN)" class="min-w-0">
            <UInput
              v-model.number="paymentForm.amount_pln"
              type="number"
              :min="1"
              :step="1"
              size="md"
              class="membership-fee-input w-full"
              :disabled="!canSubmitPayment"
            />
          </UFormField>
          <UFormField label="Opis" class="min-w-0">
            <UInput
              v-model="paymentForm.note"
              size="md"
              class="membership-fee-input w-full"
              placeholder="np. przelew mBank"
              :disabled="!canSubmitPayment"
            />
          </UFormField>
        </div>
        <p class="mt-2 text-xs text-muted">
          Domyślnie {{ formatPln(MONTHLY_FEE_PLN) }} · opis opcjonalny
        </p>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <UButton
            color="primary"
            size="md"
            icon="i-lucide-send"
            :loading="submitting"
            :disabled="!canSubmitPayment"
            @click="submitMembershipPayment"
          >
            Zgłoś płatność
          </UButton>
          <UButton
            color="neutral"
            variant="soft"
            size="md"
            icon="i-lucide-refresh-cw"
            @click="refreshAll"
          >
            Odśwież
          </UButton>
          <span v-if="paymentStatus" class="text-xs text-muted">
            Termin: {{ paymentStatus.due_date }}
          </span>
        </div>
        <p v-if="hasStandingOrder(paymentStatus)" class="mt-3 text-sm text-muted">
          Przy aktywnym przelewie stałym formularz jest wyłączony — wpisy tworzy system automatycznie.
        </p>
        <p v-else-if="paymentStatus?.is_paid" class="mt-3 text-sm text-success">
          Ten miesiąc jest już opłacony (zatwierdzony).
        </p>
      </section>
    </div>

    <UCard
      v-if="standingOrderTimeline.length"
      class="mb-6 slavia-page-card overflow-hidden border-primary/30 bg-linear-to-r from-primary/8 to-card"
    >
      <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
        Przelew stały
      </p>
      <h2 class="mt-1 text-lg font-black text-highlighted">
        Historia auto-składek
      </h2>
      <ol class="mt-4 space-y-0">
        <li
          v-for="(item, idx) in standingOrderTimeline"
          :key="item.month"
          class="relative flex gap-3 pb-4 last:pb-0"
        >
          <div class="flex flex-col items-center">
            <div class="flex size-8 items-center justify-center rounded-full bg-success/15 text-success ring-1 ring-success/30">
              <UIcon name="i-lucide-check" class="size-4" />
            </div>
            <div v-if="idx < standingOrderTimeline.length - 1" class="mt-1 w-px flex-1 bg-success/25" />
          </div>
          <div class="min-w-0 flex-1 pt-0.5">
            <p class="font-semibold text-highlighted">{{ item.label }}</p>
            <p class="text-sm text-muted">{{ item.description }}</p>
            <p class="font-mono text-[10px] text-muted">{{ item.month }}</p>
          </div>
        </li>
      </ol>
    </UCard>

    <UCard class="slavia-page-card overflow-hidden ring-1 ring-default/30">
      <MembershipYearGrid
        :rows="yearRows"
        :loading="loadingYear"
        :year="year"
        :allowed-years="allowedYears"
        :selected-month="paymentForm.month"
        :current-month="currentMonth"
        @select-month="selectMonthFromGrid"
        @update:year="year = $event"
      />
    </UCard>
  </PanelPageLayout>
</template>

<style scoped>
:deep(.membership-fee-input input) {
  min-height: 2.75rem;
}
</style>
