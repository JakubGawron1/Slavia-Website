<script setup lang="ts">
import { renderChatMarkdown } from '~/utils/renderChatMarkdown'

const props = defineProps<{
  source: string
  rootClass?: string
}>()

const html = computed(() => renderChatMarkdown(props.source))
const rootClasses = computed(() => ['oc-md-root', props.rootClass].filter(Boolean))
</script>

<template>
  <div
    :class="rootClasses"
    v-html="html"
  />
</template>
