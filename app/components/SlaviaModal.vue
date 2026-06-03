<script setup lang="ts">
/**
 * UModal (Nuxt UI v4) — jeden scroll w #body, pewne zamykanie (X / ESC / tło).
 * Nie używaj slotu #content (gubi nagłówek). scrollable=false — overlay nie jest drugim scrollem.
 */
const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    dismissible?: boolean
    /** false = standardowy dialog (jeden pasek przewijania w body) */
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
    overlay: uiSlot(custom, 'overlay', 'z-[500] bg-elevated/80 backdrop-blur-sm'),
    content: uiSlot(
      custom,
      'content',
      'z-[510] flex max-h-[min(92dvh,960px)] w-full flex-col overflow-hidden'
    ),
    header: uiSlot(custom, 'header', 'shrink-0 border-b border-default/40'),
    body: uiSlot(custom, 'body', 'min-h-0 flex-1 overflow-y-auto overscroll-contain'),
    footer: uiSlot(custom, 'footer', 'shrink-0 border-t border-default/40')
  }
})

function onUpdateOpen(next: boolean) {
  open.value = next
}

function dismiss() {
  open.value = false
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
    :class="class"
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
    <template v-if="$slots.body" #body="{ close }">
      <slot
        name="body"
        :close="() => { close(); dismiss() }"
      />
    </template>
    <template v-if="$slots.footer" #footer="{ close }">
      <slot
        name="footer"
        :close="() => { close(); dismiss() }"
      />
    </template>
    <template v-if="$slots.header" #header="{ close }">
      <slot
        name="header"
        :close="() => { close(); dismiss() }"
      />
    </template>
  </UModal>
</template>
