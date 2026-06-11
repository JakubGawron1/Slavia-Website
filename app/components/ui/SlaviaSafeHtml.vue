<script setup lang="ts">
/**
 * Jedyny dozwolony punkt `v-html` dla treści rich HTML (TipTap, CMS, dziennik).
 * Zawsze przechodzi przez `sanitizeRichHtml` (DOMPurify) — defense in depth.
 */
import { sanitizeRichHtml } from '~/utils/sanitizeHtml'

const props = defineProps<{
  html: string
}>()

const safeHtml = computed(() => sanitizeRichHtml(props.html))
</script>

<template>
  <div v-html="safeHtml" />
</template>
