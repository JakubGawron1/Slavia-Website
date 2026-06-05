<script setup lang="ts">
/**
 * Panel edycji na Teleport — bez UModal/Reka Dialog.
 * Zamykanie: ESC, X, klik w tło, gest wstecz (mobile).
 */
import { editorSheetPortalKey } from '~/composables/useOverlaySelectPortal'

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    size?: 'md' | 'lg' | 'xl' | '2xl'
    preventClose?: boolean
    /** Blokuje zamknięcie gdy formularz ma niezapisane zmiany (confirm). */
    isDirty?: boolean
    /** Klucz localStorage — przy otwarciu przywraca scroll do ostatniego `data-form-field`. */
    scrollRestoreKey?: string
  }>(),
  {
    description: undefined,
    size: 'xl',
    preventClose: false,
    isDirty: false,
    scrollRestoreKey: ''
  }
)

const emit = defineEmits<{
  close: []
}>()

const titleId = useId()
const descId = useId()
const historyKey = `slaviaEditorSheet-${useId()}`
const portalAnchor = ref<HTMLElement | null>(null)

provide(editorSheetPortalKey, portalAnchor)

const sizeClass = computed(() => {
  switch (props.size) {
    case 'md':
      return 'max-w-lg'
    case 'lg':
      return 'max-w-2xl'
    case '2xl':
      return 'max-w-5xl xl:max-w-6xl'
    default:
      return 'max-w-4xl'
  }
})

const formScroll = props.scrollRestoreKey
  ? useFormFieldScrollRestore(props.scrollRestoreKey)
  : null
const sheetBodyRef = ref<HTMLElement | null>(null)

function canDismissSheet() {
  if (props.preventClose) return false
  if (props.isDirty && !confirmDiscardUnsaved()) return false
  return true
}

function confirmDiscardUnsaved() {
  if (!import.meta.client) return true
  return window.confirm('Masz niezapisane zmiany. Zamknąć bez zapisu?')
}

const { dismiss } = useOverlayDismiss(open, {
  historyKey,
  canClose: canDismissSheet,
  onClose: () => emit('close')
})

watch(open, (isOpen) => {
  if (isOpen && formScroll) {
    nextTick(() => formScroll.restoreScroll(sheetBodyRef.value))
  }
})

function onBodyFocusIn(e: FocusEvent) {
  if (!formScroll) return
  const field = (e.target as HTMLElement | null)?.closest?.('[data-form-field]') as HTMLElement | null
  const id = field?.getAttribute('data-form-field')
  if (id) formScroll.rememberField(id)
}

function closeSheet() {
  if (!canDismissSheet()) return
  dismiss()
}

function onBackdropClick() {
  closeSheet()
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="slavia-editor-sheet-root fixed inset-0 z-[800] flex items-end justify-center sm:items-center sm:p-4 md:p-6"
        data-slavia-editor-sheet="open"
        role="presentation"
      >
        <div
          class="slavia-editor-sheet__backdrop absolute inset-0 z-0 bg-black/60 backdrop-blur-[2px]"
          aria-hidden="true"
          @click="onBackdropClick"
        />

        <Transition
          appear
          enter-active-class="transition duration-280 ease-out"
          enter-from-class="opacity-0 translate-y-full sm:translate-y-3 sm:scale-[0.98]"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="transition duration-180 ease-in"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-8 sm:translate-y-2 sm:scale-[0.98]"
        >
          <section
            v-if="open"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="description ? descId : undefined"
            class="slavia-editor-sheet relative z-10 flex max-h-[min(92dvh,880px)] w-full flex-col overflow-hidden rounded-t-[1.35rem] border border-default/55 bg-default shadow-2xl sm:max-h-[min(88dvh,820px)] sm:rounded-2xl"
            :class="sizeClass"
          >
            <button
              type="button"
              class="slavia-editor-sheet__close"
              aria-label="Zamknij"
              :disabled="preventClose"
              @click.stop.prevent="closeSheet"
            >
              <UIcon
                name="i-lucide-x"
                class="size-5 pointer-events-none"
              />
            </button>

            <div
              class="slavia-editor-sheet__handle"
              aria-hidden="true"
            />

            <header class="slavia-editor-sheet__header">
              <div class="min-w-0 flex-1">
                <slot name="header">
                  <h2
                    :id="titleId"
                    class="text-lg font-bold tracking-tight text-highlighted sm:text-xl"
                  >
                    {{ title }}
                  </h2>
                  <p
                    v-if="description"
                    :id="descId"
                    class="mt-1 text-sm text-muted"
                  >
                    {{ description }}
                  </p>
                </slot>
              </div>
            </header>

            <div
              v-if="$slots.tabs"
              class="slavia-editor-sheet__tabs"
            >
              <slot name="tabs" />
            </div>

            <div
              ref="portalAnchor"
              class="slavia-editor-sheet__portal pointer-events-none absolute inset-0 z-[22] overflow-visible"
              aria-hidden="true"
            />

            <div ref="sheetBodyRef" class="slavia-editor-sheet__body" @focusin="onBodyFocusIn">
              <div class="slavia-editor-sheet__content relative z-0 min-h-0 w-full">
                <slot />
              </div>
            </div>

            <footer
              v-if="$slots.footer"
              class="slavia-editor-sheet__footer"
            >
              <slot name="footer" />
            </footer>
          </section>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
