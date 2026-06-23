import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import type { GenerateBoardDocumentResponse } from '~/types/boardDocuments'

export type BoardGeneratorKind = 'meeting_report' | 'competition_start_list'

type CompetitionOption = { id: string, title: string }

export function useBoardDocumentGeneratorPage() {
  const api = useApi()
  const auth = useAuth()
  const toast = useToast()
  const { generateDocument, fetchBoardStatus, boardStatus } = useBoardDocuments()

  const selectedKind = ref<BoardGeneratorKind>('meeting_report')
  const meetingDate = ref('')
  const meetingTitle = ref('Raport na zebranie')
  const competitionId = ref('')
  const saveToRepo = ref(false)
  const generating = ref(false)
  const lastResult = ref<GenerateBoardDocumentResponse | null>(null)
  const error = ref<string | null>(null)

  const competitions = ref<CompetitionOption[]>([])
  const competitionsPending = ref(false)

  const canSaveToRepo = computed(() => auth.isBoardDocsFullAccess.value)
  const canGenerateStartList = computed(() => auth.isBoardDocsFullAccess.value)

  const kindOptions = computed(() => [
    {
      label: 'Raport na zebranie',
      value: 'meeting_report' as const,
      description: 'CSV z podsumowaniem obecności — dostępne dla członków zarządu.',
      icon: 'i-lucide-clipboard-list'
    },
    {
      label: 'Lista startowa',
      value: 'competition_start_list' as const,
      description: 'CSV uczestników zawodów — wymaga pełnego dostępu zarządu.',
      icon: 'i-lucide-list-ordered',
      disabled: !canGenerateStartList.value
    }
  ])

  const competitionOptions = computed(() =>
    competitions.value.map(c => ({ label: c.title, value: c.id }))
  )

  async function loadCompetitions() {
    competitionsPending.value = true
    try {
      const rows = await api<{ id: string, title?: string, name?: string }[]>(
        apiRoutes.competitions.collection
      ).catch(() => [])
      competitions.value = (rows ?? []).map(r => ({
        id: r.id,
        title: r.title ?? r.name ?? r.id
      }))
    } finally {
      competitionsPending.value = false
    }
  }

  async function checkStatus() {
    try {
      await fetchBoardStatus()
    } catch {
      // status opcjonalny przed generowaniem
    }
  }

  function downloadResult(result: GenerateBoardDocumentResponse) {
    const blob = new Blob([result.content], { type: result.mime_type || 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function runGenerate() {
    generating.value = true
    error.value = null
    lastResult.value = null
    try {
      if (selectedKind.value === 'competition_start_list' && !competitionId.value) {
        throw new Error('Wybierz zawody dla listy startowej.')
      }
      const result = await generateDocument({
        kind: selectedKind.value,
        save_to_repo: canSaveToRepo.value && saveToRepo.value,
        title: meetingTitle.value.trim() || undefined,
        meeting_date: meetingDate.value.trim() || undefined,
        competition_id: competitionId.value || undefined
      })
      lastResult.value = result
      toast.add({
        title: result.document ? 'Zapisano w repozytorium' : 'Wygenerowano dokument',
        description: result.filename,
        color: 'success'
      })
      return result
    } catch (e) {
      error.value = getApiErrorMessage(e)
      toast.add({
        title: 'Nie udało się wygenerować',
        description: error.value,
        color: 'error'
      })
      return null
    } finally {
      generating.value = false
    }
  }

  watch(selectedKind, kind => {
    if (kind === 'competition_start_list' && !canGenerateStartList.value) {
      selectedKind.value = 'meeting_report'
    }
  })

  return {
    selectedKind,
    meetingDate,
    meetingTitle,
    competitionId,
    saveToRepo,
    generating,
    lastResult,
    error,
    boardStatus,
    kindOptions,
    competitionOptions,
    competitionsPending,
    canSaveToRepo,
    canGenerateStartList,
    loadCompetitions,
    checkStatus,
    runGenerate,
    downloadResult
  }
}
