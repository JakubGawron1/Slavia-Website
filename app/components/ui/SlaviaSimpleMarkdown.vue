<script setup lang="ts">
/**
 * Podgląd lekkiego Markdown (ogłoszenia) — DOMPurify w `renderSimpleMarkdown`.
 */
import { renderSimpleMarkdown } from '~/utils/renderSimpleMarkdown'

const props = defineProps<{
  source: string
}>()

const safeHtml = computed(() => renderSimpleMarkdown(props.source))
</script>

<template>
  <div v-html="safeHtml" />
</template>
