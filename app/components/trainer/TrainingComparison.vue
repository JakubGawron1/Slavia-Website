<script setup lang="ts">
import type { TrainingPlan, TrainingPlanItem, TrainingLogEntry } from '~/types/models'
import { apiRoutes } from '~/config/api'
import {
  TRAINING_PLAN_DAYS,
  dateForPlanSlot,
  filterPlanItems,
  planDurationWeeks,
  weekLabels
} from '~/utils/trainingPlanSchedule'

const props = defineProps<{
  athleteId: string
}>()

const apiFetch = useApi()

const plans = ref<TrainingPlan[]>([])
const selectedPlanId = ref<string | undefined>(undefined)
const planItems = ref<TrainingPlanItem[]>([])
const logs = ref<TrainingLogEntry[]>([])
const loading = ref(false)
const activeWeekNumber = ref(1)

async function loadPlans() {
  plans.value = await apiFetch<TrainingPlan[]>(apiRoutes.trainingPlans.athlete(props.athleteId)).catch(() => [])
  if (plans.value.length > 0) {
    selectedPlanId.value = plans.value[0]?.id
  }
}

async function loadComparison() {
  if (!selectedPlanId.value) return
  loading.value = true
  try {
    const plan = plans.value.find(p => p.id === selectedPlanId.value)
    const [items, allLogs] = await Promise.all([
      apiFetch<TrainingPlanItem[]>(apiRoutes.trainingPlans.items(selectedPlanId.value)).catch(() => []),
      apiFetch<TrainingLogEntry[]>(`/api/athletes/${props.athleteId}/training-log`).catch(() => [])
    ])
    
    planItems.value = items
    
    if (plan) {
      const start = new Date(`${plan.week_start.slice(0, 10)}T00:00:00`)
      const end = new Date(start)
      end.setDate(end.getDate() + planDurationWeeks(plan) * 7)

      logs.value = allLogs.filter((l) => {
        const d = new Date(`${l.session_date.slice(0, 10)}T00:00:00`)
        return d >= start && d < end
      })
      activeWeekNumber.value = 1
    }
  } finally {
    loading.value = false
  }
}

watch(selectedPlanId, () => loadComparison())

onMounted(() => {
  loadPlans()
})

const days = TRAINING_PLAN_DAYS.map(d => ({ ...d, icon: 'i-lucide-calendar' }))

const selectedPlan = computed(() => plans.value.find(p => p.id === selectedPlanId.value) ?? null)
const durationWeeks = computed(() => selectedPlan.value ? planDurationWeeks(selectedPlan.value) : 1)

function getItemsForDay(dayId: number) {
  return filterPlanItems(planItems.value, activeWeekNumber.value, dayId)
}

function getLogsForDay(dayId: number) {
  const plan = selectedPlan.value
  if (!plan) return []
  const targetStr = dateForPlanSlot(plan, activeWeekNumber.value, dayId)
  if (!targetStr) return []
  return logs.value.filter(l => l.session_date.startsWith(targetStr))
}
</script>

