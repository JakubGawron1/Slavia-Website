<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'

export interface AiCoachSettingsStored {
  coach_instruction_append?: string | null
  coach_instruction_override?: string | null
  public_instruction_append?: string | null
  public_instruction_override?: string | null
  chat_temperature?: number | null
  public_chat_temperature?: number | null
  vision_chat_temperature?: number | null
  mode_plan_hint?: string | null
  mode_supplements_hint?: string | null
  mode_recovery_hint?: string | null
  mode_barbell_path_hint?: string | null
  updated_at?: string | null
  updated_by?: string | null
}

export interface AiCoachSettingsResponse {
  settings: AiCoachSettingsStored
  defaults: {
    chat_temperature: number
    public_chat_temperature: number
    vision_chat_temperature: number
    coach_instruction_preview: string
    public_instruction_preview: string
  }
  has_customizations: boolean
  effective_coach_instruction_chars: number
  effective_public_instruction_chars: number
}

type SettingsTab = 'coach' | 'public' | 'params' | 'modes'

const api = useApi()
const toast = useToast()

const loading = ref(false)
const saving = ref(false)
const activeTab = ref<SettingsTab>('coach')
const showCoachPreview = ref(false)
const showPublicPreview = ref(false)
const meta = ref<AiCoachSettingsResponse | null>(null)
const snapshot = ref('')

const form = reactive({
  coach_instruction_append: '',
  coach_instruction_override: '',
  public_instruction_append: '',
  public_instruction_override: '',
  chat_temperature: '',
  public_chat_temperature: '',
  vision_chat_temperature: '',
  mode_plan_hint: '',
  mode_supplements_hint: '',
  mode_recovery_hint: '',
  mode_barbell_path_hint: ''
})

const tabs: { id: SettingsTab, label: string, icon: string }[] = [
  { id: 'coach', label: 'Trener panel', icon: 'i-lucide-sparkles' },
  { id: 'public', label: 'Asystent WWW', icon: 'i-lucide-globe' },
  { id: 'params', label: 'Temperatura', icon: 'i-lucide-sliders-horizontal' },
  { id: 'modes', label: 'Tryby', icon: 'i-lucide-layers' }
]

function formSnapshot() {
  return JSON.stringify(form)
}

function applyToForm(data: AiCoachSettingsResponse) {
  const s = data.settings
  form.coach_instruction_append = s.coach_instruction_append ?? ''
  form.coach_instruction_override = s.coach_instruction_override ?? ''
  form.public_instruction_append = s.public_instruction_append ?? ''
  form.public_instruction_override = s.public_instruction_override ?? ''
  form.chat_temperature = s.chat_temperature != null ? String(s.chat_temperature) : ''
  form.public_chat_temperature = s.public_chat_temperature != null ? String(s.public_chat_temperature) : ''
  form.vision_chat_temperature = s.vision_chat_temperature != null ? String(s.vision_chat_temperature) : ''
  form.mode_plan_hint = s.mode_plan_hint ?? ''
  form.mode_supplements_hint = s.mode_supplements_hint ?? ''
  form.mode_recovery_hint = s.mode_recovery_hint ?? ''
  form.mode_barbell_path_hint = s.mode_barbell_path_hint ?? ''
  snapshot.value = formSnapshot()
}

const isDirty = computed(() => Boolean(meta.value) && formSnapshot() !== snapshot.value)

function parseTemp(raw: string): number | undefined {
  if (!raw.trim()) return undefined
  const n = Number.parseFloat(raw.replace(',', '.'))
  if (!Number.isFinite(n)) return undefined
  return Math.min(1, Math.max(0, n))
}

function tempDisplay(raw: string, fallback: number) {
  const n = parseTemp(raw)
  return (n ?? fallback).toFixed(2)
}

function tempSliderValue(raw: string, fallback: number) {
  const n = parseTemp(raw) ?? fallback
  return Math.round(n * 100)
}

function onTempSlider(field: 'chat_temperature' | 'public_chat_temperature' | 'vision_chat_temperature', event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  form[field] = (value / 100).toFixed(2)
}

function formatUpdatedAt(iso?: string | null) {
  if (!iso) return null
  try {
    return format(parseISO(iso), 'd MMM yyyy, HH:mm', { locale: pl })
  } catch {
    return iso
  }
}

