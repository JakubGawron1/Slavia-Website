<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'board-member'] })

useSlaviaSeo({
  title: 'Dokumenty klubu — Slavia',
  description: 'Repozytorium dokumentów zarządu klubu.',
  noindex: true
})

const auth = useAuth()
const { documents, pending, error, backendUnavailable, fetchManifest } = useBoardDocuments()

onMounted(() => {
  void fetchManifest()
})
</script>

<template>
  <KlubPageShell
    icon="i-lucide-folder-lock"
    page-label="Dokumenty"
    page-icon="i-lucide-folder-lock"
    staff-title="Dokumenty klubu"
    staff-description="Repozytorium dokumentów zarządu — raporty, protokoły i listy startowe."
    athlete-title="Dokumenty klubu"
    athlete-description="Repozytorium dokumentów zarządu klubu."
  >
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
          title="Moduł w przygotowaniu"
          :description="error ?? 'Backend dokumentów zarządu nie jest jeszcze skonfigurowany.'"
        />
        <p class="text-sm text-muted">
          Po wdrożeniu integracji Google Drive i endpointów
          <code class="text-xs">/api/board/documents</code>
          lista dokumentów pojawi się tutaj automatycznie.
        </p>
      </div>

      <div v-else-if="!documents.length" class="space-y-3">
        <UAlert
          color="neutral"
          variant="soft"
          icon="i-lucide-inbox"
          title="Brak dokumentów"
          description="Repozytorium jest puste. Po skonfigurowaniu Google Drive możesz dodać pierwsze pliki."
        />
      </div>

      <ul v-else class="divide-y divide-default">
        <li
          v-for="doc in documents"
          :key="doc.id"
          class="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
        >
          <div>
            <p class="font-medium text-highlighted">
              {{ doc.title }}
            </p>
            <p v-if="doc.doc_type || doc.folder" class="text-sm text-muted">
              {{ [doc.doc_type, doc.folder].filter(Boolean).join(' · ') }}
            </p>
          </div>
          <UBadge v-if="doc.mime_type" color="neutral" variant="subtle" size="sm">
            {{ doc.mime_type }}
          </UBadge>
        </li>
      </ul>
    </UCard>

    <template #actions>
      <UBadge v-if="auth.isBoardDocsFullAccess.value" color="primary" variant="subtle" size="sm">
        Pełny dostęp
      </UBadge>
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
