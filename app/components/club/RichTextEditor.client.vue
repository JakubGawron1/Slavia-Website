<script setup lang="ts">
import type { Editor } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Image from '@tiptap/extension-image'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    minHeight?: string
  }>(),
  {
    placeholder: 'Zacznij pisać…',
    minHeight: '220px'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

/** Ostatni HTML wyemitowany z edytora — żeby `watch(modelValue)` nie wołał `setContent` na tym samym cyklu (psuje pisanie / fokus). */
const lastEmittedHtml = ref<string | null>(null)

const TEXT_COLORS = [
  { label: 'Domyślny', value: '' },
  { label: 'Klubowa zieleń', value: '#15803d' },
  { label: 'Granat', value: '#1e3a8a' },
  { label: 'Czerwień', value: '#b91c1c' },
  { label: 'Pomarańcz', value: '#c2410c' },
  { label: 'Fiolet', value: '#6b21a8' },
  { label: 'Szary', value: '#525252' }
] as const

const HIGHLIGHT_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff'] as const

/** TipTap 3 + Vue/Nuxt: bez tego hydracja potrafi zablokować montowanie edytora (biały ekran). */
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      bulletList: { HTMLAttributes: { class: 'list-disc pl-5' } },
      orderedList: { HTMLAttributes: { class: 'list-decimal pl-5' } },
      codeBlock: { HTMLAttributes: { class: 'rounded-lg bg-muted/40 p-3 font-mono text-sm' } }
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-primary underline underline-offset-2'
      }
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right']
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    }),
    Highlight.configure({ multicolor: true }),
    TextStyle,
    Color,
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg'
      }
    })
  ],
  content: props.modelValue || '<p></p>',
  /** Obsługiwane w @tiptap/vue-3 (SSR/hydracja); typ `EditorOptions` bywa niekompletny w TS. */
  // @ts-expect-error — pole runtime TipTap 3 dla Vue
  immediatelyRender: false,
  editorProps: {
    attributes: {
      class:
        'slavia-rich-editor-prose focus:outline-none max-w-none px-3 py-2 text-sm text-highlighted leading-relaxed'
    }
  },
  onUpdate: ({ editor: ed }) => {
    const html = ed.getHTML()
    lastEmittedHtml.value = html
    emit('update:modelValue', html)
  }
})

watch(
  () => props.modelValue,
  html => {
    const ed = editor.value
    if (!ed || ed.isDestroyed) {
      return
    }
    const next = html || '<p></p>'
    if (lastEmittedHtml.value !== null && next === lastEmittedHtml.value) {
      return
    }
    if (next === ed.getHTML()) {
      lastEmittedHtml.value = next
      return
    }
    ed.commands.setContent(next, { emitUpdate: false })
    lastEmittedHtml.value = ed.getHTML()
  }
)

