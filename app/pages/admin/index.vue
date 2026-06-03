<script setup lang="ts">
import type { Athlete, AthletePaymentOverviewRow, CompetitionResult, MobileReleaseInfo } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'
import DashboardHero from '~/components/dashboard/DashboardHero.vue'
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'
import DashboardUrgentList from '~/components/dashboard/DashboardUrgentList.vue'
import DashboardMonthlySummary from '~/components/dashboard/DashboardMonthlySummary.vue'
import { dashboardLink, type DashboardModuleLink } from '~/utils/dashboardLink'

definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Panel admina — Dashboard',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const { isAccountView } = useDashboardAccountView()
const { accountSettingsPath } = useRoleDashboardNav()
const apiFetch = useApi()
const isSuperAdmin = computed(() => auth.isSuperAdmin.value)
/** Sam administrator (bez osobnej roli trenera i bez SuperAdmin). */
const isPureAdmin = computed(() => {
  const r = auth.user.value?.roles ?? []
  return r.includes('Admin')
    && !r.includes('Trainer')
    && !r.includes('SuperAdmin')
})

// Pobieranie podstawowych statystyk
const { data: athletes } = await useAsyncData(
  'dashboard-athletes',
  async (): Promise<Athlete[]> => {
    try {
      return await apiFetch<Athlete[]>('/api/athletes/admin')
    } catch {
      return await apiFetch<Athlete[]>('/api/athletes')
    }
  }
)
const { data: pendingResults, refresh: refreshPending } = await useAsyncData(
  'dashboard-pending',
  async (): Promise<CompetitionResult[]> =>
    apiFetch<CompetitionResult[]>('/api/results/pending').catch(() => [])
)
const { data: competitions } = await useAsyncData('dashboard-competitions', () => apiFetch('/api/competitions').catch(() => []))

/** KPI Summary Data (Extended) */
const currentMonthStr = new Date().toISOString().slice(0, 7)
const { data: paymentsOverview } = await useAsyncData(
  'admin-kpi-payments',
  () => apiFetch<AthletePaymentOverviewRow[]>('/api/payments/overview?month=' + currentMonthStr).catch(() => [])
)

const paidCount = computed(() => (paymentsOverview.value || []).filter(r => r.has_approved).length)
const totalAthletesWithRecords = computed(() => (paymentsOverview.value || []).length)
const paymentProgress = computed(() => {
  if (totalAthletesWithRecords.value === 0) return 0
  return Math.round((paidCount.value / totalAthletesWithRecords.value) * 100)
})
const paymentsPendingCount = computed(
  () => (paymentsOverview.value || []).filter((r: { has_approved?: boolean }) => !r.has_approved).length
)

const { data: recentAttendance } = await useAsyncData(
  'admin-kpi-attendance-recent',
  () => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    const from = d.toISOString().slice(0, 10)
    return apiFetch<{ status: string }[]>(`/api/attendance?from_date=${from}`).catch(() => [])
  }
)

const avgAttendance = computed(() => {
  const rows = recentAttendance.value || []
  if (rows.length === 0) return 0
  const present = rows.filter(r => r.status === 'obecny').length
  return Math.round((present / rows.length) * 100)
})

const toast = useToast()

const athleteNameById = computed(() => {
  const m = new Map<string, string>()
  for (const a of (athletes.value || []) as Athlete[]) {
    m.set(a.id, a.full_name)
  }
  return m
})

function labelForResult(r: CompetitionResult) {
  return athleteNameById.value.get(r.athlete_id) || r.athlete_id
}

const athletesCount = computed(() => {
  const list = athletes.value
  if (!Array.isArray(list)) {
    return 0
  }
  return list.filter(a => a.is_active !== false).length
})
const pendingCount = computed(() => Array.isArray(pendingResults.value) ? pendingResults.value.length : 0)
const _competitionsCount = computed(() => Array.isArray(competitions.value) ? competitions.value.length : 0)

// [2002] Review modal state
const reviewModalOpen = ref(false)
const reviewingId = ref('')
const reviewMode = ref<'approve' | 'reject'>('approve')
const reviewNote = ref('')
const reviewSaving = ref(false)

function openReviewModal(id: string, mode: 'approve' | 'reject') {
  reviewingId.value = id
  reviewMode.value = mode
  reviewNote.value = ''
  reviewModalOpen.value = true
}

