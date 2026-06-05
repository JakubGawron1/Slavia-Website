import { apiRoutes } from '~/config/api'

export interface ChatThread {
  id: string
  athlete_user_id: string
  trainer_user_id: string
  title?: string | null
  created_at: string
  updated_at: string
  peer_last_seen_at?: string | null
  peer_online?: boolean
}

export interface ChatReactionSummary {
  emoji: string
  count: number
  reacted_by_me: boolean
}

export interface ChatMessage {
  id: string
  thread_id: string
  sender_user_id: string
  body: string
  created_at: string
  sender_username?: string | null
  sender_photo_url?: string | null
  reactions?: ChatReactionSummary[]
}

export function useChat() {
  const api = useApi()
  const chatPresenceOn = useExperimentalFlag('chat_online_presence')
  const chatReactionsOn = useExperimentalFlag('chat_message_reactions')
  const threads = ref<ChatThread[]>([])
  const activeThreadId = ref<string | null>(null)
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  let presenceTimer: ReturnType<typeof setInterval> | null = null

  function stopPresencePing() {
    if (presenceTimer) {
      clearInterval(presenceTimer)
      presenceTimer = null
    }
  }

  function startPresencePing() {
    if (!import.meta.client || !chatPresenceOn.value) return
    stopPresencePing()
    void api(apiRoutes.chat.presence, { method: 'POST' }).catch(() => {})
    presenceTimer = setInterval(() => {
      void api(apiRoutes.chat.presence, { method: 'POST' }).catch(() => {})
    }, 60_000)
  }

  async function refreshThreads() {
    loading.value = true
    try {
      threads.value = await api<ChatThread[]>(apiRoutes.chat.threads).catch(() => [])
      if (!activeThreadId.value && threads.value.length > 0) {
        activeThreadId.value = threads.value[0]!.id
      }
    } finally {
      loading.value = false
    }
  }

  async function openThread(athleteUserId: string, trainerUserId: string, title?: string) {
    const thread = await api<ChatThread>(apiRoutes.chat.threads, {
      method: 'POST',
      body: {
        athlete_user_id: athleteUserId,
        trainer_user_id: trainerUserId,
        title: title?.trim() || undefined
      }
    })
    activeThreadId.value = thread.id
    await refreshThreads()
    await refreshMessages()
    return thread
  }

  async function refreshMessages() {
    if (!activeThreadId.value) {
      messages.value = []
      return
    }
    messages.value = await api<ChatMessage[]>(apiRoutes.chat.messages(activeThreadId.value)).catch(() => [])
    startPresencePing()
  }

  async function toggleReaction(messageId: string, emoji: string) {
    if (!chatReactionsOn.value) return
    const updated = await api<ChatReactionSummary[]>(apiRoutes.chat.messageReaction(messageId), {
      method: 'POST',
      body: { emoji }
    })
    const idx = messages.value.findIndex(m => m.id === messageId)
    if (idx >= 0) {
      const copy = [...messages.value]
      copy[idx] = { ...copy[idx]!, reactions: updated }
      messages.value = copy
    }
  }

  async function sendMessage(body: string) {
    const threadId = activeThreadId.value
    if (!threadId || !body.trim()) return
    await api(apiRoutes.chat.messages(threadId), {
      method: 'POST',
      body: { body }
    })
    await refreshThreads()
    await refreshMessages()
  }

  async function updateThreadTitle(threadId: string, title: string) {
    await api(apiRoutes.chat.thread(threadId), {
      method: 'PATCH',
      body: { title: title.trim() || null }
    })
    await refreshThreads()
  }

  async function deleteThread(threadId: string) {
    await api(apiRoutes.chat.thread(threadId), { method: 'DELETE' })
    if (activeThreadId.value === threadId) {
      activeThreadId.value = null
    }
    await refreshThreads()
    await refreshMessages()
  }

  const activeThread = computed(() =>
    threads.value.find(t => t.id === activeThreadId.value) ?? null
  )

  onScopeDispose(() => stopPresencePing())

  return {
    threads,
    activeThreadId,
    activeThread,
    messages,
    loading,
    chatPresenceOn,
    chatReactionsOn,
    refreshThreads,
    openThread,
    refreshMessages,
    sendMessage,
    toggleReaction,
    startPresencePing,
    stopPresencePing,
    updateThreadTitle,
    deleteThread
  }
}
