import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'

export interface ClubPublicAiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface ClubPublicAiStatus {
  enabled: boolean
  model: string
}

const MAX_MESSAGE_LEN = 1200
const MAX_HISTORY = 6

export function useClubPublicAi() {
  const { backendUrl } = useBackendDirectUrl()

  const messages = ref<ClubPublicAiMessage[]>([])
  const loading = ref(false)
  const enabled = ref(false)
  const model = ref('llama-3.1-70b-versatile')
  const statusLoaded = ref(false)

  async function refreshStatus() {
    try {
      const res = await $fetch<ClubPublicAiStatus>(backendUrl(apiRoutes.aiCoach.publicStatus), {
        timeout: 12_000
      })
      enabled.value = res.enabled === true
      model.value = res.model || model.value
    } catch {
      enabled.value = false
    } finally {
      statusLoaded.value = true
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim().slice(0, MAX_MESSAGE_LEN)
    if (!trimmed || loading.value || !enabled.value) return null

    messages.value.push({
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed
    })
    loading.value = true

    try {
      const history = messages.value
        .slice(0, -1)
        .slice(-MAX_HISTORY)
        .map(m => ({
          role: m.role,
          content: m.content
        }))

      const res = await $fetch<{ reply: string, model: string }>(
        backendUrl(apiRoutes.aiCoach.publicChat),
        {
          method: 'POST',
          body: { message: trimmed, history },
          timeout: 120_000
        }
      )

      messages.value.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.reply
      })
      return res
    } catch (e) {
      messages.value.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: getApiErrorMessage(e, 'Asystent jest chwilowo niedostępny. Napisz do nas przez stronę kontaktową.')
      })
      return null
    } finally {
      loading.value = false
    }
  }

  function clearChat() {
    messages.value = []
  }

  return {
    messages,
    loading,
    enabled,
    model,
    statusLoaded,
    refreshStatus,
    sendMessage,
    clearChat
  }
}
