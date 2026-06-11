import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import type { OlympicCoachAttachmentDraft, OlympicCoachAttachmentPayload } from '~/utils/olympicCoachAttachments'
import {
  parseOlympicCoachStreamProbe,
  type OlympicCoachStreamMode
} from '~/utils/olympicCoachStream'

export type OlympicCoachMode = 'chat' | 'plan' | 'supplements' | 'recovery' | 'barbell_path'

export interface OlympicCoachMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  mode: OlympicCoachMode
  attachments?: OlympicCoachAttachmentDraft[]
}

export interface OlympicCoachPlanContext {
  training_days_per_week?: number
  experience?: string
  snatch_max_kg?: number
  clean_jerk_max_kg?: number
  squat_max_kg?: number
  goal?: string
  injuries?: string
  week_start?: string
  notes?: string
}

export interface OlympicCoachQuota {
  chat_used_today: number
  chat_limit_per_day: number
  chat_used_this_minute: number
  chat_limit_per_minute: number
  import_used_today: number
  import_limit_per_day: number
  import_used_this_hour?: number
  import_limit_per_hour?: number
  barbell_path_used_today?: number
  barbell_path_limit_per_day?: number
  barbell_path_used_this_minute?: number
  barbell_path_limit_per_minute?: number
  applies_to_you?: boolean
}

export interface OlympicCoachStatus {
  configured: boolean
  model: string
  key_format_ok?: boolean
  setup_hint?: string | null
  quota?: OlympicCoachQuota
}

export interface OlympicCoachChatResponse {
  reply: string
  model: string
}

export interface OlympicCoachImportPlanResponse {
  plan_id: string
  title: string
  items_count: number
}

export interface OlympicCoachImportPlanRequest {
  plan_text: string
  athlete_id: string
  title?: string
  week_start?: string
  goal?: string
  status?: TrainingPlanStatus
  coach_note?: string
}

type TrainingPlanStatus = 'planned' | 'active' | 'completed' | 'paused'

export type OlympicCoachQuotaTone = 'ok' | 'warn' | 'danger'

export interface OlympicCoachQuotaMetric {
  id: string
  label: string
  used: number
  limit: number
  remaining: number
  percent: number
  tone: OlympicCoachQuotaTone
}

const MAX_MESSAGE_LEN = 3500
const MAX_HISTORY = 8

function quotaTone(used: number, limit: number): OlympicCoachQuotaTone {
  if (limit <= 0) return 'ok'
  const ratio = used / limit
  if (ratio >= 1) return 'danger'
  if (ratio >= 0.75) return 'warn'
  return 'ok'
}

export function olympicCoachChatBlockedReason(
  status: OlympicCoachStatus | null | undefined
): string | null {
  const q = status?.quota
  if (!q || q.applies_to_you === false) return null
  if (q.chat_used_today >= q.chat_limit_per_day) {
    return 'Dzienny limit wiadomości wyczerpany. Spróbuj jutro.'
  }
  if (q.chat_used_this_minute >= q.chat_limit_per_minute) {
    return 'Zbyt wiele wiadomości na minutę — odczekaj chwilę.'
  }
  return null
}

export function barbellPathRefineBlockedReason(
  status: OlympicCoachStatus | null | undefined
): string | null {
  const q = status?.quota
  if (!q || q.applies_to_you === false) return null
  const dayLimit = q.barbell_path_limit_per_day ?? 10
  const dayUsed = q.barbell_path_used_today ?? 0
  const minLimit = q.barbell_path_limit_per_minute ?? 2
  const minUsed = q.barbell_path_used_this_minute ?? 0
  if (dayUsed >= dayLimit) {
    return 'Dzienny limit korekty toru AI wyczerpany (free tier). Spróbuj jutro — tor MoveNet nadal działa.'
  }
  if (minUsed >= minLimit) {
    return 'Zbyt wiele analiz toru AI na minutę (max 2) — odczekaj ~60 s.'
  }
  return null
}

