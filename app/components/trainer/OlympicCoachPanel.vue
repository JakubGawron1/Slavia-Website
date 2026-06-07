<script setup lang="ts">
import type { Athlete } from '~/types/models'
import type { OlympicCoachMode } from '~/composables/useOlympicCoachAi'
import { olympicCoachQuotaMetrics } from '~/composables/useOlympicCoachAi'
import { getApiErrorMessage } from '~/composables/useApi'

const props = defineProps<{
  area: 'trainer' | 'athlete'
}>()

const auth = useAuth()
const api = useApi()
const toast = useToast()
const coachOn = useExperimentalFlag('gemini_olympic_coach')

const {
  status,
  statusLoading,
  messages,
  loading,
  importing,
  mode,
  planContext,
  sendMessage,
  clearChat,
  importPlanToAthlete
} = useOlympicCoachAi()

const draft = ref('')
const selectedAthleteId = ref('')
const messagesRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const shellRef = ref<HTMLElement | null>(null)
const showImportModal = ref(false)
const importSourceText = ref('')
const planSuiteOpen = ref(true)
const isMobile = ref(false)

const importForm = reactive({
  athlete_id: '',
  title: '',
  week_start: new Date().toISOString().slice(0, 10),
  goal: '',
  status: 'planned' as 'planned' | 'active' | 'completed' | 'paused',
  coach_note: 'Wygenerowano przez Slavia AI Trener — zweryfikuj przed startem.'
})

const statusItems = [
  { label: 'Zaplanowany', value: 'planned' },
  { label: 'Aktywny', value: 'active' },
  { label: 'Wstrzymany', value: 'paused' },
  { label: 'Zakończony', value: 'completed' }
]

const isStaff = computed(
  () => auth.isTrainer.value || auth.isAdmin.value || auth.isSuperAdmin.value
)

const quotaMetrics = computed(() =>
  olympicCoachQuotaMetrics(status.value, { includeImport: isStaff.value })
)

const { data: athletes } = await useAsyncData(
  `olympic-coach-athletes-${props.area}`,
  async (): Promise<Athlete[]> => {
    if (!isStaff.value) return []
    return api<Athlete[]>('/api/athletes/admin').catch(() => [])
  }
)

const athleteItems = computed(() =>
  (athletes.value ?? [])
    .filter(a => a.is_active !== false)
    .map(a => ({ label: a.full_name, value: a.id }))
)

const modeItems: { label: string, shortLabel: string, value: OlympicCoachMode, icon: string }[] = [
  { label: 'Czat', shortLabel: 'Czat', value: 'chat', icon: 'i-lucide-message-circle' },
  { label: 'Plan treningowy', shortLabel: 'Plan', value: 'plan', icon: 'i-lucide-clipboard-list' },
  { label: 'Suplementacja', shortLabel: 'Suplem.', value: 'supplements', icon: 'i-lucide-pill' },
  { label: 'Regeneracja', shortLabel: 'Regen.', value: 'recovery', icon: 'i-lucide-heart-pulse' }
]

const modePromptLabels: Record<OlympicCoachMode, string> = {
  chat: 'Technika',
  plan: 'Plan tygodnia',
  supplements: 'Suplementacja',
  recovery: 'Regeneracja',
  barbell_path: 'Tor sztangi'
}

const quickPrompts: Record<OlympicCoachMode, string[]> = {
  chat: [
    'Wyjaśnij second pull w rwaniu — na co zwracać uwagę w fazie eksplozywnej?',
    'Jak poprawić złapanie w podrzucie gdy sztanga ucieka do przodu?',
    'Jakie akcesoria na szybkość dziś po głównym boju?'
  ],
  plan: [
    'Wygeneruj plan tygodniowy 4 dni — priorytet podrzut, CM rwanie 80 kg, podrzut 100 kg.',
    'Plan techniczny na 3 dni po zawodach (deload + mobility).',
    'Mikrocykl 5 dni pod start za 3 tygodnie — taper w ostatnim tygodniu.'
  ],
  supplements: [
    'Stack suplementów na okres budowania siły — kreatyna, kofeina, beta-alanina.',
    'Co ma sens przed porannym treningiem technicznym dwuboju?',
    'Suplementacja wspierająca ścięgna i stawy przy dużej objętości przysiadów.'
  ],
  recovery: [
    'Plan powrotu do rwania po bolesności nadgarstka (2 tyg. przerwy).',
    'Regeneracja po przeciążeniu kolana — co robić przez 10 dni?',
    'Deload tydzień — jak obniżyć objętość bez utraty techniki?'
  ],
  barbell_path: []
}

