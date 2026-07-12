<script setup lang="ts">
import DashboardHero from '~/components/dashboard/DashboardHero.vue'
import DashboardKpiCard from '~/components/dashboard/DashboardKpiCard.vue'
import DashboardQuickActions from '~/components/dashboard/DashboardQuickActions.vue'
import DashboardWeekPreview from '~/components/dashboard/DashboardWeekPreview.vue'

definePageMeta({ middleware: 'auth' })

const clubHubOn = useExperimentalFlag('club_hub')
const { isAccountView } = useDashboardAccountView()

const {
  auth,
  accountSettingsPath,
  athlete,
  athleteModuleGroups,
  athleteQuickActions,
  attendanceKpiLoad,
  attendanceSummary,
  checklistDoneCount,
  checklistItems,
  checklistTotal,
  clearGoal,
  daysUntilNearest,
  dismissOnboarding,
  goalCurrentValue,
  goalEditing,
  goalMode,
  goalProgress,
  goalTarget,
  heroBadges,
  isAthleteRole,
  latestRelease,
  myPendingResultsCount,
  nearestCalendarEntry,
  pageHeading,
  pageLead,
  paymentKpi,
  paymentKpiLoad,
  paymentStatus,
  portalHeroAvatarSrc,
  preStartEntry,
  refreshAttendanceSummary,
  refreshPaymentStatus,
  saveGoal,
  seasonGoal,
  showArchivedAthleteNote,
  showOnboarding,
  showOverduePaymentAlert,
  showPre10PaymentBanner,
  toggleChecklistItem,
  toneFromIconBg,
  welcomeName
} = await useAthleteDashboard()

useSeoMeta({
  title: 'Profil konta — CKS Slavia Ruda Śląska',
  robots: 'noindex, nofollow'
})

provideDashboardSections()
</script>