export function barbellPathQuotaMetrics(
  status: OlympicCoachStatus | null | undefined
): OlympicCoachQuotaMetric[] {
  const q = status?.quota
  if (!q || q.applies_to_you === false) return []

  const build = (
    id: string,
    label: string,
    used: number,
    limit: number
  ): OlympicCoachQuotaMetric => {
    const safeLimit = Math.max(limit, 1)
    const clampedUsed = Math.min(Math.max(used, 0), safeLimit)
    return {
      id,
      label,
      used: clampedUsed,
      limit: safeLimit,
      remaining: Math.max(0, limit - used),
      percent: Math.min(100, Math.round((clampedUsed / safeLimit) * 100)),
      tone: quotaTone(used, limit)
    }
  }

  return [
    build(
      'barbell_path_daily',
      'Tor AI dziś',
      q.barbell_path_used_today ?? 0,
      q.barbell_path_limit_per_day ?? 10
    ),
    build(
      'barbell_path_minute',
      'Tor AI / min',
      q.barbell_path_used_this_minute ?? 0,
      q.barbell_path_limit_per_minute ?? 2
    )
  ]
}

export function olympicCoachImportBlockedReason(
  status: OlympicCoachStatus | null | undefined
): string | null {
  const q = status?.quota
  if (!q || q.applies_to_you === false) return null
  if (q.import_used_today >= q.import_limit_per_day) {
    return 'Dzienny limit importów wyczerpany. Spróbuj jutro.'
  }
  const hourLimit = q.import_limit_per_hour ?? 3
  const hourUsed = q.import_used_this_hour ?? 0
  if (hourUsed >= hourLimit) {
    return 'Zbyt wiele importów na godzinę — odczekaj chwilę.'
  }
  return null
}

export function olympicCoachQuotaMetrics(
  status: OlympicCoachStatus | null | undefined,
  options?: { includeImport?: boolean }
): OlympicCoachQuotaMetric[] {
  const q = status?.quota
  if (!q || q.applies_to_you === false) return []

  const build = (
    id: string,
    label: string,
    used: number,
    limit: number
  ): OlympicCoachQuotaMetric => {
    const safeLimit = Math.max(limit, 1)
    const clampedUsed = Math.min(Math.max(used, 0), safeLimit)
    return {
      id,
      label,
      used: clampedUsed,
      limit: safeLimit,
      remaining: Math.max(0, limit - used),
      percent: Math.min(100, Math.round((clampedUsed / safeLimit) * 100)),
      tone: quotaTone(used, limit)
    }
  }

  const metrics: OlympicCoachQuotaMetric[] = [
    build('chat_daily', 'Wiadomości dziś', q.chat_used_today, q.chat_limit_per_day),
    build('chat_minute', 'Na minutę', q.chat_used_this_minute, q.chat_limit_per_minute)
  ]

  if (options?.includeImport) {
    metrics.push(
      build('import_daily', 'Importy dziś', q.import_used_today, q.import_limit_per_day),
      build(
        'import_hour',
        'Importy / godz.',
        q.import_used_this_hour ?? 0,
        q.import_limit_per_hour ?? 3
      )
    )
  }

  return metrics
}

export async function probeOlympicCoachStream(): Promise<OlympicCoachStreamMode> {
  if (!import.meta.client) return 'offline'
  try {
    const body = await $fetch<string>(apiRoutes.aiCoach.stream, {
      responseType: 'text',
      timeout: 8_000
    })
    return parseOlympicCoachStreamProbe(body)
  } catch {
    return 'offline'
  }
}