async function refresh() {
  loading.value = true
  try {
    const res = await api<AiCoachSettingsResponse>(apiRoutes.aiCoach.settings)
    meta.value = res
    applyToForm(res)
  } catch (e) {
    toast.add({
      title: 'Ustawienia AI',
      description: getApiErrorMessage(e, 'Nie udało się wczytać ustawień'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

function buildPayload(reset = false) {
  if (reset) return { reset_to_defaults: true }
  return {
    coach_instruction_append: form.coach_instruction_append.trim() || null,
    coach_instruction_override: form.coach_instruction_override.trim() || null,
    public_instruction_append: form.public_instruction_append.trim() || null,
    public_instruction_override: form.public_instruction_override.trim() || null,
    chat_temperature: parseTemp(form.chat_temperature),
    public_chat_temperature: parseTemp(form.public_chat_temperature),
    vision_chat_temperature: parseTemp(form.vision_chat_temperature),
    mode_plan_hint: form.mode_plan_hint.trim() || null,
    mode_supplements_hint: form.mode_supplements_hint.trim() || null,
    mode_recovery_hint: form.mode_recovery_hint.trim() || null,
    mode_barbell_path_hint: form.mode_barbell_path_hint.trim() || null
  }
}

async function save() {
  saving.value = true
  try {
    const res = await api<AiCoachSettingsResponse>(apiRoutes.aiCoach.settings, {
      method: 'PUT',
      body: buildPayload(false)
    })
    meta.value = res
    applyToForm(res)
    toast.add({ title: 'Ustawienia AI zapisane', color: 'success' })
  } catch (e) {
    toast.add({
      title: 'Zapis nie powiódł się',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function resetDefaults() {
  saving.value = true
  try {
    const res = await api<AiCoachSettingsResponse>(apiRoutes.aiCoach.settings, {
      method: 'PUT',
      body: buildPayload(true)
    })
    meta.value = res
    applyToForm(res)
    toast.add({ title: 'Przywrócono domyślne ustawienia AI', color: 'success' })
  } catch (e) {
    toast.add({
      title: 'Reset nie powiódł się',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void refresh()
})
</script>

<template>
  <section
    class="dev-ai-coach"
    aria-label="Konfiguracja Trenera AI"
  >
    <header class="dev-ai-coach__hero">
      <div class="flex min-w-0 flex-1 items-start gap-3">
        <div
          class="dev-ai-coach__hero-icon"
          aria-hidden="true"
        >
          <UIcon
            name="i-lucide-brain-circuit"
            class="size-5"
          />
        </div>
        <div class="dev-ai-coach__hero-copy">
          <h3 class="dev-ai-coach__hero-title">
            Studio promptów Trenera AI
          </h3>
          <p class="dev-ai-coach__hero-sub">
            Ton, osobowość i parametry modelu — zapis w
            <code class="rounded bg-muted/40 px-1 py-0.5 font-mono text-[10px]">system_settings</code>.
            Klucz Groq pozostaje w <code class="font-mono text-[10px]">.env</code>.
          </p>
        </div>
      </div>
      <UButton
        size="sm"
        variant="soft"
        color="neutral"
        icon="i-lucide-refresh-cw"
        :loading="loading"
        @click="refresh"
      >
        Odśwież
      </UButton>
    </header>

    <div
      v-if="meta"
      class="dev-ai-coach__meta"
    >
      <UBadge
        size="xs"
        :color="meta.has_customizations ? 'primary' : 'neutral'"
        variant="subtle"
      >
        {{ meta.has_customizations ? 'Konfiguracja niestandardowa' : 'Domyślna konfiguracja' }}
      </UBadge>
      <span class="dev-ai-coach__meta-stat">
        <UIcon
          name="i-lucide-file-text"
          class="size-3"
        />
        {{ meta.effective_coach_instruction_chars }} znaków · trener
      </span>
      <span class="dev-ai-coach__meta-stat">
        <UIcon
          name="i-lucide-globe"
          class="size-3"
        />
        {{ meta.effective_public_instruction_chars }} znaków · publiczny
      </span>
      <span
        v-if="meta.settings.updated_at"
        class="dev-ai-coach__meta-stat"
      >
        <UIcon
          name="i-lucide-clock"
          class="size-3"
        />
        {{ formatUpdatedAt(meta.settings.updated_at) }}
      </span>
    </div>

    <nav
      class="dev-ai-coach__tabs"
      aria-label="Sekcje konfiguracji"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="dev-ai-coach__tab"
        :class="{ 'dev-ai-coach__tab--active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <UIcon
          :name="tab.icon"
          class="size-3.5 shrink-0"
        />
        {{ tab.label }}
      </button>
    </nav>

    <div
      v-if="loading && !meta"
      class="dev-ai-coach__skeleton"
    >
      <div class="dev-ai-coach__skeleton-line" />
      <div class="dev-ai-coach__skeleton-line dev-ai-coach__skeleton-line--lg" />
      <div class="dev-ai-coach__skeleton-line" />
    </div>

    <div
      v-else
      class="dev-ai-coach__panel"
    >
      <div
        v-show="activeTab === 'coach'"
        class="dev-ai-coach__field-grid"
      >
        <p class="dev-ai-coach__panel-intro">
          Dopisz wytyczne tonu (żarty dwubojowe, motywacja, zwracanie się po imieniu) albo — w razie potrzeby — nadpisz cały prompt systemowy trenera w panelu.
        </p>
        <UFormField
          label="Dodatkowe wytyczne osobowości"
          hint="Doklejane do wbudowanego promptu — zalecane na co dzień."
        >
          <UTextarea
            v-model="form.coach_instruction_append"
            :rows="6"
            placeholder="np. Bądź bardziej emocjonalny, jeden żart o sztandze na odpowiedź, kończ zachętą do następnego treningu…"
            class="dev-ai-coach__textarea w-full"
          />
        </UFormField>
        <UFormField
          label="Pełne nadpisanie promptu (opcjonalne)"
          hint="Puste = domyślny prompt + dodatek powyżej."
        >
          <UTextarea
            v-model="form.coach_instruction_override"
            :rows="5"
            placeholder="Zostaw puste, jeśli wystarczy dopisek osobowości"
            class="dev-ai-coach__textarea w-full"
          />
        </UFormField>
        <div class="dev-ai-coach__preview">
          <button
            type="button"
            class="dev-ai-coach__preview-toggle"
            :aria-expanded="showCoachPreview"
            @click="showCoachPreview = !showCoachPreview"
          >
            <span>Podgląd domyślnego promptu trenera</span>
            <UIcon
              :name="showCoachPreview ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="size-4 text-muted"
            />
          </button>
          <pre
            v-show="showCoachPreview"
            class="dev-ai-coach__preview-body"
          >{{ meta?.defaults.coach_instruction_preview }}</pre>
        </div>
      </div>

      <div
        v-show="activeTab === 'public'"
        class="dev-ai-coach__field-grid"
      >
        <p class="dev-ai-coach__panel-intro">
          Asystent na stronach publicznych klubu — krótsze odpowiedzi, bez planów indywidualnych. Możesz doprecyzować ton lub nadpisać prompt.
        </p>
        <UFormField label="Dodatek do promptu publicznego">
          <UTextarea
            v-model="form.public_instruction_append"
            :rows="4"
            class="dev-ai-coach__textarea w-full"
          />
        </UFormField>
        <UFormField label="Nadpisanie promptu publicznego (opcjonalne)">
          <UTextarea
            v-model="form.public_instruction_override"
            :rows="4"
            class="dev-ai-coach__textarea w-full"
          />
        </UFormField>
        <div class="dev-ai-coach__preview">
          <button
            type="button"
            class="dev-ai-coach__preview-toggle"
            :aria-expanded="showPublicPreview"
            @click="showPublicPreview = !showPublicPreview"
          >
            <span>Podgląd domyślnego promptu publicznego</span>
            <UIcon
              :name="showPublicPreview ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="size-4 text-muted"
            />
          </button>
          <pre
            v-show="showPublicPreview"
            class="dev-ai-coach__preview-body"
          >{{ meta?.defaults.public_instruction_preview }}</pre>
        </div>
      </div>

      <div v-show="activeTab === 'params'">
        <p class="dev-ai-coach__panel-intro">
          Niższa temperatura = bardziej przewidywalne odpowiedzi. Wyższa = żywszy ton i więcej kreatywności. Puste pole = wartość domyślna.
        </p>
        <div class="dev-ai-coach__temp-grid">
          <div class="dev-ai-coach__temp-card">
            <div class="dev-ai-coach__temp-head">
              <div>
                <p class="dev-ai-coach__temp-label">
                  Czat panelu
                </p>
                <p class="dev-ai-coach__temp-default">
                  domyślnie {{ meta?.defaults.chat_temperature ?? 0.72 }}
                </p>
              </div>
              <span class="dev-ai-coach__temp-value">
                {{ tempDisplay(form.chat_temperature, meta?.defaults.chat_temperature ?? 0.72) }}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              class="dev-ai-coach__range"
              :value="tempSliderValue(form.chat_temperature, meta?.defaults.chat_temperature ?? 0.72)"
              @input="onTempSlider('chat_temperature', $event)"
            >
          </div>
          <div class="dev-ai-coach__temp-card">
            <div class="dev-ai-coach__temp-head">
              <div>
                <p class="dev-ai-coach__temp-label">
                  Czat publiczny
                </p>
                <p class="dev-ai-coach__temp-default">
                  domyślnie {{ meta?.defaults.public_chat_temperature ?? 0.55 }}
                </p>
              </div>
              <span class="dev-ai-coach__temp-value">
                {{ tempDisplay(form.public_chat_temperature, meta?.defaults.public_chat_temperature ?? 0.55) }}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              class="dev-ai-coach__range"
              :value="tempSliderValue(form.public_chat_temperature, meta?.defaults.public_chat_temperature ?? 0.55)"
              @input="onTempSlider('public_chat_temperature', $event)"
            >
          </div>
          <div class="dev-ai-coach__temp-card">
            <div class="dev-ai-coach__temp-head">
              <div>
                <p class="dev-ai-coach__temp-label">
                  Vision / załączniki
                </p>
                <p class="dev-ai-coach__temp-default">
                  domyślnie {{ meta?.defaults.vision_chat_temperature ?? 0.72 }}
                </p>
              </div>
              <span class="dev-ai-coach__temp-value">
                {{ tempDisplay(form.vision_chat_temperature, meta?.defaults.vision_chat_temperature ?? 0.72) }}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              class="dev-ai-coach__range"
              :value="tempSliderValue(form.vision_chat_temperature, meta?.defaults.vision_chat_temperature ?? 0.72)"
              @input="onTempSlider('vision_chat_temperature', $event)"
            >
          </div>
        </div>
      </div>

      <div
        v-show="activeTab === 'modes'"
        class="dev-ai-coach__mode-grid"
      >
        <p class="dev-ai-coach__panel-intro">
          Prefiksy wstrzykiwane przed wiadomością użytkownika w danym trybie czatu. Puste = wbudowany prefiks Slavia.
        </p>
        <div class="dev-ai-coach__mode-card">
          <p class="dev-ai-coach__mode-label">
            <UIcon
              name="i-lucide-clipboard-list"
              class="size-3.5"
            />
            Plan treningowy
          </p>
          <UTextarea
            v-model="form.mode_plan_hint"
            :rows="3"
            class="dev-ai-coach__textarea w-full"
          />
        </div>
        <div class="dev-ai-coach__mode-card">
          <p class="dev-ai-coach__mode-label">
            <UIcon
              name="i-lucide-pill"
              class="size-3.5"
            />
            Suplementacja
          </p>
          <UTextarea
            v-model="form.mode_supplements_hint"
            :rows="3"
            class="dev-ai-coach__textarea w-full"
          />
        </div>
        <div class="dev-ai-coach__mode-card">
          <p class="dev-ai-coach__mode-label">
            <UIcon
              name="i-lucide-heart-pulse"
              class="size-3.5"
            />
            Regeneracja
          </p>
          <UTextarea
            v-model="form.mode_recovery_hint"
            :rows="3"
            class="dev-ai-coach__textarea w-full"
          />
        </div>
        <div class="dev-ai-coach__mode-card">
          <p class="dev-ai-coach__mode-label">
            <UIcon
              name="i-lucide-activity"
              class="size-3.5"
            />
            Tor sztangi
          </p>
          <UTextarea
            v-model="form.mode_barbell_path_hint"
            :rows="3"
            class="dev-ai-coach__textarea w-full"
          />
        </div>
      </div>
    </div>

    <footer class="dev-ai-coach__actions">
      <span
        v-if="isDirty"
        class="dev-ai-coach__dirty"
      >
        Niezapisane zmiany
      </span>
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        :disabled="saving || loading"
        @click="resetDefaults"
      >
        Przywróć domyślne
      </UButton>
      <UButton
        color="primary"
        size="sm"
        icon="i-lucide-save"
        :loading="saving"
        :disabled="loading || !isDirty"
        @click="save"
      >
        Zapisz konfigurację
      </UButton>
    </footer>
  </section>
</template>
