<script setup lang="ts">
/**
 * UModal (Nuxt UI v4) — jeden scroll w #body, zamykanie X / ESC / tło.
 * Slot #body (nie #content). scrollable=false — scroll tylko w body, nie na overlay.
 */
const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    dismissible?: boolean
    /** false = jeden pasek przewijania w #body (Nuxt UI: body overflow-y-auto) */
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
    scrollable: false,
    transition: true,
    overlay: true,
    close: true
  }
)

function uiSlot(custom: Record<string, string | undefined>, key: string, extra: string) {
  return [custom[key], extra].filter(Boolean).join(' ')
}

const mergedUi = computed(() => {
  const custom = props.ui ?? {}
  return {
    ...custom,
    /** overlay i content muszą mieć z-index — inaczej overlay (z-[500]) przykrywa treść bez pozycjonowania */
    overlay: uiSlot(custom, 'overlay', 'z-[250] bg-elevated/80 backdrop-blur-sm'),
    content: uiSlot(
      custom,
      'content',
      'z-[260] flex max-h-[min(92dvh,960px)] w-full flex-col overflow-hidden'
    ),
    header: uiSlot(custom, 'header', 'shrink-0 border-b border-default/40'),
    body: uiSlot(custom, 'body', 'slavia-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain'),
    footer: uiSlot(custom, 'footer', 'shrink-0 border-t border-default/40')
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
    <template v-if="$slots.close" #close="scope">
      <slot name="close" v-bind="scope" />
    </template>
  </UModal>
</template>
