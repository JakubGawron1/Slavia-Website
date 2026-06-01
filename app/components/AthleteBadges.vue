<script setup lang="ts">
import type { Athlete } from '~/types/models'
import { sinclairTotal } from '~/utils/sinclair'

const props = defineProps<{
  athlete: Athlete
  presentCount?: number
}>()

const auth = useAuth()

interface Badge {
  id: string
  label: string
  icon: string
  color: string
  current: number
  thresholds: number[]
  unit: string
  description: string
}

const sinclairVal = computed(() => {
  if (!props.athlete.total_kg || !props.athlete.bodyweight || !props.athlete.gender) return 0
  return sinclairTotal(
    props.athlete.total_kg,
    props.athlete.bodyweight,
    props.athlete.gender as 'male' | 'female'
  )
})

const badges = computed<Badge[]>(() => [
  {
    id: 'sinclair',
    label: 'Mistrz Sinclaira',
    icon: 'i-lucide-award',
    color: 'amber',
    current: sinclairVal.value || 0,
    thresholds: [100, 200, 300, 400],
    unit: 'pkt',
    description: 'Punkty Sinclair wyliczane na podstawie masy ciała i wyniku w dwuboju.'
  },
  {
    id: 'total',
    label: 'Siła Dwuboju',
    icon: 'i-lucide-dumbbell',
    color: 'primary',
    current: props.athlete.total_kg || 0,
    thresholds: [100, 200, 300, 400],
    unit: 'kg',
    description: 'Suma najlepszego rwania i podrzutu.'
  },
  {
    id: 'snatch',
    label: 'Technika Rwania',
    icon: 'i-lucide-zap',
    color: 'emerald',
    current: props.athlete.best_snatch_kg || 0,
    thresholds: [50, 90, 100, 120, 150],
    unit: 'kg',
    description: 'Twój najlepszy wynik w rwaniu.'
  },
  {
    id: 'cj',
    label: 'Moc Podrzutu',
    icon: 'i-lucide-flame',
    color: 'orange',
    current: props.athlete.best_clean_jerk_kg || 0,
    thresholds: [70, 90, 100, 120, 150, 170, 200],
    unit: 'kg',
    description: 'Twój najlepszy wynik w podrzucie.'
  },
  {
    id: 'trainings',
    label: 'Staż w Klubie',
    icon: 'i-lucide-calendar-days',
    color: 'blue',
    current: props.presentCount || 0,
    thresholds: [10, 50, 100, 250, 500],
    unit: 'sesji',
    description: 'Ilość obecności na treningach zarejestrowana w systemie.'
  }
])

function getLevel(badge: Badge) {
  let level = 0
  for (const t of badge.thresholds) {
    if (badge.current >= t) level++
  }
  return level
}

function getProgress(badge: Badge) {
  const level = getLevel(badge)
  if (level >= badge.thresholds.length) return 100
  const prev = level === 0 ? 0 : badge.thresholds[level - 1]!
  const next = badge.thresholds[level]!
  return Math.min(100, ((badge.current - prev) / (next - prev)) * 100)
}

const colorMap: Record<string, string> = {
  amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  primary: 'text-primary bg-primary/10 border-primary/20',
  emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
}

const isModalOpen = ref(false)
const selectedBadge = ref<Badge | null>(null)

function openBadgeDetails(badge: Badge) {
  selectedBadge.value = badge
  isModalOpen.value = true
}

// ── [2070] Badge-unlock celebration ───────────────────────────────────────────
const BADGE_LS_KEY = 'slavia_badge_levels_v1'

const celebrationOpen = ref(false)
const celebrationBadge = ref<{ label: string; level: number; icon: string } | null>(null)
const confettiActive = ref(false)

