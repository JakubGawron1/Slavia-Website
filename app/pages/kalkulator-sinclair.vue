<script setup lang="ts">
import type { SinclairGender } from '~/utils/sinclair'
import type { Athlete } from '~/types/models'
import { sinclair2025_2028, sinclairCoefficient, sinclairTotal } from '~/utils/sinclair'
import { parseLiveNumber } from '~/utils/liveNumber'

const auth = useAuth()
const apiFetch = useApi()
const { accountSettingsPath } = useRoleDashboardNav()

const gender = ref<SinclairGender>((auth.user.value?.athlete_gender as SinclairGender) || 'male')
const bodyweight = ref<number | undefined>(undefined)
const total = ref<number | undefined>(undefined)
const bodyweightRaw = ref('')
const totalRaw = ref('')

const { data: myProfile } = await useAsyncData(
  'sinclair-my-profile',
  async () => {
    if (!auth.isLoggedIn.value) return null
    try {
      return await apiFetch<Athlete>('/api/athletes/me')
    } catch {
      return null
    }
  }
)

const profileWarning = computed(() => {
  if (!auth.isLoggedIn.value) return null
  if (!myProfile.value) return null
  if (!myProfile.value.gender || !myProfile.value.birth_year) {
    return 'Uzupełnij płeć i rok urodzenia w swoim profilu, aby rankingi i statystyki były dokładne.'
  }
  return null
})

// Auto-fill from profile if available
onMounted(() => {
  if (myProfile.value) {
    if (myProfile.value.bodyweight) {
      bodyweight.value = myProfile.value.bodyweight
      bodyweightRaw.value = String(myProfile.value.bodyweight).replace('.', ',')
    }
    if (myProfile.value.gender) {
      gender.value = myProfile.value.gender as SinclairGender
    }
  }
})

interface Scenario {
  id: string
  label: string
  gender: SinclairGender
  bodyweight: number
  total: number
  sinclair: number
  at: string
}

const scenarios = ref<Scenario[]>([])

onMounted(() => {
  try {
    const saved = localStorage.getItem('slavia_sinclair_scenarios')
    if (saved) scenarios.value = JSON.parse(saved)
  } catch (e) {
    console.error('Failed to load scenarios', e)
  }
})

watch(scenarios, (newVal) => {
  try {
    localStorage.setItem('slavia_sinclair_scenarios', JSON.stringify(newVal))
  } catch (e) {
    console.error('Failed to save scenarios', e)
  }
}, { deep: true })

function addScenario() {
  const bw = bodyweight.value
  const t = total.value
  const s = sinclairResult.value
  if (!bw || !t || !s) return
  
  const label = prompt('Nazwa scenariusza:', `Scenariusz ${scenarios.value.length + 1}`)
  if (label === null) return

  scenarios.value.push({
    id: crypto.randomUUID(),
    label: label || 'Bez nazwy',
    gender: gender.value,
    bodyweight: bw,
    total: t,
    sinclair: Number(s.toFixed(2)),
    at: new Date().toISOString()
  })
}

function removeScenario(id: string) {
  scenarios.value = scenarios.value.filter(s => s.id !== id)
}

/** Porównanie z rankingiem klubu */
const { data: athletes } = await useAsyncData(
  'sinclair-calc-athletes',
  () => apiFetch<Athlete[]>('/api/athletes').catch(() => []),
  { default: () => [] }
)

const clubRanking = computed(() => {
  return (athletes.value || [])
    .filter(a => a.is_active !== false && (a.total_kg || 0) > 0)
    .map(a => {
      const g = a.gender === 'female' ? 'female' : 'male'
      const bw = a.bodyweight || (a.weight_category ? parseInt(a.weight_category) : 0)
      const t = a.total_kg || 0
      const s = bw > 0 ? sinclairTotal(t, bw, g) : 0
      return {
        id: a.id,
        name: a.full_name,
        sinclair: Number(s.toFixed(2))
      }
    })
    .sort((a, b) => b.sinclair - a.sinclair)
})

const currentRank = computed(() => {
  const s = sinclairResult.value
  if (!s || clubRanking.value.length === 0) return null
  const betterCount = clubRanking.value.filter(r => r.sinclair > s).length
  return betterCount + 1
})

