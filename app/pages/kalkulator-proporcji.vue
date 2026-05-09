<script setup lang="ts">
import { computeRatios, type ExerciseId } from '~/utils/weightliftingRatios'
import { parseLiveNumber } from '~/utils/liveNumber'

// Kalkulator jest publiczny — żadna logika nie odpytuje API, wszystko liczy się
// po stronie klienta na podstawie wprowadzonych przez użytkownika maxów. Stąd brak middleware.

useSeoMeta({
  title: 'Kalkulator złotych proporcji — dwubój — Slavia',
  description: 'Widełki proporcji między ćwiczeniami w dwuboju olimpijskim. Wpisz swoje maxy, a kalkulator zasugeruje zakresy dla innych bojów.'
})

const inputs = reactive<Partial<Record<ExerciseId, number>>>({
  snatch: undefined,
  clean_jerk: undefined,
  back_squat: undefined,
  front_squat: undefined,
  push_press: undefined,
  power_snatch: undefined,
  power_clean: undefined,
  power_jerk: undefined,
  snatch_squat: undefined,
  snatch_pull: undefined,
  clean_pull: undefined,
  deadlift: undefined,
  strict_press: undefined,
  snatch_push_press: undefined,
  split_jerk_front: undefined,
  split_jerk_back: undefined,
  snatch_press: undefined,
  clean_from_blocks: undefined,
  snatch_from_blocks: undefined,
  power_snatch_balance: undefined
})

const raw = reactive<Record<ExerciseId, string>>({
  snatch: '',
  clean_jerk: '',
  back_squat: '',
  front_squat: '',
  push_press: '',
  power_snatch: '',
  power_clean: '',
  power_jerk: '',
  snatch_squat: '',
  snatch_pull: '',
  clean_pull: '',
  deadlift: '',
  strict_press: '',
  snatch_push_press: '',
  split_jerk_front: '',
  split_jerk_back: '',
  snatch_press: '',
  clean_from_blocks: '',
  snatch_from_blocks: '',
  power_snatch_balance: ''
})

const ALL_KEYS: ExerciseId[] = [
  'snatch',
  'clean_jerk',
  'back_squat',
  'front_squat',
  'push_press',
  'power_snatch',
  'power_clean',
  'power_jerk',
  'snatch_squat',
  'snatch_pull',
  'clean_pull',
  'deadlift',
  'strict_press',
  'snatch_push_press',
  'split_jerk_front',
  'split_jerk_back',
  'snatch_press',
  'clean_from_blocks',
  'snatch_from_blocks',
  'power_snatch_balance'
]

for (const key of ALL_KEYS) {
  watch(
    () => raw[key],
    (val) => {
      const n = parseLiveNumber(val)
      ;(inputs as Partial<Record<ExerciseId, number | undefined>>)[key] = n
    }
  )
}

const results = computed(() => computeRatios(inputs))

const showAllInputs = ref(false)
const showOnlyOutOfRange = ref(false)
const showOnlyComputed = ref(true)
const query = ref('')

const summary = computed(() => {
  const rows = results.value
  const computedRows = rows.filter(r => r.minKg != null && r.maxKg != null)
  const withStatus = rows.filter(r => r.status !== 'unknown')
  return {
    total: rows.length,
    computed: computedRows.length,
    withStatus: withStatus.length,
    inRange: rows.filter(r => r.status === 'in_range').length,
    below: rows.filter(r => r.status === 'below').length,
    above: rows.filter(r => r.status === 'above').length
  }
})