function loadStoredLevels(): Record<string, number> {
  if (!import.meta.client) return {}
  try {
    const raw = localStorage.getItem(BADGE_LS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveStoredLevels(levels: Record<string, number>) {
  if (!import.meta.client) return
  try { localStorage.setItem(BADGE_LS_KEY, JSON.stringify(levels)) } catch { /* ignore */ }
}

function achievementsSeenKey(userId: string) {
  return `slavia-achievements-seen-${userId}`
}

function hasSeenAchievementsIntro(userId: string): boolean {
  if (!import.meta.client) return true
  try {
    return localStorage.getItem(achievementsSeenKey(userId)) === '1'
  } catch {
    return true
  }
}

function markAchievementsIntroSeen(userId: string) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(achievementsSeenKey(userId), '1')
  } catch { /* ignore */ }
}

function checkForNewBadges() {
  const userId = auth.user.value?.id
  if (!userId) return

  const stored = loadStoredLevels()
  const hadPriorSnapshot = Object.keys(stored).length > 0
  const current: Record<string, number> = {}
  let firstNew: { label: string; level: number; icon: string } | null = null

  for (const badge of badges.value) {
    const lvl = getLevel(badge)
    current[badge.id] = lvl
    const prev = stored[badge.id] ?? 0
    if (hadPriorSnapshot && lvl > prev && lvl > 0 && !firstNew) {
      firstNew = { label: badge.label, level: lvl, icon: badge.icon }
    }
  }

  saveStoredLevels(current)

  if (!hadPriorSnapshot) {
    markAchievementsIntroSeen(userId)
    return
  }

  if (firstNew) {
    celebrationBadge.value = firstNew
    celebrationOpen.value = true
    confettiActive.value = true
    setTimeout(() => { confettiActive.value = false }, 3500)
    return
  }

  if (!hasSeenAchievementsIntro(userId)) {
    markAchievementsIntroSeen(userId)
  }
}

onMounted(() => {
  setTimeout(checkForNewBadges, 600)
})

watch(celebrationOpen, (open) => {
  if (!open) {
    const userId = auth.user.value?.id
    if (userId) markAchievementsIntroSeen(userId)
  }
})

async function shareBadge() {
  const b = celebrationBadge.value
  if (!b) return
  const text = `Właśnie odblokowałem/am poziom ${b.level} odznaki „${b.label}" w aplikacji CKS Slavia Ruda Śląska! 🏋️`
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Nowa odznaka — CKS Slavia', text, url: window.location.origin })
    } catch { /* user cancelled */ }
  } else {
    try {
      await navigator.clipboard.writeText(text)
      alert('Tekst skopiowany do schowka!')
    } catch { /* ignore */ }
  }
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    <div
      v-for="badge in badges"
      :key="badge.id"
      class="group relative flex cursor-pointer items-center gap-4 rounded-2xl border border-default/60 bg-card/50 p-4 transition-all hover:border-primary/30 hover:bg-card active:scale-[0.98]"
      :class="{ 'opacity-50 grayscale': getLevel(badge) === 0 }"
      @click="openBadgeDetails(badge)"
    >
      <div
        class="relative flex size-12 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-110"
        :class="getLevel(badge) > 0 ? colorMap[badge.color] : 'bg-muted/10 border-default text-muted'"
      >
        <UIcon :name="badge.icon" class="size-6" />
        <!-- Level indicator -->
        <div
          v-if="getLevel(badge) > 0"
          class="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-default text-[10px] font-bold text-highlighted shadow-sm ring-1 ring-default/20"
        >
          {{ getLevel(badge) }}
        </div>
      </div>

      <div class="min-w-0 flex-1 space-y-1">
        <p class="truncate text-xs font-bold uppercase tracking-wider text-muted">
          {{ badge.label }}
        </p>
        <div class="flex items-baseline gap-1.5">
          <span class="text-lg font-black text-highlighted tabular-nums">
            {{ Math.floor(badge.current) }}
          </span>
          <span class="text-[10px] font-bold text-muted uppercase">{{ badge.unit }}</span>
        </div>
        <!-- Progress Bar -->
        <div class="relative h-1 w-full overflow-hidden rounded-full bg-muted/20">
          <div
            class="h-full transition-all duration-700 ease-out"
            :class="getLevel(badge) > 0 ? `bg-${badge.color}-500` : 'bg-muted'"
            :style="{ width: `${getProgress(badge)}%` }"
          />
        </div>
      </div>

      <!-- Hint icon -->
      <UIcon name="i-lucide-info" class="absolute right-3 top-3 size-3 text-muted/30 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>

    <!-- Badge Details Modal -->
    <UModal v-model:open="isModalOpen" :title="selectedBadge?.label || 'Szczegóły odznaki'">
      <template #content>
        <div v-if="selectedBadge" class="space-y-6 p-6">
          <div class="flex items-center gap-5">
            <div
              class="flex size-16 shrink-0 items-center justify-center rounded-2xl border"
              :class="getLevel(selectedBadge) > 0 ? colorMap[selectedBadge.color] : 'bg-muted/10 border-default text-muted'"
            >
              <UIcon :name="selectedBadge.icon" class="size-8" />
            </div>
            <div>
              <h3 class="text-xl font-black text-highlighted">{{ selectedBadge.label }}</h3>
              <p class="text-sm text-muted">{{ selectedBadge.description }}</p>
            </div>
          </div>

          <div class="space-y-3">
            <p class="text-xs font-bold uppercase tracking-widest text-muted">Twoje postępy</p>
            <div class="space-y-2">
              <div
                v-for="(t, idx) in selectedBadge.thresholds"
                :key="t"
                class="flex items-center justify-between rounded-xl border border-default/40 p-3 transition-colors"
                :class="selectedBadge.current >= t ? 'bg-primary/5 border-primary/20' : 'bg-muted/5 opacity-60'"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-6 items-center justify-center rounded-full"
                    :class="selectedBadge.current >= t ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'"
                  >
                    <UIcon :name="selectedBadge.current >= t ? 'i-lucide-check' : 'i-lucide-lock'" class="size-3.5" />
                  </div>
                  <span class="text-sm font-semibold" :class="selectedBadge.current >= t ? 'text-highlighted' : 'text-muted'">
                    Poziom {{ idx + 1 }}
                  </span>
                </div>
                <span class="font-mono text-sm font-bold" :class="selectedBadge.current >= t ? 'text-primary' : 'text-muted'">
                  {{ t }} {{ selectedBadge.unit }}
                </span>
              </div>
            </div>
          </div>

          <div class="rounded-xl bg-muted/20 p-4 text-center">
            <p class="text-sm text-muted">
              Obecnie: <span class="font-black text-highlighted">{{ Math.floor(selectedBadge.current) }} {{ selectedBadge.unit }}</span>
            </p>
            <p v-if="getLevel(selectedBadge) < selectedBadge.thresholds.length" class="mt-1 text-xs text-muted">
              Brakuje
              <span class="font-bold text-primary">
                {{
                  Math.ceil(
                    (selectedBadge.thresholds[getLevel(selectedBadge)] ?? selectedBadge.current) - selectedBadge.current
                  )
                }}
                {{ selectedBadge.unit }}
              </span>
              do kolejnego poziomu!
            </p>
            <p v-else class="mt-1 text-xs font-bold text-emerald-500 uppercase tracking-tighter">
              Maksymalny poziom osiągnięty! 🎉
            </p>
          </div>

          <div class="flex justify-end">
            <UButton color="neutral" variant="soft" @click="isModalOpen = false">Zamknij</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- [2070] Badge unlock celebration modal with confetti + share -->
    <UModal
      v-model:open="celebrationOpen"
      title="Nowa odznaka odblokowana! 🏆"
      :ui="{ content: 'sm:max-w-md rounded-3xl overflow-hidden' }"
    >
      <template #content>
        <div class="relative overflow-hidden">
          <!-- Animated confetti particles -->
          <div v-if="confettiActive" class="pointer-events-none absolute inset-0 z-10 overflow-hidden">
            <div
              v-for="i in 30"
              :key="i"
              class="absolute size-2 rounded-full"
              :style="{
                left: `${(i * 3.37) % 100}%`,
                top: '-8px',
                backgroundColor: ['#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#f97316','#ec4899'][(i - 1) % 7],
                animation: `confettiFall ${1.0 + (i % 6) * 0.25}s ease-in ${(i % 8) * 0.08}s forwards`,
                opacity: 0,
              }"
            />
          </div>

          <div class="space-y-5 p-6">
            <!-- Badge icon with glow -->
            <div class="flex flex-col items-center gap-4 text-center">
              <div class="relative">
                <div class="absolute inset-0 rounded-3xl bg-amber-500/30 blur-xl" />
                <div class="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-amber-500/15 text-amber-500 ring-2 ring-amber-500/40 shadow-xl">
                  <UIcon :name="celebrationBadge?.icon || 'i-lucide-award'" class="size-12" />
                </div>
              </div>
              <div>
                <p class="text-2xl font-black text-highlighted">{{ celebrationBadge?.label }}</p>
                <p class="mt-1 text-sm text-muted">
                  Osiągnąłeś/aś
                  <span class="font-bold text-amber-500">poziom {{ celebrationBadge?.level }}</span>!
                </p>
              </div>
              <!-- Stars row -->
              <div class="flex gap-1.5">
                <UIcon
                  v-for="s in (celebrationBadge?.level ?? 0)"
                  :key="s"
                  name="i-lucide-star"
                  class="size-5 text-amber-400 drop-shadow-sm"
                />
              </div>
            </div>

            <p class="text-center text-sm text-muted leading-relaxed">
              Podziel się swoim osiągnięciem ze znajomymi lub zamknij, by kontynuować trening!
            </p>

            <div class="flex justify-center gap-3 border-t border-default/60 pt-4">
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-x"
                @click="celebrationOpen = false"
              >
                Zamknij
              </UButton>
              <UButton
                color="warning"
                icon="i-lucide-share-2"
                @click="shareBadge"
              >
                Udostępnij
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