<template>
  <div class="space-y-8 animate-page-in">
    <!-- Selection Bar -->
    <div class="group relative rounded-3xl border border-default bg-card/50 backdrop-blur-md p-5 lg:p-6 shadow-xl shadow-primary/5 transition-all hover:bg-card">
      <div class="flex flex-col md:flex-row md:items-end gap-4 lg:gap-6">
        <div class="flex-1">
          <label class="block text-[10px] font-black text-primary uppercase tracking-widest mb-2 ml-1">Wybierz tydzień treningowy</label>
          <USelect
            v-model="selectedPlanId"
            :items="plans.map(p => ({ label: `${p.title} (od ${p.week_start})`, value: p.id }))"
            placeholder="Brak dostępnych planów"
            class="w-full font-bold"
            size="xl"
            icon="i-lucide-calendar-days"
          />
        </div>
        <UButton 
          icon="i-lucide-refresh-cw" 
          variant="soft" 
          color="primary" 
          size="xl" 
          class="rounded-2xl"
          :loading="loading"
          @click="loadComparison" 
        >
          Odśwież dane
        </UButton>
      </div>
    </div>

    <!-- Comparison Grid -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-24 gap-4 text-muted animate-pulse">
      <UIcon name="i-lucide-loader-2" class="size-12 animate-spin text-primary" />
      <p class="font-bold uppercase tracking-widest text-xs">Analiza danych...</p>
    </div>

    <div v-else-if="!selectedPlanId" class="flex flex-col items-center justify-center py-20 bg-default/5 rounded-3xl border-2 border-dashed border-default">
      <UIcon name="i-lucide-clipboard-x" class="size-16 text-muted/30 mb-4" />
      <h3 class="text-xl font-bold text-highlighted">Brak planów do porównania</h3>
      <p class="text-sm text-muted mt-1">Stwórz najpierw plan dla tego zawodnika w sekcji "Plany".</p>
    </div>

    <div v-else class="space-y-12">
      <div
        v-if="durationWeeks > 1"
        class="rounded-3xl border border-default bg-card/40 p-4"
      >
        <div class="flex flex-wrap gap-2">
          <button
            v-for="w in weekLabels(durationWeeks)"
            :key="w.id"
            type="button"
            class="inline-flex items-center rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors"
            :class="activeWeekNumber === w.id
              ? 'border-primary/35 bg-primary/10 text-primary'
              : 'border-default/70 text-muted hover:bg-muted/15'"
            @click="activeWeekNumber = w.id"
          >
            {{ w.label }}
          </button>
        </div>
      </div>

      <div 
        v-for="(day, dIdx) in days" 
        :key="day.id" 
        class="relative animate-page-in"
        :style="{ animationDelay: `${dIdx * 80}ms` }"
      >
        <!-- Day Section Header -->
        <div class="flex items-center gap-4 mb-6">
          <div class="size-12 rounded-2xl bg-highlighted flex items-center justify-center text-background shadow-lg">
            <UIcon :name="day.icon" class="size-7" />
          </div>
          <div>
            <h3 class="text-2xl font-black text-highlighted tracking-tight uppercase">{{ day.name }}</h3>
            <p class="text-xs font-bold text-muted uppercase tracking-widest">Zestawienie jednostki</p>
          </div>
          <div class="flex-1 border-b-2 border-default/40 border-dotted ml-2" />
        </div>

        <div class="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          <!-- PLAN (LEFT) -->
          <div class="group relative rounded-[2.5rem] border-2 border-default bg-card/30 p-6 lg:p-8 transition-all hover:bg-card/50">
            <div class="absolute -top-4 left-8 px-4 py-1.5 rounded-full bg-primary text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
              Wytyczne Trenera
            </div>
            
            <div class="space-y-4 pt-2">
              <div 
                v-for="item in getItemsForDay(day.id)" 
                :key="item.id" 
                class="relative p-5 rounded-3xl bg-card border border-default/60 shadow-sm transition-all group-hover:border-primary/20"
              >
                <div class="flex justify-between items-start gap-4">
                  <div class="flex-1">
                    <h4 class="text-lg font-black text-highlighted leading-tight mb-1">{{ item.exercise_name || item.custom_exercise_name }}</h4>
                    <div class="flex flex-wrap items-center gap-3">
                      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-bold">
                        <UIcon name="i-lucide-layers" class="size-3.5" />
                        {{ item.sets }} x {{ item.reps }}
                      </div>
                      <div v-if="item.weight_kg" class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/5 text-blue-600 text-xs font-bold">
                        <UIcon name="i-lucide-dumbbell" class="size-3.5" />
                        {{ item.weight_kg }}kg
                      </div>
                      <div v-if="item.intensity_percent" class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/5 text-purple-600 text-xs font-bold">
                        <UIcon name="i-lucide-gauge" class="size-3.5" />
                        {{ item.intensity_percent }}%
                      </div>
                    </div>
                  </div>
                </div>
                <p v-if="item.notes" class="mt-3 text-xs italic text-muted border-l-2 border-primary/20 pl-3 leading-relaxed">
                  {{ item.notes }}
                </p>
              </div>
              
              <div v-if="getItemsForDay(day.id).length === 0" class="flex flex-col items-center justify-center py-10 text-muted/40 gap-2">
                <UIcon name="i-lucide-coffee" class="size-8" />
                <span class="text-[10px] font-black uppercase tracking-widest">Dzień odpoczynku</span>
              </div>
            </div>
          </div>

          <!-- LOGS (RIGHT) -->
          <div class="group relative rounded-[2.5rem] border-2 border-primary/20 bg-primary/5 p-6 lg:p-8 transition-all hover:bg-primary/10">
            <div class="absolute -top-4 left-8 px-4 py-1.5 rounded-full bg-highlighted text-[10px] font-black text-background uppercase tracking-widest shadow-lg">
              Realizacja Zawodnika
            </div>

            <div class="space-y-4 pt-2">
              <div 
                v-for="log in getLogsForDay(day.id)" 
                :key="log.id" 
                class="p-5 rounded-3xl bg-card border border-primary/20 shadow-sm transition-all group-hover:border-primary/40"
              >
                <div class="flex items-center gap-2 mb-3">
                  <div class="size-2 rounded-full bg-primary animate-pulse" />
                  <h4 class="text-lg font-black text-primary leading-tight">{{ log.title || 'Sesja treningowa' }}</h4>
                </div>
                
                <div class="text-sm text-highlighted whitespace-pre-wrap leading-relaxed border-l-2 border-primary/40 pl-4 py-1">
                  {{ log.notes }}
                </div>
                
                <div v-if="log.created_at" class="mt-4 text-[10px] text-muted font-bold uppercase tracking-tighter text-right">
                  Zapisano: {{ new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                </div>
              </div>

              <div v-if="getLogsForDay(day.id).length === 0" class="flex flex-col items-center justify-center py-10 text-primary/30 gap-2">
                <UIcon name="i-lucide-eye-off" class="size-8" />
                <span class="text-[10px] font-black uppercase tracking-widest">Brak wpisów w dzienniku</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
