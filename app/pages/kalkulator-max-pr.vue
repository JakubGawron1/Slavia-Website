<script setup lang="ts">
import { parseLiveNumber, parseLiveInt } from '~/utils/liveNumber'
import {
  AUXILIARY_LIFTS,
  estimateOneRepMax,
  ONE_REP_MAX_FORMULAS,
  TRAINING_PERCENTAGES,
  weightAtPercent,
  type AuxiliaryLiftId,
  type OneRepMaxFormula,
  type OneRepMaxFormulaId
} from '~/utils/oneRepMax'

useSeoMeta({
  title: 'Kalkulator Max PR (1RM) — Slavia Ruda Śląska',
  description:
    'Szacuj maksymalne obciążenie (1RM) z ciężaru i liczby powtórzeń — przysiad, wycisk, martwy i inne ćwiczenia pomocnicze. Wzory Epley, Brzycki i Lombardi.'
})

const liftId = ref<AuxiliaryLiftId>('squat')
const customLiftName = ref('')
const formula = ref<OneRepMaxFormulaId>('epley')
const weightRaw = ref('')
const repsRaw = ref('')

const weightKg = ref<number | undefined>(undefined)
const reps = ref<number | undefined>(undefined)

watch(weightRaw, v => { weightKg.value = parseLiveNumber(v) })
watch(repsRaw, v => { reps.value = parseLiveInt(v) })

const liftLabel = computed(() => {
  if (liftId.value === 'other') {
    const n = customLiftName.value.trim()
    return n || AUXILIARY_LIFTS.other
  }
  return AUXILIARY_LIFTS[liftId.value]
})

const estimatedMax = computed(() => {
  const w = weightKg.value
  const r = reps.value
  if (w == null || r == null) return null
  return estimateOneRepMax(w, r, formula.value)
})

const percentRows = computed(() => {
  const max = estimatedMax.value
  if (max == null) return []
  return TRAINING_PERCENTAGES.map(p => ({
    percent: p,
    kg: weightAtPercent(max, p)
  }))
})

const formulaMeta = computed((): OneRepMaxFormula => {
  return ONE_REP_MAX_FORMULAS.find(f => f.id === formula.value) ?? ONE_REP_MAX_FORMULAS[0]!
})

function fmtKg(n: number | null) {
  if (n == null || Number.isNaN(n)) return '—'
  return n.toLocaleString('pl-PL', { maximumFractionDigits: 1 })
}
</script>

