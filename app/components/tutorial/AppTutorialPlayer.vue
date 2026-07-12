<script setup lang="ts">
import type { TutorialTrackId } from '~/types/appTutorial'
import type { PanelNavRole } from '~/data/panelNavigationCatalog'

const {
  allTracks,
  availableTracks,
  activeTrackId,
  activeTrack,
  activeStep,
  activeStepIndex,
  trackAccess,
  overallProgress,
  isStepComplete,
  setStepComplete,
  completedCountForTrack,
  selectTrack,
  selectStep,
  nextStep,
  prevStep,
  markCurrentComplete
} = useAppTutorial()

const auth = useAuth()

const showAllTracks = ref(false)

const visibleTracks = computed(() =>
  showAllTracks.value ? allTracks.value : availableTracks.value
)

const trackRoleForDemo = computed<PanelNavRole | 'common'>(() => {
  const id = activeTrackId.value
  if (id === 'athlete' || id === 'trainer' || id === 'admin' || id === 'board') return id
  return 'common'
})

const isLastStep = computed(
  () => activeStepIndex.value >= activeTrack.value.steps.length - 1
)
const isFirstStep = computed(() => activeStepIndex.value <= 0)

const currentStepDone = computed(() =>
  isStepComplete(activeTrackId.value, activeStep.value.id)
)

function toggleStepDone() {
  setStepComplete(activeTrackId.value, activeStep.value.id, !currentStepDone.value)
}

function onNext() {
  if (!nextStep()) {
    markCurrentComplete()
  }
}

function trackProgressPercent(trackId: TutorialTrackId) {
  const track = allTracks.value.find(t => t.id === trackId)
  if (!track?.steps.length) return 0
  return Math.round((completedCountForTrack(track) / track.steps.length) * 100)
}

function isTrackOwned(trackId: TutorialTrackId) {
  return availableTracks.value.some(t => t.id === trackId)
}
</script>

