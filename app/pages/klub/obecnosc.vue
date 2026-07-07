<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { getApiErrorMessage } from '~/composables/useApi'

useSlaviaSeo({
  title: 'Obecność',
  description: 'Kalendarz treningowy i zgłaszanie obecności w klubie Slavia.',
  noindex: true
})

const {
  pl,
  format,
  isToday,
  isStaff,
  attendanceViews,
  activeView,
  selectedAthleteId,
  status,
  note,
  sessionDate,
  records,
  pendingQueue,
  pendingLoading,
  bulkVerifying,
  verifyingId,
  monthRef,
  calendarViewMode,
  calendarEffectiveView,
  showCalendarViewToggle,
  setCalendarViewMode,
  attendanceModalOpen,
  selectedTrainingDay,
  athletes,
  monthStats,
  recordsByDate,
  activePendingForSession,
  modalPrimaryLabel,
  days,
  daysInMonth,
  weekDays,
  isTrainingDay,
  trainingStatusForDate,
  openTrainingModal,
  prevMonth,
  nextMonth,
  goToToday,
  statusColor,
  statusLabelPl,
  trainingStatusLabelPl,
  trainingStatusColor,
  dayAccentClass,
  athleteLabel,
  approvePendingRecord,
  approveAllPending,
  submitAttendance,
  saveAttendanceFromModal,
  savingAttendance,
  pageLoadError,
  refreshAll
} = useAttendancePage()
</script>

