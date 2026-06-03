<script setup lang="ts">
import type { Exercise } from '~/types/models'
import { apiRoutes } from '~/config/api'

definePageMeta({ middleware: 'trainer' })

useSeoMeta({
  title: 'Słownik ćwiczeń — Slavia',
  description: 'Zarządzaj bazą standardowych ćwiczeń wykorzystywanych w planach treningowych Twoich zawodników.'
})

const apiFetch = useApi()
const toast = useToast()

const exercises = ref<Exercise[]>([])
const loading = ref(false)
const showAddModal = ref(false)
const searchQuery = ref('')

const form = reactive({
  name: '',
  category: '',
  description: '',
  video_url: ''
})

async function loadExercises() {
  loading.value = true
  try {
    exercises.value = await apiFetch<Exercise[]>(apiRoutes.exercises.list)
  } finally {
    loading.value = false
  }
}

async function addExercise() {
  if (!form.name.trim()) {
    toast.add({ title: 'Podaj nazwę ćwiczenia', color: 'error' })
    return
  }
  try {
    await apiFetch(apiRoutes.exercises.list, {
      method: 'POST',
      body: form
    })
    toast.add({ title: 'Ćwiczenie dodane pomyślnie', color: 'success' })
    showAddModal.value = false
    Object.assign(form, { name: '', category: '', description: '', video_url: '' })
    loadExercises()
  } catch (e) {
    toast.add({ title: 'Błąd dodawania', description: String(e), color: 'error' })
  }
}

async function deleteExercise(id: string) {
  if (!confirm('Czy na pewno chcesz usunąć to ćwiczenie ze słownika?')) return
  try {
    await apiFetch(apiRoutes.exercises.one(id), { method: 'DELETE' })
    toast.add({ title: 'Usunięto ze słownika', color: 'success' })
    loadExercises()
  } catch (e) {
    toast.add({ title: 'Błąd usuwania', description: String(e), color: 'error' })
  }
}

const filteredExercises = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return exercises.value
  return exercises.value.filter(e =>
    e.name.toLowerCase().includes(q)
    || (e.category && e.category.toLowerCase().includes(q))
  )
})

const categories = computed(() => {
  const set = new Set(exercises.value.map(e => e.category).filter(Boolean))
  return Array.from(set) as string[]
})

