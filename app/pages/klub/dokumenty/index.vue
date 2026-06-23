<script setup lang="ts">
import { KLUB_BOARD_ROUTES } from '~/config/klubRoutes'
import { BOARD_DOCS_SUBNAV, isBoardDocsSubnavActive } from '~/data/boardDocsSubnav'
import type { BoardDocumentEntry } from '~/types/boardDocuments'

definePageMeta({ middleware: ['auth', 'board-member'] })

useSlaviaSeo({
  title: 'Dokumenty klubu — Slavia',
  description: 'Repozytorium dokumentów zarządu w Slavia-cms (GitHub).',
  noindex: true
})

const route = useRoute()
const auth = useAuth()
const {
  filteredDocuments,
  recentDocuments,
  filters,
  categoryOptions,
  docTypeOptions,
  folderFilterOptions,
  pending,
  error,
  backendUnavailable,
  boardStatus,
  docTypeLabel,
  resetFilters,
  refresh
} = useBoardDocumentsPage()

onMounted(() => {
  void refresh()
})

const quickPreviewRef = ref<{ showDocument: (doc: BoardDocumentEntry) => Promise<void> } | null>(null)

function openPreview(doc: BoardDocumentEntry) {
  void quickPreviewRef.value?.showDocument(doc)
}
</script>

<template>
  <KlubPageShell
    icon="i-lucide-folder-lock"
    page-label="Dokumenty"
    page-icon="i-lucide-folder-lock"
    staff-title="Dokumenty klubu"
    staff-description="Repozytorium dokumentów zarządu w Slavia-cms — folder board/ na GitHubie, dostęp wyłącznie przez backend."
    athlete-title="Dokumenty klubu"
    athlete-description="Repozytorium dokumentów zarządu klubu (Slavia-cms)."
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

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <UBadge v-if="auth.isBoardDocsFullAccess.value" color="primary" variant="subtle" size="sm">
        Pełny dostęp
      </UBadge>
      <UBadge
        v-if="boardStatus"
        :color="boardStatus.board_docs_ready ? 'success' : 'warning'"
        variant="subtle"
        size="sm"
      >
        {{ boardStatus.board_docs_ready ? 'Slavia-cms gotowe' : 'Slavia-cms w konfiguracji' }}
      </UBadge>
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-lucide-refresh-cw"
        :loading="pending"
        @click="refresh"
      >
        Odśwież
      </UButton>
    </div>

    <PanelCollapsibleSection
      section-id="board-docs-filters"
      title="Filtry"
      icon="i-lucide-filter"
      :default-open="true"
      class="mb-6"
    >
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <UFormField label="Szukaj">
          <UInput v-model="filters.query" placeholder="Tytuł, typ, folder…" icon="i-lucide-search" />
        </UFormField>
        <UFormField label="Kategoria">
          <USelect v-model="filters.category" :items="categoryOptions" />
        </UFormField>
        <UFormField label="Typ dokumentu">
          <USelect v-model="filters.docType" :items="docTypeOptions" />
        </UFormField>
        <UFormField label="Folder">
          <USelect v-model="filters.folder" :items="folderFilterOptions" />
        </UFormField>
      </div>
      <div class="mt-3">
        <UButton size="sm" variant="ghost" color="neutral" @click="resetFilters">
          Wyczyść filtry
        </UButton>
      </div>
    </PanelCollapsibleSection>

    <UCard>
      <div v-if="pending" class="flex items-center gap-2 text-muted">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
        <span>Ładowanie repozytorium…</span>
      </div>

      <div v-else-if="backendUnavailable" class="space-y-3">
        <UAlert
          color="warning"
          variant="soft"
          icon="i-lucide-construction"
          title="Repozytorium niedostępne"
          :description="error ?? 'Backend dokumentów zarządu nie jest jeszcze skonfigurowany.'"
        />
        <p class="text-sm text-muted">
          Dokumenty przechowujemy w prywatnym folderze
          <code class="text-xs">board/</code>
          repozytorium Slavia-cms na GitHubie. Backend wymaga
          <code class="text-xs">GITHUB_TOKEN</code>
          (scope <code class="text-xs">repo</code>) oraz endpointów
          <code class="text-xs">/api/board/documents</code>.
        </p>
      </div>

      <div v-else-if="!filteredDocuments.length" class="space-y-3">
        <UAlert
          color="neutral"
          variant="soft"
          icon="i-lucide-inbox"
          title="Brak dokumentów"
          description="Repozytorium jest puste lub filtry nie pasują do żadnego wpisu."
        />
        <div class="flex flex-wrap gap-2">
          <UButton :to="KLUB_BOARD_ROUTES.generator" icon="i-lucide-wand-sparkles" color="primary">
            Generator raportów
          </UButton>
          <UButton :to="KLUB_BOARD_ROUTES.typy" variant="soft" color="neutral" icon="i-lucide-tags">
            Katalog typów
          </UButton>
        </div>
      </div>

      <div v-else class="space-y-6">
        <PanelCollapsibleSection
          v-if="recentDocuments.length && !filters.query && filters.category === 'all'"
          section-id="board-docs-recent"
          title="Ostatnie dokumenty"
          icon="i-lucide-clock"
          :default-open="true"
          embedded
        >
          <ul class="divide-y divide-default">
            <li
              v-for="doc in recentDocuments"
              :key="`recent-${doc.id}`"
              class="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <NuxtLink
                  :to="`${KLUB_BOARD_ROUTES.dokumenty}/${doc.id}`"
                  class="font-medium text-highlighted hover:text-primary"
                >
                  {{ doc.title }}
                </NuxtLink>
                <p class="text-sm text-muted">
                  {{ docTypeLabel(doc.doc_type) }}
                  <span v-if="doc.folder"> · {{ doc.folder }}</span>
                </p>
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  icon="i-lucide-eye"
                  aria-label="Podgląd"
                  @click.stop="openPreview(doc)"
                />
                <UBadge v-if="doc.mime_type" color="neutral" variant="subtle" size="sm">
                  {{ doc.mime_type }}
                </UBadge>
              </div>
            </li>
          </ul>
        </PanelCollapsibleSection>

        <ul class="divide-y divide-default">
          <li
            v-for="doc in filteredDocuments"
            :key="doc.id"
            class="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
          >
            <div>
              <NuxtLink
                :to="`${KLUB_BOARD_ROUTES.dokumenty}/${doc.id}`"
                class="font-medium text-highlighted hover:text-primary"
              >
                {{ doc.title }}
              </NuxtLink>
              <p class="text-sm text-muted">
                {{ docTypeLabel(doc.doc_type) }}
                <span v-if="doc.folder"> · {{ doc.folder }}</span>
                <span v-if="doc.updated_at"> · {{ doc.updated_at }}</span>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-lucide-eye"
                aria-label="Podgląd"
                @click.stop="openPreview(doc)"
              />
              <UBadge v-if="doc.latest_version_no" color="neutral" variant="subtle" size="sm">
                v{{ doc.latest_version_no }}
              </UBadge>
              <UBadge v-if="doc.mime_type" color="neutral" variant="subtle" size="sm">
                {{ doc.mime_type }}
              </UBadge>
            </div>
          </li>
        </ul>
      </div>
    </UCard>

    <BoardDocumentQuickPreview ref="quickPreviewRef" />

    <template #actions>
      <UButton
        to="/klub"
        variant="soft"
        color="neutral"
        size="sm"
        icon="i-lucide-arrow-left"
      >
        Klub
      </UButton>
    </template>
  </KlubPageShell>
</template>
