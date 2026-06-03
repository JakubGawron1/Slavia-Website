<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi'
import type { Athlete, CompetitionResult } from '~/types/models'

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()
const route = useRoute()

const { data: bundle, refresh } = await useAsyncData(
  'athlete-results-panel',
  async () => {
    await auth.ensureSession()
    const roles = auth.user.value?.roles ?? []
    if (!roles.includes('Athlete') && !roles.includes('SuperAdmin')) {
      return { athlete: null as Athlete | null, results: [] as CompetitionResult[] }
    }
    const athlete = await apiFetch<Athlete | null>('/api/athletes/me').catch(() => null)
    const results = athlete?.id
      ? await apiFetch<CompetitionResult[]>(`/api/results/athlete/${athlete.id}/submissions`).catch(() => [])
      : []
    return { athlete, results }
  },
  { default: () => ({ athlete: null, results: [] }) }
)

const athlete = computed(() => bundle.value?.athlete ?? null)
const results = computed(() => bundle.value?.results ?? [])
const recentResults = computed(() => results.value)
const pendingCount = computed(() => results.value.filter(r => r.status === 'Pending').length)

const resultForm = reactive({
  kind: 'competition' as 'competition' | 'training',
  location: '',
  snatch: null as number | null,
  clean_and_jerk: null as number | null,
  total: 0,
  bodyweight: null as number | null,
  date: new Date().toISOString().substring(0, 10)
})

watch(
  () => [resultForm.snatch, resultForm.clean_and_jerk],
  ([snatch, clean]) => {
    resultForm.total = (snatch || 0) + (clean || 0)
  }
)

const sinclairValue = ref(0)
watch(
  () => [resultForm.total, resultForm.bodyweight, athlete.value?.bodyweight, athlete.value?.gender],
  async () => {
    const g = athlete.value?.gender === 'female' ? 'female' : 'male'
    const w = resultForm.bodyweight || athlete.value?.bodyweight || 0
    if (w <= 0 || resultForm.total <= 0) {
      sinclairValue.value = 0
      return
    }
    const { sinclairTotal } = await import('~/utils/sinclair')
    sinclairValue.value = sinclairTotal(resultForm.total, w, g)
  },
  { immediate: true }
)

function useProfileWeight() {
  if (athlete.value?.bodyweight) {
    resultForm.bodyweight = athlete.value.bodyweight
  }
}

function applySinclairQueryFromRoute() {
  const q = route.query
  const bw = Number(q.sinclair_bw)
  const tot = Number(q.sinclair_total)
  if (Number.isFinite(bw) && bw > 0) resultForm.bodyweight = bw
  if (Number.isFinite(tot) && tot > 0) {
    resultForm.snatch = Math.floor(tot / 2)
    resultForm.clean_and_jerk = tot - (resultForm.snatch || 0)
    resultForm.total = tot
  }
}

onMounted(() => {
  applySinclairQueryFromRoute()
})

async function submitResult() {
  if (!athlete.value) {
    toast.add({ title: 'Brak profilu zawodnika', color: 'warning' })
    return
  }
  const hasOly =
    (resultForm.snatch != null && resultForm.snatch > 0)
    || (resultForm.clean_and_jerk != null && resultForm.clean_and_jerk > 0)
  if (!hasOly) {
    toast.add({ title: 'Uzupełnij formularz', description: 'Podaj rwanie i/lub podrzut.', color: 'warning' })
    return
  }

  try {
    const body: Record<string, unknown> = {
      athlete_id: athlete.value.id,
      date: resultForm.date,
      kind: resultForm.kind
    }
    if (resultForm.kind === 'competition' && resultForm.location.trim()) {
      body.location = resultForm.location.trim()
    }
    if (resultForm.snatch != null && resultForm.snatch >= 0) body.snatch = resultForm.snatch
    if (resultForm.clean_and_jerk != null && resultForm.clean_and_jerk >= 0) body.clean_and_jerk = resultForm.clean_and_jerk
    if (resultForm.snatch != null || resultForm.clean_and_jerk != null) body.total = resultForm.total
    if (resultForm.bodyweight != null && resultForm.bodyweight > 0) {
      body.bodyweight_kg = resultForm.bodyweight
    }

    await apiFetch('/api/results', { method: 'POST', body })
    toast.add({
      title: 'Zgłoszono wynik',
      description: 'Kadra zatwierdzi wpis w systemie.',
      color: 'success'
    })
    resultForm.snatch = null
    resultForm.clean_and_jerk = null
    resultForm.total = 0
    resultForm.date = new Date().toISOString().substring(0, 10)
    resultForm.kind = 'competition'
    resultForm.location = ''
    await refresh()
  } catch (e) {
    toast.add({ title: 'Błąd zgłoszenia', description: getApiErrorMessage(e), color: 'error' })
  }
}
</script>

