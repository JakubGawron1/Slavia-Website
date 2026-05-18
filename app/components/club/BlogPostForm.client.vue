<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi'
import { stripHtmlTags } from '~/utils/html'
import { sanitizeRichHtml } from '~/utils/sanitizeHtml'
import { buildUploadFormData } from '~/utils/uploadFormData'

const props = withDefaults(
  defineProps<{
    mode: 'create' | 'edit'
    postId?: string
    initialTitle?: string
    initialContent?: string
    initialImageUrl?: string
    /** Domyślnie `true` — wpisy bez pola z API traktujemy jak opublikowane (kompatybilność). */
    initialPublished?: boolean
    editorMinHeight?: string
  }>(),
  {
    postId: undefined,
    initialTitle: '',
    initialContent: '<p></p>',
    initialImageUrl: '',
    initialPublished: true,
    editorMinHeight: 'min(72vh, 560px)'
  }
)

const emit = defineEmits<{
  success: [payload: { published: boolean; postId: string; title: string }]
  cancel: []
}>()

const apiFetch = useApi()
const toast = useToast()

const title = ref(props.initialTitle)
const content = ref(props.initialContent || '<p></p>')
const image_url = ref(props.initialImageUrl || '')
const submitting = ref(false)
const uploadLoading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

/** Podgląd zamienia edytor na kartę — jednym kliknięciem wracasz. */
const previewOpen = ref(false)

watch(
  () =>
    [props.initialTitle, props.initialContent, props.initialImageUrl, props.initialPublished] as const,
  ([t, c, img, pub]) => {
    title.value = t ?? ''
    content.value = c || '<p></p>'
    image_url.value = img ?? ''
    if (pub !== undefined) {
      lastKnownPublished.value = !!pub
    }
  }
)

/** Do badge na podglądzie — po zapisie odświeżany przez watch z props (edit). */
const lastKnownPublished = ref(!!props.initialPublished)

const sanitizedBody = computed(() => sanitizeRichHtml(content.value.trim()))

