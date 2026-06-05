import type { ClubNotification } from '~/types/notifications'

function parsePayload(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {}
  try {
    const o = JSON.parse(raw) as unknown
    if (!o || typeof o !== 'object') return {}
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

/** Opcjonalny skrót do powiązanej podstrony (bez blokowania usuwania z listy). */
export function useNotificationLinks() {
  const auth = useAuth()

  function resolveLink(n: ClubNotification): string | null {
    const p = parsePayload(n.payload)
    const competitionId = p.competition_id
    const athleteId = p.athlete_id

    if (competitionId) {
      return '/kalendarz'
    }

    if (
      n.kind === 'training_log_athlete_note'
      || n.kind === 'training_log_trainer_note_staff'
      || (n.kind === 'training_log_trainer_note' && auth.isTrainer.value)
    ) {
      if (athleteId) return `/trainer/dziennik/${athleteId}`
    }

    if (n.kind === 'training_log_trainer_note' && auth.isAthlete.value) {
      return '/dziennik'
    }

    if (n.kind === 'result_pending' || n.kind === 'result_approved_staff') {
      return '/trainer/wyniki'
    }

    if (n.kind === 'result_approved' && auth.isAthlete.value) {
      return '/athlete'
    }

    if (n.kind === 'training_plan_assigned' && auth.isAthlete.value) {
      return '/athlete/plany'
    }

    if (
      n.kind === 'training_plan_assigned_staff'
      || n.kind === 'training_plan_progress'
    ) {
      return '/trainer/plany'
    }

    if (n.kind === 'recovery_checkin') {
      return '/trainer/regeneracja'
    }

    if (n.kind === 'announcement_published') {
      return auth.isLoggedIn.value ? '/ogloszenia' : null
    }

    if (
      n.kind.startsWith('admin_')
      || n.kind.startsWith('blog_')
    ) {
      if (auth.isSuperAdmin.value) return '/superadmin'
      if (auth.isAdmin.value) return '/admin'
    }

    return null
  }

  return { resolveLink }
}