async function submitReview() {
  reviewSaving.value = true
  try {
    const body = reviewNote.value.trim() ? { review_note: reviewNote.value.trim() } : undefined
    if (reviewMode.value === 'approve') {
      await apiFetch(`/api/results/${reviewingId.value}/approve`, { method: 'PATCH', body })
      toast.add({ title: 'Wynik zatwierdzony', color: 'success' })
    } else {
      await apiFetch(`/api/results/${reviewingId.value}/reject`, { method: 'PATCH', body })
      toast.add({ title: 'Wynik odrzucony', color: 'success' })
    }
    reviewModalOpen.value = false
    await refreshPending()
  } catch (e) {
    toast.add({ title: 'Błąd weryfikacji', description: getApiErrorMessage(e), color: 'error' })
  } finally {
    reviewSaving.value = false
  }
}

const syncingMobile = ref(false)
async function syncMobileReleases() {
  syncingMobile.value = true
  try {
    const res = await apiFetch<MobileReleaseInfo>('/api/system/mobile-releases/sync', { method: 'POST' })
    toast.add({
      title: 'Zsynchronizowano wydania mobilne',
      description: `Najnowsza wersja: ${res.version}`,
      color: 'success'
    })
  } catch (e) {
    toast.add({
      title: 'Błąd synchronizacji',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    syncingMobile.value = false
  }
}

const moduleGroups = computed((): { title: string, items: DashboardModuleLink[] }[] => {
  const isTrainerScope = !isPureAdmin.value
  const admin: { title: string, items: DashboardModuleLink[] }[] = [
    {
      title: 'Najczęstsze',
      items: [
        dashboardLink('Zespół i konta', 'Zawodnicy + logowania', 'i-lucide-users-round', '/admin/zawodnicy', 'text-blue-500', 'bg-blue-500/10'),
        dashboardLink('Wiadomości (kontakt)', 'Skrzynka formularza', 'i-lucide-mail', '/admin/kontakt-wiadomosci', 'text-info', 'bg-info/12'),
        dashboardLink('Changelog', 'Historia wydań', 'i-lucide-file-text', '/admin/changelog', 'text-success', 'bg-success/12'),
        dashboardLink('Powiadomienia', 'Alerty systemowe', 'i-lucide-bell', '/powiadomienia', 'text-amber-600', 'bg-amber-500/10')
      ]
    },
    {
      title: 'Treści publiczne',
      items: [
        dashboardLink('Aktualności', 'Wpisy na stronie', 'i-lucide-newspaper', '/aktualnosci', 'text-orange-500', 'bg-orange-500/10'),
        dashboardLink('Ogłoszenia', 'Tablica klubu', 'i-lucide-megaphone', '/ogloszenia', 'text-violet-500', 'bg-violet-500/10'),
        dashboardLink('Galeria', 'Zdjęcia', 'i-lucide-images', '/galeria', 'text-pink-500', 'bg-pink-500/10'),
        dashboardLink('Ranking zawodników', 'Wyniki publiczne', 'i-lucide-trophy', '/zawodnicy', 'text-yellow-500', 'bg-yellow-500/10'),
        dashboardLink('Wyzwania miesiąca', 'Aktywność w klubie', 'i-lucide-flame', '/klub/wyzwania', 'text-orange-500', 'bg-orange-500/10'),
        dashboardLink('Kalendarz', 'Wydarzenia', 'i-lucide-calendar', '/kalendarz', 'text-purple-500', 'bg-purple-500/10')
      ]
    },
    {
      title: 'Konto i narzędzia',
      items: [
        dashboardLink('Proporcje (ratio)', 'Kalkulator bojów', 'i-lucide-sigma', '/kalkulator-proporcji', 'text-success', 'bg-success/12'),
      ]
    }
  ]
  if (!isTrainerScope) return admin
  const trainerBlock: { title: string, items: DashboardModuleLink[] } = {
    title: 'Kadra trenera',
    items: [
      dashboardLink('Starty zawodników', 'Lista startów', 'i-lucide-list-checks', '/trainer/wyniki', 'text-teal-500', 'bg-teal-500/10'),
      dashboardLink('Składki klubowe', 'Zatwierdzanie wpłat', 'i-lucide-banknote', '/trainer/skladki', 'text-green-600', 'bg-green-500/10'),
      dashboardLink('Lista obecności', 'Weryfikacja', 'i-lucide-user-check', '/attendance', 'text-indigo-600', 'bg-indigo-500/10'),
      dashboardLink('Dzienniki', 'Wpisy treningowe', 'i-lucide-book-marked', '/trainer/dziennik', 'text-cyan-600', 'bg-cyan-500/10'),
      dashboardLink('Plany treningowe', 'Monitoring progresu', 'i-lucide-clipboard-list', '/trainer/plany', 'text-emerald-600', 'bg-emerald-500/10'),
      dashboardLink('Regeneracja', 'Check-in zawodników', 'i-lucide-heart-pulse', '/trainer/regeneracja', 'text-rose-600', 'bg-rose-500/10'),
      dashboardLink('Feed wydarzeń', 'Aktywności', 'i-lucide-list-collapse', '/trainer/wydarzenia', 'text-fuchsia-600', 'bg-fuchsia-500/10'),
      dashboardLink('Inne ćwiczenia', 'Ranking siłowy', 'i-lucide-bar-chart-3', '/trainer/exercises', 'text-lime-600', 'bg-lime-500/10'),
      dashboardLink('Słownik ćwiczeń', 'Baza do planów', 'i-lucide-library', '/trainer/cwiczenia', 'text-indigo-500', 'bg-indigo-500/10'),
      dashboardLink('Analiza sztangi', 'Wideo', 'i-lucide-scan-line', '/trainer/analiza-sztangi', 'text-orange-500', 'bg-orange-500/10'),
      dashboardLink('Monitoring', 'Metryki', 'i-lucide-activity', '/trainer/monitoring', 'text-sky-600', 'bg-sky-500/10'),
      dashboardLink('Czat', 'Wiadomości 1:1', 'i-lucide-messages-square', '/chat', 'text-info', 'bg-info/12')
    ]
  }
  const [most, content, account] = admin
  if (!most || !content || !account) return admin
  return [most, content, trainerBlock, account]
})

function toneFromBg(bg?: string): 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const s = String(bg || '').toLowerCase()
  if (s.includes('red')) return 'error'
  if (s.includes('rose')) return 'error'
  if (s.includes('orange')) return 'warning'
  if (s.includes('amber') || s.includes('yellow')) return 'warning'
  if (s.includes('fuchsia')) return 'primary'
  if (s.includes('emerald') || s.includes('green') || s.includes('teal') || s.includes('lime')) return 'success'
  if (s.includes('sky') || s.includes('cyan') || s.includes('blue') || s.includes('indigo')) return 'info'
  if (s.includes('violet') || s.includes('purple') || s.includes('primary')) return 'primary'
  return 'neutral'
}

</script>

<template>
  <div>
  <PanelPageLayout>
    <DashboardAccountView v-if="isAccountView" />
    <template v-else>
    <DashboardHero
      eyebrow="Administracja"
      :title="`Witaj, ${auth.user.value?.username || 'Adminie'}!`"
      lead="Szybkie wejścia do modułów i lista rzeczy, które wymagają uwagi."
      icon="i-lucide-shield"
      :badges="[
        { label: `Wyniki do zatwierdzenia: ${pendingCount}`, color: pendingCount ? 'warning' : 'neutral' },
        { label: `Zawodnicy: ${athletesCount}`, color: 'neutral' }
      ]"
      :actions="[
        { label: 'Ustawienia konta', to: accountSettingsPath, icon: 'i-lucide-user-cog', variant: 'outline' }
      ]"
    />

    <!-- Statystyki — nad banerami i skrótami -->
    <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-2 lg:gap-4">
        <DashboardKpiCard label="Zawodnicy (aktywni)" :value="athletesCount" icon="i-lucide-users" tone="info" to="/admin/zawodnicy" />
        <DashboardKpiCard
          label="Wyniki oczekujące"
          :value="pendingCount"
          icon="i-lucide-clipboard-clock"
          :tone="pendingCount ? 'warning' : 'info'"
          :to="{ path: '/admin', hash: '#wyniki-oczekujace' }"
        />
        <DashboardKpiCard label="Składki (opłacone)" :value="`${paymentProgress}%`" icon="i-lucide-banknote" tone="success" to="/admin/zawodnicy" />
        <DashboardKpiCard label="Obecność (30d)" :value="`${avgAttendance}%`" icon="i-lucide-user-check" tone="primary" to="/attendance" hint="Lista i weryfikacja na /attendance" />
      </div>
      <div class="lg:col-span-1">
        <DashboardMonthlySummary
          :athletes-active="athletesCount"
          :payment-progress="paymentProgress"
          :payments-pending="paymentsPendingCount"
          :avg-attendance30d="avgAttendance"
          :pending-results="pendingCount"
        />
      </div>
    </div>

    <div class="slavia-panel-section space-y-2">
      <PanelModuleGrid
        v-for="g in moduleGroups"
        :key="g.title"
        :title="g.title"
        :items="g.items"
        :tone-from-bg="toneFromBg"
      />
    </div>

    <!-- SuperAdmin Banner -->
    <div
      v-if="isSuperAdmin"
      class="mb-10 flex flex-col gap-4 rounded-2xl border border-primary/20 bg-linear-to-r from-primary/10 to-purple-500/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div class="flex items-start gap-3 sm:items-center sm:gap-4">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary sm:h-12 sm:w-12">
          <UIcon
            name="i-lucide-shield-check"
            class="size-6"
          />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-wider text-primary sm:text-sm">
            Tryb SuperAdmin
          </p>
          <p class="mt-0.5 text-sm text-muted">
            Masz dostęp do zaawansowanych narzędzi systemowych.
          </p>
        </div>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row">
        <UButton
          size="lg"
          variant="soft"
          color="neutral"
          icon="i-lucide-refresh-ccw"
          :loading="syncingMobile"
          class="min-h-11 justify-center"
          @click="syncMobileReleases"
        >
          Sync Mobile Releases
        </UButton>
        <UButton
          to="/superadmin"
          trailing-icon="i-lucide-arrow-right"
          size="lg"
          class="min-h-11 w-full shrink-0 justify-center sm:w-auto"
        >
          Panel SuperAdmin
        </UButton>
      </div>
    </div>

    <PanelDashboardHub />

    <div class="mt-10">
      <DashboardUrgentList
        title="Wyniki do zatwierdzenia"
        icon="i-lucide-clipboard-clock"
        :count="pendingCount"
        empty-text="Brak oczekujących zgłoszeń."
        :footer-link="{ label: 'Wszystkie starty / dodaj wpis', to: '/trainer/wyniki' }"
        :items="(pendingResults || []).slice(0, 6).map(r => ({
          key: r.id,
          title: labelForResult(r),
          subtitle: `Rwanie ${r.snatch} · Podrzut ${r.clean_and_jerk} · Razem ${r.total} · ${r.date.slice(0,10)}`,
          badge: { label: 'Pending', color: 'warning' },
          primaryAction: { label: 'Zatwierdź', onClick: () => { openReviewModal(r.id, 'approve') } },
          secondaryAction: { label: 'Odrzuć', color: 'error', onClick: () => { openReviewModal(r.id, 'reject') } }
        }))"
      >
        <template #actions>
          <UButton size="sm" variant="soft" icon="i-lucide-refresh-ccw" @click="refreshPending()">Odśwież</UButton>
        </template>
      </DashboardUrgentList>
    </div>
    </template>
  </PanelPageLayout>

  <!-- [2002] Modal zatwierdzenia/odrzucenia wyniku z powodem -->
  <UModal
    v-model:open="reviewModalOpen"
    :title="reviewMode === 'approve' ? 'Zatwierdź wynik' : 'Odrzuć wynik'"
    :dismissible="true"
    :ui="{ content: 'sm:max-w-lg rounded-3xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField :label="reviewMode === 'approve' ? 'Uwaga do zawodnika (opcjonalnie)' : 'Powód odrzucenia (zalecane)'">
          <UTextarea
            v-model="reviewNote"
            :rows="3"
            :placeholder="reviewMode === 'approve' ? 'Np. Dobry start, wynik zatwierdzony.' : 'Np. Brak zaświadczenia / Błędna data'"
            class="w-full"
          />
        </UFormField>
        <p class="text-xs text-muted">
          Powód zostanie dostarczony zawodnikowi jako powiadomienie w aplikacji.
        </p>
        <div class="flex justify-end gap-2 border-t border-default/60 pt-3">
          <UButton color="neutral" variant="outline" @click="reviewModalOpen = false">Anuluj</UButton>
          <UButton
            :color="reviewMode === 'approve' ? 'primary' : 'error'"
            :loading="reviewSaving"
            @click="submitReview"
          >
            {{ reviewMode === 'approve' ? 'Zatwierdź' : 'Odrzuć' }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
  </div>
</template>
