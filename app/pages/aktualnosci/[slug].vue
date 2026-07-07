<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { isProbablyRichHtml, stripHtmlTags } from '~/utils/html'
import { sanitizeRichHtml } from '~/utils/sanitizeHtml'
import { resolveCmsMediaUrl } from '~/utils/cmsAssets'
import { parseBlogPostId } from '~/utils/slug'

const route = useRoute()
const apiFetch = useApi()
const config = useRuntimeConfig()
const toast = useToast()
const requestUrlState = useRequestURL()
const { auth, canManage } = useClubContentAdmin()

definePageMeta({
  backTo: '/aktualnosci',
  backLabel: 'Wróć do aktualności'
})

const rawSlug = String(route.params.slug || '')
const postId = parseBlogPostId(rawSlug)

interface BlogPost {
  title: string
  content: string
  created_at: string
  image_url?: string
}

// SSR renderuje wersję publiczną wpisu (bez per-user cache).
const { data: post, pending, error: postError, refresh: refreshPublic } = await usePublicLazyFetch<BlogPost>(
  `posts/${encodeURIComponent(String(postId))}`,
  {
    key: `aktualnosci-post-public-${String(postId)}`
  }
)

async function refreshPost() {
  // Adminowe “manage” ładujemy tylko na kliencie (token w localStorage).
  if (import.meta.client && canManage.value && auth.token.value) {
    const managed = await apiFetch<BlogPost>(`/api/posts/manage/${encodeURIComponent(String(postId))}`).catch(() => null)
    if (managed) {
      post.value = managed
      return
    }
  }
  await refreshPublic()
}

onMounted(() => {
  void refreshPost()
})

const plainExcerpt = computed(() => stripHtmlTags(sanitizeRichHtml(post.value?.content ?? '')).slice(0, 168))

const seoTitle = computed(() =>
  post.value?.title
    ? `${post.value?.title} — Slavia Ruda Śląska`
    : 'Aktualności — Slavia Ruda Śląska'
)
const seoDesc = computed(() =>
  plainExcerpt.value
    ? `${plainExcerpt.value}…`
    : (post.value?.title || 'Aktualności klubu CKS Slavia.')
)
const seoOgImage = computed(() => {
  const raw = post.value?.image_url
  if (!raw) {
    return '/logo.png'
  }
  return resolveCmsMediaUrl(raw, String(config.public.cmsBaseUrl || ''))
})

function postImageSrc(url?: string) {
  return resolveCmsMediaUrl(url || '', String(config.public.cmsBaseUrl || ''))
}

useSeoMeta({
  title: seoTitle,
  description: seoDesc,
  ogTitle: seoTitle,
  ogDescription: seoDesc,
  ogImage: seoOgImage,
  ogType: 'article',
  twitterCard: 'summary_large_image'
})

const postShareUrl = computed(() => `${requestUrlState.origin}${route.fullPath}`)

const canNativeShare = computed(
  () => import.meta.client && typeof navigator !== 'undefined' && typeof navigator.share === 'function'
)

async function copyPostLink() {
  if (!import.meta.client) return
  try {
    await navigator.clipboard.writeText(postShareUrl.value)
    toast.add({
      title: 'Skopiowano link do wpisu',
      color: 'success'
    })
  } catch {
    toast.add({ title: 'Nie udało się skopiować linku', color: 'warning' })
  }
}

async function sharePost() {
  if (!post.value || !canNativeShare.value) return
  try {
    await navigator.share({
      title: post.value.title,
      text: plainExcerpt.value || post.value.title,
      url: postShareUrl.value
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return
    await copyPostLink()
  }
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'd MMMM yyyy', { locale: pl })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return dateStr
  }
}
</script>

<template>
  <PublicPageLayout narrow :animate="false">
    <PublicPageHeader
      v-if="post"
      back-to="/aktualnosci"
      back-label="Wróć do aktualności"
      :title="post.title"
    >
      <template #description>
        <span class="inline-flex items-center gap-1.5 text-primary">
          <UIcon name="i-lucide-calendar" class="size-4" />
          Opublikowano {{ formatDate(post.created_at) }}
        </span>
      </template>
      <template #actions>
        <UButton
          variant="outline"
          color="neutral"
          size="md"
          icon="i-lucide-link"
          class="min-h-10 font-semibold"
          @click="copyPostLink"
        >
          Kopiuj link
        </UButton>
        <UButton
          v-if="canNativeShare"
          variant="soft"
          color="primary"
          size="md"
          icon="i-lucide-share-2"
          class="min-h-10 font-semibold"
          @click="sharePost"
        >
          Udostępnij
        </UButton>
      </template>
    </PublicPageHeader>

    <article class="slavia-public-section">

      <div
        v-if="pending && !post"
        class="space-y-6"
      >
        <div class="mx-auto max-w-xl text-center space-y-3">
          <div class="mx-auto h-4 w-44 rounded bg-muted/40 animate-pulse" />
          <div class="mx-auto h-10 w-full max-w-120 rounded bg-muted/40 animate-pulse" />
          <div class="mx-auto h-10 w-full max-w-96 rounded bg-muted/30 animate-pulse" />
        </div>
        <div class="h-64 w-full rounded-2xl bg-muted/30 animate-pulse md:h-96" />
        <div class="space-y-3">
          <div class="h-4 w-full rounded bg-muted/30 animate-pulse" />
          <div class="h-4 w-[92%] rounded bg-muted/30 animate-pulse" />
          <div class="h-4 w-[85%] rounded bg-muted/30 animate-pulse" />
          <div class="h-4 w-[78%] rounded bg-muted/30 animate-pulse" />
        </div>
      </div>

      <PublicApiErrorBanner
        v-else-if="postError"
        :error="postError"
        @retry="refreshPublic()"
      />

      <PublicEmptyState
        v-else-if="!post"
        icon="i-lucide-file-question"
        title="Nie znaleziono wpisu"
        description="Ten artykuł mógł zostać usunięty lub adres jest nieprawidłowy."
        compact
      >
        <UButton
          to="/aktualnosci"
          color="primary"
          variant="soft"
          icon="i-lucide-arrow-left"
        >
          Wróć do listy
        </UButton>
      </PublicEmptyState>

      <template v-else>
        <div class="mb-10 w-full overflow-hidden rounded-2xl ring-1 ring-default/50 shadow-sm">
          <img
            v-if="post.image_url"
            :src="postImageSrc(post.image_url)"
            :alt="`Zdjęcie wpisu ${post.title}`"
            class="h-64 w-full object-cover md:h-96"
          >
          <div
            v-else
            class="flex h-64 items-center justify-center bg-linear-to-br from-primary/10 via-muted/25 to-muted/40 md:h-96"
          >
            <UIcon
              name="i-lucide-camera"
              class="size-16 text-primary/35"
            />
          </div>
        </div>

        <SlaviaSafeHtml
          v-if="isProbablyRichHtml(post.content)"
          class="slavia-rich-content prose prose-lg prose-neutral max-w-none leading-relaxed dark:prose-invert"
          :html="post.content"
        />
        <div
          v-else
          class="prose prose-neutral max-w-none text-muted dark:prose-invert prose-lg leading-relaxed"
        >
          <p class="whitespace-pre-wrap">
            {{ post.content }}
          </p>
        </div>
      </template>
    </article>
  </PublicPageLayout>
</template>
