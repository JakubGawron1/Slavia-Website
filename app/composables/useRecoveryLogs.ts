import { apiRoutes } from '~/config/api'
import type { Athlete, RecoveryLog } from '~/types/models'

export const RECOVERY_CHECKIN_FORM_DEFAULT = () => ({
  date: new Date().toISOString().slice(0, 10),
  sleep_hours: 8,
  fatigue_level: 5,
  soreness_level: 5,
  readiness_level: 5,
  note: ''
})

export const RECOVERY_SCALE_LEGEND = [
  { title: 'Zmęczenie', text: 'Jak bardzo czujesz się zmęczony/a ogólnie po ostatnich jednostkach (1 — świeży/a, 10 — „nie mam nic w zbiorniku”).' },
  { title: 'Ból / obciążenie', text: 'Sztywność, zakwasy, punkty napięcia — nie koniecznie kontuzja (1 — komfort, 10 — bardzo obciążone).' },
  { title: 'Gotowość', text: 'Subiektywna gotowość na intensywny trening dziś lub jutro (1 — lepiej odpocząć, 10 — pełna dyspozycja).' }
] as const

export type RecoveryTrendPoint = {
  date: string
  sleep_hours: number
  fatigue_level: number
  soreness_level: number
  readiness_level: number
}

export function buildRecoveryTrend(logs: RecoveryLog[]): RecoveryTrendPoint[] {
  return [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map(r => ({
      date: r.date,
      sleep_hours: r.sleep_hours,
      fatigue_level: r.fatigue_level,
      soreness_level: r.soreness_level,
      readiness_level: r.readiness_level
    }))
}

function filterLogsByDate(logs: RecoveryLog[], dateFrom: string, dateTo: string) {
  let rows = logs
  if (dateFrom) rows = rows.filter(r => r.date >= dateFrom)
  if (dateTo) rows = rows.filter(r => r.date <= dateTo)
  return [...rows].sort((a, b) => b.date.localeCompare(a.date))
}

/** Panel zawodnika — własne check-iny. */
export function useAthleteRecoveryLogs() {
  const apiFetch = useApi()
  const toast = useToast()
  const form = reactive(RECOVERY_CHECKIN_FORM_DEFAULT())
  const saving = ref(false)

  const { data: logs, refresh, pending } = useAsyncData(
    'athlete-recovery-logs',
    () => apiFetch<RecoveryLog[]>(apiRoutes.recovery.collection).catch(() => []),
    { default: () => [] as RecoveryLog[] }
  )

  const trend = computed(() => buildRecoveryTrend(logs.value ?? []))

  async function saveCheckin() {
    saving.value = true
    try {
      await apiFetch(apiRoutes.recovery.collection, { method: 'POST', body: form })
      toast.add({ title: 'Check-in zapisany', color: 'success' })
      await refresh()
    } catch (e) {
      toast.add({ title: 'Błąd zapisu', description: getApiErrorMessage(e), color: 'error' })
    } finally {
      saving.value = false
    }
  }

  return { form, logs, pending, saving, saveCheckin, refresh, trend }
}

/** Panel trenera — podgląd check-inów wybranego zawodnika. */
export function useTrainerRecoveryLogs() {
  const apiFetch = useApi()
  const NO_ATHLETE = '__none__'
  const dateFrom = ref('')
  const dateTo = ref('')

  const { data: athletes } = useAsyncData(
    'trainer-recovery-athletes',
    () => apiFetch<Athlete[]>(apiRoutes.athletes.list).catch(() => []),
    { default: () => [] as Athlete[] }
  )

  const selectedAthleteId = ref(NO_ATHLETE)
  const logs = ref<RecoveryLog[]>([])
  const loading = ref(false)

  const filteredLogs = computed(() => filterLogsByDate(logs.value, dateFrom.value, dateTo.value))
  const trend = computed(() => buildRecoveryTrend(filteredLogs.value))

  async function loadLogs() {
    if (selectedAthleteId.value === NO_ATHLETE) {
      logs.value = []
      return
    }
    loading.value = true
    try {
      logs.value = await apiFetch<RecoveryLog[]>(
        apiRoutes.recovery.athlete(selectedAthleteId.value)
      ).catch(() => [])
    } finally {
      loading.value = false
    }
  }

  watch(selectedAthleteId, () => { void loadLogs() })

  const selectedName = computed(() => {
    const id = selectedAthleteId.value
    if (id === NO_ATHLETE) return ''
    return (athletes.value || []).find(a => a.id === id)?.full_name || ''
  })

  const athleteSelectItems = computed(() => [
    { label: '— wybierz zawodnika —', value: NO_ATHLETE },
    ...((athletes.value || []).map(a => ({ label: a.full_name, value: a.id })))
  ])

  return {
    NO_ATHLETE,
    athletes,
    selectedAthleteId,
    selectedName,
    athleteSelectItems,
    logs: filteredLogs,
    trend,
    dateFrom,
    dateTo,
    loading,
    loadLogs
  }
}
