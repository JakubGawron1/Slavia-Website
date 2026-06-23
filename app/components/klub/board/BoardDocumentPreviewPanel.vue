<script setup lang="ts">
import type { BoardPreviewPayload } from '~/composables/useBoardDocumentPreview'

const props = defineProps<{
  payload: BoardPreviewPayload
}>()

const isPdfBlob = computed(
  () => Boolean(props.payload.blobUrl) && props.payload.mimeType.toLowerCase().includes('pdf')
)
const isPdfSkeleton = computed(
  () =>
    !props.payload.blobUrl
    && props.payload.mimeType.toLowerCase().includes('pdf')
    && (props.payload.pdfFields?.length ?? 0) > 0
)
const isImage = computed(() => {
  const m = props.payload.mimeType.toLowerCase()
  return m.startsWith('image/') && props.payload.blobUrl
})

const sourceLabel = computed(() => {
  switch (props.payload.source) {
    case 'document':
      return 'Dokument z repozytorium'
    case 'repo_template':
      return 'Szablon z Slavia-cms (board/templates/)'
    case 'embed_template':
      return 'Szablon wbudowany (sync z CMS)'
    default:
      return 'Szkielet wbudowany'
  }
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <UBadge color="neutral" variant="subtle" size="sm">
        {{ sourceLabel }}
      </UBadge>
      <UBadge color="neutral" variant="subtle" size="sm">
        {{ payload.mimeType }}
      </UBadge>
    </div>

    <BoardDocumentPdfPreview
      v-if="isPdfBlob && payload.blobUrl"
      :blob-url="payload.blobUrl"
    />

    <div
      v-else-if="isPdfSkeleton"
      class="rounded-xl border border-dashed border-default/70 bg-muted/10 p-6"
    >
      <div class="mb-4 flex items-center gap-3">
        <span class="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UIcon name="i-lucide-file-text" class="size-6" />
        </span>
        <div>
          <p class="font-semibold text-highlighted">
            Szkielet dokumentu PDF
          </p>
          <p class="text-sm text-muted">
            Po utworzeniu dokumentu wgraj plik PDF lub wygeneruj z szablonu HTML.
          </p>
        </div>
      </div>
      <ul class="grid gap-2 sm:grid-cols-2">
        <li
          v-for="field in payload.pdfFields"
          :key="field"
          class="rounded-lg border border-default/50 bg-card/80 px-3 py-2 text-sm text-muted"
        >
          <span class="text-highlighted">{{ field }}</span>
          <span class="mt-1 block border-b border-dashed border-default/60 pb-3" />
        </li>
      </ul>
    </div>

    <img
      v-else-if="isImage && payload.blobUrl"
      :src="payload.blobUrl"
      :alt="payload.title"
      class="max-h-[32rem] w-full rounded-xl border border-default/60 object-contain"
    >

    <BoardDocumentPreview
      v-else
      :content="payload.content"
      :mime-type="payload.mimeType"
    />
  </div>
</template>
