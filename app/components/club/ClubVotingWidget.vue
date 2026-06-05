<script setup lang="ts">
import type { Athlete, ClubVoteMyVote } from '~/types/models'
import { getApiErrorMessage } from '~/composables/useApi'

const apiFetch = useApi()
const toast = useToast()

const { data: athletes } = await useAsyncData('voting-athletes', () => apiFetch<Athlete[]>('/api/athletes').catch(() => []))
const { data: myVote, refresh: refreshMyVote } = await useAsyncData('my-club-vote', () => apiFetch<ClubVoteMyVote>('/api/club-votes/my-vote').catch(() => ({ athlete_id: null })))

const selectedAthleteId = ref<string | undefined>(undefined)
const isSubmitting = ref(false)

async function submitVote() {
  if (!selectedAthleteId.value) return
  isSubmitting.value = true
  try {
    await apiFetch('/api/club-votes', {
      method: 'POST',
      body: { athlete_id: selectedAthleteId.value }
    })
    toast.add({ title: 'Głos oddany!', color: 'success' })
    await refreshMyVote()
  } catch (e: unknown) {
    toast.add({
      title: 'Błąd głosowania',
      description: getApiErrorMessage(e, 'Nie udało się oddać głosu.'),
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

const currentMonthName = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' }).format(new Date())
</script>

<template>
  <UCard class="border-primary/30 bg-primary/5">
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
          <UIcon name="i-lucide-award" class="size-6" />
        </div>
        <div>
          <h3 class="text-lg font-bold text-highlighted">Zawodnik Miesiąca</h3>
          <p class="text-xs text-muted">{{ currentMonthName }}</p>
        </div>
      </div>

      <div v-if="myVote?.athlete_id" class="rounded-xl border border-success/30 bg-success/10 p-4">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-check-circle" class="size-5 text-success" />
          <div>
            <p class="text-sm font-semibold text-highlighted">Głos oddany!</p>
            <p class="text-xs text-muted">Twój wybór: <span class="font-bold text-primary">{{ myVote.athlete_name }}</span></p>
          </div>
        </div>
      </div>

      <div v-else class="space-y-4">
        <p class="text-sm text-muted">
          Wybierz zawodnika, który Twoim zdaniem najbardziej wyróżnił się w tym miesiącu (progres, frekwencja, postawa).
        </p>
        
        <USelect
          v-model="selectedAthleteId"
          :items="(athletes || []).map(a => ({ label: a.full_name, value: a.id }))"
          placeholder="Wybierz zawodnika..."
          size="lg"
        />

        <UButton
          block
          size="lg"
          icon="i-lucide-send"
          :loading="isSubmitting"
          :disabled="!selectedAthleteId"
          @click="submitVote"
        >
          Oddaj głos
        </UButton>
      </div>
    </div>
  </UCard>
</template>