<template>
  <div class="app-tutorial-player">
    <!-- Progress header -->
    <div class="app-tutorial-player__progress-card">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Twój postęp
          </p>
          <p class="mt-1 text-sm text-muted">
            Ukończono <span class="font-bold text-highlighted">{{ overallProgress.done }}</span>
            z {{ overallProgress.total }} kroków w Twoich ścieżkach
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="h-2 min-w-[140px] flex-1 overflow-hidden rounded-full bg-elevated sm:w-48">
            <div
              class="h-full rounded-full bg-primary transition-all duration-500"
              :style="{ width: `${overallProgress.percent}%` }"
            />
          </div>
          <span class="text-sm font-bold tabular-nums text-primary">{{ overallProgress.percent }}%</span>
        </div>
      </div>
    </div>

    <div class="app-tutorial-player__layout">
      <!-- Track + step nav -->
      <aside class="app-tutorial-player__aside">
        <div class="mb-3 flex items-center justify-between gap-2">
          <p class="text-xs font-bold uppercase tracking-wider text-muted">Ścieżki</p>
          <UButton
            v-if="allTracks.length > availableTracks.length"
            size="xs"
            variant="ghost"
            color="neutral"
            @click="showAllTracks = !showAllTracks"
          >
            {{ showAllTracks ? 'Moje role' : 'Wszystkie' }}
          </UButton>
        </div>

        <div class="space-y-1.5">
          <button
            v-for="track in visibleTracks"
            :key="track.id"
            type="button"
            class="app-tutorial-player__track-btn"
            :class="{
              'app-tutorial-player__track-btn--active': activeTrackId === track.id,
              'app-tutorial-player__track-btn--preview': !isTrackOwned(track.id)
            }"
            @click="selectTrack(track.id)"
          >
            <UIcon :name="track.icon" class="size-4 shrink-0" :class="track.color" />
            <div class="min-w-0 flex-1 text-left">
              <div class="truncate text-sm font-semibold">{{ track.shortLabel }}</div>
              <div class="mt-0.5 h-1 overflow-hidden rounded-full bg-elevated">
                <div
                  class="h-full rounded-full bg-primary/70 transition-all"
                  :style="{ width: `${trackProgressPercent(track.id)}%` }"
                />
              </div>
            </div>
            <UBadge
              v-if="!isTrackOwned(track.id)"
              color="neutral"
              variant="subtle"
              size="xs"
            >
              Podgląd
            </UBadge>
          </button>
        </div>

        <div class="mt-6 border-t border-default/50 pt-4">
          <p class="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
            Kroki — {{ activeTrack.shortLabel }}
          </p>
          <ol class="space-y-1">
            <li v-for="(step, i) in activeTrack.steps" :key="step.id">
              <button
                type="button"
                class="app-tutorial-player__step-btn"
                :class="{ 'app-tutorial-player__step-btn--active': activeStepIndex === i }"
                @click="selectStep(i)"
              >
                <span
                  class="app-tutorial-player__step-dot"
                  :class="{
                    'app-tutorial-player__step-dot--done': isStepComplete(activeTrackId, step.id),
                    'app-tutorial-player__step-dot--current': activeStepIndex === i
                  }"
                />
                <span class="min-w-0 flex-1 truncate text-left text-sm">{{ step.title }}</span>
                <UIcon
                  v-if="isStepComplete(activeTrackId, step.id)"
                  name="i-lucide-check"
                  class="size-3.5 shrink-0 text-success"
                />
              </button>
            </li>
          </ol>
        </div>
      </aside>

      <!-- Main content -->
      <article class="app-tutorial-player__main">
        <UBadge
          v-if="trackAccess === 'preview'"
          color="warning"
          variant="subtle"
          class="mb-3"
          icon="i-lucide-eye"
        >
          Podgląd — nie masz roli „{{ activeTrack.shortLabel }}” ({{ auth.rolesDisplayShort }})
        </UBadge>

        <header class="mb-5">
          <div class="flex items-start gap-3">
            <span
              class="flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-default/60"
              :class="activeTrack.bg"
            >
              <UIcon :name="activeStep.icon" class="size-5" :class="activeTrack.color" />
            </span>
            <div class="min-w-0">
              <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
                Krok {{ activeStepIndex + 1 }} / {{ activeTrack.steps.length }}
              </p>
              <h2 class="mt-0.5 text-xl font-black text-highlighted sm:text-2xl">
                {{ activeStep.title }}
              </h2>
              <p class="mt-1 text-sm text-muted">{{ activeStep.summary }}</p>
            </div>
          </div>
        </header>

        <div class="space-y-4 text-sm leading-relaxed text-highlighted">
          <p v-for="(para, i) in activeStep.paragraphs" :key="i" class="text-muted">
            {{ para }}
          </p>
          <ul v-if="activeStep.bullets?.length" class="space-y-2 rounded-xl border border-default/40 bg-elevated/30 p-4">
            <li
              v-for="(bullet, i) in activeStep.bullets"
              :key="i"
              class="flex gap-2"
            >
              <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{{ bullet }}</span>
            </li>
          </ul>
        </div>

        <AppTutorialDemo
          v-if="activeStep.demo"
          :kind="activeStep.demo"
          :hotspots="activeStep.hotspots"
          :track-role="trackRoleForDemo"
          class="mt-6"
        />

        <div class="mt-8 flex flex-col gap-3 border-t border-default/50 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div class="flex flex-wrap items-center gap-2">
            <UButton
              variant="outline"
              color="neutral"
              icon="i-lucide-chevron-left"
              :disabled="isFirstStep"
              @click="prevStep()"
            >
              Wstecz
            </UButton>
            <UButton
              color="primary"
              :icon="isLastStep ? 'i-lucide-check' : 'i-lucide-chevron-right'"
              trailing
              @click="onNext"
            >
              {{ isLastStep ? 'Zakończ ścieżkę' : 'Dalej' }}
            </UButton>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <UButton
              :variant="currentStepDone ? 'soft' : 'outline'"
              :color="currentStepDone ? 'success' : 'neutral'"
              :icon="currentStepDone ? 'i-lucide-check-circle' : 'i-lucide-circle'"
              @click="toggleStepDone"
            >
              {{ currentStepDone ? 'Ukończone' : 'Oznacz jako ukończone' }}
            </UButton>
            <UButton
              v-if="activeStep.actionTo && trackAccess === 'owned'"
              :to="activeStep.actionTo"
              variant="soft"
              color="primary"
              :icon="activeStep.actionLabel ? 'i-lucide-external-link' : undefined"
            >
              {{ activeStep.actionLabel ?? 'Otwórz moduł' }}
            </UButton>
          </div>
        </div>
      </article>
    </div>

  </div>
</template>
