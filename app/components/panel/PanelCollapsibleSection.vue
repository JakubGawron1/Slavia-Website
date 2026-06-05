<script setup lang="ts">
const props = defineProps<{
  title: string
  icon?: string
  badge?: string
  defaultOpen?: boolean
}>()

const open = ref(props.defaultOpen ?? false)
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-default/65 bg-card shadow-sm ring-1 ring-default/25">
    <button
      type="button"
      class="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/15 sm:px-5"
      :aria-expanded="open"
      @click="open = !open"
    >
      <UIcon
        v-if="icon"
        :name="icon"
        class="size-5 shrink-0 text-primary"
      />
      <span class="min-w-0 flex-1 text-base font-bold text-highlighted sm:text-lg">{{ title }}</span>
      <UBadge
        v-if="badge"
        variant="soft"
        color="neutral"
        size="xs"
      >
        {{ badge }}
      </UBadge>
      <UIcon
        name="i-lucide-chevron-down"
        class="size-5 shrink-0 text-muted transition-transform duration-200"
        :class="open ? 'rotate-180' : ''"
      />
    </button>
    <div
      v-show="open"
      class="border-t border-default/50 px-4 pb-5 pt-4 sm:px-5"
    >
      <slot />
    </div>
  </div>
</template>
