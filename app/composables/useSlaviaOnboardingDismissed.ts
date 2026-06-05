/** Klucze localStorage — jedna wizyta powitalna na konto na wariant. */
export function onboardingStorageKeys(userId: string) {
  return {
    athlete: `slavia-onboarding-athlete-v1-${userId}`,
    staff: `slavia-onboarding-staff-v1-${userId}`,
    superadmin: `slavia-onboarding-superadmin-v1-${userId}`
  } as const
}

export function readOnboardingDismissed(key: string): boolean {
  if (!import.meta.client) return true
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return true
  }
}

export function writeOnboardingDismissed(key: string) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(key, '1')
  } catch {
    // ignore
  }
}
