/**
 * Śledzenie postępu onboardingu (ideas #1) — localStorage per user i portal.
 */
const PREFIX = 'slavia-onboarding-step:'

export type OnboardingPortal = 'athlete' | 'staff' | 'superadmin'

export type OnboardingStepId =
  | 'profile'
  | 'payments'
  | 'calendar'
  | 'dashboard'
  | 'athletes'
  | 'devtools'

const STEPS: Record<OnboardingPortal, OnboardingStepId[]> = {
  athlete: ['profile', 'payments', 'calendar'],
  staff: ['dashboard', 'calendar', 'athletes'],
  superadmin: ['dashboard', 'athletes', 'devtools']
}

function storageKey(userId: string, portal: OnboardingPortal, step: OnboardingStepId) {
  return `${PREFIX}${userId}:${portal}:${step}`
}

export function useOnboardingChecklist(userId: Ref<string | undefined>, portal: Ref<OnboardingPortal | null>) {
  const steps = computed(() => {
    const p = portal.value
    return p ? STEPS[p] : []
  })

  function isStepDone(step: OnboardingStepId): boolean {
    const uid = userId.value
    const p = portal.value
    if (!uid || !p || !import.meta.client) return false
    try {
      return localStorage.getItem(storageKey(uid, p, step)) === '1'
    } catch {
      return false
    }
  }

  function markStepDone(step: OnboardingStepId) {
    const uid = userId.value
    const p = portal.value
    if (!uid || !p || !import.meta.client) return
    try {
      localStorage.setItem(storageKey(uid, p, step), '1')
    } catch {
      /* ignore */
    }
  }

  const completedCount = computed(() =>
    steps.value.filter(s => isStepDone(s)).length
  )

  const progressLabel = computed(() => {
    const total = steps.value.length
    if (!total) return ''
    return `${completedCount.value}/${total}`
  })

  return { steps, isStepDone, markStepDone, completedCount, progressLabel }
}
