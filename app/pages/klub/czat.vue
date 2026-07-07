<script setup lang="ts">
import type { Athlete } from '~/types/models'
import type { ChatMessage, ChatThread } from '~/composables/useChat'
import { getApiErrorMessage } from '~/composables/useApi'
import { panelAreaFromPath } from '~/composables/useSlaviaPanelArea'
import { resolveAuthProfilePhotoSrc } from '~/utils/profilePhoto'

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Czat trener–zawodnik',
  robots: 'noindex, nofollow'
})

const route = useRoute()
const panelArea = computed(() => panelAreaFromPath(route.path))
const { primaryDashboardPath } = useRoleDashboardNav()
const auth = useAuth()
const rolePreviewState = useRolePreviewState()
const api = useApi()
const toast = useToast()
const chat = useChat()

const chatViewerUserId = computed(() =>
  rolePreviewState.isActive.value && rolePreviewState.state.value?.targetUserId
    ? rolePreviewState.state.value.targetUserId
    : (auth.user.value?.id ?? '')
)

const messageDraft = ref('')
const sendingMessage = ref(false)
const selectedAthleteId = ref('')
const messagesContainerRef = ref<HTMLElement | null>(null)
const newThreadTitle = ref('')
const threadTitleDraft = ref('')
const showNewThreadForm = ref(false)
const showThreadSettings = ref(false)
const threadPreviews = ref<Record<string, { body: string, at: string }>>({})

const READ_AT_KEY = 'slavia-chat-read-at'

const { data: athleteCandidates, error: athleteCandidatesError } = await useAsyncData('chat-athlete-candidates', async (): Promise<Athlete[]> => {
  if (!auth.isTrainer.value && !auth.isAdmin.value && !auth.isSuperAdmin.value) return []
  return api<Athlete[]>('/api/athletes/admin')
})

const canManageThreads = computed(
  () => auth.isTrainer.value || auth.isAdmin.value || auth.isSuperAdmin.value
)

const mobileThreadOpen = computed(() => Boolean(chat.activeThreadId.value))

onMounted(async () => {
  await chat.refreshThreads()
  await chat.refreshMessages()
  if (!rolePreviewState.isReadOnly.value) {
    chat.startPresencePing()
  }
  hydrateReadMarkers()
})

onUnmounted(() => {
  chat.stopPresencePing()
})

const reactionEmojis = ['👍', '✅', '🔥', '💪']

watch(() => chat.activeThreadId.value, async (id) => {
  await chat.refreshMessages()
  const active = chat.threads.value.find(t => t.id === id)
  threadTitleDraft.value = active?.title || ''
  showThreadSettings.value = false
  if (id) markThreadRead(id)
})

watch(
  () => chat.messages.value,
  (msgs) => {
    const threadId = chat.activeThreadId.value
    if (!threadId || msgs.length === 0) return
    const last = msgs[msgs.length - 1]!
    threadPreviews.value = {
      ...threadPreviews.value,
      [threadId]: { body: last.body, at: last.created_at }
    }
  },
  { deep: true }
)

watch(
  () => chat.messages.value.length,
  async () => {
    await nextTick()
    const el = messagesContainerRef.value
    if (!el) return
    el.scrollTop = el.scrollHeight
  }
)