onMounted(() => loadExercises())
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader
      area="trainer"
      title="Słownik ćwiczeń"
      icon="i-lucide-library"
      description="Twoja baza wiedzy technicznej — standardowe ćwiczenia do szybkiego wyboru w planach treningowych."
    >
      <template #actions>
        <UButton
          icon="i-lucide-plus"
          color="primary"
          @click="showAddModal = true"
        >
          Dodaj ćwiczenie
        </UButton>
      </template>
    </PanelPageHeader>

    <PanelPageSection
      title="Wyszukiwanie"
      icon="i-lucide-search"
    >
      <div class="slavia-page-card space-y-4 p-4 sm:p-5">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          size="lg"
          placeholder="Szukaj ćwiczenia lub kategorii…"
          class="w-full max-w-3xl"
        />
        <div v-if="categories.length" class="flex flex-wrap gap-2">
          <p class="w-full text-[10px] font-black uppercase tracking-widest text-muted">
            Kategoria
          </p>
          <UButton
            size="sm"
            variant="soft"
            :color="searchQuery === '' ? 'primary' : 'neutral'"
            class="rounded-full px-4"
            @click="searchQuery = ''"
          >
            Wszystkie
          </UButton>
          <UButton
            v-for="cat in categories"
            :key="cat"
            size="sm"
            :variant="searchQuery === cat ? 'solid' : 'soft'"
            :color="searchQuery === cat ? 'primary' : 'neutral'"
            class="rounded-full px-4"
            @click="searchQuery = cat"
          >
            {{ cat }}
          </UButton>
        </div>
      </div>
    </PanelPageSection>

    <PanelPageSection title="Baza ćwiczeń" icon="i-lucide-dumbbell">
      <div
        v-if="loading"
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="h-44 animate-pulse rounded-2xl bg-muted/25"
        />
      </div>

      <PublicEmptyState
        v-else-if="filteredExercises.length === 0"
        icon="i-lucide-library"
        title="Nie znaleziono ćwiczeń"
        description="Dodaj pierwsze ćwiczenie do słownika lub zmień kryteria wyszukiwania."
        compact
      >
        <UButton
          v-if="!searchQuery"
          color="primary"
          variant="soft"
          icon="i-lucide-plus"
          @click="showAddModal = true"
        >
          Dodaj pierwsze ćwiczenie
        </UButton>
        <UButton
          v-else
          variant="ghost"
          color="neutral"
          @click="searchQuery = ''"
        >
          Wyczyść wyszukiwanie
        </UButton>
      </PublicEmptyState>

      <div
        v-else
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <article
          v-for="e in filteredExercises"
          :key="e.id"
          class="slavia-section-card group relative flex flex-col justify-between p-5 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
        >
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            size="xs"
            class="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Usuń ćwiczenie"
            @click="deleteExercise(e.id)"
          />

          <div>
            <UBadge
              v-if="e.category"
              variant="soft"
              color="primary"
              size="xs"
              class="mb-3 uppercase tracking-wider"
            >
              {{ e.category }}
            </UBadge>
            <UBadge
              v-else
              variant="soft"
              color="neutral"
              size="xs"
              class="mb-3 uppercase tracking-wider"
            >
              Ogólne
            </UBadge>

            <h3 class="text-lg font-black text-highlighted transition-colors group-hover:text-primary">
              {{ e.name }}
            </h3>

            <p
              v-if="e.description"
              class="mt-2 line-clamp-3 text-sm leading-relaxed text-muted"
            >
              {{ e.description }}
            </p>
          </div>

          <div class="mt-5 flex items-center justify-between gap-2">
            <UButton
              v-if="e.video_url"
              :to="e.video_url"
              target="_blank"
              size="xs"
              icon="i-lucide-play-circle"
              variant="soft"
              color="primary"
            >
              Wideo
            </UButton>
            <span class="ml-auto text-[10px] font-medium text-muted">
              {{ new Date(e.created_at).toLocaleDateString('pl-PL') }}
            </span>
          </div>
        </article>
      </div>
    </PanelPageSection>

    <SlaviaModal
      v-model:open="showAddModal"
      title="Dodaj nowe ćwiczenie"
      :dismissible="true"
      :ui="{ content: 'rounded-2xl sm:max-w-2xl' }"
    >
      <template #body>
        <div class="space-y-5 py-2">
          <p class="text-sm text-muted">
            Uzupełnij dane techniczne dla nowego wpisu w słowniku.
          </p>

          <UFormField label="Nazwa ćwiczenia" help="Pełna nazwa techniczna">
            <UInput
              v-model="form.name"
              placeholder="np. Rwanie olimpijskie"
              size="lg"
              icon="i-lucide-dumbbell"
            />
          </UFormField>

          <UFormField label="Kategoria" help="Pomaga w filtrowaniu listy">
            <UInput
              v-model="form.category"
              placeholder="np. Dwubój, Akcesoria, Core"
              size="lg"
              icon="i-lucide-tag"
            />
          </UFormField>

          <UFormField label="Opis i wskazówki">
            <UTextarea
              v-model="form.description"
              placeholder="Skoncentruj się na fazie pierwszej…"
              size="lg"
              :rows="4"
            />
          </UFormField>

          <UFormField label="Link do filmu" help="YouTube, Vimeo lub Instagram">
            <UInput
              v-model="form.video_url"
              placeholder="https://youtube.com/…"
              size="lg"
              icon="i-lucide-video"
            />
          </UFormField>

          <div class="flex flex-col gap-3 border-t border-default/50 pt-6 sm:flex-row">
            <UButton
              class="flex-1 justify-center"
              color="primary"
              @click="addExercise"
            >
              Zapisz w słowniku
            </UButton>
            <UButton
              variant="soft"
              color="neutral"
              @click="showAddModal = false"
            >
              Anuluj
            </UButton>
          </div>
        </div>
      </template>
    </SlaviaModal>
  </PanelPageLayout>
</template>