export function useOlympicCoachAi() {
  const api = useApi()

  const status = ref<OlympicCoachStatus | null>(null)
  const statusLoading = ref(true)
  const streamMode = ref<OlympicCoachStreamMode>('offline')
  const messages = ref<OlympicCoachMessage[]>([])
  const loading = ref(false)
  const importing = ref(false)
  const mode = ref<OlympicCoachMode>('chat')

  const planContext = reactive<OlympicCoachPlanContext>({
    training_days_per_week: 4,
    experience: '',
    snatch_max_kg: undefined,
    clean_jerk_max_kg: undefined,
    squat_max_kg: undefined,
    goal: '',
    injuries: '',
    week_start: '',
    notes: ''
  })

  async function refreshStatus() {
    statusLoading.value = true
    try {
      const [nextStatus, nextStream] = await Promise.all([
        api<OlympicCoachStatus>(apiRoutes.aiCoach.status),
        probeOlympicCoachStream()
      ])
      status.value = nextStatus
      streamMode.value = nextStream
    } catch {
      status.value = {
        configured: false,
        model: 'llama-3.1-70b-versatile',
        key_format_ok: false
      }
      streamMode.value = await probeOlympicCoachStream().catch(() => 'offline' as const)
    } finally {
      statusLoading.value = false
    }
  }

  async function sendMessage(
    text: string,
    options?: {
      athleteId?: string
      /** Zawodnik: własny profil klubowy w prompcie (kadra ignoruje to pole). */
      useAthleteContext?: boolean
      modeOverride?: OlympicCoachMode
      includePlanContext?: boolean
      attachments?: OlympicCoachAttachmentDraft[]
    }
  ) {
    const trimmed = text.trim().slice(0, MAX_MESSAGE_LEN)
    const attachmentDrafts = options?.attachments ?? []
    if ((!trimmed && attachmentDrafts.length === 0) || loading.value) return null

    if (olympicCoachChatBlockedReason(status.value)) return null

    const activeMode = options?.modeOverride ?? mode.value
    const userContent = trimmed || (attachmentDrafts.length
      ? 'Przeanalizuj załączone pliki.'
      : '')
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      mode: activeMode,
      attachments: attachmentDrafts.length ? [...attachmentDrafts] : undefined
    })
    loading.value = true

    try {
      const history = messages.value
        .slice(0, -1)
        .slice(-MAX_HISTORY)
        .map((m) => {
          let content = m.content
          if (m.role === 'user' && m.attachments?.length) {
            const names = m.attachments.map(a => a.name).join(', ')
            content = `${content}\n[Załączniki: ${names}]`
          }
          return {
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content
          }
        })

      const apiAttachments: OlympicCoachAttachmentPayload[] = attachmentDrafts.flatMap(d => d.payload)

      const body: Record<string, unknown> = {
        message: userContent,
        mode: activeMode,
        history
      }

      if (apiAttachments.length > 0) {
        body.attachments = apiAttachments
      }

      if (options?.athleteId) {
        body.athlete_id = options.athleteId
      }

      if (options?.useAthleteContext !== undefined) {
        body.use_athlete_context = options.useAthleteContext
      }

      if (options?.includePlanContext && activeMode === 'plan') {
        body.plan_context = { ...planContext }
      }

      const res = await api<OlympicCoachChatResponse>(apiRoutes.aiCoach.chat, {
        method: 'POST',
        body,
        timeout: 120_000
      })

      messages.value.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.reply,
        mode: activeMode
      })
      await refreshStatus()
      return res
    } catch (e) {
      messages.value.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: getApiErrorMessage(e, 'Nie udało się uzyskać odpowiedzi trenera AI.'),
        mode: activeMode
      })
      await refreshStatus().catch(() => {})
      return null
    } finally {
      loading.value = false
    }
  }

  function clearChat() {
    messages.value = []
  }

  async function importPlanToAthlete(payload: OlympicCoachImportPlanRequest) {
    if (importing.value) return null
    if (olympicCoachImportBlockedReason(status.value)) return null
    importing.value = true
    try {
      const res = await api<OlympicCoachImportPlanResponse>(apiRoutes.aiCoach.importPlan, {
        method: 'POST',
        body: payload,
        timeout: 120_000
      })
      await refreshStatus().catch(() => {})
      return res
    } finally {
      importing.value = false
    }
  }

  if (import.meta.client) {
    void refreshStatus()
  }

  return {
    status,
    statusLoading,
    streamMode,
    messages,
    loading,
    importing,
    mode,
    planContext,
    refreshStatus,
    sendMessage,
    clearChat,
    importPlanToAthlete
  }
}
