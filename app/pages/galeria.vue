<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi'
import { buildUploadFormData } from '~/utils/uploadFormData'
import { resolveGalleryImageUrl } from '~/utils/cmsAssets'

interface GalleryPhoto {
  id: string
  image_url: string
  media_type: string
  caption?: string | null
  sort_order: number
  published: boolean
  author_id: string
  created_at: string
}

useSeoMeta({
  title: 'Galeria zdjęć — Slavia Ruda Śląska',
  description: 'Zdjęcia z treningów, zawodów i życia klubu CKS Slavia.',
  robots: 'index, follow'
})

const { auth, canManage, showManageActions, sessionReady } = useClubContentAdmin()
const { accountSettingsPath } = useRoleDashboardNav()
const apiFetch = useApi()
const toast = useToast()
const config = useRuntimeConfig()

function gallerySrc(url: string) {
  return resolveGalleryImageUrl(url, String(config.public.cmsBaseUrl || ''))
}

// SSR zawsze renderuje publiczną galerię (bez ryzyka cache per-user).
const { data: photos, refresh: refreshPublic, pending } = await usePublicLazyFetch<GalleryPhoto[]>('gallery', {
  key: 'club-gallery-public',
  default: () => [] as GalleryPhoto[]
})

async function refreshList() {
  // Adminowe “manage” ładujemy tylko na kliencie (token w localStorage) — nie wpływa na cache SSR.
  if (import.meta.client && canManage.value && auth.token.value) {
    const list = await apiFetch<GalleryPhoto[]>('/api/gallery/manage').catch(() => null)
    if (Array.isArray(list)) {
      photos.value = list
      return
    }
  }
  await refreshPublic()
}

onMounted(() => {
  void refreshList()
})

const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const draft = reactive({
  image_url: '',
  media_type: 'image',
  caption: '',
  sort_order: 0,
  published: true
})
const uploadLoading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const mediaPreviewOpen = ref(false)
const mediaPreviewItem = ref<GalleryPhoto | null>(null)

function videoPoster(url: string) {
  if (!url.includes('/video/upload/')) return ''
  return url.replace('/video/upload/', '/video/upload/so_1/').replace(/\.(mp4|mov|webm)(\?.*)?$/i, '.jpg$2')
}

function openCreate() {
  editingId.value = null
  draft.image_url = ''
  draft.media_type = 'image'
  draft.caption = ''
  draft.sort_order = 0
  draft.published = true
  modalOpen.value = true
}

function openEdit(p: GalleryPhoto) {
  editingId.value = p.id
  draft.image_url = p.image_url
  draft.media_type = p.media_type || 'image'
  draft.caption = p.caption || ''
  draft.sort_order = Number(p.sort_order) || 0
  draft.published = p.published !== false
  modalOpen.value = true
}

function clickFileInput() {
  fileInputRef.value?.click()
}

function openMediaPreview(item: GalleryPhoto) {
  mediaPreviewItem.value = item
  mediaPreviewOpen.value = true
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
  const isVideo = file.type.startsWith('video/')
  const isImage = file.type.startsWith('image/')
  if (!isVideo && !isImage) {
    toast.add({ title: 'Obsługiwane formaty', description: 'Prześlij obraz albo film (mp4/mov).', color: 'warning' })
    return
  }
  if (isVideo) {
    draft.media_type = 'video'
  }

  const formData = buildUploadFormData(file, 'gallery')
  uploadLoading.value = true
  try {
    const res = await apiFetch<{ url: string }>('/api/upload', {
      method: 'POST',
      body: formData
    })
    draft.image_url = res.url
    toast.add({ title: isVideo ? 'Film przesłany' : 'Zdjęcie przesłane', color: 'success' })
  } catch (err) {
    console.error('[gallery] upload failed', err)
    toast.add({ title: 'Błąd uploadu', description: getApiErrorMessage(err), color: 'error' })
  } finally {
    uploadLoading.value = false
  }
}

