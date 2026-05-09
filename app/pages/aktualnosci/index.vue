<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { stripHtmlTags } from '~/utils/html'
import { sanitizeRichHtml } from '~/utils/sanitizeHtml'
import { blogEditPath, blogPostPath, slugify } from '~/utils/slug'

useSeoMeta({
  title: 'Aktualności — Slavia Ruda Śląska',
  description: 'Relacje z zawodów i nowości z życia klubu CKS Slavia.',
  ogTitle: 'Aktualności CKS Slavia',
  ogDescription: 'Aktualności klubowe, relacje z zawodów i życie drużyny Slavia.',
  twitterCard: 'summary_large_image'
})

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()
const config = useRuntimeConfig()

const isAdmin = computed(() => auth.isAdmin.value || auth.isSuperAdmin.value)

interface BlogPost {
  id: string
  title: string
  content: string
  image_url?: string
  created_at: string
  published?: boolean
}

function publicBase() {
  return String(config.public.apiBase || '').replace(/\/$/, '')
}

const base = computed(() => publicBase())

// SSR zawsze renderuje publiczną listę (bez ryzyka cache per-user).
const { data: posts, refresh: refreshPublic, pending } = await useLazyFetch<BlogPost[]>(
  () => `${base.value}/api/posts`,
  {
    key: 'aktualnosci-posts-public',
    default: () => [] as BlogPost[],
    server: true
  }
)

// Prefetch danych wpisu na hover/focus (limit + debounce), żeby przejście na `/aktualnosci/[slug]` było instant.
const prefetchedIds = new Set<string>()
const inFlightIds = new Set<string>()
const hoverTimers = new Map<string, number>()
const PREFETCH_DELAY_MS = 140
const MAX_PREFETCH_IN_FLIGHT = 2

function prefetchPostData(post: BlogPost) {
  const id = String(post?.id || '')
  if (!id) return
  if (prefetchedIds.has(id) || inFlightIds.has(id)) return
  if (inFlightIds.size >= MAX_PREFETCH_IN_FLIGHT) return

  const key = `aktualnosci-post-public-${id}`
  const existing = useNuxtData<BlogPost | null>(key).data.value
  if (existing) {
    prefetchedIds.add(id)
    return
  }

  inFlightIds.add(id)
  $fetch<BlogPost>(`${base.value}/api/posts/${encodeURIComponent(id)}`)
    .then((res) => {
      if (!res) return
      useNuxtData<BlogPost | null>(key).data.value = res
      prefetchedIds.add(id)
    })
    .catch(() => {
      // cicho: prefetch ma nie przeszkadzać
    })
    .finally(() => {
      inFlightIds.delete(id)
    })
}

function schedulePrefetch(post: BlogPost) {
  const id = String(post?.id || '')
  if (!id) return
  if (hoverTimers.has(id)) return
  const t = window.setTimeout(() => {
    hoverTimers.delete(id)
    prefetchPostData(post)
  }, PREFETCH_DELAY_MS)
  hoverTimers.set(id, t)
}

function cancelScheduledPrefetch(post: BlogPost) {
  const id = String(post?.id || '')
  if (!id) return
  const t = hoverTimers.get(id)
  if (t != null) {
    window.clearTimeout(t)
    hoverTimers.delete(id)
  }
}

async function refreshList() {
  // Adminowe “manage” ładujemy tylko na kliencie (token w localStorage).
  if (import.meta.client && (auth.isAdmin.value || auth.isSuperAdmin.value) && auth.token.value) {
    const list = await apiFetch<BlogPost[]>('/api/posts/manage').catch(() => null)
    if (Array.isArray(list)) {
      posts.value = list
      return
    }
  }
  await refreshPublic()
}

onMounted(() => {
  void refreshList()
})

async function deletePost(id: string) {
  if (!isAdmin.value) {
    toast.add({ title: 'Brak uprawnień', color: 'error' })
    return
  }

  if (!confirm('Czy na pewno usunąć ten wpis?')) return

  try {
    await apiFetch(`/api/posts/${id}`, { method: 'DELETE' })
    toast.add({ title: 'Wpis usunięty', color: 'success' })
    await refreshList()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    toast.add({ title: 'Błąd usuwania', color: 'error' })
  }
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'dd MMMM yyyy, HH:mm', { locale: pl })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return dateStr
  }
}

function postUrl(post: BlogPost) {
  return blogPostPath(slugify(post.title) || 'wpis', post.id)
}

function editPostUrl(post: BlogPost) {
  return blogEditPath(slugify(post.title) || 'wpis', post.id)
}
</script>

