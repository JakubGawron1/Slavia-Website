<script setup lang="ts">
import { BLOG_POST_UUID_RE, blogPostPath, parseBlogPostId, slugify } from '~/utils/slug'

definePageMeta({
  middleware: 'admin',
  backTo: '/aktualnosci',
  backLabel: 'Wróć do listy'
})

const route = useRoute()
const apiFetch = useApi()

const postId = computed(() => parseBlogPostId(String(route.params.slug ?? '').trim()))

interface BlogPost {
  id: string
  title: string
  content: string
  image_url?: string
  created_at: string
  published: boolean
}

async function fetchPostForEdit(): Promise<BlogPost> {
  const id = String(postId.value ?? '').trim()
  if (!BLOG_POST_UUID_RE.test(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Wpis nie znaleziony', fatal: true })
  }
  const enc = encodeURIComponent(id)
  try {
    return await apiFetch<BlogPost>(`/api/posts/manage/${enc}`)
  } catch {
    return await apiFetch<BlogPost>(`/api/posts/${enc}`)
  }
}

const { data: post, error } = await useAsyncData(
  'aktualnosci-edit-post',
  fetchPostForEdit,
  { watch: [postId] }
)

if (error.value || !post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Wpis nie znaleziony', fatal: true })
}

watch(
  () => post.value?.title,
  title => {
    if (title) {
      useSeoMeta({
        title: `Edycja: ${title} — Aktualności`,
        robots: 'noindex, nofollow'
      })
    }
  },
  { immediate: true }
)

const toast = useToast()

async function goPost() {
  const p = post.value
  if (!p) {
    return
  }
  if (!p.published) {
    toast.add({
      title: 'Ten wpis jest szkicem',
      description: 'Opublikuj go z poziomu edycji lub podglądu, aby zobaczyć stronę publiczną.',
      color: 'warning'
    })
    return
  }
  await navigateTo(blogPostPath(slugify(p.title) || 'wpis', p.id))
}

function goList() {
  navigateTo('/aktualnosci')
}

async function onFormSuccess(e: { published: boolean; postId: string; title: string }) {
  const slug = slugify(e.title) || 'wpis'
  if (e.published) {
    await navigateTo(blogPostPath(slug, e.postId))
  } else {
    await navigateTo('/aktualnosci')
  }
}
</script>

<template>
  <PublicPageLayout
    v-if="post"
    narrow
  >
    <PublicPageHeader
      variant="hero"
      eyebrow="Edycja wpisu"
      icon="i-lucide-pencil-line"
      :title="post.title"
      description="Zmiany są sanityzowane (DOMPurify) tak jak przy tworzeniu wpisu."
      back-to="/aktualnosci"
      back-label="Wróć do listy"
    >
      <template #actions>
        <UButton
          variant="outline"
          color="neutral"
          icon="i-lucide-external-link"
          @click="goPost"
        >
          Podgląd publikacji
        </UButton>
      </template>
    </PublicPageHeader>

    <div class="slavia-public-section">
      <ClientOnly>
        <ClubBlogPostForm
          mode="edit"
          :post-id="post.id"
          :initial-title="post.title"
          :initial-content="post.content"
          :initial-image-url="post.image_url || ''"
          :initial-published="post.published"
          editor-min-height="min(78vh, 640px)"
          @success="onFormSuccess"
          @cancel="goList"
        />
        <template #fallback>
          <div class="slavia-page-card flex flex-col items-center gap-3 px-6 py-14 text-center text-muted">
            <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary/60" />
            <p class="font-medium text-highlighted">
              Ładowanie edytora…
            </p>
          </div>
        </template>
      </ClientOnly>
    </div>
  </PublicPageLayout>
</template>