function clickFileInput() {
  fileInputRef.value?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) {
    return
  }
  const file = input.files[0]
  input.value = ''
  if (!file) {
    return
  }

  const formData = buildUploadFormData(file, 'blog')
  uploadLoading.value = true
  try {
    const res = await apiFetch<{ url: string }>('/api/upload', {
      method: 'POST',
      body: formData
    })
    image_url.value = res.url
    toast.add({ title: 'Zdjęcie przesłane', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Błąd uploadu', description: getApiErrorMessage(err), color: 'error' })
  } finally {
    uploadLoading.value = false
  }
}

async function saveWithPublished(published: boolean) {
  const sanitized = sanitizeRichHtml(content.value.trim())
  if (!title.value.trim() || !stripHtmlTags(sanitized)) {
    toast.add({ title: 'Uzupełnij tytuł i treść wpisu', color: 'warning' })
    return
  }

  submitting.value = true
  try {
    const body = {
      title: title.value.trim(),
      content: sanitized,
      image_url: image_url.value?.trim() || null as string | null,
      published
    }
    type PostRef = { id: string; title: string }
    let refPost: PostRef
    if (props.mode === 'create') {
      refPost = await apiFetch<PostRef>('/api/posts', { method: 'POST', body })
      toast.add({
        title: published ? 'Opublikowano wpis' : 'Zapisano szkic',
        color: 'success'
      })
    } else {
      if (!props.postId) {
        toast.add({ title: 'Brak identyfikatora wpisu', color: 'error' })
        return
      }
      refPost = await apiFetch<PostRef>(`/api/posts/${encodeURIComponent(props.postId)}`, {
        method: 'PATCH',
        body
      })
      toast.add({
        title: published ? 'Zapisano i opublikowano' : 'Zapisano jako szkic',
        color: 'success'
      })
      lastKnownPublished.value = published
    }
    emit('success', {
      published,
      postId: refPost.id,
      title: refPost.title
    })
  } catch (err) {
    toast.add({ title: 'Błąd zapisu', description: String(err), color: 'error' })
  } finally {
    submitting.value = false
  }
}

function closePreview() {
  previewOpen.value = false
}
</script>

<template>
  <div class="space-y-6">
    <!-- Pasek trybu: edycja ↔ podgląd -->
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-default/60 bg-muted/15 px-4 py-3">
      <div class="flex flex-wrap items-center gap-2">
        <UBadge
          v-if="previewOpen"
          color="primary"
          variant="subtle"
        >
          Podgląd
        </UBadge>
        <UBadge
          v-else
          color="neutral"
          variant="subtle"
        >
          Edycja
        </UBadge>
        <UBadge
          v-if="!lastKnownPublished && mode === 'edit'"
          color="warning"
          variant="subtle"
        >
          Szkic
        </UBadge>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-if="previewOpen"
          color="primary"
          variant="soft"
          icon="i-lucide-pencil"
          size="sm"
          @click="closePreview"
        >
          Wróć do edycji
        </UButton>
        <UButton
          v-else
          color="neutral"
          variant="outline"
          icon="i-lucide-eye"
          size="sm"
          @click="previewOpen = true"
        >
          Podgląd
        </UButton>
      </div>
    </div>

    <!-- Podgląd publikacji -->
    <UCard
      v-if="previewOpen"
      class="overflow-hidden rounded-2xl ring-1 ring-primary/15"
    >
      <template #header>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wider text-primary">
              Jak zobaczą gość na blogu
            </p>
            <h2 class="mt-1 text-xl font-bold text-highlighted sm:text-2xl">
              {{ title.trim() || '(bez tytułu)' }}
            </h2>
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-pencil"
              @click="closePreview"
            >
              Edycja
            </UButton>
            <UButton
              color="neutral"
              variant="soft"
              size="sm"
              :loading="submitting"
              icon="i-lucide-file-clock"
              @click="saveWithPublished(false)"
            >
              Zapisz szkic
            </UButton>
            <UButton
              color="primary"
              size="sm"
              :loading="submitting"
              icon="i-lucide-send"
              @click="saveWithPublished(true)"
            >
              Opublikuj
            </UButton>
          </div>
        </div>
      </template>
      <div class="space-y-4 p-4 sm:p-6">
        <img
          v-if="image_url.trim()"
          :src="image_url.trim()"
          alt=""
          class="max-h-72 w-full rounded-xl object-cover ring-1 ring-default/40"
        >
        <!-- Treść po DOMPurify — vue/no-v-html: narzędzie nie widzi sanityzacji. -->
        <!-- eslint-disable vue/no-v-html -->
        <div
          class="slavia-rich-content prose prose-lg prose-neutral max-w-none leading-relaxed dark:prose-invert"
          v-html="sanitizedBody"
        />
        <!-- eslint-enable vue/no-v-html -->
      </div>
    </UCard>

    <!-- Formularz edycji -->
    <div
      v-show="!previewOpen"
      class="space-y-6"
    >
      <div class="slavia-form-panel">
        <div class="slavia-form-panel__header">
          <div class="slavia-form-panel__title">
            <span class="slavia-form-panel__icon">
              <UIcon
                name="i-lucide-file-text"
                class="size-4"
              />
            </span>
            Treść wpisu
          </div>
        </div>
        <div class="slavia-form-panel__body space-y-5">
          <UFormField
            label="Tytuł"
            required
          >
            <UInput
              v-model="title"
              placeholder="Chwytliwy tytuł…"
              size="lg"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Zdjęcie (URL lub upload)">
            <div class="flex flex-wrap items-center gap-2">
              <UInput
                v-model="image_url"
                placeholder="https://..."
                size="lg"
                class="min-w-0 flex-1"
              />
              <UButton
                icon="i-lucide-upload"
                color="neutral"
                variant="soft"
                size="lg"
                :loading="uploadLoading"
                type="button"
                @click="clickFileInput"
              />
              <input
                ref="fileInputRef"
                type="file"
                hidden
                accept="image/*"
                @change="onFileChange"
              >
            </div>
          </UFormField>
          <UFormField
            label="Treść"
            description="Formatowanie: nagłówki, listy, kolory, marker, linki."
            required
          >
            <ClubRichTextEditor
              v-model="content"
              placeholder="Treść aktualności…"
              :min-height="editorMinHeight"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-3 border-t border-default/60 pt-4">
        <UButton
          color="neutral"
          variant="soft"
          size="lg"
          type="button"
          @click="emit('cancel')"
        >
          Anuluj
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          size="lg"
          type="button"
          :loading="submitting"
          icon="i-lucide-file-clock"
          @click="saveWithPublished(false)"
        >
          Zapisz jako szkic
        </UButton>
        <UButton
          color="primary"
          size="lg"
          type="button"
          :loading="submitting"
          icon="i-lucide-send"
          @click="saveWithPublished(true)"
        >
          {{ mode === 'create' ? 'Opublikuj' : 'Zapisz i opublikuj' }}
        </UButton>
      </div>
    </div>
  </div>
</template>