<template>
  <KlubPageShell
    icon="i-lucide-user-check"
    page-label="Obecność"
    page-icon="i-lucide-user-check"
    staff-title="Obecność kadry"
    staff-description="Kalendarz, weryfikacja zgłoszeń i kod QR do druku — jeden moduł obecności."
    athlete-title="Moja obecność"
    athlete-description="Kalendarz treningów, ręczne zgłoszenie lub skaner QR na sali."
  >
    <UAlert
      v-if="pageLoadError"
      class="mb-4"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      title="Nie udało się załadować danych obecności"
      :description="getApiErrorMessage(pageLoadError)"
    >
      <template #actions>
        <UButton size="sm" color="error" variant="soft" @click="refreshAll">
          Spróbuj ponownie
        </UButton>
      </template>
    </UAlert>

    <template v-if="attendanceViews.length > 1" #subnav>
      <UButton
        v-for="v in attendanceViews"
        :key="v.id"
        size="lg"
        class="min-h-11"
        :variant="activeView === v.id ? 'solid' : 'outline'"
        :color="activeView === v.id ? 'primary' : 'neutral'"
        :icon="v.icon"
        @click="activeView = v.id"
      >
        {{ v.label }}
      </UButton>
    </template>

    <AttendanceQrPanel v-if="isStaff && activeView === 'qr'" />

    <AttendanceQrScannerPanel v-if="!isStaff && activeView === 'scan'" />

    <PanelPageSection
      v-if="isStaff && activeView === 'calendar'"
      title="Nowe zgłoszenia obecności"
      description="Zgłoszenia zawodników oczekujące na zatwierdzenie przez kadrę."
      icon="i-lucide-clipboard-check"
      class="relative mb-6 overflow-hidden rounded-[1.75rem] border border-warning/30 bg-linear-to-br from-warning/14 via-card to-card p-5 shadow-lg ring-1 ring-warning/20 sm:p-6"
    >
      <template #actions>
        <UButton
          v-if="pendingQueue.length"
          size="lg"
          color="warning"
          icon="i-lucide-check-check"
          class="shrink-0 font-bold shadow-lg shadow-warning/20"
          :loading="bulkVerifying"
          @click="approveAllPending"
        >
          Zatwierdź wszystkie ({{ pendingQueue.length }})
        </UButton>
      </template>

      <PanelLoadingState
        v-if="pendingLoading"
        compact
        label="Wczytywanie kolejki…"
        class="relative mt-2"
      />

      <SlaviaEmptyState
        v-else-if="!pendingQueue.length"
        icon="i-lucide-sparkles"
        title="Brak oczekujących zgłoszeń"
        description="Gdy zawodnik zgłosi obecność, pojawi się tutaj do jednego kliknięcia."
        class="relative mt-2"
      />

      <ul v-else class="relative mt-5 space-y-2.5">
        <li
          v-for="rec in pendingQueue"
          :key="rec.id"
          class="group flex flex-col gap-3 rounded-2xl border border-default/50 bg-card/95 p-4 shadow-sm transition hover:border-warning/35 hover:shadow-md sm:flex-row sm:items-center"
        >
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
              <UIcon name="i-lucide-user" class="size-5" />
            </div>
            <div class="min-w-0">
              <p class="truncate font-bold text-highlighted">
                {{ athleteLabel(rec.athlete_id) }}
              </p>
              <p class="mt-0.5 text-sm text-muted">
                {{ format(new Date(rec.session_date.slice(0, 10)), 'EEEE · dd.MM.yyyy', { locale: pl }) }}
              </p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <UBadge size="xs" variant="subtle" :color="statusColor(rec.status)">
                  {{ statusLabelPl(rec.status) }}
                </UBadge>
                <UBadge size="xs" variant="subtle" color="warning">
                  Oczekuje
                </UBadge>
              </div>
            </div>
          </div>
          <UButton
            size="md"
            color="success"
            icon="i-lucide-check"
            class="shrink-0 font-semibold shadow-sm"
            :loading="verifyingId === rec.id"
            :disabled="!!verifyingId && verifyingId !== rec.id"
            @click="approvePendingRecord(rec)"
          >
            Zatwierdź
          </UButton>
        </li>
      </ul>
    </PanelPageSection>

    <PanelPageSection
      v-if="!isStaff && activeView === 'calendar'"
      title="Zgłoś obecność na trening"
      description="Na sali zeskanuj kod QR w aplikacji mobilnej Slavia — wpis jest od razu zatwierdzony. Poniżej możesz też wysłać ręczne zgłoszenie do weryfikacji."
      icon="i-lucide-send"
      class="mb-6"
    >
    <UCard class="slavia-page-card">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <UFormField label="Data treningu">
          <UInput v-model="sessionDate" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Status">
          <SlaviaOverlaySelect
            v-model="status"
            :items="[{ label: 'Obecny', value: 'obecny' }, { label: 'Nieobecny', value: 'nieobecny' }]"
          />
        </UFormField>
        <UFormField label="Notatka" class="sm:col-span-2">
          <UInput v-model="note" placeholder="opcjonalnie" class="w-full" />
        </UFormField>
      </div>
      <div class="mt-4">
        <UButton icon="i-lucide-send" size="lg" :loading="savingAttendance" :disabled="savingAttendance" @click="() => { void submitAttendance() }">
          Wyślij zgłoszenie
        </UButton>
      </div>
    </UCard>
    </PanelPageSection>

    <PanelPageSection
      v-show="activeView === 'calendar'"
      title="Kalendarz treningowy"
      :description="format(monthRef, 'LLLL yyyy', { locale: pl })"
      icon="i-lucide-calendar-days"
    >
      <UCard class="slavia-page-card overflow-hidden">
        <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap gap-2">
              <UBadge variant="subtle" color="success" size="sm">{{ monthStats.present }} obecnych</UBadge>
              <UBadge variant="subtle" color="error" size="sm">{{ monthStats.absent }} nieobecnych</UBadge>
              <UBadge v-if="monthStats.pending" variant="subtle" color="warning" size="sm">
                {{ monthStats.pending }} oczekuje
              </UBadge>
            </div>
          </div>
          <UFormField v-if="isStaff" label="Zawodnik" class="w-full lg:max-w-xs">
            <SlaviaOverlaySelect
              v-model="selectedAthleteId"
              :items="(athletes || []).map(a => ({ label: a.full_name, value: a.id }))"
              class="w-full"
            />
          </UFormField>

          <div class="flex flex-wrap gap-2">
            <CalendarViewModeToggle
              v-if="showCalendarViewToggle"
              :model-value="calendarViewMode"
              @update:model-value="setCalendarViewMode"
            />
            <UButton size="sm" variant="ghost" icon="i-lucide-chevron-left" @click="prevMonth" />
            <UButton size="sm" variant="ghost" icon="i-lucide-calendar-days" @click="goToToday">
              Dzisiaj
            </UButton>
            <UButton size="sm" variant="ghost" icon="i-lucide-chevron-right" @click="nextMonth" />
          </div>
        </div>

        <div class="mb-4 grid gap-2 rounded-2xl border border-default/60 bg-muted/10 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div class="flex items-center gap-2">
            <UBadge color="success" variant="subtle" size="sm">Planowy</UBadge>
            <span class="text-xs text-muted">trening</span>
          </div>
          <div class="flex items-center gap-2">
            <UBadge color="warning" variant="subtle" size="sm">Odwołany</UBadge>
            <span class="text-xs text-muted">trening</span>
          </div>
          <div class="flex items-center gap-2">
            <UBadge color="success" variant="subtle" size="sm">Obecny</UBadge>
            <span class="text-xs text-muted">wpis</span>
          </div>
          <div class="flex items-center gap-2">
            <UBadge color="error" variant="subtle" size="sm">Nieobecny</UBadge>
            <span class="text-xs text-muted">wpis</span>
          </div>
          <div class="flex items-center gap-2">
            <UBadge color="warning" variant="subtle" size="sm">Oczekuje</UBadge>
            <span class="text-xs text-muted">weryfikacja przez trenera</span>
          </div>
        </div>

        <template v-if="calendarEffectiveView === 'grid'">
          <div class="max-sm:hidden">
            <div class="grid grid-cols-7 overflow-hidden rounded-2xl border border-default/60 text-center text-[10px] font-black uppercase tracking-wide text-muted">
              <div v-for="w in weekDays" :key="w" class="border-r border-default/40 bg-muted/20 py-2.5 last:border-r-0">
                {{ w }}
              </div>
            </div>
            <div class="grid grid-cols-7 overflow-hidden rounded-2xl border border-default/60 border-t-0">
              <button
                v-for="day in days"
                :key="day.toISOString()"
                type="button"
                class="min-h-[98px] border-r border-t border-default/40 p-2.5 text-left last:border-r-0 hover:bg-muted/15 transition-colors"
                :class="[
                  dayAccentClass(day),
                  isToday(day) ? 'ring-2 ring-primary/35' : ''
                ]"
                @click="openTrainingModal(day)"
              >
                <div class="mb-2 flex items-start justify-between gap-2">
                  <div class="text-sm font-black text-highlighted tabular-nums">{{ format(day, 'd') }}</div>
                  <UBadge
                    v-if="isTrainingDay(day)"
                    size="xs"
                    variant="subtle"
                    :color="trainingStatusColor(trainingStatusForDate(day))"
                    class="shrink-0"
                  >
                    {{ trainingStatusLabelPl(trainingStatusForDate(day)) }}
                  </UBadge>
                </div>
                <div class="mt-1 flex flex-col items-start gap-1">
                  <UBadge
                    v-if="recordsByDate.get(format(day, 'yyyy-MM-dd'))"
                    size="xs"
                    variant="subtle"
                    :color="statusColor(recordsByDate.get(format(day, 'yyyy-MM-dd'))?.status || '')"
                  >
                    {{ statusLabelPl(recordsByDate.get(format(day, 'yyyy-MM-dd'))?.status || '') }}
                  </UBadge>
                  <UBadge
                    v-if="recordsByDate.get(format(day, 'yyyy-MM-dd'))?.verification_state === 'pending'"
                    size="xs"
                    variant="subtle"
                    color="warning"
                  >
                    Weryfikacja
                  </UBadge>
                  <UBadge
                    v-else-if="isTrainingDay(day) && !recordsByDate.get(format(day, 'yyyy-MM-dd'))"
                    size="xs"
                    variant="subtle"
                    color="neutral"
                  >
                    Brak wpisu
                  </UBadge>
                </div>
              </button>
            </div>
          </div>
        </template>

        <template v-else-if="calendarEffectiveView === 'agenda'">
          <div class="space-y-2">
            <button
              v-for="day in daysInMonth.filter(d => isTrainingDay(d))"
              :key="day.toISOString()"
              type="button"
              class="flex w-full items-center justify-between gap-3 rounded-xl border border-default/60 bg-muted/10 px-4 py-3 text-left hover:bg-muted/20"
              @click="openTrainingModal(day)"
            >
              <div class="min-w-0">
                <p class="font-bold text-highlighted">
                  {{ format(day, 'EEEE · dd.MM', { locale: pl }) }}
                </p>
                <p class="text-xs text-muted">
                  Trening: {{ trainingStatusForDate(day) === 'scheduled' ? 'planowy' : trainingStatusForDate(day) }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <UBadge
                  size="xs"
                  variant="subtle"
                  :color="trainingStatusForDate(day) === 'scheduled' ? 'success' : 'warning'"
                >
                  {{ trainingStatusForDate(day) === 'scheduled' ? 'planowy' : trainingStatusForDate(day) }}
                </UBadge>
                <UBadge
                  v-if="recordsByDate.get(format(day, 'yyyy-MM-dd'))"
                  size="xs"
                  variant="subtle"
                  :color="statusColor(recordsByDate.get(format(day, 'yyyy-MM-dd'))?.status || 'nieobecny')"
                >
                  {{ statusLabelPl(recordsByDate.get(format(day, 'yyyy-MM-dd'))?.status || '') }}
                </UBadge>
                <UBadge v-else size="xs" variant="subtle" color="neutral">
                  brak wpisu
                </UBadge>
              </div>
            </button>
          </div>
        </template>

        <div v-if="records.length" class="mt-6 border-t border-default/50 pt-6">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
            Historia miesiąca
          </p>
          <ul class="mt-3 space-y-2">
            <li
              v-for="r in records"
              :key="r.id"
              class="flex flex-col gap-2 rounded-xl border border-default/50 bg-muted/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="min-w-0">
                <p class="font-semibold text-highlighted">
                  {{ format(new Date(r.session_date.slice(0, 10)), 'EEEE · dd.MM.yyyy', { locale: pl }) }}
                </p>
                <p v-if="isStaff" class="text-xs text-muted">{{ athleteLabel(r.athlete_id) }}</p>
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                <UBadge size="xs" variant="subtle" :color="statusColor(r.status)">{{ statusLabelPl(r.status) }}</UBadge>
                <UBadge
                  size="xs"
                  variant="subtle"
                  :color="r.verification_state === 'verified' ? 'success' : 'warning'"
                >
                  {{ r.verification_state === 'verified' ? 'Zweryfikowano' : 'Oczekuje' }}
                </UBadge>
              </div>
            </li>
          </ul>
        </div>
      </UCard>
    </PanelPageSection>

    <SlaviaModal
      v-model:open="attendanceModalOpen"
      :title="selectedTrainingDay ? `Trening · ${format(selectedTrainingDay, 'dd.MM.yyyy')}` : 'Zapis obecności'"
      :dismissible="true"
      :ui="{ content: 'sm:max-w-2xl md:max-w-3xl lg:max-w-4xl' }"
    >
      <template #body>
        <div class="space-y-4 p-4 sm:p-5">
          <UAlert
            v-if="selectedTrainingDay"
            :color="trainingStatusColor(trainingStatusForDate(selectedTrainingDay))"
            variant="subtle"
            :title="`Status treningu: ${trainingStatusLabelPl(trainingStatusForDate(selectedTrainingDay))}`"
            description="Treningi są importowane z bazy wydarzeń (siatka Pn/Śr/Pt + wyjątki)."
          />
          <UFormField label="Data treningu">
            <UInput
              v-model="sessionDate"
              type="date"
              class="w-full"
              :disabled="!!(isStaff && activePendingForSession)"
            />
          </UFormField>
          <UAlert
            v-if="activePendingForSession"
            color="warning"
            variant="subtle"
            :title="isStaff ? 'Zatwierdź zgłoszenie zawodnika' : 'Oczekuje na weryfikację trenera'"
            :description="isStaff
              ? `${athleteLabel(activePendingForSession.athlete_id)} · ${statusLabelPl(activePendingForSession.status)} — jedno kliknięcie.`
              : 'Po zatwierdzeniu w panelu trenera status zmieni się na zweryfikowany.'"
          />
          <UFormField v-if="isStaff && !activePendingForSession" label="Zawodnik">
            <SlaviaOverlaySelect
              v-model="selectedAthleteId"
              :items="(athletes || []).map(a => ({ label: a.full_name, value: a.id }))"
              class="w-full"
            />
          </UFormField>
          <template v-if="!(isStaff && activePendingForSession)">
            <UFormField label="Status obecności">
              <div class="flex flex-wrap gap-2">
                <UButton
                  size="sm"
                  :variant="status === 'obecny' ? 'solid' : 'outline'"
                  color="success"
                  icon="i-lucide-check"
                  @click="status = 'obecny'"
                >
                  Obecny
                </UButton>
                <UButton
                  size="sm"
                  :variant="status === 'nieobecny' ? 'solid' : 'outline'"
                  color="error"
                  icon="i-lucide-x"
                  @click="status = 'nieobecny'"
                >
                  Nieobecny
                </UButton>
                <UBadge size="sm" variant="subtle" :color="statusColor(status)" class="ml-auto">
                  Wybrane: {{ statusLabelPl(status) }}
                </UBadge>
              </div>
            </UFormField>
            <UFormField label="Notatka">
              <UInput v-model="note" placeholder="opcjonalnie" />
            </UFormField>
          </template>
          <div class="flex justify-end gap-2 border-t border-default/60 pt-3">
            <UButton variant="ghost" color="neutral" :disabled="savingAttendance" @click="attendanceModalOpen = false">
              Anuluj
            </UButton>
            <UButton
              :icon="isStaff && activePendingForSession ? 'i-lucide-check-check' : 'i-lucide-check'"
              :color="isStaff && activePendingForSession ? 'success' : 'primary'"
              :loading="savingAttendance"
              @click="saveAttendanceFromModal"
            >
              {{ modalPrimaryLabel }}
            </UButton>
          </div>
        </div>
      </template>
    </SlaviaModal>
  </KlubPageShell>
</template>
