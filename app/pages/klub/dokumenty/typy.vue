<script setup lang="ts">
import { BOARD_DOCS_SUBNAV, isBoardDocsSubnavActive } from '~/data/boardDocsSubnav'
import type { BoardDocumentTypeDefinition } from '~/types/boardDocuments'

definePageMeta({ middleware: ['auth', 'board-member'] })

useSlaviaSeo({
  title: 'Typy dokumentów — Slavia',
  description: 'Katalog typów dokumentów zarządu klubu.',
  noindex: true
})

const route = useRoute()
const {
  groupedBuiltin,
  filteredCustom,
  categoryFilter,
  searchQuery,
  newTypeLabel,
  newTypeCategory,
  categoryFilterOptions,
  pending,
  error,
  source,
  saving,
  canManageCustom,
  refresh,
  submitCustomType
} = useBoardDocumentTypeEditorPage()

onMounted(() => {
  void refresh()
})

const quickPreviewRef = ref<{ showType: (type: BoardDocumentTypeDefinition | string) => Promise<void> } | null>(null)

function previewType(type: BoardDocumentTypeDefinition | { id: string }) {
  void quickPreviewRef.value?.showType(type.id)
}
</script>

<template>
  <KlubPageShell
    icon="i-lucide-tags"
    page-label="Typy dokumentów"
    page-icon="i-lucide-tags"
    staff-title="Katalog typów"
    staff-description="Wbudowane typy dokumentów sportowych i zarządczych oraz typy własne z manifestu Slavia-cms."
    athlete-title="Typy dokumentów"
    athlete-description="Katalog dokumentów zarządu klubu."
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
      <UBadge color="neutral" variant="subtle" size="sm">
        Źródło typów własnych: {{
          source === 'api' ? 'manifest Slavia-cms' : 'brak'
        }}
      </UBadge>
      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-refresh-cw" :loading="pending" @click="refresh">
        Odśwież
      </UButton>
    </div>

    <div class="mb-6 grid gap-3 sm:grid-cols-2">
      <UFormField label="Szukaj w katalogu">
        <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="Nazwa lub id typu…" />
      </UFormField>
      <UFormField label="Kategoria">
        <USelect v-model="categoryFilter" :items="categoryFilterOptions" />
      </UFormField>
    </div>

    <UAlert
      v-if="error"
      color="warning"
      variant="soft"
      class="mb-4"
      :title="error"
      description="Typy własne są w manifestcie board/_manifest.json (Slavia-cms). Przy błędzie API pokazujemy ostatnią pamięć podręczną."
    />

    <div class="space-y-6">
      <PanelCollapsibleSection
        v-for="group in groupedBuiltin"
        :key="group.category"
        :section-id="`board-type-${group.category}`"
        :title="group.label"
        icon="i-lucide-folder"
        :default-open="categoryFilter !== 'all'"
      >
        <ul class="grid gap-2 sm:grid-cols-2">
          <li
            v-for="type in group.types"
            :key="type.id"
            class="rounded-xl border border-default/50 bg-muted/5 px-3 py-2.5"
          >
            <p class="font-medium text-highlighted">
              {{ type.label }}
            </p>
            <p class="text-xs text-muted">
              <code>{{ type.id }}</code>
              · {{ type.folder }}/ · {{ type.defaultExtension }}
            </p>
            <p v-if="type.description" class="mt-1 text-sm text-muted">
              {{ type.description }}
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <UButton
                size="xs"
                variant="soft"
                color="neutral"
                icon="i-lucide-eye"
                @click="previewType(type)"
              >
                Podgląd szkieletu
              </UButton>
              <UBadge
                v-if="type.generatorKind"
                color="primary"
                variant="subtle"
                size="sm"
              >
                Generator
              </UBadge>
            </div>
          </li>
        </ul>
      </PanelCollapsibleSection>

      <PanelCollapsibleSection
        section-id="board-custom-types"
        title="Typy własne"
        icon="i-lucide-plus-circle"
        :default-open="true"
      >
        <div v-if="canManageCustom" class="mb-4 grid gap-3 sm:grid-cols-2">
          <UFormField label="Nazwa typu">
            <UInput v-model="newTypeLabel" placeholder="np. Protokół komisji sportowej" />
          </UFormField>
          <UFormField label="Folder (opcjonalnie)" hint="Podfolder w board/">
            <UInput v-model="newTypeCategory" placeholder="np. organizational" />
          </UFormField>
          <div class="sm:col-span-2">
            <UButton color="primary" icon="i-lucide-plus" :loading="saving" @click="submitCustomType">
              Dodaj typ własny
            </UButton>
          </div>
        </div>
        <UAlert
          v-else
          color="info"
          variant="subtle"
          icon="i-lucide-info"
          class="mb-4"
          title="Podgląd katalogu"
          description="Dodawanie typów własnych wymaga pełnego dostępu zarządu (prezes/wice)."
        />

        <ul v-if="filteredCustom.length" class="divide-y divide-default rounded-xl border border-default/50">
          <li
            v-for="type in filteredCustom"
            :key="type.id"
            class="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
          >
            <div>
              <p class="font-medium text-highlighted">
                {{ type.label }}
              </p>
              <p class="text-xs text-muted">
                <code>{{ type.id }}</code>
                <span v-if="type.category"> · {{ type.category }}</span>
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <UButton
                size="xs"
                variant="soft"
                color="neutral"
                icon="i-lucide-eye"
                @click="previewType(type)"
              >
                Podgląd szkieletu
              </UButton>
              <UBadge color="neutral" variant="subtle" size="sm">
                Własny
              </UBadge>
            </div>
          </li>
        </ul>
        <SlaviaEmptyState
          v-else
          icon="i-lucide-tags"
          title="Brak typów własnych"
          description="Dodaj pierwszy typ, jeśli masz pełny dostęp zarządu."
        />
      </PanelCollapsibleSection>
    </div>

    <BoardDocumentQuickPreview ref="quickPreviewRef" />
  </KlubPageShell>
</template>
