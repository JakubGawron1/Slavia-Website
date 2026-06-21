<script setup lang="ts">
import type { HomeNewsPost } from '~/data/homePageContent'
import { resolveCmsMediaUrl } from '~/utils/cmsAssets'
import { formatHomePostDate, homePostExcerpt } from '~/utils/homePagePosts'
import { blogPostPath } from '~/utils/slug'

defineProps<{
  posts: HomeNewsPost[]
}>()

const config = useRuntimeConfig()

function postImageSrc(url?: string) {
  return resolveCmsMediaUrl(url || '', String(config.public.cmsBaseUrl || ''))
}
</script>

<template>
  <section
    v-if="posts.length > 0"
    class="slavia-public-section slavia-public-section--band"
  >
    <UContainer>
      <PublicSectionHead
        split
        eyebrow="Z życia klubu"
        title="Najnowsze aktualności"
      >
        <template #actions>
          <UButton
            to="/aktualnosci"
            color="neutral"
            variant="outline"
            trailing-icon="i-lucide-arrow-right"
            size="md"
            class="font-bold"
          >
            Wszystkie wpisy
          </UButton>
        </template>
      </PublicSectionHead>

      <div class="slavia-public-grid slavia-public-grid--stagger">
        <NuxtLink
          v-for="p in posts"
          :key="p.id"
          :to="blogPostPath(p.title, p.id)"
          class="slavia-public-card slavia-public-card--glass bg-card ring-1 ring-default/30"
        >
          <div class="slavia-public-card__media">
            <img
              v-if="p.image_url"
              :src="postImageSrc(p.image_url)"
              :alt="p.title"
              width="640"
              height="400"
              loading="lazy"
              decoding="async"
            >
            <div
              v-else
              class="flex size-full items-center justify-center bg-linear-to-br from-primary/20 via-primary/5 to-amber-500/10"
            >
              <UIcon name="i-lucide-newspaper" class="size-12 text-primary/40" />
            </div>
          </div>
          <div class="slavia-public-card__body">
            <p class="slavia-public-meta text-muted">
              {{ formatHomePostDate(p.created_at) }}
            </p>
            <h3 class="slavia-public-card__title mt-2">
              {{ p.title }}
            </h3>
            <p class="mt-3 line-clamp-3 slavia-public-lead">
              {{ homePostExcerpt(p) }}
            </p>
            <span class="slavia-public-card__link">
              Czytaj dalej
              <UIcon name="i-lucide-arrow-right" class="size-4" />
            </span>
          </div>
        </NuxtLink>
      </div>
    </UContainer>
  </section>
</template>
