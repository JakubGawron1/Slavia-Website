<script setup lang="ts">
const d = useDeveloperPage()
</script>

<template>
  <div class="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
    <UCard class="rounded-2xl border-default/60 p-4 shadow-sm lg:col-span-12">
      <p class="text-[10px] font-bold uppercase tracking-wider text-muted">
        Mapa aplikacji
      </p>
      <p class="mt-1 text-[11px] text-muted">
        Mapa tras jest budowana z <span class="font-mono">router.getRoutes()</span> (w tym dynamiczne <span class="font-mono">:param</span>). Poniżej ewentualne kotwice oraz dokumentacja zewnętrzna — uzupełniaj ręcznie tylko wpisy, których router nie wystawia.
      </p>
        <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <div
          v-for="group in d.devLinkGroupsCombined"
          :key="group.title"
          class="rounded-xl border border-default/40 bg-muted/5 p-3"
        >
          <h2 class="text-sm font-bold text-highlighted">
            {{ group.title }}
          </h2>
          <p
            v-if="group.description"
            class="mt-0.5 text-[11px] leading-snug text-muted"
          >
            {{ group.description }}
          </p>
          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <UButton
              v-for="link in group.links"
              :key="`${group.title}-${link.label}`"
              :to="link.to"
              variant="outline"
              color="neutral"
              size="sm"
              class="h-auto min-h-12 flex-col items-start gap-0.5 py-2 whitespace-normal text-left overflow-hidden"
              :target="d.isExternalHref(link.to) ? '_blank' : undefined"
              :rel="d.isExternalHref(link.to) ? 'noopener noreferrer' : undefined"
            >
              <span class="flex w-full items-center gap-2 font-semibold text-highlighted">
                <UIcon
                  :name="link.icon"
                  class="size-4 shrink-0 text-primary"
                />
                <span class="min-w-0 flex-1 break-all">
                  {{ d.routeChipLabel(link.label || link.to) }}
                </span>
              </span>
              <span class="w-full wrap-break-word text-[11px] font-normal leading-snug text-muted">
                {{ link.description }}
              </span>
            </UButton>
          </div>
        </div>
      </div>
      </UCard>
  </div>
</template>
