import type { ResultKind } from '~/types/models'

/** Spójne etykiety statusów i źródeł wyniku (microcopy / słownik aplikacji). */
export function useSlaviaCopy() {
  function resultStatusLabel(status: string): string {
    switch (status) {
      case 'Pending':
        return 'Oczekujący'
      case 'Approved':
        return 'Zatwierdzony'
      case 'Rejected':
        return 'Odrzucony'
      default:
        return status
    }
  }

  function resultKindLabel(kind?: ResultKind | string | null): string {
    const k = (kind ?? 'competition') as string
    switch (k) {
      case 'competition':
        return 'Zawody'
      case 'training':
        return 'Trening (sala)'
      case 'import':
        return 'Import'
      default:
        return k
    }
  }

  function paymentStandingOrder(): string {
    return 'Przelew stały'
  }

  /** Krótka etykieta kategorii powiadomienia in-app (`kind` z API). */
  function notificationKindLabel(kind: string | null | undefined): string {
    const k = (kind ?? '').trim()
    if (!k) return 'Ogólne'

    switch (k) {
      case 'result_approved':
      case 'result_approved_staff':
      case 'result_pending':
      case 'result_rejected':
        return 'Wynik'
      case 'payment_approved':
      case 'payment_rejected':
      case 'payment_pending':
        return 'Składka'
      case 'competition_assigned':
      case 'competition_assigned_staff':
      case 'competition_unassigned':
      case 'competition_unassigned_staff':
      case 'competition_created':
      case 'competition_updated':
      case 'competition_deleted':
      case 'competitions_synced':
      case 'calendar':
      case 'competition':
        return 'Kalendarz'
      case 'competition_roster_updated':
        return 'Zapisy na zawody'
      case 'training_log_trainer_note':
      case 'training_log_trainer_note_staff':
      case 'training_log_athlete_note':
      case 'diary':
      case 'training_log':
        return 'Dziennik'
      case 'training_plan_assigned':
      case 'training_plan_assigned_staff':
      case 'training_plan_progress':
        return 'Plan treningu'
      case 'announcement_published':
        return 'Ogłoszenia'
      case 'athlete_account_requested':
      case 'admin_athlete_created':
      case 'admin_athlete_updated':
      case 'admin_athlete_deleted':
      case 'admin_athlete_linked':
      case 'admin_athlete_linked_existing':
      case 'admin_athlete_detached_user':
        return 'Zawodnicy'
      case 'admin_user_created':
      case 'admin_user_updated':
      case 'admin_user_deleted':
      case 'admin_role_changed':
        return 'Konta'
      case 'blog_post_created':
      case 'blog_post_updated':
      case 'blog_post_deleted':
        return 'Blog'
      case 'chat_message':
      case 'chat':
        return 'Czat'
      case 'recovery_checkin':
        return 'Regeneracja'
      case 'attendance_pending':
        return 'Obecność'
      default: {
        const words = k.split('_').filter(Boolean)
        if (words.length === 0) return 'Ogólne'
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      }
    }
  }

  return {
    resultStatusLabel,
    resultKindLabel,
    paymentStandingOrder,
    notificationKindLabel
  }
}
