<script setup lang="ts">
/**
 * Spójny wrapper UModal (Nuxt UI v4):
 * - `scrollable` — poprawne zamykanie kliknięciem w tło na długich formularzach
 * - wyższy z-index niż belka witryny
 * - slot #body (nie #content) — domyślny nagłówek z przyciskiem X
 */
const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    dismissible?: boolean
    scrollable?: boolean
    fullscreen?: boolean
    transition?: boolean
    overlay?: boolean
    portal?: boolean | string | HTMLElement
    close?: boolean | Record<string, unknown>
    closeIcon?: string
    class?: string
    ui?: Record<string, string | undefined>
  }>(),
  {
    dismissible: true,
    scrollable: true,
    transition: true,
    overlay: true,
    close: true
  }
)

function uiSlot(custom: Record<string, string | undefined>, key: string, defaults: string) {
  return [custom[key], defaults].filter(Boolean).join(' ')
}

const mergedUi = computed(() => {
  const custom = props.ui ?? {}
  return {
    ...custom,
    overlay: uiSlot(custom, 'overlay', 'z-[250]'),
    content: uiSlot(custom, 'content', 'z-[260]'),
    header: uiSlot(custom, 'header', 'shrink-0'),
    body: uiSlot(custom, 'body', 'min-h-0 overflow-y-auto overscroll-contain')
  }
})
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :dismissible="dismissible"
    :scrollable="scrollable"
    :fullscreen="fullscreen"
    :transition="transition"
    :overlay="overlay"
    :portal="portal"
    :close="close"
    :close-icon="closeIcon"
    :class="class"
    :ui="mergedUi"
  >
    <template v-if="$slots.default" #default="scope">
      <slot name="default" v-bind="scope" />
    </template>
    <template v-if="$slots.body" #body="scope">
      <slot name="body" v-bind="scope" />
    </template>
    <template v-if="$slots.footer" #footer="scope">
      <slot name="footer" v-bind="scope" />
    </template>
    <template v-if="$slots.header" #header="scope">
      <slot name="header" v-bind="scope" />
    </template>
  </UModal>
</template>