function readAtMap(): Record<string, string> {
  if (!import.meta.client) return {}
  try {
    return JSON.parse(sessionStorage.getItem(READ_AT_KEY) || '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function hydrateReadMarkers() {
  if (!import.meta.client) return
  const map = readAtMap()
  for (const t of chat.threads.value) {
    if (!map[t.id]) map[t.id] = t.updated_at
  }
  sessionStorage.setItem(READ_AT_KEY, JSON.stringify(map))
}

function markThreadRead(threadId: string) {
  if (!import.meta.client) return
  const t = chat.threads.value.find(x => x.id === threadId)
  if (!t) return
  const map = readAtMap()
  map[threadId] = t.updated_at
  sessionStorage.setItem(READ_AT_KEY, JSON.stringify(map))
}

function isThreadUnread(t: ChatThread) {
  if (t.id === chat.activeThreadId.value) return false
  const readAt = readAtMap()[t.id]
  if (!readAt) return true
  return new Date(t.updated_at).getTime() > new Date(readAt).getTime()
}

function formatTimestamp(ts: string) {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ts
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

function formatListTime(ts: string) {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ts
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' }).format(d)
  }
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000
  if (d.getTime() > weekAgo) {
    return new Intl.DateTimeFormat('pl-PL', { weekday: 'short' }).format(d)
  }
  return new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit' }).format(d)
}

function userInitials(username?: string | null) {
  const v = (username || '').trim()
  if (!v) return 'U'
  const parts = v.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  return v.slice(0, 2).toUpperCase()
}

function threadInitials(t: ChatThread) {
  return userInitials(threadDisplayName(t))
}

function threadDisplayName(t: ChatThread) {
  return t.title?.trim() || 'Konwersacja'
}

function threadPreviewText(t: ChatThread) {
  const cached = threadPreviews.value[t.id]
  if (cached?.body) {
    const oneLine = cached.body.replace(/\s+/g, ' ').trim()
    return oneLine.length > 72 ? `${oneLine.slice(0, 72)}…` : oneLine
  }
  return 'Brak wiadomości — napisz pierwszą'
}

function messageSenderPhotoSrc(m: ChatMessage): string | undefined {
  const raw = m.sender_photo_url?.trim()
  return raw || undefined
}

const selfChatAvatarSrc = computed(() => resolveAuthProfilePhotoSrc(auth.user.value ?? undefined))

const activePeerOnline = computed(
  () => chat.chatPresenceOn.value && Boolean(chat.activeThread.value?.peer_online)
)

const sortedThreads = computed(() =>
  [...chat.threads.value].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )
)

function selectThread(id: string) {
  chat.activeThreadId.value = id
}

function backToThreadList() {
  chat.activeThreadId.value = null
}

async function openThreadWithAthlete() {
  const athleteId = selectedAthleteId.value
  if (!athleteId) return
  const athlete = (athleteCandidates.value || []).find(a => a.id === athleteId)
  if (!athlete?.user_id) {
    toast.add({ title: 'Ten zawodnik nie ma konta użytkownika', color: 'warning' })
    return
  }
  try {
    await chat.openThread(athlete.user_id, auth.user.value?.id || '', newThreadTitle.value)
    newThreadTitle.value = ''
    selectedAthleteId.value = ''
    showNewThreadForm.value = false
    toast.add({ title: 'Wątek czatu gotowy', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Nie udało się otworzyć wątku', description: getApiErrorMessage(e), color: 'error' })
  }
}

async function saveThreadTitle() {
  if (!chat.activeThreadId.value) return
  try {
    await chat.updateThreadTitle(chat.activeThreadId.value, threadTitleDraft.value)
    showThreadSettings.value = false
    toast.add({ title: 'Zapisano tytuł konwersacji', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Nie udało się zapisać tytułu', description: getApiErrorMessage(e), color: 'error' })
  }
}

async function deleteActiveThread() {
  const threadId = chat.activeThreadId.value
  if (!threadId) return
  const active = chat.threads.value.find(t => t.id === threadId)
  const title = active?.title?.trim() || 'Konwersacja bez tytułu'
  const ok = window.confirm(`Usunąć wątek „${title}” razem ze wszystkimi wiadomościami? Tej operacji nie da się cofnąć.`)
  if (!ok) return
  try {
    await chat.deleteThread(threadId)
    toast.add({ title: 'Usunięto wątek', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Nie udało się usunąć wątku', description: getApiErrorMessage(e), color: 'error' })
  }
}

async function sendMessage() {
  if (!messageDraft.value.trim() || sendingMessage.value) return
  sendingMessage.value = true
  try {
    await chat.sendMessage(messageDraft.value)
    messageDraft.value = ''
  } catch (e) {
    toast.add({ title: 'Nie udało się wysłać wiadomości', description: getApiErrorMessage(e), color: 'error' })
  } finally {
    sendingMessage.value = false
  }
}

const chatLiveItems = computed(() =>
  chat.messages.value.map(m => ({
    id: m.id,
    body: m.body,
    role: m.sender_user_id === chatViewerUserId.value ? 'self' as const : 'peer' as const,
    senderName: m.sender_username ?? undefined
  }))
)

const { announcement: chatLiveAnnouncement } = useChatLiveRegion(chatLiveItems, {
  scopeKey: computed(() => chat.activeThreadId.value)
})
</script>

<template>
  <PanelPageLayout padding="compact" :animate="false">
    <PanelPageHeader
      :area="panelArea"
      eyebrow="Klub"
      title="Czat trener–zawodnik"
      icon="i-lucide-messages-square"
      description="Wiadomości prywatne między kadrą a zawodnikami klubu."
      :breadcrumbs="[
        { label: 'Strefa klubu', to: '/klub', icon: 'i-lucide-layout-grid' },
        { label: 'Czat', icon: 'i-lucide-messages-square' }
      ]"
    >
      <template #actions>
        <UButton
          :to="primaryDashboardPath"
          variant="soft"
          color="neutral"
          size="sm"
          icon="i-lucide-layout-dashboard"
        >
          Panel
        </UButton>
        <UButton
          v-if="canManageThreads && !rolePreviewState.isReadOnly.value"
          variant="soft"
          color="primary"
          size="sm"
          icon="i-lucide-square-pen"
          @click="showNewThreadForm = !showNewThreadForm"
        >
          Nowa rozmowa
        </UButton>
      </template>
    </PanelPageHeader>

    <UAlert
      v-if="chat.threadsLoadError.value"
      class="mb-4"
      color="error"
      variant="subtle"
      icon="i-lucide-wifi-off"
      title="Nie udało się wczytać konwersacji"
      :description="chat.threadsLoadError.value"
    >
      <template #actions>
        <UButton size="sm" color="error" variant="soft" @click="() => chat.refreshThreads()">
          Spróbuj ponownie
        </UButton>
      </template>
    </UAlert>

    <UAlert
      v-if="athleteCandidatesError"
      class="mb-4"
      color="warning"
      variant="subtle"
      icon="i-lucide-users"
      title="Nie udało się wczytać listy zawodników"
      :description="getApiErrorMessage(athleteCandidatesError)"
    />

    <UAlert
      v-if="rolePreviewState.isReadOnly.value"
      class="mb-4"
      color="warning"
      variant="subtle"
      icon="i-lucide-eye"
      title="Podgląd read-only"
      description="Widzisz czat wybranego użytkownika — wysyłanie wiadomości i edycja wątków są wyłączone."
    />

    <div class="slavia-messenger">
      <aside
        class="slavia-messenger__sidebar"
        :class="{ 'slavia-messenger__sidebar--hidden-mobile': mobileThreadOpen }"
      >
        <header class="slavia-messenger__sidebar-head">
          <div class="min-w-0 flex-1">
            <h2 class="slavia-messenger__title">Konwersacje</h2>
            <p class="slavia-messenger__subtitle">
              {{ sortedThreads.length }}
              {{ sortedThreads.length === 1 ? 'wątek' : 'wątków' }}
            </p>
          </div>
        </header>

        <div v-if="showNewThreadForm && canManageThreads" class="slavia-messenger__new-thread">
          <UFormField label="Zawodnik">
            <USelect
              v-model="selectedAthleteId"
              :items="(athleteCandidates || []).map(a => ({ label: a.full_name, value: a.id }))"
              placeholder="Wybierz zawodnika…"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Tytuł konwersacji">
            <UInput v-model="newThreadTitle" placeholder="np. Plan na MP U20" class="w-full" />
          </UFormField>
          <UButton
            block
            icon="i-lucide-message-square-plus"
            :disabled="!selectedAthleteId"
            @click="openThreadWithAthlete"
          >
            Rozpocznij rozmowę
          </UButton>
        </div>

        <div class="slavia-messenger__thread-list" role="list">
          <button
            v-for="t in sortedThreads"
            :key="t.id"
            type="button"
            role="listitem"
            class="slavia-messenger__thread-item"
            :class="{ 'slavia-messenger__thread-item--active': chat.activeThreadId.value === t.id }"
            @click="selectThread(t.id)"
          >
            <UAvatar
              :text="threadInitials(t)"
              size="md"
              class="slavia-messenger__thread-avatar shrink-0"
            />
            <span class="slavia-messenger__thread-body min-w-0 flex-1">
              <span class="slavia-messenger__thread-row">
                <span class="slavia-messenger__thread-name truncate">{{ threadDisplayName(t) }}</span>
                <span class="slavia-messenger__thread-time shrink-0">{{ formatListTime(t.updated_at) }}</span>
              </span>
              <span class="slavia-messenger__thread-row">
                <span class="slavia-messenger__thread-preview truncate">{{ threadPreviewText(t) }}</span>
                <span
                  v-if="isThreadUnread(t)"
                  class="slavia-messenger__unread-badge shrink-0"
                  aria-label="Nieprzeczytane"
                />
              </span>
            </span>
          </button>
          <SlaviaEmptyState
            v-if="sortedThreads.length === 0"
            icon="i-lucide-messages-square"
            :title="canManageThreads ? 'Brak konwersacji' : 'Brak wiadomości'"
            :description="canManageThreads
              ? 'Utwórz nową rozmowę przyciskiem powyżej lub w nagłówku strony.'
              : 'Gdy trener rozpocznie rozmowę, zobaczysz ją na tej liście.'"
            class="slavia-messenger__empty m-4"
          />
        </div>
      </aside>

      <section
        class="slavia-messenger__main"
        :class="{ 'slavia-messenger__main--visible-mobile': mobileThreadOpen }"
      >
        <template v-if="chat.activeThreadId.value && chat.activeThread.value">
          <header class="slavia-messenger__header">
            <UButton
              class="slavia-messenger__back lg:hidden"
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="ghost"
              size="sm"
              square
              aria-label="Wróć do listy"
              @click="backToThreadList"
            />
            <UAvatar
              :text="threadInitials(chat.activeThread.value)"
              size="md"
              class="shrink-0"
            />
            <div class="min-w-0 flex-1">
              <p class="slavia-messenger__header-name truncate">
                {{ threadDisplayName(chat.activeThread.value) }}
              </p>
              <p
                v-if="chat.chatPresenceOn.value"
                class="slavia-messenger__presence"
                :class="activePeerOnline ? 'slavia-messenger__presence--online' : ''"
              >
                <span class="slavia-messenger__presence-dot" aria-hidden="true" />
                {{ activePeerOnline ? 'Aktywny teraz' : 'Offline' }}
              </p>
            </div>
            <UDropdownMenu
              v-if="!rolePreviewState.isReadOnly.value"
              :items="[[
                { label: 'Ustawienia wątku', icon: 'i-lucide-settings-2', onSelect: () => { showThreadSettings = !showThreadSettings } },
                { label: 'Usuń wątek', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: deleteActiveThread }
              ]]"
            >
              <UButton
                icon="i-lucide-ellipsis-vertical"
                color="neutral"
                variant="ghost"
                size="sm"
                square
                aria-label="Opcje konwersacji"
              />
            </UDropdownMenu>
          </header>

          <div v-if="showThreadSettings" class="slavia-messenger__settings">
            <UFormField label="Tytuł konwersacji" class="min-w-0 flex-1">
              <UInput v-model="threadTitleDraft" placeholder="Wpisz tytuł…" class="w-full" />
            </UFormField>
            <UButton icon="i-lucide-save" variant="soft" @click="saveThreadTitle">
              Zapisz
            </UButton>
          </div>

          <div ref="messagesContainerRef" class="slavia-messenger__messages">
            <UAlert
              v-if="chat.messagesLoadError.value"
              class="m-4"
              color="error"
              variant="subtle"
              icon="i-lucide-wifi-off"
              title="Nie udało się wczytać wiadomości"
              :description="chat.messagesLoadError.value"
            >
              <template #actions>
                <UButton size="sm" color="error" variant="soft" @click="() => chat.refreshMessages()">
                  Spróbuj ponownie
                </UButton>
              </template>
            </UAlert>
            <div
              class="sr-only"
              aria-live="polite"
              aria-atomic="true"
            >
              {{ chatLiveAnnouncement }}
            </div>
            <div
              v-for="m in chat.messages.value"
              :key="m.id"
              class="slavia-messenger__message-row"
              :class="m.sender_user_id === chatViewerUserId ? 'slavia-messenger__message-row--own' : 'slavia-messenger__message-row--peer'"
            >
              <UAvatar
                v-if="m.sender_user_id !== chatViewerUserId"
                :src="messageSenderPhotoSrc(m)"
                :alt="m.sender_username || 'Rozmówca'"
                size="xs"
                :text="messageSenderPhotoSrc(m) ? undefined : userInitials(m.sender_username)"
                class="slavia-messenger__msg-avatar shrink-0"
              />
              <div
                class="slavia-messenger__bubble"
                :class="m.sender_user_id === chatViewerUserId ? 'slavia-messenger__bubble--own' : 'slavia-messenger__bubble--peer'"
              >
                <p class="slavia-messenger__bubble-text">{{ m.body }}</p>
                <div
                  v-if="!rolePreviewState.isReadOnly.value && chat.chatReactionsOn.value && (m.reactions?.length || 0) > 0"
                  class="slavia-messenger__reactions"
                >
                  <button
                    v-for="r in m.reactions"
                    :key="`${m.id}-${r.emoji}`"
                    type="button"
                    class="slavia-messenger__reaction-chip"
                    :class="{ 'slavia-messenger__reaction-chip--mine': r.reacted_by_me }"
                    @click="chat.toggleReaction(m.id, r.emoji)"
                  >
                    {{ r.emoji }} {{ r.count }}
                  </button>
                </div>
                <div v-if="!rolePreviewState.isReadOnly.value && chat.chatReactionsOn.value" class="slavia-messenger__reaction-add">
                  <button
                    v-for="em in reactionEmojis"
                    :key="`${m.id}-add-${em}`"
                    type="button"
                    class="slavia-messenger__reaction-add-btn"
                    :aria-label="`Reakcja ${em}`"
                    @click="chat.toggleReaction(m.id, em)"
                  >
                    {{ em }}
                  </button>
                </div>
                <time class="slavia-messenger__bubble-time">{{ formatTimestamp(m.created_at) }}</time>
              </div>
              <UAvatar
                v-if="m.sender_user_id === chatViewerUserId"
                :src="selfChatAvatarSrc"
                :alt="auth.user.value?.username"
                size="xs"
                :text="selfChatAvatarSrc ? undefined : userInitials(auth.user.value?.username)"
                class="slavia-messenger__msg-avatar shrink-0"
              />
            </div>
            <SlaviaEmptyState
              v-if="chat.messages.value.length === 0 && !chat.messagesLoadError.value"
              icon="i-lucide-message-circle"
              title="Brak wiadomości"
              description="Napisz coś, aby rozpocząć rozmowę."
              class="slavia-messenger__messages-empty"
            />
          </div>

          <footer v-if="!rolePreviewState.isReadOnly.value" class="slavia-messenger__composer">
            <div class="slavia-messenger__composer-inner">
              <UInput
                v-model="messageDraft"
                class="slavia-messenger__input min-w-0 flex-1"
                placeholder="Aa"
                size="lg"
                variant="none"
                @keydown.enter.exact.prevent="sendMessage"
              />
              <UButton
                icon="i-lucide-send"
                color="primary"
                variant="solid"
                size="md"
                square
                class="slavia-messenger__send"
                :disabled="!messageDraft.trim() || sendingMessage"
                :loading="sendingMessage"
                aria-label="Wyślij wiadomość"
                @click="sendMessage"
              />
            </div>
          </footer>
        </template>

        <SlaviaEmptyState
          v-else
          icon="i-lucide-messages-square"
          title="Wybierz konwersację"
          description="Kliknij wątek po lewej, aby zobaczyć wiadomości."
          class="slavia-messenger__placeholder"
        />
      </section>
    </div>
  </PanelPageLayout>
</template>
