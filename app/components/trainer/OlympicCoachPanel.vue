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
const showImportModal = ref(false)
const importSourceText = ref('')

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

const modeItems: { label: string, value: OlympicCoachMode, icon: string }[] = [
  { label: 'Czat', value: 'chat', icon: 'i-lucide-message-circle' },
  { label: 'Plan treningowy', value: 'plan', icon: 'i-lucide-clipboard-list' },
  { label: 'Suplementacja', value: 'supplements', icon: 'i-lucide-pill' },
  { label: 'Regeneracja', value: 'recovery', icon: 'i-lucide-heart-pulse' }
]

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
  ]
}

watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    const el = messagesRef.value
    if (el) el.scrollTop = el.scrollHeight
  }
)

async function submitDraft() {
  if (!draft.value.trim()) return
  const text = draft.value
  draft.value = ''
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
</script>

<template>
  <div class="space-y-6">
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

    <UCard
      v-else-if="statusLoading"
      class="slavia-page-card"
    >
      <div class="flex min-h-[280px] flex-col items-center justify-center gap-3 text-muted">
        <UIcon
          name="i-lucide-loader-2"
          class="size-8 animate-spin"
        />
        <p class="text-sm">
          Łączenie z trenerem AI…
        </p>
      </div>
    </UCard>

    <template v-else-if="coachOn">
      <OlympicCoachQuotaStrip
        v-if="quotaMetrics.length"
        :metrics="quotaMetrics"
        :columns="isStaff ? 4 : 2"
        class="rounded-xl border border-default overflow-hidden"
      />

      <UCard class="slavia-page-card">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm font-semibold text-highlighted">
              Slavia AI Trener
            </p>
            <p class="mt-1 text-xs text-muted">
              Dwubój olimpijski · plany · suplementacja · regeneracja
              <span
                v-if="status?.model"
                class="font-mono"
              >({{ status.model }})</span>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="item in modeItems"
              :key="item.value"
              size="sm"
              :variant="mode === item.value ? 'solid' : 'outline'"
              :color="mode === item.value ? 'primary' : 'neutral'"
              :icon="item.icon"
              @click="mode = item.value"
            >
              {{ item.label }}
            </UButton>
          </div>
        </div>

        <UFormField
          v-if="isStaff && athleteItems.length"
          label="Kontekst zawodnika (opcjonalnie)"
          description="Kadra: PB i ostatnie check-iny regeneracji trafią do promptu."
          class="mt-6"
        >
          <SlaviaOverlaySelect
            v-model="selectedAthleteId"
            value-key="value"
            size="lg"
            class="w-full max-w-md"
            :items="[{ label: '— bez profilu —', value: '' }, ...athleteItems]"
          />
        </UFormField>

        <div
          v-if="mode === 'plan'"
          class="mt-6 grid gap-4 rounded-xl border border-default bg-elevated/40 p-4 sm:grid-cols-2"
        >
          <UFormField label="Dni treningowe / tydzień">
            <UInput
              v-model.number="planContext.training_days_per_week"
              type="number"
              min="2"
              max="6"
              size="lg"
            />
          </UFormField>
          <UFormField label="Doświadczenie">
            <UInput
              v-model="planContext.experience"
              placeholder="np. 2 lata dwuboju, junior"
              size="lg"
            />
          </UFormField>
          <UFormField label="CM rwanie (kg)">
            <UInput
              v-model.number="planContext.snatch_max_kg"
              type="number"
              step="0.5"
              size="lg"
            />
          </UFormField>
          <UFormField label="CM podrzut (kg)">
            <UInput
              v-model.number="planContext.clean_jerk_max_kg"
              type="number"
              step="0.5"
              size="lg"
            />
          </UFormField>
          <UFormField label="CM przysiad (kg)">
            <UInput
              v-model.number="planContext.squat_max_kg"
              type="number"
              step="0.5"
              size="lg"
            />
          </UFormField>
          <UFormField label="Tydzień od (data)">
            <UInput
              v-model="planContext.week_start"
              type="date"
              size="lg"
            />
          </UFormField>
          <UFormField
            label="Cel"
            class="sm:col-span-2"
          >
            <UInput
              v-model="planContext.goal"
              placeholder="np. poprawa C&J, start za 6 tygodni"
              size="lg"
            />
          </UFormField>
          <UFormField
            label="Kontuzje / ograniczenia"
            class="sm:col-span-2"
          >
            <UTextarea
              v-model="planContext.injuries"
              :rows="2"
              placeholder="np. lekki ból nadgarstka przy hang snatch"
            />
          </UFormField>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <UButton
            v-for="(prompt, idx) in quickPrompts[mode]"
            :key="idx"
            size="xs"
            variant="soft"
            color="neutral"
            :disabled="loading"
            @click="useQuickPrompt(prompt)"
          >
            {{ prompt.length > 48 ? `${prompt.slice(0, 48)}…` : prompt }}
          </UButton>
        </div>
      </UCard>

      <UCard class="slavia-page-card overflow-hidden">
        <div
          ref="messagesRef"
          class="max-h-[min(52vh,520px)] min-h-[280px] space-y-4 overflow-y-auto p-1"
        >
          <PublicEmptyState
            v-if="messages.length === 0"
            compact
            icon="i-lucide-sparkles"
            title="Zacznij rozmowę z trenerem AI"
            description="Wybierz tryb, użyj szybkiego promptu lub opisz swój cel treningowy."
          />

          <div
            v-for="msg in messages"
            :key="msg.id"
            class="flex"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[80%]"
              :class="msg.role === 'user'
                ? 'bg-primary text-white'
                : 'border border-default bg-elevated text-highlighted'"
            >
              <p class="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                {{ msg.role === 'user' ? 'Ty' : 'Slavia AI Trener' }}
              </p>
              <pre class="whitespace-pre-wrap font-sans">{{ msg.content }}</pre>
              <div
                v-if="canImportMessage(msg)"
                class="mt-3 border-t border-default/60 pt-2"
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

          <div
            v-if="loading"
            class="flex items-center gap-2 text-sm text-muted"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="size-4 animate-spin"
            />
            Trener analizuje…
          </div>
        </div>

        <div class="mt-4 border-t border-default pt-4">
          <form
            class="flex flex-col gap-3 sm:flex-row"
            @submit.prevent="submitDraft"
          >
            <UTextarea
              v-model="draft"
              :rows="2"
              autoresize
              :maxrows="6"
              class="flex-1"
              placeholder="Zadaj pytanie o technikę, poproś o plan, suplementację lub regenerację…"
              :disabled="loading || !status?.configured"
            />
            <div class="flex shrink-0 flex-row gap-2 sm:flex-col">
              <UButton
                type="submit"
                color="primary"
                size="lg"
                icon="i-lucide-send"
                :loading="loading"
                :disabled="!draft.trim() || !status?.configured"
              >
                Wyślij
              </UButton>
              <UButton
                type="button"
                variant="outline"
                color="neutral"
                size="lg"
                icon="i-lucide-copy"
                :disabled="!messages.some(m => m.role === 'assistant')"
                @click="copyLastReply"
              >
                Kopiuj
              </UButton>
              <UButton
                type="button"
                variant="ghost"
                color="neutral"
                size="lg"
                icon="i-lucide-trash-2"
                :disabled="messages.length === 0 || loading"
                @click="clearChat"
              >
                Wyczyść
              </UButton>
            </div>
          </form>
          <p class="mt-3 text-[11px] leading-relaxed text-muted">
            Trener AI to narzędzie edukacyjne — nie zastępuje diagnozy medycznej ani decyzji Twojego trenera klubowego.
            Klucz API Gemini jest przechowywany wyłącznie na backendzie.
          </p>
        </div>
      </UCard>

      <SlaviaModal
        v-model:open="showImportModal"
        title="Import planu AI"
        description="Gemini przekształci odpowiedź na strukturę planu tygodniowego przypisaną zawodnikowi."
        modal-class="max-w-lg"
      >
        <div class="space-y-4">
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
          <UFormField label="Tytuł planu">
            <UInput
              v-model="importForm.title"
              size="lg"
              placeholder="Plan AI — tydzień 1"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
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
          <UFormField label="Cel tygodnia">
            <UInput
              v-model="importForm.goal"
              size="lg"
            />
          </UFormField>
          <UFormField label="Notatka trenera">
            <UTextarea
              v-model="importForm.coach_note"
              :rows="2"
            />
          </UFormField>
          <div class="flex flex-wrap justify-end gap-2 pt-2">
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
        </div>
      </SlaviaModal>
    </template>
  </div>
</template>
