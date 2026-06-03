<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{
  eyebrow: string
  title: string
  lead?: string
  icon: string
  badges?: Array<{ label: string, color?: 'primary' | 'neutral' | 'success' | 'warning' | 'error' | 'info' }>
  actions?: Array<{ label: string, to: RouteLocationRaw, icon?: string, variant?: 'solid' | 'soft' | 'outline' | 'ghost', color?: 'primary' | 'neutral' }>
}>()

const badgeItems = computed(() => props.badges ?? [])
const actionItems = computed(() => props.actions ?? [])
</script>

<template>
  <div class="relative overflow-hidden rounded-3xl border border-default/60 bg-linear-to-br from-primary/10 via-card to-card p-6 shadow-sm ring-1 ring-primary/10 sm:p-8">
    <div class="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/20 blur-3xl" />
    <div class="relative">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-[11px] font-black uppercase tracking-[0.25em] text-primary">
            {{ eyebrow }}
          </p>
          <h1 class="mt-2 text-3xl font-black tracking-tight text-highlighted sm:text-4xl">
            {{ title }}
          </h1>
          <p v-if="lead" class="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            {{ lead }}
          </p>
        </div>
        <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
          <UIcon :name="icon" class="size-5" />
        </span>
      </div>

      <div v-if="badgeItems.length || actionItems.length" class="mt-5 flex flex-wrap items-center gap-2">
        <UBadge
          v-for="b in badgeItems"
          :key="b.label"
          :color="b.color || 'neutral'"
          variant="subtle"
          size="sm"
        >
          {{ b.label }}
        </UBadge>

        <div v-if="actionItems.length" class="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
          <UButton
            v-for="a in actionItems"
            :key="a.label"
            :to="a.to"
            size="sm"
            :icon="a.icon"
            :variant="a.variant || 'soft'"
            :color="a.color || 'neutral'"
            class="min-h-9 flex-1 justify-center sm:flex-initial"
          >
            {{ a.label }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