const filteredResults = computed(() => {
  const q = query.value.trim().toLowerCase()
  return results.value.filter((r) => {
    if (showOnlyComputed.value && (r.minKg == null || r.maxKg == null)) return false
    if (showOnlyOutOfRange.value && !(r.status === 'below' || r.status === 'above')) return false
    if (q) {
      const hay = `${r.pl} ${r.fromPl}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const filledCount = computed(() => {
  let n = 0
  for (const key of ALL_KEYS) {
    const v = inputs[key]
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) n++
  }
  return n
})

/** Relacje, gdzie podano oba ćwiczenia (dają feedback + notatkę). */
const relationAnalyses = computed(() => {
  const rows = results.value.filter(r => r.actualPct != null)
  const rank = (s: string) => (s === 'below' ? 0 : s === 'above' ? 1 : s === 'in_range' ? 2 : 3)
  return [...rows].sort((a, b) => {
    const ra = rank(a.status)
    const rb = rank(b.status)
    if (ra !== rb) return ra - rb
    const la = `${a.pl} ${a.fromPl}`.toLowerCase()
    const lb = `${b.pl} ${b.fromPl}`.toLowerCase()
    return la.localeCompare(lb, 'pl')
  })
})

const relationSummary = computed(() => {
  const rows = relationAnalyses.value
  return {
    total: rows.length,
    inRange: rows.filter(r => r.status === 'in_range').length,
    below: rows.filter(r => r.status === 'below').length,
    above: rows.filter(r => r.status === 'above').length
  }
})

function fmtKg(n: number | null) {
  if (n == null || Number.isNaN(n)) return '—'
  return `${n.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} kg`
}

function fmtPct(min: number, max: number) {
  const a = Math.round(min * 100)
  const b = Math.round(max * 100)
  return a === b ? `${a}%` : `${a}–${b}%`
}

function statusColor(s: string) {
  if (s === 'in_range') return 'success'
  if (s === 'below') return 'warning'
  if (s === 'above') return 'info'
  return 'neutral'
}

function rowAccentClass(s: string) {
  if (s === 'in_range') return 'border-emerald-500/25 ring-1 ring-emerald-500/10 bg-emerald-500/5'
  if (s === 'below') return 'border-amber-500/25 ring-1 ring-amber-500/10 bg-amber-500/5'
  if (s === 'above') return 'border-sky-500/25 ring-1 ring-sky-500/10 bg-sky-500/5'
  return 'border-default/60 bg-muted/10'
}
</script>

<template>
  <UContainer class="py-8 md:py-14 lg:py-16">
    <div class="mx-auto max-w-6xl">
      <div class="relative overflow-hidden rounded-3xl border border-default/60 bg-linear-to-br from-primary/10 via-card to-card p-6 shadow-sm ring-1 ring-primary/10 sm:p-8">
        <div class="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/20 blur-3xl" />
        <div class="relative">
          <p class="text-[11px] font-black uppercase tracking-[0.25em] text-primary">
            Narzędzie
          </p>
          <h1 class="mt-2 text-3xl font-black tracking-tight text-highlighted sm:text-4xl lg:text-5xl">
            Kalkulator „złotych proporcji”
          </h1>
          <p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            Wpisz znane maxy (1RM). Dostaniesz sugerowane <strong class="text-default">widełki</strong> oraz miłe wskazówki,
            co najczęściej poprawia balans między bojami (technika, mobilność, transfer siły).
          </p>
          <p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            <strong class="text-default">Możesz wpisać kilka powiązanych ćwiczeń naraz</strong> — dostaniesz feedback dla każdej relacji,
            gdzie podasz oba ćwiczenia (dotyczy też ćwiczeń dodatkowych).
          </p>
          <div class="mt-5 flex flex-wrap gap-2">
            <UBadge color="success" variant="subtle" size="sm">
              W widełkach: {{ summary.inRange }}
            </UBadge>
            <UBadge color="warning" variant="subtle" size="sm">
              Poniżej: {{ summary.below }}
            </UBadge>
            <UBadge color="info" variant="subtle" size="sm">
              Powyżej: {{ summary.above }}
            </UBadge>
            <UBadge color="neutral" variant="subtle" size="sm">
              Policzone: {{ summary.computed }} / {{ summary.total }}
            </UBadge>
            <UBadge color="neutral" variant="subtle" size="sm">
              Wpisane: {{ filledCount }}
            </UBadge>
            <UBadge color="primary" variant="subtle" size="sm">
              Analiz relacji: {{ relationAnalyses.length }}
            </UBadge>
          </div>
        </div>
      </div>

      <div class="mt-10 grid gap-8 lg:grid-cols-5">
        <UCard class="rounded-3xl border-default/70 shadow-sm ring-1 ring-default/40 lg:col-span-2">
          <template #header>
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
                  Dane wejściowe
                </p>
                <h2 class="mt-1 text-lg font-bold text-highlighted">
                  Twoje maxy (1RM)
                </h2>
              </div>
              <span class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
                <UIcon name="i-lucide-sliders-horizontal" class="size-5" />
              </span>
            </div>
          </template>

          <div class="space-y-5">
            <UFormField label="Rwanie">
              <UInput v-model="raw.snatch" inputmode="decimal" class="w-full tabular-nums" placeholder="np. 110" />
            </UFormField>
            <UFormField label="Podrzut">
              <UInput v-model="raw.clean_jerk" inputmode="decimal" class="w-full tabular-nums" placeholder="np. 140" />
            </UFormField>
            <UFormField label="Przysiad z tyłu">
              <UInput v-model="raw.back_squat" inputmode="decimal" class="w-full tabular-nums" placeholder="np. 200" />
            </UFormField>
            <UFormField label="Przysiad z przodu">
              <UInput v-model="raw.front_squat" inputmode="decimal" class="w-full tabular-nums" placeholder="np. 165" />
            </UFormField>
            <UFormField label="Wycisko-podrzut">
              <UInput v-model="raw.push_press" inputmode="decimal" class="w-full tabular-nums" placeholder="np. 95" />
            </UFormField>

            <UButton
              variant="soft"
              color="neutral"
              size="sm"
              class="w-full"
              :icon="showAllInputs ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              @click="showAllInputs = !showAllInputs"
            >
              {{ showAllInputs ? 'Ukryj dodatkowe pola' : 'Pokaż wszystkie ćwiczenia' }}
            </UButton>

            <div v-if="showAllInputs" class="space-y-5 pt-2">
              <USeparator />
              <p class="text-[11px] font-semibold text-muted">
                Dodatkowe ćwiczenia (opcjonalnie) — wpisz, jeśli chcesz porównać swoje ratio z widełkami.
              </p>
              <UFormField label="Rwanie siłowe">
                <UInput v-model="raw.power_snatch" inputmode="decimal" class="w-full tabular-nums" />
              </UFormField>
              <UFormField label="Zarzut siłowy">
                <UInput v-model="raw.power_clean" inputmode="decimal" class="w-full tabular-nums" />
              </UFormField>
              <UFormField label="Wybijanie siłowe (power jerk)">
                <UInput v-model="raw.power_jerk" inputmode="decimal" class="w-full tabular-nums" />
              </UFormField>
              <UFormField label="Przysiad rwaniowy">
                <UInput v-model="raw.snatch_squat" inputmode="decimal" class="w-full tabular-nums" />
              </UFormField>
              <UFormField label="Ciągi do rwania">
                <UInput v-model="raw.snatch_pull" inputmode="decimal" class="w-full tabular-nums" />
              </UFormField>
              <UFormField label="Ciągi do podrzutu">
                <UInput v-model="raw.clean_pull" inputmode="decimal" class="w-full tabular-nums" />
              </UFormField>
              <UFormField label="Martwy ciąg">
                <UInput v-model="raw.deadlift" inputmode="decimal" class="w-full tabular-nums" />
              </UFormField>
              <UFormField label="Wyciskanie żołnierskie">
                <UInput v-model="raw.strict_press" inputmode="decimal" class="w-full tabular-nums" />
              </UFormField>
              <UFormField label="Wycisko-wybijanie rwaniowe (chwyt rwaniowy)">
                <UInput v-model="raw.snatch_push_press" inputmode="decimal" class="w-full tabular-nums" />
              </UFormField>
              <UFormField label="Wybijanie w nożyce z przodu">
                <UInput v-model="raw.split_jerk_front" inputmode="decimal" class="w-full tabular-nums" />
              </UFormField>
              <UFormField label="Wybijanie w nożyce z tyłu (na barkach)">
                <UInput v-model="raw.split_jerk_back" inputmode="decimal" class="w-full tabular-nums" />
              </UFormField>
              <UFormField label="Wyciskanie rwaniowe">
                <UInput v-model="raw.snatch_press" inputmode="decimal" class="w-full tabular-nums" />
              </UFormField>
              <UFormField label="Zarzut z bloków">
                <UInput v-model="raw.clean_from_blocks" inputmode="decimal" class="w-full tabular-nums" />
              </UFormField>
              <UFormField label="Rwanie z bloków">
                <UInput v-model="raw.snatch_from_blocks" inputmode="decimal" class="w-full tabular-nums" />
              </UFormField>
              <UFormField label="Wybijanie do rwania (snatch balance)">
                <UInput v-model="raw.power_snatch_balance" inputmode="decimal" class="w-full tabular-nums" />
              </UFormField>
            </div>
          </div>

          <UAlert
            class="mt-6"
            color="neutral"
            variant="subtle"
            icon="i-lucide-info"
            title="Uwaga"
            description="To są benchmarki planistyczne. Jeśli jakaś relacja odstaje, nie musi to oznaczać „błędu” — często to kwestia techniki, mobilności lub proporcji ciała."
          />
        </UCard>

        <UCard class="rounded-3xl border-primary/20 bg-linear-to-br from-primary/6 via-card to-card shadow-md ring-1 ring-primary/15 lg:col-span-3">
          <template #header>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
                  Wyniki
                </p>
                <h2 class="mt-1 text-lg font-bold text-highlighted">
                  Sugerowane zakresy
                </h2>
              </div>
              <div class="flex flex-wrap gap-2">
                <UInput
                  v-model="query"
                  size="sm"
                  icon="i-lucide-search"
                  placeholder="Szukaj ćwiczenia…"
                  class="min-w-52"
                />
                <UButton
                  size="sm"
                  color="neutral"
                  variant="outline"
                  :icon="showOnlyComputed ? 'i-lucide-check' : 'i-lucide-circle'"
                  @click="showOnlyComputed = !showOnlyComputed"
                >
                  Tylko policzone
                </UButton>
                <UButton
                  size="sm"
                  color="neutral"
                  variant="outline"
                  :icon="showOnlyOutOfRange ? 'i-lucide-check' : 'i-lucide-circle'"
                  @click="showOnlyOutOfRange = !showOnlyOutOfRange"
                >
                  Tylko poza widełkami
                </UButton>
              </div>
            </div>
          </template>

          <div class="space-y-3">
            <UAlert
              v-if="relationAnalyses.length > 0"
              color="primary"
              variant="subtle"
              icon="i-lucide-sparkles"
              title="Analiza relacji (dla wpisanych wartości)"
              :description="`Masz ${relationSummary.total} relacji: ${relationSummary.inRange} w widełkach, ${relationSummary.below} poniżej, ${relationSummary.above} powyżej. Możesz wpisać wiele ćwiczeń naraz — analizujemy wszystkie relacje między nimi.`"
            />

            <div v-if="relationAnalyses.length > 0" class="grid gap-3 sm:grid-cols-2">
              <UCard
                v-for="r in relationAnalyses"
                :key="`rel-${r.id}-${r.from}`"
                class="rounded-2xl border border-default/60"
                :class="rowAccentClass(r.status)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-highlighted">
                      {{ r.pl }} względem {{ r.fromPl }}
                    </p>
                    <p class="mt-1 text-xs text-muted">
                      Masz: <span class="font-mono text-default">{{ fmtKg(r.actualKg) }}</span>
                      (<span class="font-mono text-default">{{ r.actualPct }}%</span>) · Widełki:
                      <span class="font-mono text-default">{{ fmtPct(r.ratio.min, r.ratio.max) }}</span>
                    </p>
                  </div>
                  <UBadge :color="statusColor(r.status)" variant="subtle" size="sm" class="shrink-0">
                    <template v-if="r.status === 'in_range'">W widełkach</template>
                    <template v-else-if="r.status === 'below'">Poniżej</template>
                    <template v-else-if="r.status === 'above'">Powyżej</template>
                    <template v-else>—</template>
                  </UBadge>
                </div>
                <p v-if="r.note" class="mt-3 text-sm text-muted leading-relaxed">
                  {{ r.note }}
                </p>
              </UCard>
            </div>

            <div
              v-for="r in filteredResults"
              :key="`${r.id}-${r.from}`"
              class="flex flex-col gap-2 rounded-2xl border px-4 py-3 transition-colors sm:flex-row sm:items-start sm:justify-between"
              :class="rowAccentClass(r.status)"
            >
              <div class="min-w-0">
                <p class="font-semibold text-highlighted">
                  {{ r.pl }}
                </p>
                <p class="text-xs text-muted">
                  od: <span class="font-medium text-default">{{ r.fromPl }}</span> · {{ fmtPct(r.ratio.min, r.ratio.max) }}
                  <span v-if="r.ratio.heuristic" class="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
                    orientacyjnie
                  </span>
                </p>
                <div v-if="r.status !== 'unknown'" class="mt-2">
                  <UBadge :color="statusColor(r.status)" variant="subtle" size="xs">
                    <template v-if="r.status === 'in_range'">W widełkach</template>
                    <template v-else-if="r.status === 'below'">Poniżej widełek</template>
                    <template v-else>Pow. widełek</template>
                  </UBadge>
                  <p class="mt-1 text-[11px] leading-relaxed text-muted">
                    {{ r.note }}
                  </p>
                </div>
                <p class="mt-1 text-[11px] text-muted/90">
                  {{ r.ratio.source }}
                </p>
              </div>

              <div class="mt-1 shrink-0 font-mono text-sm font-bold tabular-nums text-primary sm:mt-0 sm:text-right">
                <template v-if="r.minKg != null && r.maxKg != null">
                  {{ fmtKg(r.minKg) }} – {{ fmtKg(r.maxKg) }}
                </template>
                <template v-else>
                  —
                </template>
                <div v-if="r.actualKg != null" class="mt-1 text-[11px] text-muted font-semibold">
                  <template v-if="r.actualPct != null">
                    Masz: {{ fmtKg(r.actualKg) }} ({{ r.actualPct }}%)
                  </template>
                  <template v-else>
                    Masz: {{ fmtKg(r.actualKg) }}
                  </template>
                </div>
              </div>
            </div>
          </div>

          <USeparator class="my-8" />

          <div class="text-sm text-muted space-y-2">
            <p class="font-semibold text-highlighted">
              Skąd te widełki?
            </p>
            <p>
              Część proporcji jest oparta o publiczne „ratio / gold standards” (np. power snatch, OHS, relacje siadów),
              a część to praktyczne widełki coachingowe (oznaczone jako <span class="font-semibold text-warning">orientacyjnie</span>).
            </p>
            <p class="text-xs">
              Źródła referencyjne: „Gold Standards in Weightlifting” (TrainingWeightlifting) oraz zestawy ratio typu „Weightlifting ratios calculator” (PerformancePlusProgramming).
            </p>
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>

