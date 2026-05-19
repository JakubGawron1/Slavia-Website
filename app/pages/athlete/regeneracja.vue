<script setup lang="ts">
import type { RecoveryLog } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Regeneracja — zawodnik',
  robots: 'noindex, nofollow'
})

const apiFetch = useApi()
const toast = useToast()

const form = reactive({
  date: new Date().toISOString().slice(0, 10),
  sleep_hours: 8,
  fatigue_level: 5,
  soreness_level: 5,
  readiness_level: 5,
  note: ''
})

const { data: logs, refresh, pending } = await useAsyncData(
  'athlete-recovery-logs',
  () => apiFetch<RecoveryLog[]>('/api/recovery').catch(() => []),
  { default: () => [] }
)

const saving = ref(false)
async function saveCheckin() {
  saving.value = true
  try {
    await apiFetch('/api/recovery', { method: 'POST', body: form })
    toast.add({ title: 'Check-in zapisany', color: 'success' })
    await refresh()
  } catch (e) {
    toast.add({ title: 'Błąd zapisu', description: getApiErrorMessage(e), color: 'error' })
  } finally {
    saving.value = false
  }
}

const scaleLegend = [
  { title: 'Zmęczenie', text: 'Jak bardzo czujesz się zmęczony/a ogólnie po ostatnich jednostkach (1 — świeży/a, 10 — „nie mam nic w zbiorniku”).' },
  { title: 'Ból / obciążenie', text: 'Sztywność, zakwasy, punkty napięcia — nie koniecznie kontuzja (1 — komfort, 10 — bardzo obciążone).' },
  { title: 'Gotowość', text: 'Subiektywna gotowość na intensywny trening dziś lub jutro (1 — lepiej odpocząć, 10 — pełna dyspozycja).' }
] as const
</script>

<template>
  <PanelPageLayout narrow>
    <PanelPageHeader
      area="athlete"
      eyebrow="Dobrostan"
      title="Regeneracja"
      icon="i-lucide-heart-pulse"
      description="Krótki check-in pomaga trenerowi widzieć trend snu i zmęczenia — nie zastępuje rozmowy, ale ułatwia planowanie obciążeń."
    />

    <div class="mb-10 grid gap-4 sm:grid-cols-3">
      <UCard
        v-for="item in scaleLegend"
        :key="item.title"
        class="border-default/70 bg-muted/5"
      >
        <p class="text-xs font-bold uppercase tracking-wide text-primary">
          {{ item.title }}
        </p>
        <p class="mt-2 text-sm leading-relaxed text-muted">
          {{ item.text }}
        </p>
      </UCard>
    </div>

    <UCard class="mb-10 overflow-hidden border-primary/20 ring-1 ring-primary/10">
      <div class="border-b border-default/60 bg-primary/5 px-5 py-4 dark:bg-primary/10">
        <h2 class="flex items-center gap-2 text-base font-bold text-highlighted">
          <UIcon name="i-lucide-clipboard-pen-line" class="size-5 text-primary" />
          Dzisiejszy wpis
        </h2>
        <p class="mt-1 text-xs text-muted">
          Wypełnij w ciągu minuty — jedna data = jeden rekord (aktualizacja nadpisuje ten sam dzień po stronie API).
        </p>
      </div>
      <div class="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <UFormField label="Data wpisu">
          <UInput v-model="form.date" type="date" size="lg" class="w-full" />
        </UFormField>
        <UFormField label="Sen (godz.)" description="Szacunek snu nocnego">
          <UInputNumber v-model="form.sleep_hours" :min="0" :max="24" :step="0.5" class="w-full" />
        </UFormField>
        <UFormField label="Zmęczenie (1–10)">
          <UInputNumber v-model="form.fatigue_level" :min="1" :max="10" class="w-full" />
        </UFormField>
        <UFormField label="Ból / obciążenie (1–10)">
          <UInputNumber v-model="form.soreness_level" :min="1" :max="10" class="w-full" />
        </UFormField>
        <UFormField label="Gotowość treningowa (1–10)">
          <UInputNumber v-model="form.readiness_level" :min="1" :max="10" class="w-full" />
        </UFormField>
        <UFormField label="Notatka" class="sm:col-span-2 lg:col-span-3" description="Opcjonalnie: jakość snu, stres, jednostki">
          <UInput v-model="form.note" placeholder="Np. krótki sen przed zmianą…" size="lg" class="w-full" />
        </UFormField>
      </div>
      <div class="flex flex-wrap gap-2 border-t border-default/60 px-5 py-4">
        <UButton :loading="saving" color="primary" size="lg" icon="i-lucide-save" @click="saveCheckin">
          Zapisz check-in
        </UButton>
      </div>
    </UCard>

    <section>
      <h2 class="mb-4 flex items-center gap-2 text-lg font-bold text-highlighted">
        <UIcon name="i-lucide-history" class="size-5 text-muted" />
        Historia
      </h2>
      <div v-if="pending" class="flex items-center gap-2 text-sm text-muted">
        <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
        Ładowanie…
      </div>
      <div v-else class="space-y-3">
        <UCard
          v-for="r in logs"
          :key="r.id"
          class="border-default/60 transition hover:border-primary/25"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <p class="font-bold tabular-nums text-highlighted">
              {{ r.date }}
            </p>
            <UBadge variant="subtle" color="neutral" size="sm">
              sen {{ r.sleep_hours }}h
            </UBadge>
          </div>
          <div class="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-3">
            <span>Zmęczenie <strong class="text-highlighted">{{ r.fatigue_level }}</strong>/10</span>
            <span>Ból <strong class="text-highlighted">{{ r.soreness_level }}</strong>/10</span>
            <span>Gotowość <strong class="text-highlighted">{{ r.readiness_level }}</strong>/10</span>
          </div>
          <p v-if="r.note" class="mt-3 rounded-lg border border-default/50 bg-muted/10 px-3 py-2 text-sm text-muted">
            {{ r.note }}
          </p>
        </UCard>
        <PublicEmptyState
          v-if="(logs || []).length === 0"
          compact
          icon="i-lucide-heart-pulse"
          title="Brak wpisów regeneracji"
          description="Zapisz pierwszy check-in w formularzu powyżej."
        />
      </div>
    </section>
  </PanelPageLayout>
</template>