const consts = computed(() => sinclair2025_2028[gender.value])

const coefficient = computed(() => {
  const bw = bodyweight.value
  if (bw === undefined || bw === null || Number.isNaN(bw)) return null
  return sinclairCoefficient(bw, gender.value)
})


watch(bodyweightRaw, (newVal) => {
  bodyweight.value = parseLiveNumber(newVal)
})

watch(totalRaw, (newVal) => {
  total.value = parseLiveNumber(newVal)
})

const sinclairResult = computed(() => {
  const bw = bodyweight.value
  const t = total.value
  if (
    bw === undefined || bw === null || Number.isNaN(bw)
    || t === undefined || t === null || Number.isNaN(t)
  ) {
    return null
  }
  return sinclairTotal(t, bw, gender.value)
})

function fmt(n: number | null, digits = 3) {
  if (n === null || Number.isNaN(n)) return '—'
  return n.toLocaleString('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  })
}

useSeoMeta({
  title: 'Kalkulator Sinclair (2025–2028) — Slavia Ruda Śląska',
  description: 'Współczynnik i Total Sinclair 2025–2028 — te same założenia co kalkulator na PodnoszenieCiężarów.pl.'
})
</script>

<template>
  <PublicPageLayout centered>
    <PublicPageHeader
      variant="hero"
      eyebrow="Narzędzie"
      icon="i-lucide-calculator"
      title="Kalkulator Sinclair"
      description="Przelicznik na okres 2025–2028 — porównywanie wyników zawodników o różnej masie ciała (dwubój: rwanie + podrzut)."
    />

    <div class="slavia-content-well mx-auto flex w-full max-w-5xl flex-col gap-8">
    <UAlert
      v-if="profileWarning"
      color="warning"
      variant="subtle"
      icon="i-lucide-alert-triangle"
      class="mb-8 max-w-3xl"
      :title="profileWarning"
      :actions="[{ label: 'Ustawienia konta', to: accountSettingsPath, color: 'warning' }]"
    />

      <div class="grid w-full gap-8 lg:grid-cols-5">
        <UCard class="border-default/80 shadow-sm lg:col-span-2">
          <template #header>
            <h2 class="text-lg font-semibold text-highlighted">
              Dane
            </h2>
          </template>
          <div class="space-y-6">
            <UFormField label="Płeć">
              <USelect
                v-model="gender"
                size="lg"
                :items="[
                  { label: 'Mężczyzna', value: 'male' },
                  { label: 'Kobieta', value: 'female' }
                ]"
                value-key="value"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Masa ciała z ważenia"
              description="kg — rzeczywista masa w zawodach"
            >
              <UInput
                v-model="bodyweightRaw"
                inputmode="decimal"
                size="lg"
                placeholder="np. 81,4"
                class="w-full tabular-nums"
              />
            </UFormField>

            <UFormField
              label="Dwubój (total)"
              description="kg — suma najlepszego rwania i podrzutu"
            >
              <UInput
                v-model="totalRaw"
                inputmode="decimal"
                size="lg"
                class="w-full tabular-nums"
                placeholder="np. 280"
              />
            </UFormField>

            <div class="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted">
              Stałe dla tej płci: <span class="font-mono text-default">A = {{ consts.A }}</span>,
              <span class="font-mono text-default">b = {{ consts.b }} kg</span>
            </div>
          </div>
        </UCard>

        <UCard
          class="border-primary/20 bg-linear-to-br from-primary/5 to-transparent shadow-md lg:col-span-3"
          :ui="{ body: 'flex flex-col justify-center min-h-[280px]' }"
        >
          <template #header>
            <h2 class="text-lg font-semibold text-highlighted">
              Wynik
            </h2>
          </template>

          <div class="grid gap-8 sm:grid-cols-2">
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-muted">
                Współczynnik Sinclair
              </p>
              <p class="mt-2 font-mono text-4xl font-bold tabular-nums text-primary sm:text-5xl">
                {{ fmt(coefficient, 4) }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-muted">
                Total Sinclair
              </p>
              <p class="mt-2 font-mono text-4xl font-bold tabular-nums text-highlighted sm:text-5xl">
                {{ fmt(sinclairResult, 2) }}
                <span class="text-xl font-semibold text-muted">pkt</span>
              </p>
            </div>
          </div>

          <USeparator class="my-8" />

          <div class="space-y-3 text-sm text-muted">
            <p>
              Jeśli masa ciała <span class="font-mono text-default">≥ b</span>, współczynnik wynosi
              <strong class="text-default">1</strong> — bez podwyższenia wyniku względem rzeczywistego totalu.
            </p>
            <p>
              Dla mas niższych niż <span class="font-mono text-default">b</span> stosuje się wzór:
              <span class="block mt-2 rounded-md bg-muted/50 p-3 font-mono text-xs text-default sm:text-sm">
                10<sup class="text-[0.65em]">(A × log₁₀(x/b)²)</sup>
              </span>
            </p>
          </div>

          <div v-if="sinclairResult" class="mt-8 flex flex-col gap-3">
            <UButton
              block
              size="lg"
              color="primary"
              variant="soft"
              icon="i-lucide-save"
              @click="addScenario"
            >
              Zapisz jako scenariusz (lokalnie)
            </UButton>
            <UButton
              v-if="auth.isAthlete.value"
              block
              size="lg"
              color="neutral"
              variant="outline"
              icon="i-lucide-send"
              :to="{
                path: '/athlete',
                query: {
                  sinclair_bw: bodyweight,
                  sinclair_total: total
                }
              }"
            >
              Wpisz w formularz zgłoszenia wyniku
            </UButton>
            
            <div v-if="currentRank" class="rounded-xl border border-primary/25 bg-primary/10 p-4 text-center">
              <p class="text-xs font-bold uppercase tracking-wider text-primary">Estymowana pozycja w klubie</p>
              <p class="mt-1 text-2xl font-black text-highlighted">
                #{{ currentRank }} <span class="text-sm font-normal text-muted">/ {{ clubRanking.length }}</span>
              </p>
              <p class="mt-1 text-[11px] text-muted">
                Biorąc pod uwagę aktualny publiczny ranking Sinclair kadry.
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Scenariusze (Porównywarka) -->
      <div v-if="scenarios.length > 0" class="mt-12 w-full">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="text-xl font-black uppercase italic tracking-tight text-highlighted">
            Twoje Scenariusze
          </h2>
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            @click="scenarios = []"
          >
            Wyczyść listę
          </UButton>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <UCard
            v-for="s in scenarios"
            :key="s.id"
            class="relative overflow-hidden border-default/60 bg-muted/10"
            :ui="{ body: 'p-4' }"
          >
            <UButton
              class="absolute right-2 top-2"
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="xs"
              @click="removeScenario(s.id)"
            />
            <div class="mb-3">
              <p class="text-xs font-bold uppercase tracking-wider text-primary">{{ s.label }}</p>
              <p class="text-[10px] text-muted">{{ s.gender === 'female' ? 'Kobieta' : 'Mężczyzna' }} · {{ s.at.slice(0, 10) }}</p>
            </div>
            <div class="flex items-end justify-between">
              <div>
                <p class="text-[10px] uppercase text-muted">Masa / Total</p>
                <p class="font-mono text-sm font-bold text-highlighted">
                  {{ s.bodyweight }} / {{ s.total }} kg
                </p>
              </div>
              <div class="text-right">
                <p class="text-[10px] uppercase text-muted">Sinclair</p>
                <p class="font-mono text-xl font-black text-primary">
                  {{ s.sinclair }}
                </p>
              </div>
            </div>
          </UCard>
        </div>
      </div>

    <UAlert
      class="mt-10 max-w-3xl"
      color="neutral"
      variant="subtle"
      icon="i-lucide-info"
      title="Informacja"
      description="Przelicznik jest liczony jak na podnoszenieciezarow.pl (okres 2025–2028): mężczyźni b = 201 kg, kobiety b = 164 kg; stała A dopasowana do ich tabeli. Ewentualne różnice w ostatnich miejscach wynikają z zaokrągleń po stronie serwisu referencyjnego."
    />
    </div>
  </PublicPageLayout>
</template>