async function save() {
  if (!canManage.value) return
  const image_url = draft.image_url.trim()
  if (!image_url) {
    toast.add({ title: 'Prześlij zdjęcie', color: 'warning' })
    return
  }
  try {
    const cap = draft.caption.trim()
    if (editingId.value) {
      await apiFetch(`/api/gallery/${editingId.value}`, {
        method: 'PATCH',
        body: {
          image_url,
          media_type: draft.media_type,
          caption: cap || null,
          sort_order: draft.sort_order,
          published: draft.published
        }
      })
      toast.add({ title: 'Zapisano', color: 'success' })
    } else {
      await apiFetch('/api/gallery', {
        method: 'POST',
        body: {
          image_url,
          media_type: draft.media_type,
          caption: cap || undefined,
          sort_order: draft.sort_order,
          published: draft.published
        }
      })
      toast.add({ title: 'Dodano zdjęcie', color: 'success' })
    }
    modalOpen.value = false
    await refreshList()
  } catch (e) {
    console.error('[gallery] save failed', e)
    toast.add({
      title: 'Błąd zapisu',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

async function remove(id: string) {
  if (!canManage.value) return
  if (!confirm('Usunąć to zdjęcie z galerii? Plik zostanie też usunięty z repozytorium Slavia-cms (GitHub), jeśli jest skonfigurowany.')) return
  try {
    await apiFetch(`/api/gallery/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Usunięto z galerii i repozytorium mediów', color: 'success' })
    if (mediaPreviewItem.value?.id === id) {
      mediaPreviewOpen.value = false
      mediaPreviewItem.value = null
    }
    await refreshList()
  } catch (e) {
    console.error('[gallery] delete failed', e)
    toast.add({
      title: 'Błąd',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

const sortedPhotos = computed(() => {
  const list = [...(photos.value || [])]
  return list.sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return String(b.created_at).localeCompare(String(a.created_at))
  })
})
</script>

<template>
  <PublicPageLayout>
    <PublicPageHeader
      variant="hero"
      eyebrow="CKS Slavia"
      icon="i-lucide-images"
      title="Galeria zdjęć"
      description="Klub w obiektywie — podgląd dla wszystkich; zdjęcia dodaje administrator."
    >
      <template #actions>
        <UButton
          v-if="showManageActions"
          icon="i-lucide-image-plus"
          color="primary"
          size="lg"
          class="min-h-11 w-full shrink-0 justify-center font-semibold sm:w-auto"
          @click="openCreate"
        >
          Dodaj zdjęcie
        </UButton>
      </template>
    </PublicPageHeader>

    <div class="slavia-content-well slavia-public-section">
    <div
      v-if="pending"
      class="py-14"
    >
      <div class="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="i in 6"
          :key="`gallery-skel-${i}`"
          class="overflow-hidden rounded-2xl border border-default bg-card shadow-sm"
        >
          <div class="p-3">
            <SlaviaShimmerText block width="100%" height="10rem" />
            <div class="mt-3 space-y-2">
              <SlaviaShimmerText block width="72%" height="0.85rem" />
              <SlaviaShimmerText block width="58%" height="0.85rem" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <PublicEmptyState
      v-else-if="!sortedPhotos.length"
      icon="i-lucide-images"
      title="Galeria jest pusta"
      description="Tu pojawią się zdjęcia i filmy z treningów, zawodów i życia klubu."
    >
      <UButton
        v-if="showManageActions"
        icon="i-lucide-image-plus"
        color="primary"
        size="lg"
        class="min-h-11 w-auto shrink-0 font-semibold"
        @click="openCreate"
      >
        Dodaj pierwsze zdjęcie
      </UButton>
      <template
        v-if="auth.isLoggedIn && !canManage && sessionReady"
        #hint
      >
        Galerię uzupełniają konta Administrator lub SuperAdmin.
        <NuxtLink :to="accountSettingsPath" class="font-semibold text-primary underline">
          Sprawdź swoje role
        </NuxtLink>
        — po zmianie roli wyloguj się i zaloguj ponownie.
      </template>
    </PublicEmptyState>

    <div
      v-if="showManageActions && sortedPhotos.length > 0"
      class="mb-6 flex flex-wrap items-center justify-center gap-2 sm:justify-end"
    >
      <UButton
        icon="i-lucide-image-plus"
        color="primary"
        size="lg"
        class="min-h-11 w-full shrink-0 justify-center font-semibold sm:w-auto"
        @click="openCreate"
      >
        Dodaj zdjęcie
      </UButton>
    </div>

    <div
      v-if="sortedPhotos.length > 0"
      class="columns-1 gap-5 sm:columns-2 sm:gap-6 lg:columns-3"
    >
      <figure
        v-for="p in sortedPhotos"
        :key="p.id"
        class="group slavia-page-card mb-5 break-inside-avoid overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-md sm:mb-6"
      >
        <div class="relative">
          <img
            v-if="p.media_type === 'image'"
            :src="gallerySrc(p.image_url)"
            :alt="p.caption || 'Zdjęcie klubu'"
            class="w-full cursor-zoom-in object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
            @click="openMediaPreview(p)"
          >
          <button
            v-else
            type="button"
            class="group relative block w-full text-left"
            @click="openMediaPreview(p)"
          >
            <video
              :src="gallerySrc(p.image_url)"
              :poster="videoPoster(gallerySrc(p.image_url))"
              class="w-full object-cover"
              preload="metadata"
              muted
            />
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35">
              <span class="flex items-center gap-2 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white">
                <UIcon name="i-lucide-play" class="size-4" />
                Odtwórz film
              </span>
            </div>
          </button>
          <UBadge
            v-if="canManage && !p.published"
            class="absolute left-2 top-2"
            color="warning"
            size="xs"
          >
            Szkic
          </UBadge>
          <div
            v-if="canManage"
            class="absolute right-2 top-2 flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
          >
            <UButton
              size="xs"
              color="neutral"
              variant="solid"
              icon="i-lucide-pencil"
              aria-label="Edytuj"
              @click.stop="openEdit(p)"
            />
            <UButton
              size="xs"
              color="error"
              variant="solid"
              icon="i-lucide-trash-2"
              aria-label="Usuń"
              @click.stop="remove(p.id)"
            />
          </div>
        </div>
        <figcaption
          v-if="p.caption || canManage"
          class="flex flex-col gap-2 border-t border-default/50 bg-muted/10 p-4"
        >
          <p
            v-if="p.caption"
            class="text-sm leading-relaxed text-muted"
          >
            {{ p.caption }}
          </p>
          <div
            v-if="canManage"
            class="flex flex-wrap gap-2"
          >
            <UButton
              size="xs"
              variant="soft"
              icon="i-lucide-pencil"
              @click="openEdit(p)"
            >
              Edytuj
            </UButton>
            <UButton
              size="xs"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              @click="remove(p.id)"
            >
              Usuń
            </UButton>
          </div>
        </figcaption>
      </figure>
    </div>
    </div>

    <UModal
      v-model:open="modalOpen"
      :title="editingId ? 'Edytuj zdjęcie' : 'Nowe zdjęcie'"
      :dismissible="true"
      :ui="{ content: 'max-h-[90vh] overflow-y-auto sm:max-w-2xl md:max-w-3xl lg:max-w-4xl' }"
    >
      <template #body>
        <div class="flex flex-col gap-4 p-4 sm:p-6">
          <UFormField
            label="Zdjęcie"
            description="Prześlij zdjęcie z urządzenia."
            required
          >
            <div class="flex flex-wrap items-center gap-2">
              <UInput
                v-model="draft.image_url"
                placeholder="URL zdjęcia..."
                size="lg"
                class="min-w-0 flex-1"
                readonly
              />
              <UButton
                icon="i-lucide-upload"
                color="neutral"
                variant="soft"
                size="lg"
                :loading="uploadLoading"
                type="button"
                @click="clickFileInput"
              >
                Prześlij
              </UButton>
              <input
                ref="fileInputRef"
                type="file"
                hidden
                :accept="draft.media_type === 'video' ? 'video/*' : 'image/*'"
                @change="onFileChange"
              >
            </div>
          </UFormField>
          <UFormField label="Typ mediów">
            <URadioGroup
              v-model="draft.media_type"
              :options="[
                { label: 'Zdjęcie', value: 'image' },
                { label: 'Film', value: 'video' }
              ]"
            />
          </UFormField>
          <UFormField label="Podpis (opcjonalnie)">
            <UInput
              v-model="draft.caption"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Kolejność wyświetlania">
            <UInput
              v-model.number="draft.sort_order"
              type="number"
              class="w-full max-w-48"
            />
          </UFormField>
          <label class="flex cursor-pointer items-center gap-3 text-sm text-highlighted">
            <USwitch v-model="draft.published" />
            Opublikowane
          </label>
          <div class="flex flex-wrap justify-end gap-2 border-t border-default pt-4">
            <UButton
              variant="ghost"
              color="neutral"
              @click="modalOpen = false"
            >
              Anuluj
            </UButton>
            <UButton
              color="primary"
              @click="save"
            >
              Zapisz
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
    <UModal
      v-model:open="mediaPreviewOpen"
      :title="mediaPreviewItem?.caption || (mediaPreviewItem?.media_type === 'video' ? 'Podgląd filmu' : 'Podgląd zdjęcia')"
      :dismissible="true"
      :ui="{ content: 'max-w-5xl' }"
    >
      <template #body>
        <div class="p-3 sm:p-4">
          <img
            v-if="mediaPreviewItem?.media_type === 'image'"
            :src="gallerySrc(mediaPreviewItem.image_url)"
            :alt="mediaPreviewItem.caption || 'Podgląd zdjęcia'"
            class="max-h-[75vh] w-full rounded-lg object-contain"
          >
          <video
            v-else-if="mediaPreviewItem"
            :src="gallerySrc(mediaPreviewItem.image_url)"
            :poster="videoPoster(mediaPreviewItem.image_url)"
            controls
            class="max-h-[75vh] w-full rounded-lg bg-black object-contain"
            autoplay
          />
          <div
            v-if="canManage && mediaPreviewItem"
            class="mt-4 flex flex-wrap justify-end gap-2 border-t border-default pt-4"
          >
            <UButton
              variant="soft"
              icon="i-lucide-pencil"
              @click="openEdit(mediaPreviewItem); mediaPreviewOpen = false"
            >
              Edytuj
            </UButton>
            <UButton
              color="error"
              variant="soft"
              icon="i-lucide-trash-2"
              @click="remove(mediaPreviewItem.id)"
            >
              Usuń z galerii
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </PublicPageLayout>
</template>
