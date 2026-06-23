<script setup lang="ts">
const props = defineProps<{
  content: string
  mimeType: string
}>()

const isCsv = computed(() => {
  const m = props.mimeType.toLowerCase()
  return m.includes('csv') || props.content.includes(';')
})

const isHtml = computed(() => {
  const m = props.mimeType.toLowerCase()
  return m.includes('html') || /<\/?[a-z][\s\S]*>/i.test(props.content.trim())
})

const isPdf = computed(() => props.mimeType.toLowerCase().includes('pdf'))

const isImage = computed(() => {
  const m = props.mimeType.toLowerCase()
  return m.startsWith('image/')
})

const isJson = computed(() => {
  const m = props.mimeType.toLowerCase()
  return m.includes('json') || (props.content.trim().startsWith('{') && props.content.trim().endsWith('}'))
})

const prettyJson = computed(() => {
  if (!isJson.value) return props.content
  try {
    return JSON.stringify(JSON.parse(props.content), null, 2)
  } catch {
    return props.content
  }
})

const csvRows = computed(() => {
  if (!isCsv.value) return [] as string[][]
  const text = props.content.replace(/^\uFEFF/, '')
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const cells: string[] = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          inQuotes = !inQuotes
          continue
        }
        if ((ch === ';' || ch === ',') && !inQuotes) {
          cells.push(current.trim())
          current = ''
          continue
        }
        current += ch
      }
      cells.push(current.trim())
      return cells
    })
})

const csvHeader = computed(() => csvRows.value[0] ?? [])
const csvBody = computed(() => csvRows.value.slice(1))
</script>

<template>
  <div class="space-y-4">
    <div v-if="isPdf" class="rounded-xl border border-dashed border-default/60 bg-muted/10 p-4 text-center text-sm text-muted">
      Użyj panelu podglądu dokumentu — PDF renderowany przez pdf.js.
    </div>

    <div v-else-if="isImage && content.startsWith('data:')">
      <img :src="content" alt="Podgląd" class="max-h-96 rounded-xl border border-default/60 object-contain">
    </div>

    <div v-else-if="isHtml">
      <SlaviaSafeHtml :html="content" class="prose prose-sm max-w-none dark:prose-invert" />
    </div>

    <div v-else-if="isCsv && csvRows.length" class="space-y-3">
      <div class="overflow-x-auto rounded-xl border border-default/60">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-muted/15">
            <tr>
              <th
                v-for="(cell, idx) in csvHeader"
                :key="`h-${idx}`"
                class="px-3 py-2 font-semibold text-highlighted"
              >
                {{ cell }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default/40">
            <tr v-for="(row, rIdx) in csvBody" :key="`r-${rIdx}`">
              <td
                v-for="(cell, cIdx) in row"
                :key="`c-${rIdx}-${cIdx}`"
                class="px-3 py-2 text-muted"
              >
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <details class="rounded-xl border border-default/40 bg-muted/5 p-3">
        <summary class="cursor-pointer text-sm font-medium text-highlighted">
          Podgląd surowy (CSV)
        </summary>
        <pre class="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-muted">{{ content }}</pre>
      </details>
    </div>

    <div v-else-if="isJson" class="rounded-xl border border-default/60 bg-muted/5 p-4">
      <pre class="max-h-[32rem] overflow-auto whitespace-pre-wrap text-sm text-muted">{{ prettyJson }}</pre>
    </div>

    <div v-else class="rounded-xl border border-default/60 bg-muted/5 p-4">
      <pre class="max-h-[32rem] overflow-auto whitespace-pre-wrap text-sm text-muted">{{ content }}</pre>
    </div>
  </div>
</template>
