<script setup lang="ts">
/**
 * UModal (Nuxt UI v4) — scroll w #body, zamykanie X / ESC / tło / gest wstecz.
 * scrollable=false + pointer-events-none na overlay — inaczej overlay przechwytuje
 * kliknięcia w buttony / USelect / USwitch (inputy często „przechodzą” przez focus).
 */
const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    dismissible?: boolean
    /** Synchronizacja z history API — gest wstecz na mobile. */
    historyDismiss?: boolean
    scrollable?: boolean
    fullscreen?: boolean
    transition?: boolean
    overlay?: boolean
    portal?: boolean | string | HTMLElement
    close?: boolean | Record<string, unknown>
    closeIcon?: string
    modalClass?: string
    ui?: Record<string, string | undefined>
  }>(),
  {
    title: undefined,
    description: undefined,
    dismissible: true,
    historyDismiss: true,
    scrollable: false,
    fullscreen: undefined,
    transition: true,
    overlay: true,
    portal: undefined,
    close: true,
    closeIcon: undefined,
    modalClass: undefined,
    ui: undefined
  }
)

const emit = defineEmits<{
  close: []
}>()

const historyKey = `slaviaModal-${useId()}`

const { dismiss: dismissOverlay } = useOverlayDismiss(open, {
  historyKey,
  enabled: () => props.historyDismiss,
  canClose: () => props.dismissible,
  onClose: () => emit('close')
})

function uiSlot(custom: Record<string, string | undefined>, key: string, extra: string) {
  return [custom[key], extra].filter(Boolean).join(' ')
}

const modalZ = computed(() =>
  import.meta.dev
    ? { overlay: 'z-[600]', content: 'z-[610]' }
    : { overlay: 'z-[500]', content: 'z-[510]' }
)

const mergedUi = computed(() => {
  const custom = props.ui ?? {}
  const z = modalZ.value
  return {
    ...custom,
    overlay: uiSlot(
      custom,
      'overlay',
      `${z.overlay} pointer-events-none bg-elevated/80 backdrop-blur-sm`
    ),
    content: uiSlot(
      custom,
      'content',
      `${z.content} pointer-events-auto flex max-h-[min(92dvh,960px)] w-full flex-col overflow-hidden`
    ),
    header: uiSlot(custom, 'header', 'shrink-0 border-b border-default/40'),
    body: uiSlot(
      custom,
      'body',
      'slavia-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pointer-events-auto'
    ),
    footer: uiSlot(custom, 'footer', 'shrink-0 border-t border-default/40')
  }
})

function onUpdateOpen(next: boolean) {
  if (!next && props.historyDismiss) {
    dismissOverlay()
    return
  }
  open.value = next
}

function dismiss() {
  if (props.historyDismiss) {
    dismissOverlay()
    return
  }
  open.value = false
}

function wrapClose(close?: () => void) {
  close?.()
  dismiss()
}
</script>

<template>
  <UModal
    :open="open"
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
    :class="modalClass"
    :ui="mergedUi"
    @update:open="onUpdateOpen"
  >
    <template v-if="close && !$slots.close" #close>
      <button
        type="button"
        class="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-muted/30 hover:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Zamknij"
        @click="dismiss"
      >
        <UIcon
          :name="closeIcon || 'i-lucide-x'"
          class="size-5"
        />
      </button>
    </template>
    <template v-else-if="$slots.close" #close="scope">
      <slot name="close" v-bind="scope" />
    </template>

    <template v-if="$slots.default" #default="scope">
      <slot name="default" v-bind="scope" />
    </template>
    <template v-if="$slots.body" #body="{ close: closeModal }">
      <slot
        name="body"
        :close="() => wrapClose(closeModal)"
      />
    </template>
    <template v-if="$slots.footer" #footer="{ close: closeModal }">
      <slot
        name="footer"
        :close="() => wrapClose(closeModal)"
      />
    </template>
    <template v-if="$slots.header" #header="{ close: closeModal }">
      <slot
        name="header"
        :close="() => wrapClose(closeModal)"
      />
    </template>
  </UModal>
</template>
