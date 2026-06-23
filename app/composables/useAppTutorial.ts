import {
  APP_TUTORIAL_TRACKS,
  TUTORIAL_TRACK_ORDER,
  tutorialTrackById
} from '~/data/appTutorialCatalog'
import type { TutorialTrack, TutorialTrackId } from '~/types/appTutorial'

const PROGRESS_PREFIX = 'slavia-tutorial-done:'

function progressKey(userId: string, trackId: TutorialTrackId, stepId: string) {
  return `${PROGRESS_PREFIX}${userId}:${trackId}:${stepId}`
}

function readStepDone(userId: string, trackId: TutorialTrackId, stepId: string): boolean {
  if (!import.meta.client) return false
  try {
    return localStorage.getItem(progressKey(userId, trackId, stepId)) === '1'
  } catch {
    return false
  }
}

function writeStepDone(userId: string, trackId: TutorialTrackId, stepId: string, done: boolean) {
  if (!import.meta.client) return
  try {
    if (done) {
      localStorage.setItem(progressKey(userId, trackId, stepId), '1')
    } else {
      localStorage.removeItem(progressKey(userId, trackId, stepId))
    }
  } catch {
    /* ignore */
  }
}

export type TutorialTrackAccess = 'owned' | 'preview'

export function tutorialTracksForUser(roles: string[]): TutorialTrack[] {
  const r = new Set(roles)
  const has = {
    athlete: r.has('Athlete'),
    trainer: r.has('Trainer'),
    admin: r.has('Admin'),
    editor: r.has('Editor'),
    board: r.has('BoardMember') || r.has('BoardDocsFullAccess')
  }

  return TUTORIAL_TRACK_ORDER
    .map(id => tutorialTrackById(id))
    .filter((t): t is TutorialTrack => !!t)
    .filter((t) => {
      if (t.id === 'common') return true
      if (t.id === 'athlete') return has.athlete
      if (t.id === 'trainer') return has.trainer
      if (t.id === 'admin') return has.admin
      if (t.id === 'editor') return has.editor
      if (t.id === 'board') return has.board
      return false
    })
}

/** Wszystkie ścieżki — także te, do których użytkownik nie ma roli (tryb podglądu). */
export function allTutorialTracks(): TutorialTrack[] {
  return TUTORIAL_TRACK_ORDER
    .map(id => tutorialTrackById(id))
    .filter((t): t is TutorialTrack => !!t)
}

export function trackAccessForUser(trackId: TutorialTrackId, roles: string[]): TutorialTrackAccess {
  const owned = tutorialTracksForUser(roles).some(t => t.id === trackId)
  return owned ? 'owned' : 'preview'
}

export function useAppTutorial() {
  const auth = useAuth()
  const route = useRoute()
  const router = useRouter()

  const userId = computed(() => auth.user.value?.id ?? '')
  const roles = computed(() => auth.roles.value ?? [])

  const availableTracks = computed(() => tutorialTracksForUser(roles.value))
  const allTracks = computed(() => allTutorialTracks())

  const activeTrackId = ref<TutorialTrackId>('common')
  const activeStepIndex = ref(0)
  const progressTick = ref(0)

  const activeTrack = computed(() => tutorialTrackById(activeTrackId.value) ?? APP_TUTORIAL_TRACKS[0]!)
  const activeStep = computed(() => activeTrack.value.steps[activeStepIndex.value] ?? activeTrack.value.steps[0]!)

  const trackAccess = computed(() => trackAccessForUser(activeTrackId.value, roles.value))

  function isStepComplete(trackId: TutorialTrackId, stepId: string): boolean {
    void progressTick.value
    const uid = userId.value
    if (!uid) return false
    return readStepDone(uid, trackId, stepId)
  }

  function setStepComplete(trackId: TutorialTrackId, stepId: string, done = true) {
    const uid = userId.value
    if (!uid) return
    writeStepDone(uid, trackId, stepId, done)
    progressTick.value++
  }

  function completedCountForTrack(track: TutorialTrack): number {
    void progressTick.value
    return track.steps.filter(s => isStepComplete(track.id, s.id)).length
  }

  const overallProgress = computed(() => {
    const tracks = availableTracks.value
    const total = tracks.reduce((n, t) => n + t.steps.length, 0)
    if (!total) return { done: 0, total: 0, percent: 0 }
    const done = tracks.reduce((n, t) => n + completedCountForTrack(t), 0)
    return { done, total, percent: Math.round((done / total) * 100) }
  })

  function selectTrack(id: TutorialTrackId) {
    activeTrackId.value = id
    activeStepIndex.value = 0
    syncQuery()
  }

  function selectStep(index: number) {
    const max = activeTrack.value.steps.length - 1
    activeStepIndex.value = Math.max(0, Math.min(index, max))
    syncQuery()
  }

  function nextStep() {
    if (activeStepIndex.value < activeTrack.value.steps.length - 1) {
      activeStepIndex.value++
      syncQuery()
      return true
    }
    return false
  }

  function prevStep() {
    if (activeStepIndex.value > 0) {
      activeStepIndex.value--
      syncQuery()
      return true
    }
    return false
  }

  function markCurrentComplete() {
    setStepComplete(activeTrackId.value, activeStep.value.id, true)
  }

  function syncQuery() {
    void router.replace({
      query: {
        ...route.query,
        sciezka: activeTrackId.value,
        krok: String(activeStepIndex.value + 1)
      }
    })
  }

  function hydrateFromQuery() {
    const pathQ = route.query.sciezka
    const stepQ = route.query.krok
    if (typeof pathQ === 'string' && tutorialTrackById(pathQ)) {
      activeTrackId.value = pathQ as TutorialTrackId
    }
    if (typeof stepQ === 'string') {
      const n = Number.parseInt(stepQ, 10)
      if (Number.isFinite(n) && n >= 1) {
        activeStepIndex.value = Math.min(n - 1, activeTrack.value.steps.length - 1)
      }
    }
  }

  onMounted(hydrateFromQuery)
  watch(() => route.query, hydrateFromQuery)

  return {
    availableTracks,
    allTracks,
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
  }
}
