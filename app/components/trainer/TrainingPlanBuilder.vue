<script setup lang="ts">
import type { Exercise, TrainingPlanItem } from '~/types/models'
import { apiRoutes } from '~/config/api'

const props = defineProps<{
  planId: string
}>()

const apiFetch = useApi()
const toast = useToast()

type EditableTrainingPlanItem = Omit<
  TrainingPlanItem,
  'exercise_id' | 'custom_exercise_name' | 'sets' | 'reps' | 'intensity_percent' | 'weight_kg' | 'notes'
> & {
  exercise_id?: string
  custom_exercise_name: string
  sets?: number
  reps?: number
  intensity_percent?: number
  weight_kg?: number
  notes: string
}

const items = ref<EditableTrainingPlanItem[]>([])
const exercises = ref<Exercise[]>([])
const loading = ref(false)
const saving = ref(false)
const editingIds = ref(new Set<string>())

function isEditing(id: string) {
  return editingIds.value.has(id)
}

function toggleEdit(id: string) {
  const next = new Set(editingIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  editingIds.value = next
}

const days = [
  { id: 1, name: 'Poniedziałek', icon: 'i-lucide-calendar-1' },
  { id: 2, name: 'Wtorek', icon: 'i-lucide-calendar-2' },
  { id: 3, name: 'Środa', icon: 'i-lucide-calendar-3' },
  { id: 4, name: 'Czwartek', icon: 'i-lucide-calendar-4' },
  { id: 5, name: 'Piątek', icon: 'i-lucide-calendar-5' },
  { id: 6, name: 'Sobota', icon: 'i-lucide-calendar-6' },
  { id: 7, name: 'Niedziela', icon: 'i-lucide-calendar-7' }
]

async function loadData() {
  loading.value = true
  try {
    const [fetchedItems, fetchedExercises] = await Promise.all([
      apiFetch<TrainingPlanItem[]>(apiRoutes.trainingPlans.items(props.planId)).catch(() => []),
      apiFetch<Exercise[]>(apiRoutes.exercises.list).catch(() => [])
    ])
    // Nuxt UI inputy nie lubią `null` w v-model; normalizujemy na `undefined` / ''.
    items.value = (fetchedItems || []).map(i => ({
      ...i,
      exercise_id: i.exercise_id ?? undefined,
      custom_exercise_name: i.custom_exercise_name ?? '',
      sets: i.sets ?? undefined,
      reps: i.reps ?? undefined,
      intensity_percent: i.intensity_percent ?? undefined,
      weight_kg: i.weight_kg ?? undefined,
      notes: i.notes ?? ''
    })) as EditableTrainingPlanItem[]
    exercises.value = fetchedExercises
    editingIds.value = new Set()
  } finally {
    loading.value = false
  }
}

function addItem(dayId: number) {
  const dayItems = items.value.filter(i => i.day_of_week === dayId)
  const id = `temp-${Date.now()}`
  const newItem: EditableTrainingPlanItem = {
    id,
    plan_id: props.planId,
    day_of_week: dayId,
    exercise_id: undefined,
    custom_exercise_name: '',
    sets: 3,
    reps: 5,
    intensity_percent: undefined,
    weight_kg: undefined,
    notes: '',
    sort_order: dayItems.length,
    exercise_name: null
  }
  items.value.push(newItem)
  const next = new Set(editingIds.value)
  next.add(id)
  editingIds.value = next
}

function removeItem(id: string) {
  items.value = items.value.filter(i => i.id !== id)
  const next = new Set(editingIds.value)
  next.delete(id)
  editingIds.value = next
}

function moveItem(id: string, direction: 'up' | 'down') {
  const index = items.value.findIndex(i => i.id === id)
  if (index === -1) return
  const item = items.value[index]!
  const sameDay = items.value.filter(i => i.day_of_week === item.day_of_week).sort((a, b) => a.sort_order - b.sort_order)
  const currentIdxInDay = sameDay.findIndex(i => i.id === id)
  
  if (direction === 'up' && currentIdxInDay > 0) {
    const prev = sameDay[currentIdxInDay - 1]
    if (!prev) return
    const temp = prev.sort_order
    prev.sort_order = item.sort_order
    item.sort_order = temp
  } else if (direction === 'down' && currentIdxInDay < sameDay.length - 1) {
    const next = sameDay[currentIdxInDay + 1]
    if (!next) return
    const temp = next.sort_order
    next.sort_order = item.sort_order
    item.sort_order = temp
  }
}

async function saveItems() {
  saving.value = true
  try {
    await apiFetch(apiRoutes.trainingPlans.items(props.planId), {
      method: 'PUT',
      body: {
        items: items.value.map(i => ({
          day_of_week: i.day_of_week,
          exercise_id: i.exercise_id,
          custom_exercise_name: i.custom_exercise_name,
          sets: i.sets,
          reps: i.reps,
          intensity_percent: i.intensity_percent,
          weight_kg: i.weight_kg,
          notes: i.notes,
          sort_order: i.sort_order
        }))
      }
    })
    toast.add({ title: 'Plan treningowy został zaktualizowany', color: 'success' })
    editingIds.value = new Set()
    await loadData()
  } catch (e) {
    toast.add({ title: 'Błąd zapisu', description: String(e), color: 'error' })
  } finally {
    saving.value = false
  }
}

function getItemsForDay(dayId: number) {
  return items.value.filter(i => i.day_of_week === dayId).sort((a, b) => a.sort_order - b.sort_order)
}

onMounted(() => {
  loadData()
})

const exerciseOptions = computed(() => {
  return [
    { label: '-- Własna nazwa --', value: null },
    ...exercises.value.map(e => ({ label: e.name, value: e.id }))
  ]
})
</script>

<template>
  <div class="space-y-8 pb-10">
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4 text-muted animate-pulse">
      <UIcon name="i-lucide-loader-2" class="size-10 animate-spin text-primary" />
      <p class="font-medium">Wczytywanie struktury planu...</p>
    </div>
    
    <template v-else>
      <div 
        v-for="(day, dIdx) in days" 
        :key="day.id" 
        class="animate-page-in"
        :style="{ animationDelay: `${dIdx * 50}ms` }"
      >
        <div class="group relative rounded-3xl border border-default bg-card/40 backdrop-blur-sm overflow-hidden transition-all hover:bg-card/60">
          <!-- Day Header -->
          <div class="flex items-center justify-between p-4 lg:px-6 lg:py-5 border-b border-default/50">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <UIcon :name="day.icon || 'i-lucide-calendar'" class="size-6" />
              </div>
              <h3 class="text-xl font-black text-highlighted tracking-tight">{{ day.name }}</h3>
            </div>
            
            <UButton 
              size="sm" 
              icon="i-lucide-plus" 
              variant="soft" 
              color="primary"
              class="rounded-full px-4 font-bold"
              @click="addItem(day.id)"
            >
              Dodaj ćwiczenie
            </UButton>
          </div>

          <!-- Items List -->
          <div class="p-4 lg:p-6 space-y-4">
            <TransitionGroup 
              name="list" 
              tag="div" 
              class="space-y-4"
            >
              <div 
                v-for="(item, idx) in getItemsForDay(day.id)" 
                :key="item.id" 
                class="group/row relative flex flex-col gap-4 rounded-2xl border border-default bg-card p-4 shadow-sm transition-all hover:border-primary/30 sm:flex-row sm:items-center sm:p-5"
              >
                <!-- Reorder Controls (Always Visible) -->
                <div class="flex items-center justify-between sm:flex-col sm:justify-center gap-1 shrink-0">
                  <UButton 
                    size="xs" 
                    variant="ghost" 
                    icon="i-lucide-chevron-up" 
                    :disabled="idx === 0"
                    class="rounded-lg"
                    @click="moveItem(item.id, 'up')"
                  />
                  <span class="text-[10px] font-black text-muted sm:hidden">POZYCJA {{ idx + 1 }}</span>
                  <UButton 
                    size="xs" 
                    variant="ghost" 
                    icon="i-lucide-chevron-down" 
                    :disabled="idx === getItemsForDay(day.id).length - 1"
                    class="rounded-lg"
                    @click="moveItem(item.id, 'down')"
                  />
                </div>

                <!-- PREVIEW MODE -->
                <div v-if="!isEditing(item.id)" class="flex-1 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div class="flex-1">
                    <h4 class="text-lg font-black text-highlighted leading-tight">
                      {{ item.exercise_id ? (exercises.find(e => e.id === item.exercise_id)?.name || 'Nieznane ćwiczenie') : (item.custom_exercise_name || 'Bez nazwy') }}
                    </h4>
                    <div class="flex flex-wrap items-center gap-3 mt-1">
                      <span class="text-xs font-bold text-primary">{{ item.sets }} x {{ item.reps }}</span>
                      <span v-if="item.weight_kg" class="text-xs font-bold text-blue-500">{{ item.weight_kg }}kg</span>
                      <span v-if="item.intensity_percent" class="text-xs font-bold text-purple-500">@ {{ item.intensity_percent }}%</span>
                      <span v-if="item.notes" class="text-[10px] italic text-muted border-l border-default pl-2 ml-1">{{ item.notes }}</span>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <UButton 
                      size="sm" 
                      variant="soft" 
                      color="neutral" 
                      icon="i-lucide-pencil" 
                      class="rounded-xl opacity-0 group-hover/row:opacity-100 transition-opacity"
                      @click="toggleEdit(item.id)"
                    >
                      Edytuj
                    </UButton>
                    <UButton 
                      size="sm" 
                      icon="i-lucide-trash-2" 
                      color="error" 
                      variant="ghost" 
                      class="rounded-xl opacity-0 group-hover/row:opacity-100 transition-opacity"
                      @click="removeItem(item.id)"
                    />
                  </div>
                </div>

                <!-- EDIT MODE -->
                <template v-else>
                  <!-- Exercise Select -->
                  <div class="flex-1 space-y-2">
                    <USelect
                      v-model="item.exercise_id"
                      :items="exerciseOptions"
                      placeholder="Wybierz ćwiczenie ze słownika"
                      class="w-full font-bold"
                      size="lg"
                    />
                    <UInput 
                      v-if="!item.exercise_id" 
                      v-model="item.custom_exercise_name" 
                      placeholder="Wpisz nazwę własną..." 
                      size="md"
                      variant="soft"
                      class="font-medium"
                    />
                  </div>

                  <!-- Parameters Grid -->
                  <div class="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-4 bg-default/5 p-3 rounded-xl border border-default/50">
                    <div class="flex flex-col gap-1">
                      <span class="text-[9px] font-black text-muted uppercase ml-1">Serie x Powt.</span>
                      <div class="flex items-center gap-1">
                        <UInput v-model.number="item.sets" type="number" placeholder="S" class="w-16" size="sm" />
                        <span class="text-xs font-bold text-muted">×</span>
                        <UInput v-model.number="item.reps" type="number" placeholder="P" class="w-16" size="sm" />
                      </div>
                    </div>
                    
                    <div class="flex flex-col gap-1">
                      <span class="text-[9px] font-black text-muted uppercase ml-1">Ciężar @ Intens.</span>
                      <div class="flex items-center gap-1">
                        <UInput v-model.number="item.weight_kg" type="number" step="0.5" placeholder="kg" class="w-20" size="sm" />
                        <span class="text-xs font-bold text-muted">@</span>
                        <UInput v-model.number="item.intensity_percent" type="number" placeholder="%" class="w-16" size="sm" />
                      </div>
                    </div>
                  </div>

                  <!-- Notes & Save & Delete -->
                  <div class="flex items-center gap-2 pt-2 border-t border-default/30 sm:pt-0 sm:border-0">
                    <UInput 
                      v-model="item.notes" 
                      placeholder="Wskazówki..." 
                      class="flex-1 sm:w-32 lg:w-48" 
                      size="md"
                      variant="ghost"
                      icon="i-lucide-message-square"
                    />
                    <div class="flex items-center gap-1">
                      <UButton 
                        size="md" 
                        icon="i-lucide-check" 
                        color="success" 
                        variant="soft" 
                        class="rounded-xl"
                        @click="toggleEdit(item.id)"
                      />
                      <UButton 
                        size="md" 
                        icon="i-lucide-trash-2" 
                        color="error" 
                        variant="ghost" 
                        class="rounded-xl hover:bg-error/10"
                        @click="removeItem(item.id)"
                      />
                    </div>
                  </div>
                </template>
              </div>
            </TransitionGroup>

            <div v-if="getItemsForDay(day.id).length === 0" class="py-8 text-center flex flex-col items-center gap-2 border-2 border-dashed border-default/40 rounded-2xl">
              <UIcon name="i-lucide-coffee" class="size-8 text-muted/40" />
              <p class="text-xs font-bold text-muted/60 uppercase tracking-widest">Dzień bez zaplanowanych jednostek</p>
              <UButton size="xs" variant="link" color="primary" @click="addItem(day.id)">Zaplanuj trening</UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Action -->
      <div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex animate-page-in [animation-delay:500ms]">
        <div class="p-1.5 rounded-full bg-background/80 backdrop-blur-md border border-default shadow-2xl flex items-center gap-2">
          <p class="px-4 text-xs font-black text-muted uppercase hidden sm:block">Plan tygodniowy</p>
          <UButton 
            size="xl" 
            color="primary" 
            icon="i-lucide-save" 
            class="rounded-full px-8 font-black shadow-lg shadow-primary/30 transition-transform active:scale-95"
            :loading="saving"
            @click="saveItems"
          >
            Zapisz plan treningowy
          </UButton>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.list-move {
  transition: transform 0.4s ease;
}
</style>
