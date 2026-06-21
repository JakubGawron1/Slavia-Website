<script setup lang="ts">
import DashboardHero from '~/components/dashboard/DashboardHero.vue'
import DashboardQuickActions from '~/components/dashboard/DashboardQuickActions.vue'
import DashboardUrgentList from '~/components/dashboard/DashboardUrgentList.vue'
import DashboardMonthlySummary from '~/components/dashboard/DashboardMonthlySummary.vue'

definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Panel trenera — Dashboard',
  robots: 'noindex, nofollow'
})

const { isAccountView } = useDashboardAccountView()

const {
  accountSettingsPath,
  approvePayment,
  auth,
  currentMonthStr,
  labelForResult,
  openReviewModal,
  pendingAttendanceCount,
  pendingCount,
  pendingPayments,
  pendingPaymentsCount,
  pendingResults,
  paymentsPendingCount,
  refreshPending,
  refreshPendingPayments,
  rejectPayment,
  reviewModalOpen,
  reviewMode,
  reviewNote,
  reviewSaving,
  submitReview,
  summaryMetrics,
  trainerQuickActions,
  unpaidThisMonth
} = await useTrainerDashboard()

provideDashboardSections()
</script>

<template>
  <div>
  <PanelPageLayout>
    <DashboardAccountView v-if="isAccountView" />
    <template v-else>
    <PanelCollapsibleSection
      section-id="hero"
      title="Powitanie"
      icon="i-lucide-dumbbell"
      :badge="pendingCount || pendingPaymentsCount ? 'Do zrobienia' : undefined"
      :default-open="true"
      class="mt-0"
    >
      <DashboardHero
        eyebrow="Panel trenera"
        :title="`Witaj, ${auth.user.value?.username || 'Trenerze'}!`"
        lead="Najważniejsze moduły, szybkie akcje i rzeczy do zatwierdzenia w jednym miejscu."
        icon="i-lucide-dumbbell"
        :badges="[
          { label: `Oczekujące wyniki: ${pendingCount}`, color: pendingCount ? 'warning' : 'neutral' },
          { label: `Oczekujące składki: ${pendingPaymentsCount}`, color: pendingPaymentsCount ? 'warning' : 'neutral' }
        ]"
        :actions="[
          { label: 'Ustawienia konta', to: accountSettingsPath, icon: 'i-lucide-user-cog', variant: 'outline' },
          { label: 'Zawodnicy', to: '/trainer/zawodnicy', icon: 'i-lucide-users', color: 'primary' },
          { label: 'Wyniki', to: '/trainer/wyniki', icon: 'i-lucide-clipboard-clock', color: 'primary' }
        ]"
      />
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      section-id="quick-actions"
      title="Szybkie akcje"
      icon="i-lucide-zap"
      :default-open="true"
      embedded
      class="mt-6"
    >
      <DashboardQuickActions
        class="slavia-quick-actions--wide"
        :items="trainerQuickActions"
      />
    </PanelCollapsibleSection>

    <DashboardSectionsToolbar class="mt-6" />

    <PanelCollapsibleSection
      section-id="summary"
      title="Podsumowanie miesiąca"
      icon="i-lucide-bar-chart-3"
      :default-open="true"
      class="mt-6"
    >
      <DashboardMonthlySummary :metrics="summaryMetrics" />
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      section-id="klub-hub"
      title="Strefa klubu"
      icon="i-lucide-users"
      :default-open="true"
      embedded
      class="mt-6"
    >
      <KlubHubSection context="trainer" />
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="pendingAttendanceCount > 0"
      section-id="attendance-alert"
      title="Obecności do weryfikacji"
      icon="i-lucide-user-check"
      :badge="String(pendingAttendanceCount)"
      :default-open="true"
      class="mt-6"
    >
      <UAlert
        icon="i-lucide-user-check"
        color="warning"
        variant="subtle"
        title="Obecności oczekują na weryfikację"
        :description="`${pendingAttendanceCount} wpisów — zarządzaj na dedykowanej stronie listy obecności (kalendarz + agenda).`"
      >
        <template #actions>
          <UButton to="/klub/obecnosc" size="sm" color="primary" variant="soft">
            Otwórz listę obecności
          </UButton>
        </template>
      </UAlert>
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      section-id="urgent"
      title="Wymaga uwagi"
      icon="i-lucide-clipboard-clock"
      :badge="pendingCount || pendingPaymentsCount ? String(pendingCount + pendingPaymentsCount) : undefined"
      :default-open="true"
      class="mt-6"
    >
    <PanelDashboardGrid variant="duo">
      <DashboardUrgentList
        title="Wyniki do zatwierdzenia"
        icon="i-lucide-clipboard-clock"
        :count="pendingCount"
        empty-text="Brak oczekujących zgłoszeń wyników."
        :footer-link="{ label: 'Przejdź do wszystkich startów', to: '/trainer/wyniki' }"
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

      <DashboardUrgentList
        title="Składki do zatwierdzenia"
        icon="i-lucide-banknote"
        :count="pendingPaymentsCount"
        empty-text="Brak zgłoszeń składek w statusie oczekującym."
        :footer-link="{ label: 'Przejdź do składek (widok miesiąca)', to: '/trainer/skladki' }"
        :items="(pendingPayments || []).slice(0, 6).map(p => ({
          key: p.id,
          title: p.athlete_name,
          subtitle: `Miesiąc ${p.month}${p.amount_pln != null ? ` · ${p.amount_pln} PLN` : ''}${p.note && p.note.trim() ? ` · ${p.note}` : ''}`,
          badge: { label: 'Pending', color: 'warning' },
          primaryAction: { label: 'Zatwierdź', onClick: () => { void approvePayment(p.id) } },
          secondaryAction: { label: 'Odrzuć', color: 'error', onClick: () => { void rejectPayment(p.id) } }
        }))"
      >
        <template #actions>
          <UButton size="sm" variant="soft" icon="i-lucide-refresh-ccw" @click="refreshPendingPayments()">Odśwież</UButton>
        </template>
      </DashboardUrgentList>

      <UCard v-if="unpaidThisMonth.length" class="rounded-2xl border-warning/40 bg-warning/5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="font-bold text-highlighted">
            Bez wpłaty za {{ currentMonthStr }}
          </h3>
          <UButton size="xs" variant="soft" to="/trainer/skladki">
            Składki
          </UButton>
        </div>
        <ul class="mt-3 space-y-1 text-sm">
          <li v-for="row in unpaidThisMonth" :key="row.athlete_id" class="text-muted">
            {{ row.full_name }}
            <UBadge v-if="row.has_pending" size="xs" color="warning" variant="subtle" class="ml-1">
              Pending
            </UBadge>
          </li>
        </ul>
        <p v-if="paymentsPendingCount > unpaidThisMonth.length" class="mt-2 text-xs text-muted">
          + {{ paymentsPendingCount - unpaidThisMonth.length }} więcej — pełna lista w składkach.
        </p>
      </UCard>
    </PanelDashboardGrid>
    </PanelCollapsibleSection>

    </template>
  </PanelPageLayout>

  <!-- [2002] Modal zatwierdzenia/odrzucenia wyniku z powodem -->
  <SlaviaModal
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
  </SlaviaModal>
  </div>
</template>
