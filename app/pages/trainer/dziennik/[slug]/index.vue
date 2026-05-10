<script setup lang="ts">
import type { Athlete, TrainingLogEntry } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'
import { isProbablyRichHtml } from '~/utils/html'
import { sanitizeRichHtml } from '~/utils/sanitizeHtml'
import { parseSlugId } from '~/utils/slug'

definePageMeta({ middleware: 'trainer' })

const route = useRoute()
const apiFetch = useApi()
const toast = useToast()

const slugSegment = computed(() => String(route.params.slug || ''))
const athleteId = computed(() => parseSlugId(slugSegment.value))
const activeTab = ref('history')

useSeoMeta({
  title: 'Dziennik treningów — trener',
  robots: 'noindex, nofollow'
})

const { data: athletes } = await useAsyncData(
  'trainer-diary-detail-athletes',
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
      title: 'Nie udało się wczytać dziennika',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

watch(athleteId, () => loadEntries(), { immediate: true })

const redagujBase = computed(() => `/trainer/dziennik/${slugSegment.value}/redaguj`)

async function removeEntry(e: TrainingLogEntry) {
  if (!confirm(`Usunąć wpis z dnia ${e.session_date.slice(0, 10)}?`)) {
    return
  }
  try {
    await apiFetch(`/api/athletes/${athleteId.value}/training-log/${e.id}`, { method: 'DELETE' })
    toast.add({ title: 'Usunięto', color: 'success' })
    await loadEntries()
  } catch (err) {
    toast.add({
      title: 'Nie udało się usunąć',
      description: getApiErrorMessage(err),
      color: 'error'
    })
  }
}
</script>

<template>
  <UContainer class="animate-page-in py-8 md:py-14 lg:py-16">
    <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-primary">
          Dziennik treningów
        </p>
        <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
          {{ athleteName }}
        </h1>
        <p class="mt-2 text-sm text-muted">
          Zawodnik widzi te wpisy u siebie i może dopisywać własne jednostki.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          :to="redagujBase"
          color="primary"
          icon="i-lucide-plus"
        >
          Nowy wpis (pełny ekran)
        </UButton>
        <UButton
          to="/trainer/dziennik"
          variant="soft"
          color="neutral"
          icon="i-lucide-users"
        >
          Inny zawodnik
        </UButton>
        <UButton
          to="/trainer"
          variant="ghost"
          color="neutral"
          icon="i-lucide-arrow-left"
        >
          Panel trenera
        </UButton>
      </div>
    </div>

    <div class="mb-6 flex gap-1 rounded-xl bg-default/10 p-1">
      <button 
        class="flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-all"
        :class="activeTab === 'history' ? 'bg-card text-primary shadow-sm' : 'text-muted hover:text-highlighted'"
        @click="activeTab = 'history'"
      >
        Historia wpisów
      </button>
      <button 
        class="flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-all"
        :class="activeTab === 'comparison' ? 'bg-card text-primary shadow-sm' : 'text-muted hover:text-highlighted'"
        @click="activeTab = 'comparison'"
      >
        Porównaj z planem
      </button>
    </div>

    <div v-if="activeTab === 'comparison'">
      <TrainerTrainingComparison :athlete-id="athleteId" />
    </div>

    <template v-else>
      <h2 class="mb-4 text-xl font-bold text-highlighted">
        Historia wpisów
      </h2>

    <div
      v-if="loading"
      class="flex items-center gap-2 py-12 text-muted"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-6 animate-spin"
      />
      Wczytywanie…
    </div>

    <div
      v-else-if="entries.length === 0"
      class="rounded-xl border border-dashed border-default py-14 text-center text-muted"
    >
      Brak wpisów —
      <NuxtLink
        :to="redagujBase"
        class="font-medium text-primary underline underline-offset-2"
      >
        dodaj pierwszą jednostkę
      </NuxtLink>
      .
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <UCard
        v-for="e in entries"
        :key="e.id"
        class="overflow-hidden"
      >
        <div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div class="min-w-0 flex-1 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                color="primary"
                variant="subtle"
              >
                {{ e.session_date.slice(0, 10) }}
              </UBadge>
              <span
                v-if="e.title"
                class="font-semibold text-highlighted"
              >{{ e.title }}</span>
            </div>
            <!-- eslint-disable-next-line vue/no-v-html — treść po DOMPurify -->
            <div v-if="isProbablyRichHtml(e.notes)" class="slavia-rich-content text-sm leading-relaxed text-highlighted" v-html="sanitizeRichHtml(e.notes)" />
            <p
              v-else
              class="text-sm text-highlighted whitespace-pre-wrap leading-relaxed"
            >
              {{ e.notes }}
            </p>
            <p class="text-[11px] text-muted">
              <span v-if="e.author_username">Dodał: {{ e.author_username }}</span>
              <span v-if="e.created_at"> · {{ e.created_at.slice(0, 16).replace('T', ' ') }}</span>
            </p>
          </div>
          <div class="flex shrink-0 gap-1 sm:flex-col">
            <UButton
              size="xs"
              variant="soft"
              icon="i-lucide-pencil"
              :to="{ path: redagujBase, query: { wpis: e.id } }"
            >
              Edytuj
            </UButton>
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click="removeEntry(e)"
            >
              Usuń
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
    </template>
  </UContainer>
</template>
