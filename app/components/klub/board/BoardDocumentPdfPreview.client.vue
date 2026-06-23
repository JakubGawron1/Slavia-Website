<script setup lang="ts">
import * as pdfjs from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

const props = defineProps<{
  blobUrl: string
}>()

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker

const canvasHost = ref<HTMLElement | null>(null)
const pending = ref(true)
const error = ref<string | null>(null)
const pageCount = ref(0)
const currentPage = ref(1)

let pdfDoc: pdfjs.PDFDocumentProxy | null = null

async function renderPage(pageNum: number) {
  if (!pdfDoc || !canvasHost.value) return
  const page = await pdfDoc.getPage(pageNum)
  const viewport = page.getViewport({ scale: 1.25 })
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  canvas.width = viewport.width
  canvas.height = viewport.height
  canvasHost.value.innerHTML = ''
  canvasHost.value.appendChild(canvas)
  await page.render({ canvasContext: ctx, viewport, canvas }).promise
  currentPage.value = pageNum
}

async function loadPdf() {
  pending.value = true
  error.value = null
  try {
    const loading = pdfjs.getDocument({ url: props.blobUrl })
    pdfDoc = await loading.promise
    pageCount.value = pdfDoc.numPages
    await renderPage(1)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Nie udało się wyświetlić PDF.'
  } finally {
    pending.value = false
  }
}

watch(() => props.blobUrl, () => {
  void loadPdf()
}, { immediate: true })

onBeforeUnmount(() => {
  void pdfDoc?.cleanup()
  pdfDoc = null
})
</script>

<template>
  <div class="space-y-3">
    <div v-if="pending" class="flex items-center gap-2 text-muted">
      <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />
      <span>Renderowanie PDF…</span>
    </div>
    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      :title="error"
    />
    <template v-else>
      <div
        ref="canvasHost"
        class="overflow-x-auto rounded-xl border border-default/60 bg-white p-2 dark:bg-neutral-950"
      />
      <div
        v-if="pageCount > 1"
        class="flex items-center justify-center gap-2"
      >
        <UButton
          size="xs"
          variant="soft"
          icon="i-lucide-chevron-left"
          :disabled="currentPage <= 1"
          @click="renderPage(currentPage - 1)"
        />
        <span class="text-sm text-muted">{{ currentPage }} / {{ pageCount }}</span>
        <UButton
          size="xs"
          variant="soft"
          icon="i-lucide-chevron-right"
          :disabled="currentPage >= pageCount"
          @click="renderPage(currentPage + 1)"
        />
      </div>
    </template>
  </div>
</template>