watch(editor, ed => {
  if (ed && !ed.isDestroyed) {
    lastEmittedHtml.value = ed.getHTML()
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function setLink() {
  const ed = editor.value
  if (!ed) {
    return
  }
  const prev = ed.getAttributes('link').href as string | undefined
  const url = window.prompt('Adres URL odnośnika', prev || 'https://')
  if (url === null) {
    return
  }
  if (url === '') {
    ed.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  ed.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

function setImage() {
  const ed = editor.value
  if (!ed) {
    return
  }
  const url = window.prompt('Adres URL obrazu', 'https://')
  if (url === null || url === '') {
    return
  }
  ed.chain().focus().setImage({ src: url }).run()
}

function applyTextColor(hex: string) {
  const ed = editor.value
  if (!ed) {
    return
  }
  if (!hex) {
    ed.chain().focus().unsetColor().run()
  } else {
    ed.chain().focus().setColor(hex).run()
  }
}

/** TipTap TextAlign — sprawdzanie przez atrybut `textAlign` aktywnego bloku. */
function alignActive(ed: Editor, align: 'left' | 'center' | 'right'): boolean {
  return ed.isActive({ textAlign: align })
}

const toolbarBtn =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-transparent text-muted transition-colors hover:bg-muted/40 hover:text-highlighted data-[active=true]:border-primary/35 data-[active=true]:bg-primary/10 data-[active=true]:text-primary disabled:pointer-events-none disabled:opacity-40'

const colorPopoverOpen = ref(false)
</script>

<template>
  <div
    v-if="!editor"
    class="slavia-rich-editor flex min-h-[var(--slavia-editor-fallback-min-h,220px)] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-default/70 bg-muted/10 px-4 py-10 text-center text-muted"
    :style="{ minHeight }"
  >
    <UIcon
      name="i-lucide-loader-2"
      class="size-8 animate-spin text-primary"
    />
    <p class="text-sm">
      Uruchamianie edytora…
    </p>
  </div>
  <div
    v-else
    class="slavia-rich-editor overflow-hidden rounded-xl border border-default/70 bg-background ring-1 ring-default/30"
  >
    <div
      class="flex flex-wrap gap-0.5 border-b border-default/60 bg-muted/15 p-2 dark:bg-muted/10"
      role="toolbar"
      aria-label="Formatowanie tekstu"
    >
      <button
        type="button"
        :class="toolbarBtn"
        :data-active="editor.isActive('bold')"
        title="Pogrubienie"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <span class="text-xs font-black">B</span>
      </button>
      <button
        type="button"
        :class="toolbarBtn"
        :data-active="editor.isActive('italic')"
        title="Kursywa"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        <span class="text-xs font-serif italic">I</span>
      </button>
      <button
        type="button"
        :class="toolbarBtn"
        :data-active="editor.isActive('underline')"
        title="Podkreślenie"
        @click="editor.chain().focus().toggleUnderline().run()"
      >
        <span class="text-xs underline">U</span>
      </button>
      <button
        type="button"
        :class="toolbarBtn"
        :data-active="editor.isActive('strike')"
        title="Przekreślenie"
        @click="editor.chain().focus().toggleStrike().run()"
      >
        <span class="text-xs line-through">S</span>
      </button>

      <span class="mx-1 hidden h-6 w-px self-center bg-default/50 sm:inline" />

      <UPopover
        v-model:open="colorPopoverOpen"
        :content="{ side: 'bottom', align: 'start' }"
      >
        <button
          type="button"
          :class="toolbarBtn"
          title="Kolor tekstu"
        >
          <UIcon
            name="i-lucide-palette"
            class="size-4 text-primary"
          />
        </button>
        <template #content>
          <div class="flex flex-col gap-2 p-2">
            <p class="px-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              Kolor tekstu
            </p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="c in TEXT_COLORS"
                :key="c.label"
                type="button"
                class="flex items-center gap-2 rounded-lg border border-default/60 px-2 py-1.5 text-xs hover:bg-muted/40"
                @click="
                  applyTextColor(c.value);
                  colorPopoverOpen = false;
                "
              >
                <span
                  v-if="c.value"
                  class="size-4 rounded-full ring-1 ring-default/50"
                  :style="{ backgroundColor: c.value }"
                />
                <span v-else class="size-4 rounded-full border border-dashed border-muted" />
                {{ c.label }}
              </button>
            </div>
            <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-default/50 px-2 py-2 text-xs hover:bg-muted/30">
              <UIcon
                name="i-lucide-pipette"
                class="size-4 shrink-0"
              />
              <span>Własny</span>
              <input
                type="color"
                class="ml-auto h-8 w-14 cursor-pointer rounded border border-default/60 bg-background"
                value="#15803d"
                @input="
                  applyTextColor(($event.target as HTMLInputElement).value);
                  colorPopoverOpen = false;
                "
              >
            </label>
          </div>
        </template>
      </UPopover>

      <button
        type="button"
        :class="toolbarBtn"
        title="Reset koloru tekstu"
        @click="editor.chain().focus().unsetColor().run()"
      >
        <UIcon
          name="i-lucide-eraser"
          class="size-4"
        />
      </button>

      <UPopover :content="{ side: 'bottom', align: 'start' }">
        <button
          type="button"
          :class="toolbarBtn"
          title="Podświetlenie tła"
        >
          <UIcon
            name="i-lucide-highlighter"
            class="size-4"
          />
        </button>
        <template #content>
          <div class="p-2">
            <p class="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              Marker
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="hc in HIGHLIGHT_COLORS"
                :key="hc"
                type="button"
                class="size-9 rounded-lg ring-1 ring-default/40 hover:ring-primary/50"
                :style="{ backgroundColor: hc }"
                @click="editor.chain().focus().toggleHighlight({ color: hc }).run()"
              />
              <button
                type="button"
                class="flex size-9 items-center justify-center rounded-lg border border-dashed border-muted text-[10px] font-bold text-muted hover:bg-muted/40"
                title="Wyłącz podświetlenie"
                @click="editor.chain().focus().unsetHighlight().run()"
              >
                ∅
              </button>
            </div>
          </div>
        </template>
      </UPopover>

      <span class="mx-1 hidden h-6 w-px self-center bg-default/50 sm:inline" />

      <button
        type="button"
        :class="toolbarBtn"
        :data-active="editor.isActive('heading', { level: 2 })"
        title="Nagłówek 2"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <span class="text-[11px] font-bold">H2</span>
      </button>
      <button
        type="button"
        :class="toolbarBtn"
        :data-active="editor.isActive('heading', { level: 3 })"
        title="Nagłówek 3"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <span class="text-[11px] font-bold">H3</span>
      </button>
      <button
        type="button"
        :class="toolbarBtn"
        :data-active="editor.isActive('bulletList')"
        title="Lista punktowana"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        <UIcon
          name="i-lucide-list"
          class="size-4"
        />
      </button>
      <button
        type="button"
        :class="toolbarBtn"
        :data-active="editor.isActive('orderedList')"
        title="Lista numerowana"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        <UIcon
          name="i-lucide-list-ordered"
          class="size-4"
        />
      </button>
      <button
        type="button"
        :class="toolbarBtn"
        :data-active="editor.isActive('blockquote')"
        title="Cytat"
        @click="editor.chain().focus().toggleBlockquote().run()"
      >
        <UIcon
          name="i-lucide-quote"
          class="size-4"
        />
      </button>
      <button
        type="button"
        :class="toolbarBtn"
        :data-active="editor.isActive('codeBlock')"
        title="Blok kodu"
        @click="editor.chain().focus().toggleCodeBlock().run()"
      >
        <UIcon
          name="i-lucide-code"
          class="size-4"
        />
      </button>

      <span class="mx-1 hidden h-6 w-px self-center bg-default/50 sm:inline" />

      <button
        type="button"
        :class="toolbarBtn"
        :data-active="alignActive(editor, 'left')"
        title="Wyrównaj do lewej"
        @click="editor.chain().focus().setTextAlign('left').run()"
      >
        <UIcon
          name="i-lucide-align-left"
          class="size-4"
        />
      </button>
      <button
        type="button"
        :class="toolbarBtn"
        :data-active="alignActive(editor, 'center')"
        title="Wyśrodkuj"
        @click="editor.chain().focus().setTextAlign('center').run()"
      >
        <UIcon
          name="i-lucide-align-center"
          class="size-4"
        />
      </button>
      <button
        type="button"
        :class="toolbarBtn"
        :data-active="alignActive(editor, 'right')"
        title="Wyrównaj do prawej"
        @click="editor.chain().focus().setTextAlign('right').run()"
      >
        <UIcon
          name="i-lucide-align-right"
          class="size-4"
        />
      </button>

      <span class="mx-1 hidden h-6 w-px self-center bg-default/50 sm:inline" />

      <button
        type="button"
        :class="toolbarBtn"
        title="Wstaw / edytuj link"
        @click="setLink"
      >
        <UIcon
          name="i-lucide-link"
          class="size-4"
        />
      </button>
      <button
        type="button"
        :class="toolbarBtn"
        title="Wstaw obraz"
        @click="setImage"
      >
        <UIcon
          name="i-lucide-image"
          class="size-4"
        />
      </button>
      <button
        type="button"
        :class="toolbarBtn"
        title="Usuń formatowanie"
        @click="editor.chain().focus().unsetAllMarks().clearNodes().run()"
      >
        <span class="text-[10px] font-bold">Tx</span>
      </button>
      <button
        type="button"
        :class="toolbarBtn"
        title="Cofnij"
        :disabled="!editor.can().undo()"
        @click="editor.chain().focus().undo().run()"
      >
        <UIcon
          name="i-lucide-undo-2"
          class="size-4"
        />
      </button>
      <button
        type="button"
        :class="toolbarBtn"
        title="Ponów"
        :disabled="!editor.can().redo()"
        @click="editor.chain().focus().redo().run()"
      >
        <UIcon
          name="i-lucide-redo-2"
          class="size-4"
        />
      </button>
    </div>

    <EditorContent
      :editor="editor"
      :style="{ minHeight }"
      class="max-h-[min(520px,55vh)] overflow-y-auto bg-background"
    />
  </div>
</template>