<template>
  <PublicPageLayout centered>
    <PublicPageHeader
      variant="hero"
      eyebrow="Narzędzie"
      icon="i-lucide-dumbbell"
      title="Kalkulator Max PR (1RM)"
      description="Szacuj rekord życiowy z serii treningowej — dla przysiadu, wycisku, martwego i innych ćwiczeń poza dwubojem olimpijskim."
    >
      <template #badges>
        <UBadge color="neutral" variant="subtle" size="sm">
          {{ liftLabel }}
        </UBadge>
        <UBadge v-if="estimatedMax != null" color="primary" variant="subtle" size="sm">
          Szac. 1RM: {{ fmtKg(estimatedMax) }} kg
        </UBadge>
      </template>
    </PublicPageHeader>

    <div
      v-slavia-reveal="'fade-up'"
      class="slavia-content-well slavia-public-section mx-auto flex w-full max-w-5xl flex-col gap-8"
    >
      <div
        v-slavia-reveal="'fade-up'"
        :data-slavia-reveal-delay="60"
        class="grid w-full gap-8 lg:grid-cols-5"
      >
        <UCard class="slavia-page-card slavia-public-card slavia-public-card--flat lg:col-span-2">
          <template #header>
            <div
              v-slavia-reveal="'fade-left'"
            >
              <p class="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
                Dane wejściowe
              </p>
              <h2 class="mt-1 text-lg font-bold text-highlighted">
                Seria treningowa
              </h2>
            </div>
          </template>

          <div class="space-y-5">
            <UFormField label="Ćwiczenie">
              <USelect
                v-model="liftId"
                :items="[
                  { label: AUXILIARY_LIFTS.squat, value: 'squat' },
                  { label: AUXILIARY_LIFTS.bench, value: 'bench' },
                  { label: AUXILIARY_LIFTS.deadlift, value: 'deadlift' },
                  { label: AUXILIARY_LIFTS.other, value: 'other' }
                ]"
                value-key="value"
                size="lg"
                class="w-full"
              />
            </UFormField>

            <UFormField v-if="liftId === 'other'" label="Nazwa ćwiczenia">
              <UInput
                v-model="customLiftName"
                size="lg"
                class="w-full"
                placeholder="np. Front squat, RDL, wycisk francuski…"
              />
            </UFormField>

            <UFormField label="Wzór szacowania">
              <USelect
                v-model="formula"
                :items="ONE_REP_MAX_FORMULAS.map(f => ({
                  label: `${f.label} (${f.short})`,
                  value: f.id
                }))"
                value-key="value"
                size="lg"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Ciężar na sztandze" description="kg — wykonana seria">
              <UInput
                v-model="weightRaw"
                inputmode="decimal"
                size="lg"
                class="w-full tabular-nums"
                placeholder="np. 100"
              />
            </UFormField>

            <UFormField label="Liczba powtórzeń" description="1–12+ (przy 1 powt. wynik = ciężar)">
              <UInput
                v-model="repsRaw"
                inputmode="numeric"
                size="lg"
                class="w-full tabular-nums"
                placeholder="np. 5"
              />
            </UFormField>
          </div>
        </UCard>

        <UCard
          class="slavia-page-card slavia-public-card slavia-public-card--glass border-primary/20 bg-linear-to-br from-primary/6 via-card to-card lg:col-span-3"
        >
          <template #header>
            <div v-slavia-reveal="'fade-right'">
              <p class="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
                Wynik
              </p>
              <h2 class="mt-1 text-lg font-bold text-highlighted">
                Szacowany Max PR
              </h2>
            </div>
          </template>

          <div
            v-slavia-reveal="'scale'"
            :data-slavia-reveal-delay="80"
            class="flex min-h-[200px] flex-col justify-center"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-muted">
              {{ liftLabel }} · {{ formulaMeta.label }}
            </p>
            <p
              v-if="estimatedMax != null"
              class="mt-3 font-mono text-5xl font-black tabular-nums text-primary sm:text-6xl"
            >
              {{ fmtKg(estimatedMax) }}
              <span class="text-2xl font-semibold text-muted">kg</span>
            </p>
            <p v-else class="mt-3 text-lg text-muted">
              Wpisz ciężar i powtórzenia — wynik pojawi się na żywo.
            </p>
            <p v-if="weightKg != null && reps != null && reps > 12" class="mt-3 text-sm text-warning">
              Przy wysokiej liczbie powtórzeń szacunek jest mniej wiarygodny — traktuj wynik orientacyjnie.
            </p>
          </div>

          <USeparator v-if="percentRows.length" class="my-8" />

          <div
            v-if="percentRows.length"
            v-slavia-reveal="'fade-up'"
            :data-slavia-reveal-delay="120"
          >
            <h3 class="text-sm font-bold text-highlighted">
              Procenty od szacowanego 1RM
            </h3>
            <p class="mt-1 text-xs text-muted">
              Szybki podgląd obciążeń treningowych (zaokrąglenie do 0,5 kg).
            </p>
            <div
              v-slavia-reveal="'fade-up'"
              :data-slavia-reveal-delay="160"
              class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"
            >
              <div
                v-for="row in percentRows"
                :key="row.percent"
                v-slavia-reveal="'scale'"
                class="rounded-xl border border-default/60 bg-muted/10 px-3 py-2 text-center"
              >
                <p class="text-[10px] font-bold uppercase text-muted">
                  {{ row.percent }}%
                </p>
                <p class="mt-0.5 font-mono text-lg font-bold tabular-nums text-highlighted">
                  {{ fmtKg(row.kg) }}
                  <span class="text-xs font-medium text-muted">kg</span>
                </p>
              </div>
            </div>
          </div>

          <USeparator class="my-8" />

          <div class="space-y-2 text-sm text-muted">
            <p>
              <span class="font-semibold text-highlighted">Epley:</span>
              1RM = ciężar × (1 + powtórzenia / 30) — domyślny, sprawdzony w planowaniu siły.
            </p>
            <p>
              <span class="font-semibold text-highlighted">Brzycki:</span>
              lepszy przy niskiej liczbie powtórzeń (np. 2–6); przy reps ≥ 37 nie liczymy.
            </p>
            <p class="text-xs">
              To szacunek z jednej serii — nie zastępuje testu 1RM na platformie ani zgłoszenia w rankingu
              <NuxtLink to="/athlete/exercises" class="font-semibold text-primary hover:underline">
                Inne ćwiczenia
              </NuxtLink>
              (wymaga konta zawodnika).
            </p>
          </div>
        </UCard>
      </div>

      <div
        v-slavia-reveal="'fade-up'"
        :data-slavia-reveal-delay="100"
        class="flex flex-wrap gap-3"
      >
        <UButton
          to="/kalkulator-proporcji"
          variant="soft"
          color="neutral"
          icon="i-lucide-sigma"
        >
          Kalkulator proporcji (dwubój)
        </UButton>
        <UButton
          to="/kalkulator-sinclair"
          variant="soft"
          color="neutral"
          icon="i-lucide-calculator"
        >
          Kalkulator Sinclair
        </UButton>
      </div>
    </div>
  </PublicPageLayout>
</template>
