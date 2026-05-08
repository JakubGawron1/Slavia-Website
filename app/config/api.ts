/**
 * Konfiguracja pod zewnętrzny backend (np. Rust na Shuttle).
 *
 * Bazowy adres ustawiasz w `.env`: `NUXT_PUBLIC_API_BASE_URL=https://twoj-serwis.shuttle.app`
 * (bez końcowego slasha). Żądania lecą z przeglądarki (i z SSR) bezpośrednio na ten host —
 * w backendzie włącz CORS dla domeny frontendu.
 *
 * Ścieżki w `apiRoutes` trzymaj spójnie z routerem Axum (`router.rs` po stronie Rust).
 */
export const apiRoutes = {
  auth: {
    login: '/api/auth/login',
    me: '/api/auth/me',
    profile: '/api/auth/profile'
  },
  athletes: {
    list: '/api/athletes',
    listAdmin: '/api/athletes/admin',
    me: '/api/athletes/me',
    myCalendar: '/api/athletes/my-calendar',
    one: (id: string) => `/api/athletes/${encodeURIComponent(id)}`,
    competitions: (id: string) => `/api/athletes/${encodeURIComponent(id)}/competitions`,
    trainingLog: (id: string) => `/api/athletes/${encodeURIComponent(id)}/training-log`,
    timeline: (id: string) => `/api/athletes/${encodeURIComponent(id)}/timeline`,
    trainingLogEntry: (athleteId: string, entryId: string) =>
      `/api/athletes/${encodeURIComponent(athleteId)}/training-log/${encodeURIComponent(entryId)}`,
    link: (id: string) => `/api/athletes/${encodeURIComponent(id)}/link`,
    attachUser: (id: string) => `/api/athletes/${encodeURIComponent(id)}/attach-user`,
    detachUser: (id: string) => `/api/athletes/${encodeURIComponent(id)}/detach-user`
  },
  players: {
    list: '/api/athletes'
  },
  admin: {
    athletes: '/api/athletes',
    players: '/api/athletes',
    results: '/api/results',
    competitions: '/api/competitions'
  },
  superadmin: {
    admins: '/api/admins',
    adminsGrouped: '/api/admins/grouped'
  },
  posts: {
    list: '/api/posts',
    one: (id: string) => `/api/posts/${encodeURIComponent(id)}`
  },
  announcements: {
    collection: '/api/announcements',
    manage: '/api/announcements/manage',
    one: (id: string) => `/api/announcements/${encodeURIComponent(id)}`
  },
  gallery: {
    collection: '/api/gallery',
    manage: '/api/gallery/manage',
    one: (id: string) => `/api/gallery/${encodeURIComponent(id)}`
  },
  contact: {
    submit: '/api/contact',
    manage: '/api/contact/manage',
    manageOne: (id: string) => `/api/contact/manage/${encodeURIComponent(id)}`
  },
  exercises: {
    board: '/api/exercises/board'
  },
  attendance: {
    collection: '/api/attendance',
    athlete: (athleteId: string) => `/api/attendance/${encodeURIComponent(athleteId)}`,
    summary: (athleteId: string) => `/api/attendance/summary/${encodeURIComponent(athleteId)}`
  },
  chat: {
    threads: '/api/chat/threads',
    thread: (threadId: string) => `/api/chat/threads/${encodeURIComponent(threadId)}`,
    messages: (threadId: string) => `/api/chat/threads/${encodeURIComponent(threadId)}/messages`,
    /** Admin-only: ręczne czyszczenie bezczynnych wątków (POST, opcjonalny `?days=N`). */
    adminPrune: '/api/chat/admin/prune'
  },
  comments: {
    collection: '/api/comments'
  },
  trainingPlans: {
    collection: '/api/training-plans',
    my: '/api/training-plans/my',
    athlete: (athleteId: string) => `/api/training-plans/athlete/${encodeURIComponent(athleteId)}`,
    one: (id: string) => `/api/training-plans/${encodeURIComponent(id)}`,
    myProgress: (id: string) => `/api/training-plans/${encodeURIComponent(id)}/my-progress`
  },
  recovery: {
    collection: '/api/recovery',
    athlete: (athleteId: string) => `/api/recovery/athlete/${encodeURIComponent(athleteId)}`
  },
  system: {
    ping: '/api/system/ping',
    backendProvider: '/api/system/backend-provider',
    auditLogs: '/api/system/audit-logs',
    metrics: '/api/system/metrics',
    eventFeed: '/api/system/event-feed'
  },
  upload: '/api/upload',
  notifications: {
    collection: '/api/notifications',
    one: (id: string) => `/api/notifications/${encodeURIComponent(id)}`,
    markRead: (id: string) => `/api/notifications/${encodeURIComponent(id)}/read`,
    markAllRead: '/api/notifications/read-all',
    deleteAll: '/api/notifications'
  },
  competitions: {
    collection: '/api/competitions',
    syncExternal: '/api/competitions/sync-external',
    recurringTrainingCancellations: '/api/competitions/recurring-training-cancellations',
    recurringTrainingCancellationOne: (sessionDate: string) =>
      `/api/competitions/recurring-training-cancellations/${encodeURIComponent(sessionDate)}`,
    one: (id: string) => `/api/competitions/${encodeURIComponent(id)}`,
    participants: (id: string) => `/api/competitions/${encodeURIComponent(id)}/participants`
  },
  payments: {
    my: '/api/payments/my',
    myStatus: '/api/payments/my/status',
    status: '/api/payments/status',
    overview: '/api/payments/overview',
    pending: '/api/payments/pending',
    approve: (id: string) => `/api/payments/${encodeURIComponent(id)}/approve`,
    reject: (id: string) => `/api/payments/${encodeURIComponent(id)}/reject`,
    createApprovedForAthlete: (athleteId: string) =>
      `/api/payments/athlete/${encodeURIComponent(athleteId)}/approved`,
    /** Toggle „przelew stały" — backend w razie włączenia od razu robi catch-up za bieżący miesiąc. */
    standingOrder: (athleteId: string) =>
      `/api/payments/athlete/${encodeURIComponent(athleteId)}/standing-order`
  },
  results: {
    collection: '/api/results',
    /** Publiczna tablica (JOIN zawodnik + zawody), bez mutacji — wyłącznie wpisy `kind = competition`. */
    publicBoard: '/api/results/public-board',
    publicBoardOlympic: '/api/results/public-board-olympic',
    pending: '/api/results/pending',
    all: '/api/results/all',
    /** Domyślnie tylko zawody (publiczne). `?kind=training` lub `?kind=all` wymaga zalogowania. */
    athlete: (id: string, kind?: 'competition' | 'training' | 'all') => {
      const base = `/api/results/athlete/${encodeURIComponent(id)}`
      return kind ? `${base}?kind=${encodeURIComponent(kind)}` : base
    },
    athleteSubmissions: (id: string) =>
      `/api/results/athlete/${encodeURIComponent(id)}/submissions`,
    one: (id: string) => `/api/results/${encodeURIComponent(id)}`,
    approve: (id: string) => `/api/results/${encodeURIComponent(id)}/approve`,
    reject: (id: string) => `/api/results/${encodeURIComponent(id)}/reject`
  },
  /** Zgłoszenia wyników (Pending) — osobna przestrzeń od zwykłych tras `results`. */
  submissions: {
    pending: '/api/submissions/pending',
    approve: (id: string) => `/api/submissions/${encodeURIComponent(id)}/approve`,
    one: (id: string) => `/api/submissions/${encodeURIComponent(id)}`
  }
} as const

export function urlAdminAthlete(id: string) {
  return `${apiRoutes.admin.athletes}/${id}`
}

export function urlAdminPlayer(id: string) {
  return urlAdminAthlete(id)
}

export function urlSuperadminAdmin(id: string) {
  return `${apiRoutes.superadmin.admins}/${id}`
}

export function urlAdminAccount(id: string) {
  return `${apiRoutes.superadmin.admins}/${id}/account`
}

export function urlAdminBan(id: string) {
  return `${apiRoutes.superadmin.admins}/${id}/ban`
}

export function urlAdminUnban(id: string) {
  return `${apiRoutes.superadmin.admins}/${id}/unban`
}
