<script setup lang="ts">
import type { DevToolLinkGroup, DevToolLinkItem } from '~/data/devToolsCatalog'

const d = useDeveloperPage()

const routeFilter = ref('')

const filteredGroups = computed(() => {
  const q = routeFilter.value.trim().toLowerCase()
  if (!q) {
    return d.devLinkGroupsCombined as DevToolLinkGroup[]
  }
  return (d.devLinkGroupsCombined as DevToolLinkGroup[])
    .map((g: DevToolLinkGroup) => {
      const links = (g.links || []).filter((l: DevToolLinkItem) => {
        const hay = `${l.to} ${l.label} ${l.description}`.toLowerCase()
        return hay.includes(q)
      })
      return { ...g, links }
    })
    .filter((g: DevToolLinkGroup) => g.links.length > 0)
})

const totalLinks = computed(() =>
  filteredGroups.value.reduce((n: number, g: DevToolLinkGroup) => n + g.links.length, 0)
)
</script>

<template>
  <div class="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
    <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div class="min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
            Mapa aplikacji
          </p>
          <p class="mt-1 text-[11px] text-muted">
            Auto z <span class="font-mono">router.getRoutes()</span> + skróty superadmina i dokumentacja stosu.
          </p>
        </div>
        <UFormField label="Filtr tras" size="xs" class="w-full sm:w-64">
          <UInput v-model="routeFilter" icon="i-lucide-search" placeholder="np. trainer, cms, aktualnosci…" size="sm" />
        </UFormField>
      </div>
      <p class="mt-2 text-[10px] text-muted">
        Wyświetlono <span class="font-semibold text-highlighted">{{ totalLinks }}</span> linków w
        <span class="font-semibold text-highlighted">{{ filteredGroups.length }}</span> grupach.
      </p>

      <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <div
          v-for="group in filteredGroups"
          :key="group.title"
          class="rounded-xl border border-default/40 bg-muted/5 p-3"
        >
          <h2 class="text-sm font-bold text-highlighted">
            {{ group.title }}
          </h2>
          <p v-if="group.description" class="mt-0.5 text-[11px] leading-snug text-muted">
            {{ group.description }}
          </p>
          <div class="mt-2 grid gap-2 sm:grid-cols-1">
            <UButton
              v-for="link in group.links"
              :key="`${group.title}-${link.to}`"
              :to="link.to"
              variant="outline"
              color="neutral"
              size="sm"
              class="h-auto min-h-11 flex-col items-start gap-0.5 py-2 whitespace-normal text-left overflow-hidden"
              :target="d.isExternalHref(link.to) ? '_blank' : undefined"
              :rel="d.isExternalHref(link.to) ? 'noopener noreferrer' : undefined"
            >
              <span class="flex w-full items-center gap-2 font-semibold text-highlighted">
                <UIcon :name="link.icon" class="size-4 shrink-0 text-primary" />
                <span class="min-w-0 flex-1 break-all">{{ d.routeChipLabel(link.label || link.to) }}</span>
              </span>
              <span class="w-full wrap-break-word text-[11px] font-normal leading-snug text-muted">
                {{ link.description }}
              </span>
            </UButton>
          </div>
        </div>
      </div>

      <p v-if="filteredGroups.length === 0" class="mt-6 text-center text-sm text-muted">
        Brak tras pasujących do filtra „{{ routeFilter }}”.
      </p>
    </UCard>
  </div>
</template>
