<script setup lang="ts">
const sections = useDashboardSections()

const visible = computed(() => (sections?.sectionCount.value ?? 0) > 0)
</script>

<template>
  <div
    v-if="visible && sections"
    class="flex flex-wrap items-center justify-end gap-2"
  >
    <p class="mr-auto text-[10px] font-black uppercase tracking-[0.2em] text-muted">
      Sekcje dashboardu
    </p>
    <UButton
      size="xs"
      variant="soft"
      color="neutral"
      icon="i-lucide-chevrons-down-up"
      @click="sections.collapseAll()"
    >
      Zwiń wszystko
    </UButton>
    <UButton
      size="xs"
      variant="soft"
      color="primary"
      icon="i-lucide-chevrons-up-down"
      @click="sections.expandAll()"
    >
      Rozwiń wszystko
    </UButton>
  </div>
</template>
