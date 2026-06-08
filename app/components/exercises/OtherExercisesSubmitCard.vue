<script setup lang="ts">
defineProps<{
  exerciseItems: { label: string, value: string }[]
  selectedExerciseId: string
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:selectedExerciseId': [value: string]
  submit: [payload: { value: number, performed_at: string, notes: string }]
}>()

const form = reactive({
  value: null as number | null,
  performed_at: new Date().toISOString().slice(0, 10),
  notes: ''
})

function onSubmit() {
  const v = form.value != null ? Number(form.value) : null
  if (v == null || !Number.isFinite(v) || v <= 0) return
  emit('submit', {
    value: v,
    performed_at: form.performed_at,
    notes: form.notes
  })
}

function resetForm() {
  form.value = null
  form.notes = ''
}

defineExpose({ resetForm })
</script>

<template>
  <UCard>
    <h2 class="mb-1 text-lg font-semibold text-highlighted">Zgłoś wynik do weryfikacji</h2>
    <p class="mb-3 text-sm text-muted">
      Kadra zatwierdzi wpis — dopiero wtedy trafi do rankingu klubu.
    </p>
    <div class="grid gap-3 sm:grid-cols-4">
      <UFormField label="Ćwiczenie">
        <USelect
          :model-value="selectedExerciseId"
          :items="exerciseItems"
          size="lg"
          class="w-full"
          @update:model-value="emit('update:selectedExerciseId', $event)"
        />
      </UFormField>
      <UFormField label="Wynik (kg)">
        <UInputNumber v-model="form.value" :min="0" :step="0.5" size="lg" class="w-full" />
      </UFormField>
      <UFormField label="Data">
        <UInput v-model="form.performed_at" type="date" size="lg" class="w-full" />
      </UFormField>
      <UFormField label="Notatka (opcjonalnie)">
        <UInput v-model="form.notes" size="lg" class="w-full" placeholder="np. belt, pauza, RPE…" />
      </UFormField>
    </div>
    <div class="mt-3">
      <UButton icon="i-lucide-send" :loading="saving" @click="onSubmit">
        Wyślij do kadry
      </UButton>
    </div>
  </UCard>
</template>