<template>
  <div v-if="!auth.canAccessAthletePortal" class="rounded-2xl border border-warning/30 bg-warning/5 p-6">
    <p class="text-sm text-muted">Brak dostępu do panelu zawodnika.</p>
  </div>

  <UAlert
    v-else-if="!athlete"
    icon="i-lucide-info"
    title="Brak powiązanego profilu"
    description="Skontaktuj się z administratorem, aby połączyć konto z rekordem zawodnika."
    color="warning"
    variant="subtle"
    class="rounded-2xl"
  />

  <div v-else class="grid gap-10 xl:grid-cols-12">
    <div class="space-y-6 xl:col-span-7">
      <div
        v-if="pendingCount > 0"
        class="rounded-2xl border border-warning/35 bg-warning/8 px-4 py-3 text-sm"
      >
        <span class="font-bold text-warning">{{ pendingCount }}</span>
        <span class="text-muted"> zgłoszeń czeka na zatwierdzenie przez kadrę.</span>
      </div>

      <div class="slavia-form-panel shadow-md">
        <div class="slavia-form-panel__header">
          <div class="slavia-form-panel__title">
            <span class="slavia-form-panel__icon">
              <UIcon name="i-lucide-dumbbell" class="size-4" />
            </span>
            Zgłoś wynik
          </div>
          <p class="slavia-form-panel__desc">
            <strong>Zawody</strong> trafiają do rankingu po zatwierdzeniu;
            <strong>trening</strong> jest widoczny tylko po zalogowaniu.
          </p>
        </div>
        <div class="slavia-form-panel__body">
          <div class="slavia-form-grid grid-cols-1 sm:max-w-md">
            <UFormField label="Typ wpisu">
              <select v-model="resultForm.kind" class="slavia-select w-full py-3 text-[15px]">
                <option value="competition">Zawody (publiczne)</option>
                <option value="training">Trening (po zalogowaniu)</option>
              </select>
            </UFormField>
          </div>
          <div v-if="resultForm.kind === 'competition'" class="slavia-form-grid grid-cols-1 sm:max-w-2xl">
            <UFormField label="Miejsce zawodów" description="Opcjonalnie">
              <UInput v-model="resultForm.location" placeholder="np. Ruda Śląska" size="lg" class="w-full" />
            </UFormField>
          </div>
          <div class="slavia-form-grid grid-cols-1 border-t border-default/40 pt-5 sm:grid-cols-2">
            <UFormField label="Rwanie (kg)">
              <UInputNumber v-model="resultForm.snatch" :min="0" :step="0.5" size="lg" class="w-full" />
            </UFormField>
            <UFormField label="Podrzut (kg)">
              <UInputNumber v-model="resultForm.clean_and_jerk" :min="0" :step="0.5" size="lg" class="w-full" />
            </UFormField>
            <UFormField label="Data">
              <UInput v-model="resultForm.date" type="date" size="lg" class="w-full" />
            </UFormField>
            <UFormField label="Suma (dwubój)">
              <UInputNumber :value="resultForm.total" size="lg" class="w-full" disabled />
            </UFormField>
            <UFormField label="Waga ciała (kg)">
              <div class="flex gap-2">
                <UInputNumber v-model="resultForm.bodyweight" :min="0" :step="0.1" size="lg" class="flex-1" />
                <UButton
                  v-if="athlete?.bodyweight"
                  variant="outline"
                  color="neutral"
                  icon="i-lucide-user"
                  @click="useProfileWeight"
                >
                  Z profilu
                </UButton>
              </div>
            </UFormField>
            <UFormField label="Sinclair">
              <div class="flex h-11 items-center rounded-lg border border-default bg-muted/20 px-4 font-black text-primary">
                {{ sinclairValue.toFixed(2) }} pkt
              </div>
            </UFormField>
          </div>
          <div class="slavia-form-actions border-t border-default/60 pt-5">
            <UButton color="primary" size="lg" icon="i-lucide-send" @click="submitResult">
              Zgłoś wynik
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <div class="xl:col-span-5">
      <h2 class="mb-4 text-lg font-black text-highlighted">
        Historia zgłoszeń
      </h2>
      <UCard v-if="recentResults.length" :ui="{ body: 'p-0' }" class="overflow-hidden rounded-2xl">
        <table class="w-full text-sm">
          <thead class="border-b border-default bg-muted/30">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-muted">Data</th>
              <th class="px-4 py-3 text-center font-semibold text-muted">Suma</th>
              <th class="px-4 py-3 text-center font-semibold text-muted">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="r in recentResults" :key="r.id" class="hover:bg-muted/10">
              <td class="px-4 py-3 text-muted">{{ r.date.slice(0, 10) }}</td>
              <td class="px-4 py-3 text-center font-bold">{{ r.total }} kg</td>
              <td class="px-4 py-3 text-center">
                <UBadge
                  :color="r.status === 'Approved' ? 'success' : (r.status === 'Rejected' ? 'error' : 'warning')"
                  variant="subtle"
                  size="sm"
                >
                  {{ r.status === 'Approved' ? 'OK' : (r.status === 'Rejected' ? 'Odrzucony' : 'Czeka') }}
                </UBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </UCard>
      <PublicEmptyState
        v-else
        compact
        icon="i-lucide-trophy"
        title="Brak zgłoszeń"
        description="Wyślij pierwszy wynik formularzem obok."
      />
    </div>
  </div>
</template>
