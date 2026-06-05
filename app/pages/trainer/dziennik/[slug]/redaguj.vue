<script setup lang="ts">
import type { Athlete, TrainingLogEntry } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'
import { stripHtmlTags } from '~/utils/html'
import { sanitizeRichHtml } from '~/utils/sanitizeHtml'
import { parseSlugId } from '~/utils/slug'

definePageMeta({
  middleware: 'trainer',
  layout: false
})

const route = useRoute()
const apiFetch = useApi()
const toast = useToast()

const slugSegment = computed(() => String(route.params.slug || ''))
const athleteId = computed(() => parseSlugId(slugSegment.value))
const wpisId = computed(() => String(route.query.wpis || '').trim())
const planIdFromQuery = computed(() => String(route.query.plan_id || '').trim())
const planTitleFromQuery = computed(() => String(route.query.plan_title || '').trim())
const planSessionFromQuery = computed(() => String(route.query.session_date || '').trim())

const diaryListPath = computed(() => `/trainer/dziennik/${slugSegment.value}`)

const { data: athletes } = await useAsyncData(
  'trainer-diary-compose-athletes',
  async (): Promise<Athlete[]> => {
    try {
      return await apiFetch<Athlete[]>('/api/athletes/admin')
    } catch {
      return await apiFetch<Athlete[]>('/api/athletes').catch(() => [])
    }
  }
)

const athleteName = computed(() => {
  const a = (athletes.value || []).find(x => x.id === athleteId.value)
  return a?.full_name ?? 'Zawodnik'
})

const entries = ref<TrainingLogEntry[]>([])
const loading = ref(true)

async function loadEntries() {
  if (!athleteId.value) {
    return
  }
  loading.value = true
  try {
    entries.value = await apiFetch<TrainingLogEntry[]>(`/api/athletes/${athleteId.value}/training-log`)
  } catch (e) {
    entries.value = []
    toast.add({
      title: 'Nie udało się wczytać wpisów',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
  if (wpisId.value) {
    applyEntryToForm(wpisId.value)
  }
}

watch(athleteId, () => loadEntries(), { immediate: true })

const form = reactive({
  session_date: new Date().toISOString().slice(0, 10),
  title: '',
  notes: '<p></p>'
})

const saving = ref(false)
const previewOpen = ref(false)

const sanitizedNotesPreview = computed(() => sanitizeRichHtml(form.notes.trim()))

function applyEntryToForm(id: string) {
  const e = entries.value.find(x => x.id === id)
  if (!e) {
    return
  }
  form.session_date = e.session_date.slice(0, 10)
  form.title = e.title || ''
  form.notes = e.notes
}

watch(wpisId, (id) => {
  if (!id) {
    form.session_date = planSessionFromQuery.value || new Date().toISOString().slice(0, 10)
    if (planTitleFromQuery.value) {
      form.title = `Plan: ${planTitleFromQuery.value}`
      form.notes = `<p><strong>Powiązanie z planem</strong> (${planIdFromQuery.value || '—'}).</p><p></p>`
    } else {
      form.title = ''
      form.notes = '<p></p>'
    }
    return
  }
  applyEntryToForm(id)
}, { immediate: true })

const pageTitle = computed(() => (wpisId.value ? 'Edycja wpisu' : 'Nowy wpis'))

async function save() {
  if (!athleteId.value) {
    return
  }
  const notes = sanitizeRichHtml(form.notes.trim())
  if (!stripHtmlTags(notes)) {
    toast.add({ title: 'Uzupełnij treść wpisu', color: 'warning' })
    return
  }

  saving.value = true
  try {
    if (wpisId.value) {
      await apiFetch(`/api/athletes/${athleteId.value}/training-log/${wpisId.value}`, {
        method: 'PATCH',
        body: {
          session_date: form.session_date,
          title: form.title.trim(),
          notes
        }
      })
      toast.add({ title: 'Zapisano', color: 'success' })
    } else {
      await apiFetch(`/api/athletes/${athleteId.value}/training-log`, {
        method: 'POST',
        body: {
          session_date: form.session_date,
          title: form.title.trim() || undefined,
          notes
        }
      })
      toast.add({ title: 'Dodano wpis', color: 'success' })
    }
    await navigateTo(diaryListPath.value)
  } catch (e) {
    toast.add({
      title: 'Błąd zapisu',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function cancel() {
  void navigateTo(diaryListPath.value)
}

useSeoMeta({
  title: 'Dziennik — redakcja wpisu',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <div class="slavia-diary-compose flex flex-col bg-background">
    <header class="slavia-diary-compose__header sticky top-0 z-50 border-b border-default/60">
      <div class="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div class="min-w-0">
          <p class="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
            Dziennik · {{ athleteName }}
          </p>
          <h1 class="slavia-display truncate text-lg font-black text-highlighted sm:text-xl">
            {{ pageTitle }}
          </h1>
        </div>
        <div class="flex flex-wrap gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide-x"
            @click="cancel"
          >
            Zamknij
          </UButton>
          <UButton
            v-if="previewOpen"
            color="primary"
            variant="soft"
            size="sm"
            icon="i-lucide-pencil"
            @click="previewOpen = false"
          >
            Edycja
          </UButton>
          <UButton
            v-else
            color="neutral"
            variant="outline"
            size="sm"
            icon="i-lucide-eye"
            @click="previewOpen = true"
          >
            Podgląd
          </UButton>
          <UButton
            size="sm"
            :loading="saving"
            icon="i-lucide-save"
            @click="save"
          >
            Zapisz
          </UButton>
        </div>
      </div>
    </header>

    <main class="slavia-diary-compose__main flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div
        v-if="loading"
        class="flex justify-center py-16 text-muted"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="size-8 animate-spin"
        />
      </div>
      <div
        v-else
        class="mx-auto max-w-3xl space-y-6"
      >
        <UCard
          v-if="previewOpen"
          class="slavia-section-card overflow-hidden rounded-2xl ring-1 ring-primary/15"
        >
          <template #header>
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Podgląd wpisu
                </p>
                <p class="mt-1 text-sm text-muted">
                  {{ form.session_date }} · {{ form.title.trim() || 'bez tematu' }}
                </p>
              </div>
              <UButton
                color="primary"
                variant="soft"
                size="sm"
                icon="i-lucide-pencil"
                @click="previewOpen = false"
              >
                Wróć do edycji
              </UButton>
            </div>
          </template>
          <div class="p-4 sm:p-6">
            <!-- eslint-disable vue/no-v-html — sanitizeRichHtml (DOMPurify) -->
            <div
              class="slavia-rich-content prose prose-lg prose-neutral max-w-none leading-relaxed dark:prose-invert"
              v-html="sanitizedNotesPreview"
            />
            <!-- eslint-enable vue/no-v-html -->
          </div>
        </UCard>

        <template v-else>
          <div class="slavia-section-card grid gap-5 p-4 sm:grid-cols-2 sm:p-5">
            <UFormField
              label="Data jednostki"
              required
            >
              <UInput
                v-model="form.session_date"
                type="date"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Temat (opcjonalnie)">
              <UInput
                v-model="form.title"
                placeholder="np. Technika rwania"
                size="lg"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField
            label="Treść / obciążenia / uwagi"
            description="Pełny edytor — jak na osobnej stronie dokumentu."
            required
          >
            <ClubRichTextEditor
              v-model="form.notes"
              placeholder="Opisz przebieg treningu…"
              min-height="min(72vh, 620px)"
              class="w-full"
            />
          </UFormField>
        </template>
      </div>
    </main>
  </div>
</template>
