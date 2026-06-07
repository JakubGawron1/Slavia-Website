<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

const {
  items,
  pending,
  error,
  refresh,
  feedHref,
  feedIcon,
  feedKindLabel,
  feedBadgeColor
} = useKlubFeed()

useSeoMeta({
  title: 'Feed klubowy — Slavia',
  description: 'Aktualności, ogłoszenia i wydarzenia z kalendarza w jednym strumieniu.',
  ogTitle: 'Feed klubowy CKS Slavia',
  robots: 'index, follow'
})

function formatAt(iso: string) {
  try {
    return format(parseISO(iso.slice(0, 10)), 'dd MMM yyyy', { locale: pl })
  } catch {
    return iso.slice(0, 10)
  }
}
</script>

<template>
  <PublicPageLayout>
    <PublicPageHeader
      variant="hero"
      eyebrow="Klub · community"
      icon="i-lucide-rss"
      title="Feed klubowy"
      description="Jeden strumień: wpisy na blogu, tablica ogłoszeń i wydarzenia z kalendarza — bez przeskakiwania między modułami."
    >
      <template #actions>
        <UButton variant="soft" icon="i-lucide-refresh-cw" :loading="pending" @click="() => refresh()">
          Odśwież
        </UButton>
      </template>
    </PublicPageHeader>

    <div class="slavia-content-well mx-auto w-full max-w-3xl space-y-4">
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        title="Nie udało się załadować feedu"
        description="Spróbuj odświeżyć stronę za chwilę."
      />

      <div v-if="pending && !items.length" class="flex justify-center py-16">
        <UIcon name="i-lucide-loader-2" class="size-10 animate-spin text-primary" />
      </div>

      <PublicEmptyState
        v-else-if="!items.length"
        icon="i-lucide-rss"
        title="Brak wpisów w feedzie"
        description="Gdy pojawią się aktualności, ogłoszenia lub wydarzenia, zobaczysz je tutaj."
      />

      <ul v-else class="space-y-3">
        <li v-for="item in items" :key="`${item.kind}-${item.id}`">
          <NuxtLink
            :to="feedHref(item)"
            class="group block rounded-2xl border border-default/50 bg-card/80 p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
          >
            <div class="flex items-start gap-3">
              <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UIcon :name="feedIcon(item)" class="size-5" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge size="xs" variant="subtle" :color="feedBadgeColor(item)">
                    {{ feedKindLabel(item) }}
                  </UBadge>
                  <UBadge v-if="item.pinned" size="xs" variant="subtle" color="warning">
                    Przypięte
                  </UBadge>
                  <span class="text-xs text-muted">{{ formatAt(item.at) }}</span>
                </div>
                <h2 class="mt-1 font-bold text-highlighted group-hover:text-primary transition-colors">
                  {{ item.title }}
                </h2>
                <p class="mt-1 line-clamp-2 text-sm text-muted">
                  {{ item.summary }}
                </p>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-5 shrink-0 text-muted opacity-0 transition group-hover:opacity-100"
              />
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </PublicPageLayout>
</template>
