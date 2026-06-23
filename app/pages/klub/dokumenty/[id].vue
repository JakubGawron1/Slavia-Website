<script setup lang="ts">
import { KLUB_BOARD_ROUTES } from '~/config/klubRoutes'
import { BOARD_DOCS_SUBNAV, isBoardDocsSubnavActive } from '~/data/boardDocsSubnav'
import { boardDocumentTypeLabel } from '~/data/boardDocumentCatalog'
import { getApiErrorMessage } from '~/composables/useApi'
import type { BoardDocumentEntry, BoardDocumentPreviewMeta } from '~/types/boardDocuments'

definePageMeta({ middleware: ['auth', 'board-member'] })

const route = useRoute()
const auth = useAuth()
const toast = useToast()
const id = computed(() => String(route.params.id ?? ''))

const {
  fetchDocument,
  getPreviewMeta,
  saveContent
} = useBoardDocuments()

const docPreview = useBoardDocumentPreview()
const previewPayload = ref<import('~/composables/useBoardDocumentPreview').BoardPreviewPayload | null>(null)

const doc = ref<BoardDocumentEntry | null>(null)
const previewMeta = ref<BoardDocumentPreviewMeta | null>(null)
const editContent = ref('')
const pending = ref(true)
const contentPending = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'preview' | 'edit' | 'versions'>('preview')

const canEdit = computed(
  () => auth.isBoardDocsFullAccess.value && previewMeta.value?.edit_mode === 'native'
)

const mimeType = computed(() => previewMeta.value?.mime_type ?? doc.value?.mime_type ?? 'text/plain')

useSlaviaSeo({
  title: 'Dokument — Slavia',
  description: 'Szczegóły dokumentu zarządu klubu.',
  noindex: true
})

watch(
  () => doc.value?.title,
  title => {
    if (title) useSeoMeta({ title: `${title} — Dokumenty` })
  }
)

async function loadDocument() {
  pending.value = true
  error.value = null
  try {
    doc.value = await fetchDocument(id.value)
    previewMeta.value = await getPreviewMeta(id.value)
    if (activeTab.value === 'edit' && !canEdit.value) {
      activeTab.value = 'preview'
    }
  } catch (e) {
    error.value = getApiErrorMessage(e)
    doc.value = null
  } finally {
    pending.value = false
  }
}

