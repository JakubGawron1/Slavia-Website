<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { isProbablyRichHtml, stripHtmlTags } from '~/utils/html'
import { sanitizeRichHtml } from '~/utils/sanitizeHtml'
import { parseBlogPostId } from '~/utils/slug'

const route = useRoute()
const apiFetch = useApi()
const auth = useAuth()
const config = useRuntimeConfig()

const rawSlug = String(route.params.slug || '')
const postId = parseBlogPostId(rawSlug)

interface BlogPost {
  title: string
  content: string
  created_at: string
  image_url?: string
}

function publicBase() {
  return String(config.public.apiBase || '').replace(/\/$/, '')
}

const base = computed(() => publicBase())
const isAdmin = computed(() => auth.isAdmin.value || auth.isSuperAdmin.value)

// SSR zawsze renderuje wersję publiczną wpisu (cache/ISR bez ryzyka per-user).
const { data: post, pending, refresh: refreshPublic } = await useLazyFetch<BlogPost | null>(
  () => `${base.value}/api/posts/${encodeURIComponent(String(postId))}`,
  {
    key: `aktualnosci-post-public-${String(postId)}`,
    default: () => null,
    server: true
  }
)

async function refreshPost() {
  // Adminowe “manage” ładujemy tylko na kliencie (token w localStorage).
  if (import.meta.client && isAdmin.value && auth.token.value) {
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

const sanitizedPostContent = computed(() => sanitizeRichHtml(post.value?.content ?? ''))

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
const seoOgImage = computed(() => post.value?.image_url || '/logo.png')

useSeoMeta({
  title: seoTitle,
  description: seoDesc,
  ogImage: seoOgImage
})

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
  <article class="animate-page-in py-8 sm:py-12 lg:py-16">
    <UContainer class="max-w-3xl px-2 sm:px-0">
      <NuxtLink
        to="/aktualnosci"
        class="mb-8 inline-flex items-center text-sm font-medium text-muted transition-colors hover:text-primary"
      >
        <UIcon name="i-lucide-arrow-left" class="mr-1 size-4" />
        Wróć do aktualności
      </NuxtLink>

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

      <div
        v-else-if="!post"
        class="rounded-2xl border border-dashed border-default bg-muted/10 px-6 py-14 text-center text-muted"
      >
        Nie znaleziono wpisu.
      </div>

      <template v-else>
        <header class="mb-10 text-center">
          <p class="mb-4 flex items-center justify-center gap-1.5 text-sm font-medium text-primary">
            <UIcon
              name="i-lucide-calendar"
              class="size-4"
            />
            Opublikowano {{ formatDate(post.created_at) }}
          </p>
          <h1 class="text-3xl font-extrabold tracking-tight text-highlighted sm:text-4xl md:text-5xl">
            {{ post.title }}
          </h1>
        </header>

        <div class="mb-12 w-full overflow-hidden rounded-2xl shadow-inner ring-1 ring-default/40">
          <img
            v-if="post.image_url"
            :src="post.image_url"
            :alt="`Zdjęcie wpisu ${post.title}`"
            class="h-64 w-full object-cover md:h-96"
          >
          <div
            v-else
            class="flex h-64 items-center justify-center rounded-2xl bg-linear-to-br from-primary/15 via-muted/30 to-neutral-900/80 md:h-96 dark:from-primary/25 dark:to-neutral-950"
          >
            <UIcon
              name="i-lucide-camera"
              class="size-16 text-primary/35"
            />
          </div>
        </div>

        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="isProbablyRichHtml(post.content)" class="slavia-rich-content prose prose-lg prose-neutral max-w-none leading-relaxed dark:prose-invert" v-html="sanitizedPostContent" />
        <div
          v-else
          class="prose prose-neutral max-w-none text-muted dark:prose-invert prose-lg leading-relaxed"
        >
          <p class="whitespace-pre-wrap">
            {{ post.content }}
          </p>
        </div>
      </template>
    </UContainer>
  </article>
</template>