<template>
  <PanelPageLayout padding="compact">
    <DashboardAccountView v-if="isAccountView" />
    <template v-else>
    <PanelCollapsibleSection
      section-id="hero"
      title="Powitanie"
      icon="i-lucide-user"
      :default-open="true"
    >
      <DashboardHero
        :eyebrow="pageHeading"
        :title="`Cześć, ${welcomeName}`"
        :lead="pageLead"
        icon="i-lucide-dumbbell"
        :avatar-src="portalHeroAvatarSrc"
        :avatar-alt="welcomeName"
        :badges="heroBadges"
        :actions="[
          { label: 'Ustawienia', to: accountSettingsPath, icon: 'i-lucide-user-cog', variant: 'outline' },
          { label: 'Moje starty', to: '/athlete/wyniki', icon: 'i-lucide-trophy', color: 'primary' }
        ]"
      />
      <DashboardQuickActions
        v-if="auth.canAccessAthletePortal && athlete"
        class="slavia-quick-actions--wide mt-4"
        :items="athleteQuickActions"
        aria-label="Skróty do modułów"
      />
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="auth.canAccessAthletePortal && athlete"
      section-id="badges"
      title="Osiągnięcia"
      icon="i-lucide-award"
      :default-open="true"
      class="mt-4"
    >
      <AthleteBadges :athlete="athlete" :present-count="attendanceSummary?.present_count || 0" />
    </PanelCollapsibleSection>

    <div
      v-if="auth.canAccessAthletePortal && athlete"
      class="mt-4 space-y-3"
    >
      <UAlert
        v-if="showArchivedAthleteNote"
        class="rounded-2xl"
        color="warning"
        variant="subtle"
        icon="i-lucide-ghost"
        title="Profil w archiwum kadry"
        description="Nie jesteś na liście aktywnej kadry, ale historia startów pozostaje dostępna. Napisz trenerowi, jeśli wracasz do treningów."
      >
        <template #actions>
          <UButton to="/klub/czat" size="xs" color="primary" variant="soft" icon="i-lucide-messages-square">
            Napisz do trenera
          </UButton>
        </template>
      </UAlert>

      <UAlert
        v-if="showOverduePaymentAlert && paymentStatus"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        :title="`Zaległa składka — ${paymentStatus.month}`"
        description="Termin płatności minął 10. dnia miesiąca. Zgłoś przelew w module składek."
      >
        <template #actions>
          <UButton to="/athlete/skladki" size="sm" color="error" variant="soft">
            Zgłoś płatność
          </UButton>
        </template>
      </UAlert>

      <UAlert
        v-else-if="showPre10PaymentBanner && paymentStatus"
        color="warning"
        variant="subtle"
        icon="i-lucide-banknote"
        title="Zbliża się termin składki"
        :description="`Brak zatwierdzonej wpłaty za ${paymentStatus.month}. Zgłoś przelew do 10. dnia miesiąca.`"
      >
        <template #actions>
          <UButton to="/athlete/skladki" size="sm" color="warning" variant="soft">
            Składki
          </UButton>
        </template>
      </UAlert>
    </div>

    <DashboardSectionsToolbar class="mt-4" />

    <PanelCollapsibleSection
      v-if="auth.canAccessAthletePortal && athlete"
      section-id="overview"
      title="Dziś i ten miesiąc"
      icon="i-lucide-gauge"
      :default-open="true"
      class="mt-4"
    >
      <div class="space-y-4">
        <DashboardWeekPreview
          v-if="isAthleteRole"
          :entry="nearestCalendarEntry"
          :days-until="daysUntilNearest"
        />
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <DashboardKpiCard
            size="compact"
            label="Składka"
            :value="paymentKpi.value"
            icon="i-lucide-banknote"
            :tone="paymentKpi.tone"
            :hint="paymentKpi.hint"
            :loading="paymentKpiLoad.loading.value"
            :failed="paymentKpiLoad.failed.value"
            error-hint="Nie udało się załadować składki — spróbuj ponownie"
            to="/athlete/skladki"
            @retry="refreshPaymentStatus"
          />
          <DashboardKpiCard
            size="compact"
            label="Frekwencja"
            :value="attendanceSummary ? `${attendanceSummary.attendance_percent}%` : '—'"
            icon="i-lucide-user-check"
            :tone="attendanceSummary ? 'primary' : 'info'"
            :hint="attendanceSummary ? `${attendanceSummary.present_count} obecności · ${attendanceSummary.absent_count} nieob.` : null"
            :loading="attendanceKpiLoad.loading.value"
            :failed="attendanceKpiLoad.failed.value"
            error-hint="Nie udało się załadować frekwencji — spróbuj ponownie"
            to="/klub/obecnosc"
            @retry="refreshAttendanceSummary"
          />
          <DashboardKpiCard
            size="compact"
            label="Wyniki oczek."
            :value="myPendingResultsCount"
            icon="i-lucide-clipboard-clock"
            :tone="myPendingResultsCount ? 'warning' : 'info'"
            to="/athlete/wyniki"
          />
        </div>
        <ClubVotingWidget />
      </div>
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="preStartEntry"
      section-id="prestart"
      class="mt-4"
      title="Lista przed startem"
      icon="i-lucide-check-square"
      :badge="daysUntilNearest === 0 ? 'Dzisiaj' : 'Jutro'"
      :default-open="true"
    >
      <div class="rounded-xl border border-warning/40 bg-warning/6 p-4">
        <p class="mb-3 text-sm text-muted">
          <span class="font-semibold text-highlighted">{{ preStartEntry.competition?.title }}</span>
          · {{ preStartEntry.competition?.date?.slice(0, 10) }}
          · {{ preStartEntry.competition?.location ?? '—' }}
          <span class="ms-2 text-xs">({{ checklistDoneCount }}/{{ checklistTotal }})</span>
        </p>
        <div class="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-default/40">
          <div
            class="h-full rounded-full bg-warning transition-all duration-500"
            :style="{ width: `${Math.round((checklistDoneCount / checklistTotal) * 100)}%` }"
          />
        </div>
        <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          <label
            v-for="item in checklistItems"
            :key="item.id"
            class="flex cursor-pointer items-center gap-2.5 rounded-lg border border-default/50 bg-card px-3 py-2 transition-colors hover:border-warning/35"
            @click="toggleChecklistItem(item.id)"
          >
            <div
              class="flex size-4 shrink-0 items-center justify-center rounded border-2 transition-all"
              :class="item.checked ? 'border-warning bg-warning/20 text-warning' : 'border-default/60'"
            >
              <UIcon v-if="item.checked" name="i-lucide-check" class="size-2.5" />
            </div>
            <span class="text-sm" :class="item.checked ? 'text-muted line-through' : 'text-highlighted'">
              {{ item.label }}
            </span>
          </label>
        </div>
      </div>
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="auth.canAccessAthletePortal && athlete"
      section-id="modules"
      title="Moduły panelu"
      icon="i-lucide-layout-grid"
      :default-open="true"
      embedded
      class="mt-4"
    >
      <PanelModuleNav
        :groups="athleteModuleGroups"
        :tone-from-bg="toneFromIconBg"
      />
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="clubHubOn && auth.canAccessAthletePortal && athlete"
      section-id="klub-hub"
      title="Strefa klubu"
      icon="i-lucide-users"
      :default-open="false"
      embedded
      class="mt-4"
    >
      <KlubHubSection context="athlete" />
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="auth.canAccessAthletePortal && athlete && isAthleteRole"
      section-id="season-goal"
      class="mt-4"
      title="Cel sezonu"
      icon="i-lucide-target"
      :default-open="false"
    >
      <div class="rounded-xl border border-default/50 bg-muted/10 p-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm text-muted">
            Śledź postęp względem najlepszego zatwierdzonego wyniku.
          </p>
          <div class="flex gap-1">
            <UButton
              v-if="seasonGoal && !goalEditing"
              size="xs"
              variant="ghost"
              icon="i-lucide-pencil"
              @click="goalEditing = true"
            >
              Edytuj
            </UButton>
            <UButton
              v-if="seasonGoal"
              size="xs"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              @click="clearGoal"
            >
              Usuń
            </UButton>
          </div>
        </div>

        <template v-if="seasonGoal && !goalEditing">
          <div class="mb-2 flex items-end justify-between gap-2">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-muted">
                {{ seasonGoal.mode === 'total' ? 'Total' : 'Sinclair (szac.)' }}
              </p>
              <div class="mt-1 flex items-end gap-1">
                <span class="text-2xl font-black tabular-nums text-highlighted">{{ goalCurrentValue }}</span>
                <span class="mb-0.5 text-sm font-semibold text-muted">/ {{ seasonGoal.target }} kg</span>
              </div>
            </div>
            <span class="text-xl font-black tabular-nums" :class="goalProgress >= 100 ? 'text-success' : 'text-primary'">
              {{ goalProgress }}%
            </span>
          </div>
          <div class="h-2 w-full overflow-hidden rounded-full bg-default/40">
            <div
              class="h-full rounded-full transition-all duration-700"
              :class="goalProgress >= 100 ? 'bg-success' : 'bg-primary'"
              :style="{ width: `${goalProgress}%` }"
            />
          </div>
        </template>

        <template v-else>
          <div class="flex flex-wrap items-end gap-3">
            <UFormField label="Typ celu">
              <USelect
                v-model="goalMode"
                :items="[{ label: 'Total (kg)', value: 'total' }, { label: 'Sinclair (szac.)', value: 'sinclair' }]"
                class="w-40"
              />
            </UFormField>
            <UFormField label="Cel (kg)">
              <UInputNumber
                v-model="goalTarget"
                :min="1"
                :step="1"
                placeholder="np. 250"
                class="w-28"
              />
            </UFormField>
            <UButton color="success" size="sm" icon="i-lucide-check" @click="saveGoal">
              Zapisz
            </UButton>
            <UButton v-if="seasonGoal" variant="ghost" color="neutral" size="sm" @click="goalEditing = false">
              Anuluj
            </UButton>
          </div>
        </template>
      </div>
    </PanelCollapsibleSection>

    <PanelCollapsibleSection
      v-if="latestRelease"
      section-id="mobile-app"
      class="mt-4"
      title="Aplikacja mobilna"
      icon="i-lucide-smartphone"
      :badge="latestRelease.version"
      :default-open="false"
    >
      <div class="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <p class="font-semibold text-highlighted">Aplikacja na Androida</p>
          <p class="text-sm text-muted">Wyniki i obecność w telefonie.</p>
          <UBadge size="sm" variant="soft" color="primary" class="mt-1 font-mono">{{ latestRelease.version }}</UBadge>
        </div>
        <UButton
          :to="latestRelease.download_url"
          target="_blank"
          color="primary"
          trailing-icon="i-lucide-download"
          class="shrink-0"
        >
          Pobierz APK
        </UButton>
      </div>
    </PanelCollapsibleSection>

    <SlaviaModal
      v-model:open="showOnboarding"
      title="Witaj w panelu zawodnika"
      :dismissible="true"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <div class="space-y-4 p-4 sm:p-5">
          <ol class="list-decimal space-y-3 ps-5 text-sm text-muted">
            <li>
              <strong class="text-highlighted">Składka</strong> — zgłoś przelew do 10. dnia miesiąca.
            </li>
            <li>
              <strong class="text-highlighted">Kalendarz</strong> — starty i treningi klubowe.
            </li>
            <li>
              <strong class="text-highlighted">Wyniki</strong> — zgłaszaj starty; kadra zatwierdza wpisy.
            </li>
          </ol>
          <div class="flex justify-end border-t border-default/60 pt-3">
            <UButton @click="dismissOnboarding">
              Rozumiem
            </UButton>
          </div>
        </div>
      </template>
    </SlaviaModal>

    <div
      v-if="auth.canAccessAthletePortal && !athlete"
      class="mt-4"
    >
      <UAlert
        icon="i-lucide-info"
        title="Brak powiązanego profilu"
        description="Konto nie jest powiązane z rekordem zawodnika. Skontaktuj się z administratorem."
        color="warning"
        variant="subtle"
        class="rounded-2xl"
      />
    </div>

    </template>
  </PanelPageLayout>
</template>
