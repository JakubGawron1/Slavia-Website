<script setup lang="ts">
import { renderChatMarkdown } from '~/utils/renderChatMarkdown'

const props = defineProps<{
  source: string
  tag?: string
}>()

const html = computed(() => renderChatMarkdown(props.source))
</script>

<template>
  <component
    :is="tag || 'div'"
    class="oc-md-root"
    v-html="html"
  />
</template>