async function loadContent() {
  if (!doc.value) return
  contentPending.value = true
  try {
    docPreview.cleanupPreview(previewPayload.value)
    previewPayload.value = await docPreview.loadDocumentPreview(doc.value)
    if (previewPayload.value.mimeType.includes('pdf')) {
      editContent.value = ''
    } else {
      editContent.value = previewPayload.value.content
    }
  } catch (e) {
    toast.add({
      title: 'Nie udało się wczytać treści',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    contentPending.value = false
  }
}

function downloadCurrent() {
  const p = previewPayload.value
  if (!p) return
  if (p.blobUrl) {
    const a = document.createElement('a')
    a.href = p.blobUrl
    a.download = doc.value?.title ?? 'dokument.pdf'
    a.click()
    return
  }
  const blob = new Blob([p.content], { type: p.mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = doc.value?.title ?? 'dokument'
  a.click()
  URL.revokeObjectURL(url)
}

async function onSaveContent(value: string) {
  saving.value = true
  try {
    await saveContent(id.value, value)
    await loadContent()
    await loadDocument()
    toast.add({ title: 'Zapisano dokument', color: 'success' })
  } catch (e) {
    toast.add({
      title: 'Błąd zapisu',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

watch(activeTab, async tab => {
  if ((tab === 'preview' || tab === 'edit') && !previewPayload.value && !contentPending.value) {
    await loadContent()
  }
})

watch(id, () => {
  docPreview.cleanupPreview(previewPayload.value)
  previewPayload.value = null
  editContent.value = ''
  void loadDocument()
})

onBeforeUnmount(() => {
  docPreview.cleanupPreview(previewPayload.value)
})

onMounted(async () => {
  await loadDocument()
  await loadContent()
})

const tabItems = computed(() => {
  const items = [
    { label: 'Podgląd', value: 'preview', icon: 'i-lucide-eye' },
    { label: 'Wersje', value: 'versions', icon: 'i-lucide-history' }
  ]
  if (canEdit.value) {
    items.splice(1, 0, { label: 'Edytuj', value: 'edit', icon: 'i-lucide-pencil' })
  }
  return items
})

const versions = computed(() => [...(doc.value?.versions ?? [])].sort((a, b) => b.version_no - a.version_no))
</script>

<template>
  <KlubPageShell
    icon="i-lucide-file-text"
    :page-label="doc?.title ?? 'Dokument'"
    page-icon="i-lucide-file-text"
    staff-title="Szczegóły dokumentu"
    staff-description="Podgląd i edycja treści z repozytorium Slavia-cms."
    athlete-title="Dokument klubu"
    athlete-description="Podgląd dokumentu zarządu."
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

    <div v-if="pending" class="flex items-center gap-2 text-muted">
      <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
      <span>Ładowanie dokumentu…</span>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      :title="error"
    />

    <template v-else-if="doc">
      <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-highlighted">
            {{ doc.title }}
          </h1>
          <p class="mt-1 text-sm text-muted">
            {{ boardDocumentTypeLabel(doc.doc_type) }}
            <span v-if="doc.folder"> · {{ doc.folder }}</span>
            <span v-if="doc.updated_at"> · {{ doc.updated_at }}</span>
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <UButton
            size="sm"
            variant="soft"
            icon="i-lucide-download"
            @click="downloadCurrent"
          >
            Pobierz
          </UButton>
          <UBadge v-if="previewMeta" color="neutral" variant="subtle">
            {{ previewMeta.mime_type }}
          </UBadge>
          <UBadge
            v-if="previewMeta"
            :color="previewMeta.edit_mode === 'native' ? 'success' : 'warning'"
            variant="subtle"
          >
            {{ previewMeta.edit_mode === 'native' ? 'Edycja natywna' : 'Tylko podgląd / pobranie' }}
          </UBadge>
        </div>
      </div>

      <UTabs v-model="activeTab" :items="tabItems" class="mb-4" />

      <UCard v-if="activeTab === 'preview'">
        <div v-if="contentPending" class="flex items-center gap-2 text-muted">
          <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
          <span>Wczytywanie treści…</span>
        </div>
        <BoardDocumentPreviewPanel
          v-else-if="previewPayload"
          :payload="previewPayload"
        />
      </UCard>

      <UCard v-else-if="activeTab === 'edit' && canEdit">
        <BoardDocumentNativeEditor
          v-model="editContent"
          :mime-type="mimeType"
          :saving="saving"
          @save="onSaveContent"
        />
      </UCard>

      <UCard v-else-if="activeTab === 'versions'">
        <ul v-if="versions.length" class="divide-y divide-default">
          <li
            v-for="ver in versions"
            :key="ver.version_no"
            class="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0"
          >
            <div>
              <p class="font-medium text-highlighted">
                Wersja {{ ver.version_no }}
              </p>
              <p class="text-sm text-muted">
                {{ ver.created_at }}
                <span v-if="ver.created_by_username"> · {{ ver.created_by_username }}</span>
                <span v-if="ver.edit_source"> · {{ ver.edit_source }}</span>
              </p>
              <p v-if="ver.note" class="mt-1 text-sm text-muted">
                {{ ver.note }}
              </p>
            </div>
            <UBadge v-if="ver.git_sha" color="neutral" variant="subtle" size="sm">
              {{ ver.git_sha.slice(0, 7) }}
            </UBadge>
          </li>
        </ul>
        <SlaviaEmptyState
          v-else
          icon="i-lucide-history"
          title="Brak historii wersji"
          description="Wersje pojawią się po pierwszym zapisie do repozytorium."
        />
      </UCard>
    </template>

    <template #actions>
      <UButton
        :to="KLUB_BOARD_ROUTES.dokumenty"
        variant="soft"
        color="neutral"
        size="sm"
        icon="i-lucide-arrow-left"
      >
        Repozytorium
      </UButton>
    </template>
  </KlubPageShell>
</template>
