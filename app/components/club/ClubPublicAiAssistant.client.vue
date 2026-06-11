<script setup lang="ts">
import { useClubPublicAi } from '~/composables/useClubPublicAi'
import { useOverlayDismiss } from '~/composables/useOverlayDismiss'
import { renderChatMarkdown } from '~/utils/renderChatMarkdown'

const open = ref(false)
const draft = ref('')
const messagesRef = ref<HTMLElement | null>(null)

const {
  messages,
  loading,
  enabled,
  statusLoaded,
  refreshStatus,
  sendMessage,
  clearChat
} = useClubPublicAi()

const quickPrompts = [
  { label: 'Treningi w klubie', text: 'Jak wyglądają treningi w CKS Slavia Ruda Śląska?' },
  { label: 'Dwubój dla początkujących', text: 'Czy w klubie trenujecie dwubój olimpijski i od czego zacząć?' },
  { label: 'Zapisy', text: 'Jak zapisać się do klubu Slavia?' },
  { label: 'Kontakt z trenerem', text: 'Chciałbym porozmawiać z trenerem — jak się skontaktować?' }
]

const isEmpty = computed(() => messages.value.length === 0)
const canSend = computed(() => Boolean(draft.value.trim()) && !loading.value && enabled.value)

useOverlayDismiss(open)

onMounted(() => {
  document.documentElement.classList.add('slavia-public-ai-visible')
  void refreshStatus()
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('slavia-public-ai-visible')
})

watch(open, (v) => {
  if (v && !statusLoaded.value) {
    void refreshStatus()
  }
  if (v) {
    nextTick(() => scrollToBottom())
  }
})

watch(
  () => messages.value.length,
  () => nextTick(() => scrollToBottom())
)

watch(loading, (v) => {
  if (v) nextTick(() => scrollToBottom())
})

function scrollToBottom() {
  const el = messagesRef.value
  if (el) el.scrollTop = el.scrollHeight
}

async function submitDraft() {
  if (!canSend.value) return
  const text = draft.value
  draft.value = ''
  await sendMessage(text)
}

function onComposerKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void submitDraft()
  }
}

async function useQuickPrompt(text: string) {
  if (loading.value || !enabled.value) return
  draft.value = text
  await submitDraft()
}

function toggleOpen() {
  open.value = !open.value
}
</script>

<template>
  <Teleport to="body">
    <Transition name="club-ai-panel">
      <div
        v-if="open"
        class="club-ai__backdrop"
        aria-hidden="true"
        @click="open = false"
      />
    </Transition>

    <Transition name="club-ai-panel">
      <aside
        v-if="open"
        class="club-ai__panel"
        role="dialog"
        aria-labelledby="club-ai-title"
        aria-modal="true"
      >
        <header class="club-ai__header">
          <div class="club-ai__header-main">
            <div class="club-ai__avatar">
              <UIcon
                name="i-lucide-message-circle"
                class="size-5 text-white"
              />
            </div>
            <div>
              <h2
                id="club-ai-title"
                class="club-ai__title"
              >
                Asystent Slavia
              </h2>
              <p class="club-ai__subtitle">
                Pytania o klub, treningi i dwubój — w razie potrzeby skierujemy Cię do trenera.
              </p>
            </div>
          </div>
          <div class="club-ai__header-actions">
            <UButton
              v-if="messages.length"
              variant="ghost"
              color="neutral"
              size="xs"
              icon="i-lucide-trash-2"
              aria-label="Wyczyść czat"
              @click="clearChat"
            />
            <UButton
              variant="ghost"
              color="neutral"
              size="xs"
              icon="i-lucide-x"
              aria-label="Zamknij"
              @click="open = false"
            />
          </div>
        </header>

        <div
          ref="messagesRef"
          class="club-ai__thread"
        >
          <div
            v-if="!enabled && statusLoaded"
            class="club-ai__offline"
          >
            <UIcon
              name="i-lucide-cloud-off"
              class="size-8 text-muted"
            />
            <p>Asystent jest chwilowo niedostępny.</p>
            <UButton
              to="/kontakt"
              color="primary"
              variant="soft"
              size="sm"
            >
              Przejdź na /kontakt
            </UButton>
          </div>

          <div
            v-else-if="isEmpty && !loading"
            class="club-ai__hero"
          >
            <p class="club-ai__hero-lead">
              Cześć! Jestem asystentem CKS Slavia. Zapytaj o klub, treningi siłowe lub dwubój.
            </p>
            <div class="club-ai__prompts">
              <button
                v-for="item in quickPrompts"
                :key="item.label"
                type="button"
                class="club-ai__prompt"
                @click="useQuickPrompt(item.text)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <div
            v-for="msg in messages"
            :key="msg.id"
            class="club-ai__msg"
            :class="msg.role === 'user' ? 'club-ai__msg--user' : 'club-ai__msg--bot'"
          >
            <div
              class="club-ai__bubble"
              :class="{ 'club-ai__bubble--md': msg.role === 'assistant' }"
            >
              <span v-if="msg.role === 'user'">{{ msg.content }}</span>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <span
                v-else
                class="oc-md-root"
                v-html="renderChatMarkdown(msg.content)"
              />
            </div>
          </div>

          <div
            v-if="loading"
            class="club-ai__typing"
          >
            <span /><span /><span />
            <span>Slavia odpowiada…</span>
          </div>
        </div>

        <footer class="club-ai__footer">
          <form
            class="club-ai__composer"
            @submit.prevent="submitDraft"
          >
            <textarea
              v-model="draft"
              rows="1"
              class="club-ai__input"
              placeholder="Napisz pytanie o klub…"
              :disabled="loading || !enabled"
              @keydown="onComposerKeydown"
            />
            <button
              type="submit"
              class="club-ai__send"
              :disabled="!canSend"
              aria-label="Wyślij"
            >
              <UIcon
                :name="loading ? 'i-lucide-loader-2' : 'i-lucide-arrow-up'"
                class="size-5"
                :class="{ 'animate-spin': loading }"
              />
            </button>
          </form>
          <div class="club-ai__footnote">
            <span>To nie jest porada medyczna ani indywidualny plan.</span>
            <NuxtLink
              to="/kontakt"
              class="club-ai__contact-link"
            >
              Kontakt z trenerem →
            </NuxtLink>
          </div>
        </footer>
      </aside>
    </Transition>

    <button
      type="button"
      class="club-ai__fab"
      :class="{ 'club-ai__fab--open': open }"
      :aria-expanded="open"
      aria-controls="club-ai-title"
      @click="toggleOpen"
    >
      <UIcon
        :name="open ? 'i-lucide-x' : 'i-lucide-message-circle'"
        class="size-6"
      />
      <span class="sr-only">{{ open ? 'Zamknij asystenta' : 'Otwórz asystenta klubu' }}</span>
    </button>
  </Teleport>
</template>