<template>
  <UContainer class="animate-page-in py-8 sm:py-12 lg:py-14">
    <div class="mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight text-highlighted sm:text-3xl lg:text-4xl">
          Aktualności
        </h1>
        <p class="mt-2 text-sm text-muted sm:text-base lg:text-lg lg:leading-relaxed">
          Najnowsze informacje i relacje z zawodów naszego klubu.
        </p>
      </div>
      <UButton
        v-if="isAdmin"
        to="/aktualnosci/nowy"
        icon="i-lucide-pen-tool"
        color="primary"
        class="min-h-11 w-full shrink-0 justify-center md:w-auto"
      >
        Dodaj wpis
      </UButton>
    </div>

    <div
      v-if="pending"
      class="py-10"
    >
      <div class="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
        <div
          v-for="i in 6"
          :key="`posts-skel-${i}`"
          class="overflow-hidden rounded-2xl border border-default bg-card p-5 shadow-sm"
        >
          <div class="h-44 rounded-lg bg-muted/30 animate-pulse sm:h-48" />
          <div class="mt-4 space-y-2">
            <div class="h-3.5 w-44 rounded bg-primary/15 animate-pulse" />
            <div class="h-6 w-[88%] rounded bg-muted/35 animate-pulse" />
            <div class="h-6 w-[72%] rounded bg-muted/30 animate-pulse" />
            <div class="mt-3 space-y-2">
              <div class="h-4 w-full rounded bg-muted/25 animate-pulse" />
              <div class="h-4 w-[92%] rounded bg-muted/25 animate-pulse" />
              <div class="h-4 w-[78%] rounded bg-muted/25 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="!posts || posts.length === 0"
      class="text-center py-20 border border-dashed border-default rounded-xl bg-muted/5"
    >
      <UIcon
        name="i-lucide-newspaper"
        class="size-12 mx-auto text-muted/50 mb-4"
      />
      <h3 class="text-lg font-medium text-highlighted">
        Brak wpisów
      </h3>
      <p class="text-muted mt-1">
        Zaglądaj tu wkrótce po nowości ze świata ciężarów.
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:gap-10"
    >
      <UCard
        v-for="post in posts"
        :key="post.id"
        class="group flex flex-col overflow-hidden border-transparent transition-colors hover:border-primary/50"
        @pointerenter="schedulePrefetch(post)"
        @pointerleave="cancelScheduledPrefetch(post)"
      >
        <div class="relative mb-4 flex h-44 items-center justify-center overflow-hidden rounded-lg bg-neutral-800 sm:h-48">
          <img
            v-if="post.image_url"
            :src="post.image_url"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          >
          <div
            v-else
            class="w-full h-full bg-linear-to-br from-primary/20 to-neutral-900 flex items-center justify-center"
          >
            <UIcon
              name="i-lucide-newspaper"
              class="size-16 text-primary/10"
            />
          </div>
        </div>

        <div class="flex-1 flex flex-col">
          <p class="text-xs font-medium text-primary mb-2 flex items-center gap-1.5">
            <UIcon
              name="i-lucide-calendar"
              class="size-3.5"
            />
            {{ formatDate(post.created_at) }}
          </p>
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <h3 class="text-xl font-bold text-highlighted line-clamp-2 flex-1 min-w-0">
              {{ post.title }}
            </h3>
            <UBadge
              v-if="isAdmin && post.published === false"
              color="warning"
              variant="subtle"
              size="xs"
            >
              Szkic
            </UBadge>
          </div>
          <p class="text-muted text-sm line-clamp-3 mb-4">
            {{ stripHtmlTags(sanitizeRichHtml(post.content)) }}
          </p>

          <div class="mt-auto flex flex-col gap-3 border-t border-default pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <UButton
              :to="postUrl(post)"
              prefetch
              prefetch-on="interaction"
              variant="link"
              color="primary"
              trailing-icon="i-lucide-arrow-right"
              class="min-h-10 justify-start px-0"
              @focus="schedulePrefetch(post)"
            >
              Czytaj więcej
            </UButton>

            <div
              v-if="isAdmin"
              class="flex flex-wrap gap-2"
            >
              <UButton
                :to="editPostUrl(post)"
                prefetch
                prefetch-on="interaction"
                size="sm"
                color="neutral"
                variant="soft"
                icon="i-lucide-pencil"
                class="min-h-10"
              >
                Edytuj
              </UButton>
              <UButton
                size="sm"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                class="min-h-10"
                @click="deletePost(post.id)"
              >
                Usuń
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