const activeModeItem = computed(() => modeItems.find(m => m.value === mode.value))

const areaLabel = computed(() => (props.area === 'trainer' ? 'Kadra' : 'Zawodnik'))

const { visible: backVisible, target: backTarget, goBack } = useSlaviaNavBack()

const { swipeStyle, backdropOpacity, tracking: swipeTracking } = useEdgeSwipeBack(shellRef, {
  enabled: isMobile,
  canSwipe: () => Boolean(coachOn.value) && !showImportModal.value && !statusLoading.value,
  onBack: goBack
})

onMounted(() => {
  if (!import.meta.client) return
  const mq = window.matchMedia('(max-width: 639px)')
  const sync = () => {
    isMobile.value = mq.matches
    if (mq.matches && messages.value.length > 0) planSuiteOpen.value = false
  }
  sync()
  mq.addEventListener('change', sync)
  onUnmounted(() => mq.removeEventListener('change', sync))
})

watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    const el = messagesRef.value
    if (el) el.scrollTop = el.scrollHeight
  }
)

watch(mode, (m) => {
  if (m === 'plan') {
    planSuiteOpen.value = !isMobile.value || messages.value.length === 0
  }
})

watch(isMobile, (mobile) => {
  if (!mobile && mode.value === 'plan') {
    planSuiteOpen.value = true
  }
})

