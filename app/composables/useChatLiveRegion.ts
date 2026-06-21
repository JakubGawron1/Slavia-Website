import { chatPlainText } from '~/utils/chatPlainText'

export type ChatLiveRole = 'assistant' | 'peer' | 'self'

export interface ChatLiveItem {
  id: string
  body: string
  role: ChatLiveRole
  senderName?: string
}

export interface UseChatLiveRegionOptions {
  assistantLabel?: string
  peerLabel?: (senderName?: string) => string
  loadingLabel?: string
  maxBodyLength?: number
  /** Re-prime without announcing when scope changes (e.g. thread switch). */
  scopeKey?: Ref<string | null | undefined>
  loading?: Ref<boolean>
}

export function useChatLiveRegion(
  messages: Ref<ChatLiveItem[]>,
  options: UseChatLiveRegionOptions = {}
) {
  const {
    assistantLabel = 'Asystent',
    peerLabel = (name) => (name ? `${name}:` : 'Nowa wiadomość:'),
    loadingLabel,
    maxBodyLength = 280,
    scopeKey,
    loading
  } = options

  const announcement = ref('')
  const seenIds = new Set<string>()
  let primed = false

  function resetScope() {
    seenIds.clear()
    primed = false
    announcement.value = ''
  }

  function primeCurrent(msgs: ChatLiveItem[]) {
    for (const msg of msgs) {
      seenIds.add(msg.id)
    }
    primed = true
  }

  function formatMessage(msg: ChatLiveItem): string {
    const body = chatPlainText(msg.body, maxBodyLength)
    if (msg.role === 'assistant') {
      return body ? `${assistantLabel}: ${body}` : assistantLabel
    }
    if (msg.role === 'peer') {
      const prefix = peerLabel(msg.senderName)
      return body ? `${prefix} ${body}` : prefix
    }
    return body
  }

  function announceIncoming(msgs: ChatLiveItem[]) {
    if (!import.meta.client) return

    if (!primed) {
      primeCurrent(msgs)
      return
    }

    for (const msg of msgs) {
      if (seenIds.has(msg.id)) continue
      seenIds.add(msg.id)
      if (msg.role === 'self') continue
      const text = formatMessage(msg)
      if (text) announcement.value = text
    }
  }

  if (scopeKey) {
    watch(scopeKey, () => resetScope())
  }

  watch(messages, announceIncoming, { deep: true, immediate: true })

  if (loading && loadingLabel) {
    watch(loading, (isLoading) => {
      if (isLoading) announcement.value = loadingLabel
    })
  }

  return { announcement }
}
