<script setup lang="ts">
import { RECOVERY_SCALE_LEGEND, useAthleteRecoveryLogs } from '~/composables/useRecoveryLogs'

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Regeneracja — zawodnik',
  robots: 'noindex, nofollow'
})

const { form, logs, pending, saving, saveCheckin } = useAthleteRecoveryLogs()
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
        v-for="item in RECOVERY_SCALE_LEGEND"
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
          <UInput v-model="form.date" type="date" size="lg" class="w-full" data-form-field="date" />
        </UFormField>
        <UFormField label="Sen (godz.)" description="Szacunek snu nocnego">
          <UInputNumber v-model="form.sleep_hours" :min="0" :max="24" :step="0.5" class="w-full" data-form-field="sleep" />
        </UFormField>
        <UFormField label="Zmęczenie (1–10)">
          <UInputNumber v-model="form.fatigue_level" :min="1" :max="10" class="w-full" data-form-field="fatigue" />
        </UFormField>
        <UFormField label="Ból / obciążenie (1–10)">
          <UInputNumber v-model="form.soreness_level" :min="1" :max="10" class="w-full" data-form-field="soreness" />
        </UFormField>
        <UFormField label="Gotowość treningowa (1–10)">
          <UInputNumber v-model="form.readiness_level" :min="1" :max="10" class="w-full" data-form-field="readiness" />
        </UFormField>
        <UFormField label="Notatka" class="sm:col-span-2 lg:col-span-3" description="Opcjonalnie: jakość snu, stres, jednostki">
          <UInput v-model="form.note" placeholder="Np. krótki sen przed zmianą…" size="lg" class="w-full" data-form-field="note" />
        </UFormField>
      </div>
      <div class="flex flex-wrap gap-2 border-t border-default/60 px-5 py-4">
        <UButton :loading="saving" color="primary" size="lg" icon="i-lucide-save" @click="saveCheckin">
          Zapisz check-in
        </UButton>
      </div>
    </UCard>

    <RecoveryLogHistory :logs="logs || []" :pending="pending" />
  </PanelPageLayout>
</template>
