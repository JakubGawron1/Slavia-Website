<script setup lang="ts">
import { blogEditPath, blogPostPath, slugify } from '~/utils/slug'

definePageMeta({ middleware: 'admin' })

useSeoMeta({
  title: 'Nowy wpis — Aktualności Slavia',
  robots: 'noindex, nofollow'
})

function goList() {
  navigateTo('/aktualnosci')
}

async function onFormSuccess(e: { published: boolean; postId: string; title: string }) {
  const slug = slugify(e.title) || 'wpis'
  if (e.published) {
    await navigateTo(blogPostPath(slug, e.postId))
  } else {
    await navigateTo(blogEditPath(slug, e.postId))
  }
}
</script>

<template>
  <PublicPageLayout narrow>
    <PublicPageHeader
      variant="hero"
      eyebrow="Aktualności klubu"
      icon="i-lucide-pen-tool"
      title="Nowy wpis"
      description="Pełnoekranowy edytor — więcej miejsca na treść i podgląd formatowania."
      back-to="/aktualnosci"
      back-label="Wróć do listy"
    />

    <div class="slavia-public-section">
      <ClientOnly>
        <ClubBlogPostForm
          mode="create"
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
