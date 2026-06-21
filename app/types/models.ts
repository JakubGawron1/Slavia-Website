/**
 * Kształt JSON z zewnętrznego backendu — dopasuj pola do odpowiedzi z Rust.
 * Ścieżki HTTP: `app/config/api.ts` + `NUXT_PUBLIC_API_BASE_URL`.
 */
export type UserRole =
  | 'Athlete'
  | 'Trainer'
  | 'Admin'
  | 'Editor'
  | 'SuperAdmin'
  | 'BoardMember'
  | 'BoardDocsFullAccess'

export interface AuthUser {
  id: string
  username: string
  avatar_url?: string | null
  roles: UserRole[]
  is_banned: boolean
  banned_reason?: string | null
  /** Opcjonalne 2FA (TOTP) — z `GET /api/auth/me`. */
  totp_enabled?: boolean
  /** Preset kolorystyczny zapisany na koncie (`slavia`, `iron`, …). */
  ui_theme_preset?: string | null
  /** Jasny / ciemny / system — zsynchronizowany z backendem. */
  ui_color_mode?: string | null
  /** Płeć zawodnika powiązanego z kontem (jeśli konto ma profil athlete). */
  athlete_gender?: string | null
  /** Rok urodzenia zawodnika powiązanego z kontem. */
  athlete_birth_year?: number | null
  /** Zdjęcie z `athletes.image_url` (Cloudinary), gdy konto jest powiązane ze zawodnikiem. */
  athlete_image_url?: string | null
  /** `athletes.id` powiązany profil (`GET /api/auth/me`). */
  athlete_id?: string | null
  /** Imię i nazwisko powiązanego zawodnika (panel kont). */
  athlete_full_name?: string | null
}

export interface LoginResponse {
  token: string
  roles: UserRole[]
  user_id: string
}

export interface Athlete {
  id: string
  user_id?: string | null
  full_name: string
  birth_year?: number | null
  gender?: string | null // 'male' or 'female'
  weight_category?: string | null
  bodyweight?: number | null
  best_snatch_kg?: number | null
  best_clean_jerk_kg?: number | null
  total_kg?: number | null
  image_url?: string | null
  notes?: string | null
  /** Krótki podtytuł widoczny na publicznym profilu i w SEO (uzupełnia trener/admin). */
  profile_tagline?: string | null
  /** Dłuższy opis na publicznej stronie zawodnika. */
  public_bio?: string | null
  is_active: boolean
  /** Czy zawodnik ma przelew stały — system co miesiąc automatycznie tworzy Approved-składkę. */
  has_standing_order?: boolean
}

/** Odpowiedź `GET /api/athletes/:id` — bez powiązania konta i bez notatek wewnętrznych. */
export type AthletePublicProfile = Omit<Athlete, 'user_id' | 'notes'>

/** Alias for Athlete used in management components */
export type Player = Athlete

/** Wpis z `/api/competitions/recurring-training-cancellations` — wyjątek od domyślnego treningu Pn/Śr/Pt. */
export interface RecurringTrainingSession {
  session_date: string
  status: string
}

export interface Competition {
  id: string
  title: string
  date: string
  location: string
  description?: string
  category?: string | null
  status?: string | null
  /** Zapis zsynchronizowany z kalendarza zewnętrznego (PZPC, PodnoszenieCiezarow.pl). */
  external_source?: string | null
  external_ref?: string | null
  external_url?: string | null
  /** Klub bierze udział — niezależnie od przypisanych zawodników. */
  club_participates?: boolean
}

export type CalendarEvent = {
  id: string
  title: string
  date: string
  type: string
  time?: string
  location?: string
  description?: string
  category?: string | null
  status?: string | null
  external_source?: string | null
  external_ref?: string | null
  external_url?: string | null
  club_participates?: boolean
}

export interface CalendarParticipantBrief {
  athlete_id: string
  full_name: string
}

export interface MyCalendarEntry {
  competition: Competition
  participants: CalendarParticipantBrief[]
}

/**
 * Rozróżnienie wpisu w `results`:
 * - `competition` — start zawodów (publiczne, ranking, wykres na karcie zawodnika);
 * - `training` — wynik z treningu (widoczny po zalogowaniu, nie liczy się do PB).
 */
/** `import` — rekordy z importu danych (jeśli backend je oznacza). */
export type ResultKind = 'competition' | 'training' | 'import'

export interface CompetitionResult {
  id: string
  athlete_id: string
  snatch: number
  clean_and_jerk: number
  total: number
  status: 'Pending' | 'Approved' | 'Rejected'
  date: string
  /** Domyślnie `competition` (po stronie backendu); starsze rekordy bez pola traktujemy jako zawody. */
  kind?: ResultKind
  /** Miejsce zawodów — wypełniane tylko dla `kind = 'competition'`. */
  location?: string | null
  /** Waga ciała na starcie (kg) — jeśli podana, używana m.in. do liczenia Sinclaira dla tego startu. */
  bodyweight_kg?: number | null
  squat_kg?: number | null
  bench_kg?: number | null
  deadlift_kg?: number | null
}

/** Wpis w dzienniku treningów (zawodnik edytuje/usuwa tylko wpisy z własnym `author_user_id`). */
export interface TrainingLogEntry {
  id: string
  athlete_id: string
  session_date: string
  title?: string | null
  notes: string
  created_at: string
  author_user_id?: string | null
  author_username?: string | null
}

