<script setup lang="ts">
import type { BoardDocumentEntry, BoardDocumentTypeDefinition } from '~/types/boardDocuments'
import type { BoardPreviewPayload } from '~/composables/useBoardDocumentPreview'

const open = defineModel<boolean>('open', { default: false })

defineProps<{
  title?: string
}>()

const preview = useBoardDocumentPreview()
const payload = ref<BoardPreviewPayload | null>(null)

const showLoading = computed(
  () =>
    preview.pending.value
    || (open.value && !payload.value && !preview.error.value)
)

const previewError = computed(() => preview.error.value)

async function showDocument(doc: BoardDocumentEntry) {
  preview.cleanupPreview(payload.value)
  payload.value = null
  open.value = true
  try {
    payload.value = await preview.loadDocumentPreview(doc)
  } catch {
    // error w composable
  }
}

async function showType(type: BoardDocumentTypeDefinition | string) {
  preview.cleanupPreview(payload.value)
  payload.value = null
  open.value = true
  try {
    payload.value = await preview.loadTypeSkeletonPreview(type)
  } catch {
    // error w composable
  }
}

async function showPayloadDirect(data: BoardPreviewPayload) {
  preview.cleanupPreview(payload.value)
  payload.value = data
  open.value = true
}

watch(open, isOpen => {
  if (!isOpen) {
    preview.cleanupPreview(payload.value)
    payload.value = null
  }
})

defineExpose({ showDocument, showType, showPayloadDirect })
</script>

<template>
  <SlaviaModal
    v-model:open="open"
    :title="payload?.title ?? title ?? 'Podgląd dokumentu'"
    :description="showLoading ? 'Wczytywanie…' : undefined"
    scrollable
    modal-class="max-w-4xl"
  >
    <template #body>
      <div v-if="showLoading" class="flex items-center gap-2 py-8 text-muted">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
        <span>Przygotowywanie podglądu…</span>
      </div>
      <UAlert
        v-else-if="previewError"
        color="error"
        variant="soft"
        :title="previewError || 'Błąd podglądu'"
      />
      <BoardDocumentPreviewPanel
        v-else-if="payload"
        :payload="payload"
      />
      <SlaviaEmptyState
        v-else
        icon="i-lucide-file-question"
        title="Brak podglądu"
        description="Nie udało się wczytać treści dokumentu."
      />
    </template>
  </SlaviaModal>
</template>
