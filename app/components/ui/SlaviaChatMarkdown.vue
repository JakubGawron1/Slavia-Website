<script setup lang="ts">
import { renderChatMarkdown } from '~/utils/renderChatMarkdown'

const props = defineProps<{
  source: string
}>()

const html = computed(() => renderChatMarkdown(props.source))
</script>

<template>
  <div
    class="oc-md-root"
    v-html="html"
  />
</template>
