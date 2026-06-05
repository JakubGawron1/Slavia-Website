<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { stripHtmlTags } from '~/utils/html'
import { sanitizeRichHtml } from '~/utils/sanitizeHtml'
import { resolveCmsMediaUrl } from '~/utils/cmsAssets'
import { blogEditPath, blogPostPath, slugify } from '~/utils/slug'

const { accountSettingsPath } = useRoleDashboardNav()

useSeoMeta({
  title: 'Aktualności — Slavia Ruda Śląska',
  description: 'Relacje z zawodów i nowości z życia klubu CKS Slavia.',
  ogTitle: 'Aktualności CKS Slavia',
  ogDescription: 'Aktualności klubowe, relacje z zawodów i życie drużyny Slavia.',
  twitterCard: 'summary_large_image'
})

const { auth, canManage, showManageActions, sessionReady } = useClubContentAdmin()
const apiFetch = useApi()
const toast = useToast()
const config = useRuntimeConfig()

interface BlogPost {
  id: string
  title: string
  content: string
  image_url?: string
  created_at: string
  published?: boolean
}

function postImageSrc(url?: string) {
  return resolveCmsMediaUrl(url || '', String(config.public.cmsBaseUrl || ''))
}

// SSR zawsze renderuje publiczną listę (bez ryzyka cache per-user).
const { data: posts, refresh: refreshPublic, pending } = await usePublicLazyFetch<BlogPost[]>('posts', {
  key: 'aktualnosci-posts-public',
  default: () => [] as BlogPost[]
})

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
  $fetch<BlogPost>(publicApiUrl(`posts/${encodeURIComponent(id)}`))
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
  if (import.meta.client && canManage.value && auth.token.value) {
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
  if (!canManage.value) {
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
  <PublicPageLayout>
    <PublicPageHeader
      variant="hero"
      eyebrow="CKS Slavia"
      icon="i-lucide-newspaper"
      title="Aktualności"
      description="Najnowsze informacje i relacje z zawodów naszego klubu."
    >
      <template #actions>
        <UButton
          v-if="showManageActions"
          to="/aktualnosci/nowy"
          icon="i-lucide-pen-tool"
          color="primary"
          size="lg"
          class="min-h-11 w-full shrink-0 justify-center font-semibold sm:w-auto"
        >
          Dodaj wpis
        </UButton>
      </template>
    </PublicPageHeader>

    <div class="slavia-content-well slavia-public-section">
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

    <PublicEmptyState
      v-else-if="!posts || posts.length === 0"
      icon="i-lucide-newspaper"
      title="Brak wpisów"
      description="Zaglądaj tu wkrótce po relacje z zawodów, komunikaty i życie sekcji na sali."
    >
      <UButton
        v-if="showManageActions"
        to="/aktualnosci/nowy"
        icon="i-lucide-pen-tool"
        color="primary"
        size="lg"
        class="min-h-11 w-auto shrink-0 font-semibold"
      >
        Dodaj pierwszy wpis
      </UButton>
      <template
        v-if="auth.isLoggedIn && !canManage && sessionReady"
        #hint
      >
        Tworzenie wpisów mają konta z rolą Administrator lub SuperAdmin.
        <NuxtLink :to="accountSettingsPath" class="font-semibold text-primary underline">
          Sprawdź swoje role
        </NuxtLink>
        — po zmianie roli wyloguj się i zaloguj ponownie.
      </template>
    </PublicEmptyState>

    <div
      v-if="showManageActions && posts && posts.length > 0"
      class="mb-6 flex flex-wrap items-center justify-center gap-2 sm:justify-end"
    >
      <UButton
        to="/aktualnosci/nowy"
        icon="i-lucide-pen-tool"
        color="primary"
        size="lg"
        class="min-h-11 w-full shrink-0 justify-center font-semibold sm:w-auto"
      >
        Dodaj wpis
      </UButton>
    </div>

    <div
      v-if="posts && posts.length > 0"
      class="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:gap-10"
    >
      <article
        v-for="post in posts"
        :key="post.id"
        class="group slavia-page-card flex flex-col overflow-hidden transition-all duration-300 hover:border-primary/35 hover:shadow-md"
        @pointerenter="schedulePrefetch(post)"
        @pointerleave="cancelScheduledPrefetch(post)"
      >
        <div class="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-muted/20 sm:aspect-[5/3]">
          <img
            v-if="post.image_url"
            :src="postImageSrc(post.image_url)"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          >
          <div
            v-else
            class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/8 via-muted/20 to-muted/40"
          >
            <UIcon
              name="i-lucide-newspaper"
              class="size-14 text-primary/25 sm:size-16"
            />
          </div>
        </div>

        <div class="flex flex-1 flex-col p-5 sm:p-6">
          <p class="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <UIcon
              name="i-lucide-calendar"
              class="size-3.5"
            />
            {{ formatDate(post.created_at) }}
          </p>
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <h3 class="min-w-0 flex-1 text-lg font-bold leading-snug tracking-tight text-highlighted line-clamp-2 sm:text-xl">
              {{ post.title }}
            </h3>
            <UBadge
              v-if="canManage && post.published === false"
              color="warning"
              variant="subtle"
              size="xs"
            >
              Szkic
            </UBadge>
          </div>
          <p class="mb-4 line-clamp-3 text-sm leading-relaxed text-muted">
            {{ stripHtmlTags(sanitizeRichHtml(post.content)) }}
          </p>

          <div class="mt-auto flex flex-col gap-3 border-t border-default/60 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
              v-if="canManage"
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
      </article>
    </div>
    </div>
  </PublicPageLayout>
</template>
