<script setup lang="ts">
import { BOARD_DOCS_SUBNAV, isBoardDocsSubnavActive } from '~/data/boardDocsSubnav'

definePageMeta({ middleware: ['auth', 'board-member'] })

useSlaviaSeo({
  title: 'Generator dokumentów — Slavia',
  description: 'Generator raportów zarządu i list startowych.',
  noindex: true
})

const route = useRoute()
const {
  selectedKind,
  meetingDate,
  meetingTitle,
  competitionId,
  saveToRepo,
  generating,
  lastResult,
  error,
  boardStatus,
  kindOptions,
  competitionOptions,
  competitionsPending,
  canSaveToRepo,
  canGenerateStartList,
  loadCompetitions,
  checkStatus,
  runGenerate,
  downloadResult
} = useBoardDocumentGeneratorPage()

onMounted(() => {
  void Promise.all([checkStatus(), loadCompetitions()])
})
</script>

<template>
  <KlubPageShell
    icon="i-lucide-wand-sparkles"
    page-label="Generator"
    page-icon="i-lucide-wand-sparkles"
    staff-title="Generator dokumentów"
    staff-description="Raporty na zebrania i listy startowe — dane z bazy Slavia, zapis opcjonalnie do Slavia-cms."
    athlete-title="Generator dokumentów"
    athlete-description="Narzędzia generowania dokumentów zarządu."
  >
    <template #subnav>
      <UButton
        v-for="item in BOARD_DOCS_SUBNAV"
        :key="item.id"
        :to="item.to"
        size="lg"
        class="min-h-11"
        :variant="isBoardDocsSubnavActive(route.path, item) ? 'solid' : 'outline'"
        :color="isBoardDocsSubnavActive(route.path, item) ? 'primary' : 'neutral'"
        :icon="item.icon"
      >
        {{ item.label }}
      </UButton>
    </template>

    <UAlert
      v-if="boardStatus && !boardStatus.board_docs_ready"
      color="warning"
      variant="soft"
      icon="i-lucide-alert-triangle"
      class="mb-4"
      title="Slavia-cms niegotowe"
      description="Generowanie i pobieranie działa, ale zapis do repozytorium wymaga skonfigurowanego PAT i folderu board/."
    />

    <div class="grid gap-4 lg:grid-cols-2">
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Rodzaj dokumentu
          </h2>
        </template>

        <div class="space-y-3">
          <button
            v-for="opt in kindOptions"
            :key="opt.value"
            type="button"
            class="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors"
            :class="selectedKind === opt.value
              ? 'border-primary bg-primary/5'
              : 'border-default/60 hover:border-primary/30'"
            :disabled="opt.disabled"
            @click="selectedKind = opt.value"
          >
            <UIcon :name="opt.icon" class="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p class="font-medium text-highlighted">
                {{ opt.label }}
              </p>
              <p class="text-sm text-muted">
                {{ opt.description }}
              </p>
            </div>
          </button>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Parametry
          </h2>
        </template>

        <div class="space-y-4">
          <template v-if="selectedKind === 'meeting_report'">
            <UFormField label="Tytuł raportu">
              <UInput v-model="meetingTitle" />
            </UFormField>
            <UFormField label="Data zebrania" hint="YYYY-MM-DD (opcjonalnie)">
              <UInput v-model="meetingDate" type="date" />
            </UFormField>
          </template>

          <template v-else>
            <UFormField label="Zawody">
              <USelect
                v-model="competitionId"
                :items="competitionOptions"
                :loading="competitionsPending"
                placeholder="Wybierz zawody"
              />
            </UFormField>
            <UAlert
              v-if="!canGenerateStartList"
              color="warning"
              variant="subtle"
              icon="i-lucide-lock"
              title="Wymagany pełny dostęp"
              description="Listy startowe mogą generować prezes/wice lub SuperAdmin."
            />
          </template>

          <UFormField v-if="canSaveToRepo">
            <UCheckbox v-model="saveToRepo" label="Zapisz od razu do repozytorium Slavia-cms" />
          </UFormField>

          <UButton
            color="primary"
            icon="i-lucide-sparkles"
            :loading="generating"
            @click="() => { void runGenerate() }"
          >
            Generuj
          </UButton>

          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            :title="error"
          />
        </div>
      </UCard>
    </div>

    <UCard v-if="lastResult" class="mt-6">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="font-semibold text-highlighted">
            Podgląd wyniku
          </h2>
          <div class="flex gap-2">
            <UButton
              size="sm"
              variant="soft"
              icon="i-lucide-download"
              @click="downloadResult(lastResult)"
            >
              Pobierz {{ lastResult.filename }}
            </UButton>
            <UButton
              v-if="lastResult.document"
              size="sm"
              color="primary"
              :to="`/klub/dokumenty/${lastResult.document.id}`"
            >
              Otwórz w repozytorium
            </UButton>
          </div>
        </div>
      </template>

      <BoardDocumentPreviewPanel
        v-if="lastResult"
        :payload="{
          title: 'Podgląd wyniku generatora',
          content: lastResult.content,
          mimeType: lastResult.mime_type,
          source: 'skeleton'
        }"
      />
    </UCard>
  </KlubPageShell>
</template>
