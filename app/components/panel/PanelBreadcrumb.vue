<script setup lang="ts">
export type PanelBreadcrumbItem = {
  label: string
  to?: string
  icon?: string
}

defineProps<{
  items: PanelBreadcrumbItem[]
}>()
</script>

<template>
  <nav
    v-if="items.length"
    class="slavia-panel-breadcrumb"
    aria-label="Ścieżka nawigacji"
  >
    <ol class="slavia-panel-breadcrumb__list">
      <li
        v-for="(item, index) in items"
        :key="`${item.label}-${index}`"
        class="slavia-panel-breadcrumb__item"
      >
        <UIcon
          v-if="index > 0"
          name="i-lucide-chevron-right"
          class="slavia-panel-breadcrumb__sep size-3.5"
          aria-hidden="true"
        />
        <NuxtLink
          v-if="item.to && index < items.length - 1"
          :to="item.to"
          class="slavia-panel-breadcrumb__link"
        >
          <UIcon
            v-if="item.icon"
            :name="item.icon"
            class="size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span class="truncate">{{ item.label }}</span>
        </NuxtLink>
        <span
          v-else
          class="slavia-panel-breadcrumb__current"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
        >
          <UIcon
            v-if="item.icon"
            :name="item.icon"
            class="size-3.5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <span class="truncate">{{ item.label }}</span>
        </span>
      </li>
    </ol>
  </nav>
</template>
