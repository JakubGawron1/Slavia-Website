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
    e.name.toLowerCase().includes(q) || 
    (e.category && e.category.toLowerCase().includes(q))
  )
})

const categories = computed(() => {
  const set = new Set(exercises.value.map(e => e.category).filter(Boolean))
  return Array.from(set) as string[]
})

onMounted(() => loadExercises())
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Premium Header -->
    <div class="relative overflow-hidden bg-background pt-12 pb-16 lg:pt-20 lg:pb-24">
      <div class="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div class="absolute -top-24 -left-24 size-96 rounded-full bg-primary/30 blur-3xl" />
        <div class="absolute top-1/2 -right-24 size-80 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      <UContainer class="relative z-10">
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div class="max-w-2xl animate-page-in">
            <p class="text-xs font-bold uppercase tracking-widest text-primary mb-3">Zarządzanie wiedzą</p>
            <h1 class="text-4xl lg:text-5xl font-black tracking-tight text-highlighted leading-tight">
              Słownik <span class="text-primary italic">Ćwiczeń</span>
            </h1>
            <p class="mt-4 text-lg text-muted leading-relaxed">
              Twoja własna baza wiedzy technicznej. Standardowe ćwiczenia, które możesz błyskawicznie wybierać podczas tworzenia planów treningowych.
            </p>
          </div>
          
          <div class="flex items-center gap-3 animate-page-in [animation-delay:100ms]">
            <UButton 
              size="xl" 
              icon="i-lucide-plus" 
              class="rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              @click="showAddModal = true"
            >
              Dodaj ćwiczenie
            </UButton>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="mt-12 flex flex-col gap-6 animate-page-in [animation-delay:200ms]">
          <div class="relative w-full max-w-3xl">
            <UInput 
              v-model="searchQuery" 
              icon="i-lucide-search" 
              size="xl" 
              placeholder="Szukaj ćwiczenia lub kategorii..." 
              class="w-full bg-card/50 backdrop-blur-sm shadow-inner"
              variant="outline"
            />
          </div>
          
          <div class="flex flex-wrap gap-2">
            <p class="w-full text-[10px] font-black text-muted uppercase tracking-widest mb-1">Filtruj po kategorii:</p>
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
              class="whitespace-nowrap rounded-full px-4 transition-all"
              @click="searchQuery = cat"
            >
              {{ cat }}
            </UButton>
          </div>
        </div>
      </UContainer>
    </div>

    <UContainer class="mt-8">
      <!-- Loading State -->
      <div v-if="loading" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="n in 6" :key="n" class="h-48 rounded-3xl bg-card animate-pulse" />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredExercises.length === 0" class="flex flex-col items-center justify-center py-20 animate-page-in">
        <div class="p-6 rounded-full bg-primary/5 mb-6">
          <UIcon name="i-lucide-library" class="size-16 text-primary/40" />
        </div>
        <h3 class="text-xl font-bold text-highlighted">Nie znaleziono ćwiczeń</h3>
        <p class="mt-2 text-muted max-w-sm text-center">Dodaj swoje pierwsze ćwiczenie do bazy lub zmień kryteria wyszukiwania.</p>
        <UButton v-if="!searchQuery" variant="soft" color="primary" class="mt-6" @click="showAddModal = true">Dodaj pierwsze ćwiczenie</UButton>
        <UButton v-else variant="ghost" color="neutral" class="mt-2" @click="searchQuery = ''">Wyczyść wyszukiwanie</UButton>
      </div>

      <!-- Grid -->
      <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-page-in [animation-delay:300ms]">
        <div 
          v-for="e in filteredExercises" 
          :key="e.id" 
          class="group relative flex flex-col justify-between rounded-3xl border border-default bg-card p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
        >
          <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <UButton 
              icon="i-lucide-trash-2" 
              variant="ghost" 
              color="error" 
              size="xs" 
              @click="deleteExercise(e.id)"
            />
          </div>

          <div>
            <div class="flex items-center gap-2 mb-4">
              <span v-if="e.category" class="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                {{ e.category }}
              </span>
              <span v-else class="px-2.5 py-0.5 rounded-full bg-muted text-muted text-[10px] font-black uppercase tracking-wider">
                Ogólne
              </span>
            </div>

            <h3 class="text-xl font-black text-highlighted group-hover:text-primary transition-colors">{{ e.name }}</h3>
            
            <p v-if="e.description" class="mt-3 text-sm text-muted line-clamp-3 leading-relaxed">
              {{ e.description }}
            </p>
          </div>

          <div class="mt-6 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UButton 
                v-if="e.video_url" 
                :to="e.video_url" 
                target="_blank"
                size="xs" 
                icon="i-lucide-play-circle" 
                variant="soft" 
                color="primary"
                class="rounded-full"
              >
                Wideo
              </UButton>
            </div>
            <div class="text-[10px] text-muted font-medium">
              Dodano {{ new Date(e.created_at).toLocaleDateString() }}
            </div>
          </div>
        </div>
      </div>
    </UContainer>

    <!-- Modal (Correct for Nuxt UI v4) -->
    <UModal 
      v-model:open="showAddModal" 
      title="Dodaj nowe ćwiczenie"
      :ui="{ content: 'rounded-[2rem] sm:max-w-2xl' }"
    >
      <template #body>
        <div class="space-y-5 py-2">
          <div class="mb-2">
            <p class="text-sm text-muted">Uzupełnij dane techniczne dla nowego wpisu w słowniku.</p>
          </div>

          <UFormField label="Nazwa ćwiczenia" help="Pełna nazwa techniczna">
            <UInput v-model="form.name" placeholder="np. Rwanie olimpijskie" size="xl" icon="i-lucide-dumbbell" class="font-bold" />
          </UFormField>
          
          <UFormField label="Kategoria" help="Pomaga w filtrowaniu listy">
            <UInput v-model="form.category" placeholder="np. Dwubój, Akcesoria, Core" size="lg" icon="i-lucide-tag" />
          </UFormField>

          <UFormField label="Opis i wskazówki">
            <UTextarea v-model="form.description" placeholder="Skoncentruj się na fazie pierwszej..." size="lg" :rows="4" />
          </UFormField>

          <UFormField label="Link do filmu" help="Link do YouTube, Vimeo lub Instagrama">
            <UInput v-model="form.video_url" placeholder="https://youtube.com/..." size="lg" icon="i-lucide-video" />
          </UFormField>

          <div class="mt-8 flex flex-col sm:flex-row gap-3 pt-6 border-t border-default/50">
            <UButton 
              class="flex-1 justify-center rounded-2xl py-4 font-black" 
              size="xl" 
              color="primary" 
              @click="addExercise"
            >
              Zapisz w słowniku
            </UButton>
            <UButton 
              variant="soft" 
              color="neutral" 
              class="rounded-2xl py-4 px-8 font-bold" 
              size="xl" 
              @click="showAddModal = false"
            >
              Anuluj
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