export interface Exercise {
  id: string
  name: string
  category?: string | null
  description?: string | null
  video_url?: string | null
  created_at: string
}

export interface TrainingPlanItem {
  id: string
  plan_id: string
  week_number?: number
  day_of_week: number
  exercise_id?: string | null
  custom_exercise_name?: string | null
  sets?: number | null
  reps?: number | null
  intensity_percent?: number | null
  weight_kg?: number | null
  notes?: string | null
  sort_order: number
  exercise_name?: string | null
}

export interface TrainingPlan {
  id: string
  athlete_id: string
  title: string
  goal?: string | null
  week_start: string
  duration_weeks?: number
  status: 'planned' | 'active' | 'completed' | 'paused'
  coach_note?: string | null
  athlete_note?: string | null
  progress_percent: number
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface RecoveryLog {
  id: string
  athlete_id: string
  date: string
  sleep_hours: number
  fatigue_level: number
  soreness_level: number
  readiness_level: number
  note?: string | null
  created_at: string
}

export interface OpsEvent {
  source: string
  at: string
  title: string
  detail: string
}

export interface PaymentStatusResponse {
  month: string
  due_date: string // YYYY-MM-10
  is_paid: boolean
  is_overdue: boolean
  /** Z API — przy braku pola (cache/stary backend) traktuj jak false. */
  has_standing_order?: boolean
}

/** Agregowany payload `GET /api/athletes/me/dashboard` — jeden round-trip na dashboard zawodnika. */
export interface AthleteDashboardResponse {
  athlete: Athlete | null
  pending_results_count: number
  calendar_entries: MyCalendarEntry[]
  attendance_summary: {
    athlete_id: string
    present_count: number
    absent_count: number
    pending_count: number
    attendance_percent: number
  } | null
  payment_status: PaymentStatusResponse | null
}

/** Agregowany payload `GET /api/trainer/dashboard` — jeden round-trip na dashboard trenera. */
export interface TrainerDashboardResponse {
  pending_results: CompetitionResult[]
  pending_payments: PendingPaymentRow[]
  monitoring_summary: {
    athletes_count: number
    active_plans_count: number
    pending_results_count: number
    pending_payments_count: number
    pending_attendance_count: number
    unread_notifications_count: number
    recovery_checkins_7d_count: number
  }
}

export interface PaymentMonthStatusRow {
  month: string // YYYY-MM
  due_date: string // YYYY-MM-10
  is_paid: boolean
  has_pending: boolean
  is_overdue: boolean
}

export interface AthletePaymentStatusRow {
  athlete_id: string
  full_name: string
  is_paid: boolean
}

export interface PendingPaymentRow {
  id: string
  athlete_id: string
  athlete_name: string
  month: string
  amount_pln?: number | null
  note?: string | null
  created_at: string
  created_by_user_id?: string | null
}

export interface AthletePaymentOverviewRow {
  athlete_id: string
  full_name: string
  month: string
  has_approved: boolean
  has_pending: boolean
  approved_amount_pln: number
  pending_amount_pln: number
}

export interface AdminAccount extends AuthUser {
  created_at?: string
}

/** Konta z `/api/admins/grouped` — admini (panel administracyjny), trenerzy, zawodnicy (bez nakładania list). */
export interface GroupedAdminAccounts {
  admins: AdminAccount[]
  trainers: AdminAccount[]
  athletes: AdminAccount[]
}

export interface ExerciseBoardRow {
  athlete_id: string
  athlete_name: string
  squat_kg?: number | null
  bench_kg?: number | null
  deadlift_kg?: number | null
  source_trainer_direct: boolean
  source_athlete_pending_count: number
  source_approved_results_count: number
  source_training_log_count: number
  source_last_approved_date?: string | null
}

export type ExerciseSubmissionStatus = 'Pending' | 'Approved' | 'Rejected'

export interface ExerciseSubmissionDto {
  id: string
  athlete_id: string
  athlete_name?: string | null
  exercise_id: string
  exercise_name: string
  value: number
  unit: string
  performed_at: string
  notes?: string | null
  status: ExerciseSubmissionStatus
  reviewed_at?: string | null
  review_note?: string | null
  created_at: string
}

export interface ExerciseBoardRowV2 {
  athlete_id: string
  athlete_name: string
  best_value: number
  unit: string
  entries: number
  last_performed_at?: string | null
}

export interface PlayerPayload {
  full_name: string
  birth_year?: number | null
  weight_category?: string | null
  best_snatch_kg?: number | null
  best_clean_jerk_kg?: number | null
  total_kg?: number | null
  notes?: string | null
  is_active?: boolean
}

export interface CreateAdminPayload {
  username: string
  password: string
  /** Domyślnie backend ustawia `['Admin']`. */
  roles?: UserRole[]
}

export interface ClubVoteMyVote {
  athlete_id: string | null
  athlete_name?: string | null
}

/** Odpowiedź `/api/system/mobile-releases/latest` i sync. */
export interface MobileReleaseInfo {
  version: string
  download_url: string
  published_at: string
}

/** Wpis dnia w kalendarzu zawodnika (`/athlete/kalendarz`). */
export interface AthleteCalendarDayEvent {
  id: string
  type: string
  category: string
  status: string
  external_source?: string
  title: string
  time: string
  location?: string
  modalHint: string
  participantsLine: string
  isAssigned?: boolean
  _dateIso?: string
}
