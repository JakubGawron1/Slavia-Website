<script setup lang="ts">
import type { ExerciseSubmissionDto } from '~/types/models'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  submission: ExerciseSubmissionDto | null
  mode: 'approve' | 'reject'
  saving?: boolean
}>()

const emit = defineEmits<{
  confirm: [reviewNote: string]
}>()

const reviewNote = ref('')

watch(
  () => props.submission,
  () => {
    reviewNote.value = ''
  }
)

function onConfirm() {
  emit('confirm', reviewNote.value.trim())
}
</script>

<template>
  <SlaviaModal
    v-model:open="open"
    :title="mode === 'approve' ? 'Zatwierdź zgłoszenie' : 'Odrzuć zgłoszenie'"
    :dismissible="true"
    :ui="{ content: 'rounded-3xl sm:max-w-2xl' }"
  >
    <template #body>
      <div v-if="submission" class="space-y-4">
        <div class="rounded-2xl border border-default/60 bg-muted/10 p-4">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge color="neutral" variant="subtle" size="sm">
              {{ submission.athlete_name || submission.athlete_id }}
            </UBadge>
            <UBadge color="primary" variant="subtle" size="sm">
              {{ submission.exercise_name }}
            </UBadge>
            <UBadge color="success" variant="subtle" size="sm" class="font-mono">
              {{ submission.value }} {{ submission.unit }}
            </UBadge>
            <UBadge color="neutral" variant="subtle" size="sm" class="font-mono">
              {{ submission.performed_at }}
            </UBadge>
          </div>
          <p v-if="submission.notes" class="mt-3 text-sm text-muted">
            <span class="font-semibold text-highlighted">Notatka zawodnika:</span>
            {{ submission.notes }}
          </p>
          <p v-else class="mt-3 text-sm text-muted">
            <span class="font-semibold text-highlighted">Notatka zawodnika:</span> —
          </p>
        </div>

        <UFormField
          :label="mode === 'approve' ? 'Notatka do zawodnika (opcjonalnie)' : 'Powód odrzucenia (zalecane)'"
        >
          <UTextarea
            v-model="reviewNote"
            :rows="4"
            placeholder="Np. OK. Zatwierdzone. / Brak dowodu / Zła data / Podejrzana wartość…"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="outline" @click="open = false">
            Anuluj
          </UButton>
          <UButton
            :color="mode === 'approve' ? 'primary' : 'error'"
            :loading="saving"
            @click="onConfirm"
          >
            {{ mode === 'approve' ? 'Zatwierdź' : 'Odrzuć' }}
          </UButton>
        </div>
      </div>
    </template>
  </SlaviaModal>
</template>