function resizeInput() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 128)}px`
}

function onInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void submitDraft()
  }
}

async function submitDraft() {
  if (!draft.value.trim()) return
  const text = draft.value
  draft.value = ''
  await nextTick()
  resizeInput()
  await sendMessage(text, {
    athleteId: isStaff.value && selectedAthleteId.value ? selectedAthleteId.value : undefined,
    includePlanContext: mode.value === 'plan'
  })
}

async function useQuickPrompt(prompt: string) {
  draft.value = prompt
  await submitDraft()
}

async function copyLastReply() {
  const last = [...messages.value].reverse().find(m => m.role === 'assistant')
  if (!last?.content || !import.meta.client) return
  try {
    await navigator.clipboard.writeText(last.content)
    toast.add({ title: 'Skopiowano odpowiedź', color: 'success' })
  } catch {
    toast.add({ title: 'Nie udało się skopiować', color: 'error' })
  }
}

function openImportModal(planText: string) {
  importSourceText.value = planText
  importForm.athlete_id = selectedAthleteId.value
  importForm.title = planContext.goal
    ? `Plan AI — ${planContext.goal.slice(0, 48)}`
    : `Plan AI — ${importForm.week_start}`
  importForm.week_start = planContext.week_start || importForm.week_start
  importForm.goal = planContext.goal || ''
  showImportModal.value = true
}

async function confirmImportPlan() {
  if (!importForm.athlete_id) {
    toast.add({ title: 'Wybierz zawodnika', color: 'warning' })
    return
  }
  try {
    const res = await importPlanToAthlete({
      plan_text: importSourceText.value,
      athlete_id: importForm.athlete_id,
      title: importForm.title.trim() || undefined,
      week_start: importForm.week_start || undefined,
      goal: importForm.goal.trim() || undefined,
      status: importForm.status,
      coach_note: importForm.coach_note.trim() || undefined
    })
    if (!res) return
    showImportModal.value = false
    toast.add({
      title: 'Plan zaimportowany',
      description: `${res.title} — ${res.items_count} ćwiczeń`,
      color: 'success'
    })
    await navigateTo(`/trainer/plany?athlete=${encodeURIComponent(importForm.athlete_id)}`)
  } catch (e) {
    toast.add({
      title: 'Import nie powiódł się',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

function canImportMessage(msg: { role: string, mode: OlympicCoachMode }) {
  return isStaff.value && msg.role === 'assistant' && msg.mode === 'plan'
}

function truncatePrompt(text: string, max = 72) {
  return text.length > max ? `${text.slice(0, max)}…` : text
}
</script>

<template>
  <div
    class="olympic-coach olympic-coach--page"
    :class="`olympic-coach--${area}`"
  >
    <UAlert
      v-if="!coachOn"
      color="warning"
      variant="subtle"
      title="Trener AI wyłączony"
    >
      Moduł jest wyłączony flagą
      <span class="font-mono text-[11px]">gemini_olympic_coach</span>
      — włącz w
      <NuxtLink
        to="/superadmin/developer"
        class="font-semibold text-primary underline"
      >
        narzędziach deweloperskich
      </NuxtLink>.
    </UAlert>

    <UAlert
      v-else-if="status && !status.configured"
      color="warning"
      variant="subtle"
      title="Trener AI niedostępny"
      description="Ustaw GROQ_API_KEY w .env backendu i zrestartuj serwer."
    />

    <div
      v-else-if="statusLoading"
      class="olympic-coach__shell olympic-coach__shell--loading"
    >
      <div class="olympic-coach__loading">
        <UIcon
          name="i-lucide-loader-2"
          class="size-8 animate-spin text-primary"
        />
        <p>Łączenie z trenerem AI…</p>
      </div>
    </div>

    <div
      v-else-if="coachOn"
      class="olympic-coach__swipe-stage"
      :class="{ 'olympic-coach__swipe-stage--active': swipeTracking || (backdropOpacity ?? 0) > 0 }"
    >
      <div
        class="olympic-coach__swipe-backdrop"
        aria-hidden="true"
        :style="{ opacity: backdropOpacity }"
      >
        <UIcon
          name="i-lucide-chevron-left"
          class="olympic-coach__swipe-backdrop-icon"
        />
      </div>

      <div
        ref="shellRef"
        class="olympic-coach__shell"
        :class="{
          'olympic-coach__shell--swiping': swipeTracking,
          'olympic-coach__shell--plan': mode === 'plan'
        }"
        :style="swipeStyle"
      >
      <OlympicCoachQuotaStrip
        v-if="quotaMetrics.length"
        :metrics="quotaMetrics"
        :columns="isStaff ? 4 : 2"
      />

      <header class="olympic-coach__toolbar">
        <div class="olympic-coach__toolbar-head">
          <button
            v-if="isMobile && backVisible"
            type="button"
            class="olympic-coach__back-btn"
            :aria-label="backTarget?.label ?? 'Wróć'"
            @click="goBack"
          >
            <UIcon
              name="i-lucide-chevron-left"
              class="size-5"
            />
          </button>

          <div class="olympic-coach__meta">
            <span class="olympic-coach__area-badge hidden sm:inline-flex">{{ areaLabel }}</span>
            <span class="olympic-coach__badge olympic-coach__badge--live">
              <UIcon
                name="i-lucide-sparkles"
                class="size-3"
              />
              Slavia AI
            </span>
            <span
              v-if="status?.model"
              class="olympic-coach__badge hidden sm:inline-flex"
            >
              {{ status.model }}
            </span>
          </div>
        </div>

        <nav
          class="olympic-coach__modes"
          aria-label="Tryb rozmowy"
        >
          <button
            v-for="item in modeItems"
            :key="item.value"
            type="button"
            class="olympic-coach__mode-btn"
            :class="{ 'olympic-coach__mode-btn--active': mode === item.value }"
            :disabled="loading"
            @click="mode = item.value"
          >
            <UIcon
              :name="item.icon"
              class="size-4 shrink-0"
            />
            <span class="hidden sm:inline">{{ item.label }}</span>
            <span class="sm:hidden">{{ item.shortLabel }}</span>
          </button>
        </nav>
      </header>

      <div
        v-if="isStaff && athleteItems.length"
        class="olympic-coach__context-bar"
      >
        <div class="olympic-coach__context-bar-icon">
          <UIcon
            name="i-lucide-user-round"
            class="size-4"
          />
        </div>
        <div class="olympic-coach__context-bar-copy">
          <strong>Kontekst zawodnika</strong>
          <span>PB i check-iny regeneracji trafią do promptu (opcjonalnie).</span>
        </div>
        <SlaviaOverlaySelect
          v-model="selectedAthleteId"
          value-key="value"
          size="lg"
          class="olympic-coach__context-select"
          :items="[{ label: '— bez profilu —', value: '' }, ...athleteItems]"
        />
      </div>

      <section
        v-if="mode === 'plan'"
        class="olympic-coach__plan-suite"
        :class="{ 'olympic-coach__plan-suite--collapsed': isMobile && !planSuiteOpen }"
      >
        <button
          v-if="isMobile"
          type="button"
          class="olympic-coach__plan-suite-toggle"
          :aria-expanded="planSuiteOpen"
          @click="planSuiteOpen = !planSuiteOpen"
        >
          <div class="olympic-coach__plan-suite-head">
            <UIcon
              name="i-lucide-clipboard-list"
              class="size-5 shrink-0"
            />
            <div>
              <h3>Parametry planu</h3>
              <p>CM, dni treningowe i cel — AI dopasuje mikrocykl.</p>
            </div>
          </div>
          <UIcon
            :name="planSuiteOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="size-5 shrink-0 text-muted"
          />
        </button>

        <div
          v-else
          class="olympic-coach__plan-suite-static-head"
        >
          <div class="olympic-coach__plan-suite-head">
            <UIcon
              name="i-lucide-clipboard-list"
              class="size-5 shrink-0"
            />
            <div>
              <h3>Parametry planu</h3>
              <p>Obok czatu — bez scrollowania.</p>
            </div>
          </div>
        </div>

        <div
          v-show="!isMobile || planSuiteOpen"
          class="olympic-coach__plan-suite-body"
        >
          <div class="olympic-coach__plan-block olympic-coach__plan-block--cm">
            <span class="olympic-coach__plan-block-label">CM (kg)</span>
            <div class="olympic-coach__plan-cm-grid">
              <div class="olympic-coach__plan-cm-card">
                <UIcon
                  name="i-lucide-dumbbell"
                  class="size-4"
                />
                <label for="oc-snatch">Rwanie</label>
                <div class="olympic-coach__plan-cm-input-wrap">
                  <input
                    id="oc-snatch"
                    v-model.number="planContext.snatch_max_kg"
                    type="number"
                    step="0.5"
                    inputmode="decimal"
                    placeholder="—"
                  >
                  <span>kg</span>
                </div>
              </div>
              <div class="olympic-coach__plan-cm-card">
                <UIcon
                  name="i-lucide-dumbbell"
                  class="size-4"
                />
                <label for="oc-cj">Podrzut</label>
                <div class="olympic-coach__plan-cm-input-wrap">
                  <input
                    id="oc-cj"
                    v-model.number="planContext.clean_jerk_max_kg"
                    type="number"
                    step="0.5"
                    inputmode="decimal"
                    placeholder="—"
                  >
                  <span>kg</span>
                </div>
              </div>
              <div class="olympic-coach__plan-cm-card">
                <UIcon
                  name="i-lucide-dumbbell"
                  class="size-4"
                />
                <label for="oc-sq">Przysiad</label>
                <div class="olympic-coach__plan-cm-input-wrap">
                  <input
                    id="oc-sq"
                    v-model.number="planContext.squat_max_kg"
                    type="number"
                    step="0.5"
                    inputmode="decimal"
                    placeholder="—"
                  >
                  <span>kg</span>
                </div>
              </div>
            </div>
          </div>

          <div class="olympic-coach__plan-block olympic-coach__plan-block--profile">
            <span class="olympic-coach__plan-block-label">Profil</span>
            <div class="olympic-coach__plan-row">
              <div class="olympic-coach__plan-field olympic-coach__plan-field--sm">
                <label for="oc-days">Dni / tydz.</label>
                <input
                  id="oc-days"
                  v-model.number="planContext.training_days_per_week"
                  class="olympic-coach__plan-input"
                  type="number"
                  min="2"
                  max="6"
                >
              </div>
              <div class="olympic-coach__plan-field olympic-coach__plan-field--grow">
                <label for="oc-week">Tydzień od</label>
                <input
                  id="oc-week"
                  v-model="planContext.week_start"
                  class="olympic-coach__plan-input"
                  type="date"
                >
              </div>
              <div class="olympic-coach__plan-field olympic-coach__plan-field--full">
                <label for="oc-exp">Doświadczenie</label>
                <input
                  id="oc-exp"
                  v-model="planContext.experience"
                  class="olympic-coach__plan-input"
                  type="text"
                  placeholder="np. 2 lata dwuboju, junior"
                >
              </div>
            </div>
          </div>

          <div class="olympic-coach__plan-block olympic-coach__plan-block--goal">
            <span class="olympic-coach__plan-block-label">Cel i ograniczenia</span>
            <div class="olympic-coach__plan-row">
              <div class="olympic-coach__plan-field olympic-coach__plan-field--full">
                <label for="oc-goal">Cel tygodnia</label>
                <input
                  id="oc-goal"
                  v-model="planContext.goal"
                  class="olympic-coach__plan-input"
                  type="text"
                  placeholder="np. poprawa C&J, start za 6 tygodni"
                >
              </div>
              <div class="olympic-coach__plan-field olympic-coach__plan-field--full">
                <label for="oc-inj">Kontuzje / ograniczenia</label>
                <textarea
                  id="oc-inj"
                  v-model="planContext.injuries"
                  class="olympic-coach__plan-input olympic-coach__plan-textarea"
                  rows="2"
                  placeholder="np. lekki ból nadgarstka przy hang snatch"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="olympic-coach__chat-stack">
      <div
        ref="messagesRef"
        class="olympic-coach__thread"
      >
        <div
          v-if="messages.length === 0"
          class="olympic-coach__hero"
        >
          <div class="olympic-coach__orb">
            <UIcon
              name="i-lucide-sparkles"
              class="size-7 text-white"
            />
          </div>
          <h2 class="olympic-coach__hero-title">
            Cześć, jestem Twoim trenerem AI
          </h2>
          <p class="olympic-coach__hero-sub">
            {{ activeModeItem?.label ?? 'Czat' }} — dwubój olimpijski, plany, suplementacja i bezpieczna regeneracja.
          </p>

          <div class="olympic-coach__prompt-grid">
            <button
              v-for="(prompt, idx) in quickPrompts[mode]"
              :key="idx"
              type="button"
              class="olympic-coach__prompt-card"
              :disabled="loading"
              @click="useQuickPrompt(prompt)"
            >
              <span class="olympic-coach__prompt-label">{{ modePromptLabels[mode] }}</span>
              <span class="olympic-coach__prompt-text">{{ truncatePrompt(prompt) }}</span>
            </button>
          </div>
        </div>

        <template v-else>
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="olympic-coach__row"
            :class="{ 'olympic-coach__row--user': msg.role === 'user' }"
          >
            <div
              class="olympic-coach__avatar"
              :class="msg.role === 'user' ? 'olympic-coach__avatar--user' : 'olympic-coach__avatar--ai'"
              aria-hidden="true"
            >
              <UIcon
                :name="msg.role === 'user' ? 'i-lucide-user' : 'i-lucide-sparkles'"
                class="size-3.5"
              />
            </div>
            <div
              class="olympic-coach__bubble"
              :class="msg.role === 'user' ? 'olympic-coach__bubble--user' : 'olympic-coach__bubble--ai'"
            >
              <p class="whitespace-pre-wrap">
                {{ msg.content }}
              </p>
              <div
                v-if="canImportMessage(msg)"
                class="olympic-coach__bubble-actions"
              >
                <UButton
                  size="xs"
                  color="primary"
                  variant="soft"
                  icon="i-lucide-file-input"
                  :disabled="importing || loading"
                  @click="openImportModal(msg.content)"
                >
                  Importuj do planów
                </UButton>
              </div>
            </div>
          </div>
        </template>

        <div
          v-if="loading"
          class="olympic-coach__typing"
        >
          <div
            class="olympic-coach__avatar olympic-coach__avatar--ai"
            aria-hidden="true"
          >
            <UIcon
              name="i-lucide-sparkles"
              class="size-3.5"
            />
          </div>
          <div class="olympic-coach__dots">
            <span /><span /><span />
          </div>
          <span>Trener analizuje…</span>
        </div>
      </div>

      <footer class="olympic-coach__composer-wrap">
        <form
          class="olympic-coach__composer"
          @submit.prevent="submitDraft"
        >
          <textarea
            ref="inputRef"
            v-model="draft"
            class="olympic-coach__input"
            rows="1"
            placeholder="Zadaj pytanie lub poproś o plan…"
            :disabled="loading || !status?.configured"
            @input="resizeInput"
            @keydown="onInputKeydown"
          />
          <button
            type="submit"
            class="olympic-coach__send"
            :disabled="!draft.trim() || loading || !status?.configured"
            aria-label="Wyślij wiadomość"
          >
            <UIcon
              name="i-lucide-arrow-up"
              class="size-5"
            />
          </button>
        </form>

        <div class="olympic-coach__composer-foot">
          <p class="olympic-coach__composer-disclaimer">
            Narzędzie edukacyjne — nie zastępuje diagnozy medycznej ani decyzji trenera klubowego.
          </p>
          <div class="olympic-coach__composer-actions">
            <button
              type="button"
              class="olympic-coach__composer-icon-btn"
              title="Kopiuj ostatnią odpowiedź"
              :disabled="!messages.some(m => m.role === 'assistant')"
              @click="copyLastReply"
            >
              <UIcon
                name="i-lucide-copy"
                class="size-4"
              />
            </button>
            <button
              type="button"
              class="olympic-coach__composer-icon-btn"
              title="Wyczyść rozmowę"
              :disabled="messages.length === 0 || loading"
              @click="clearChat"
            >
              <UIcon
                name="i-lucide-trash-2"
                class="size-4"
              />
            </button>
          </div>
        </div>
      </footer>
      </div>
      </div>
    </div>

    <SlaviaModal
      v-model:open="showImportModal"
      title="Import planu AI"
      description="Odpowiedź zostanie przekształcona w plan tygodniowy przypisany zawodnikowi."
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #body>
        <div class="olympic-coach__import-form">
          <section class="olympic-coach__import-section">
            <h4 class="olympic-coach__import-section-title">
              <UIcon
                name="i-lucide-user-round"
                class="size-4"
              />
              Przypisanie
            </h4>
            <UFormField
              label="Zawodnik"
              required
            >
              <SlaviaOverlaySelect
                v-model="importForm.athlete_id"
                value-key="value"
                size="lg"
                class="w-full"
                :items="athleteItems"
              />
            </UFormField>
          </section>

          <section class="olympic-coach__import-section">
            <h4 class="olympic-coach__import-section-title">
              <UIcon
                name="i-lucide-calendar-range"
                class="size-4"
              />
              Szczegóły planu
            </h4>
            <UFormField label="Tytuł planu">
              <UInput
                v-model="importForm.title"
                size="lg"
                placeholder="Plan AI — tydzień 1"
              />
            </UFormField>
            <div class="slavia-form-grid sm:grid-cols-2 mt-3">
              <UFormField label="Tydzień od">
                <UInput
                  v-model="importForm.week_start"
                  type="date"
                  size="lg"
                />
              </UFormField>
              <UFormField label="Status">
                <SlaviaOverlaySelect
                  v-model="importForm.status"
                  value-key="value"
                  size="lg"
                  class="w-full"
                  :items="statusItems"
                />
              </UFormField>
            </div>
            <UFormField
              label="Cel tygodnia"
              class="mt-3"
            >
              <UInput
                v-model="importForm.goal"
                size="lg"
              />
            </UFormField>
          </section>

          <section class="olympic-coach__import-section">
            <h4 class="olympic-coach__import-section-title">
              <UIcon
                name="i-lucide-sticky-note"
                class="size-4"
              />
              Notatka trenera
            </h4>
            <UTextarea
              v-model="importForm.coach_note"
              :rows="2"
            />
          </section>
        </div>
      </template>
      <template #footer>
        <div class="olympic-coach__import-actions w-full">
          <UButton
            variant="ghost"
            color="neutral"
            @click="showImportModal = false"
          >
            Anuluj
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-file-input"
            :loading="importing"
            :disabled="!importForm.athlete_id"
            @click="confirmImportPlan"
          >
            Utwórz plan
          </UButton>
        </div>
      </template>
    </SlaviaModal>
  </div>
</template>
