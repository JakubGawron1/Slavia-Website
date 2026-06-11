<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    lead?: string
    icon: string
    /** Opcjonalny avatar (np. zdjęcie zawodnika na dashboardzie athlete) */
    avatarSrc?: string
    avatarAlt?: string
    badges?: Array<{ label: string, color?: 'primary' | 'neutral' | 'success' | 'warning' | 'error' | 'info' }>
    actions?: Array<{ label: string, to: RouteLocationRaw, icon?: string, variant?: 'solid' | 'soft' | 'outline' | 'ghost', color?: 'primary' | 'neutral' }>
    enableCms?: boolean
    cmsPage?: string
  }>(),
  {
    lead: undefined,
    avatarSrc: undefined,
    avatarAlt: undefined,
    badges: undefined,
    actions: undefined,
    enableCms: true,
    cmsPage: undefined
  }
)

const cms = useCms()

const resolvedCmsPage = computed(
  () => props.cmsPage || cms.routePageName.value
)

const useCmsFields = computed(() => props.enableCms && cms.cmsEnabledOnRoute.value)

const badgeItems = computed(() => props.badges ?? [])
const actionItems = computed(() => props.actions ?? [])
</script>

<template>
  <div class="relative overflow-hidden rounded-[1.75rem] border border-primary/20 bg-linear-to-br from-primary/[0.14] via-card to-card p-5 shadow-sm ring-1 ring-primary/10 sm:rounded-3xl sm:p-6">
    <div class="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-primary/25 blur-3xl" />
    <div class="pointer-events-none absolute -bottom-20 -left-16 size-60 rounded-full bg-primary/10 blur-3xl" />
    <div class="relative">
      <div
        class="flex flex-col gap-4 sm:gap-5"
        :class="avatarSrc ? 'lg:flex-row lg:items-center lg:justify-between' : ''"
      >
        <div
          class="flex min-w-0 gap-5"
          :class="avatarSrc ? 'flex-col sm:flex-row sm:items-center' : 'items-start justify-between'"
        >
          <div v-if="avatarSrc" class="relative shrink-0">
            <div class="absolute -inset-1 rounded-full bg-linear-to-br from-primary/40 to-primary/5 opacity-80 blur-sm" />
            <UAvatar
              :src="avatarSrc"
              :alt="avatarAlt || title"
              size="xl"
              class="relative size-24 ring-2 ring-background shadow-lg sm:size-28"
            />
          </div>
          <div class="min-w-0 flex-1">
          <p class="text-[11px] font-black uppercase tracking-[0.25em] text-primary">
            <CmsEditable
              v-if="useCmsFields"
              :page-name="resolvedCmsPage"
              field-key="dashboard_eyebrow"
              type="text"
              label="Dashboard — odznaka"
              tag="span"
              :fallback="eyebrow"
            />
            <template v-else>
              {{ eyebrow }}
            </template>
          </p>
          <h1 class="mt-2 text-3xl font-black tracking-tight text-highlighted sm:text-4xl">
            <CmsEditable
              v-if="useCmsFields"
              :page-name="resolvedCmsPage"
              field-key="dashboard_title"
              type="text"
              label="Dashboard — tytuł"
              tag="span"
              :fallback="title"
            />
            <template v-else>
              {{ title }}
            </template>
          </h1>
          <p v-if="lead" class="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            <CmsEditable
              v-if="useCmsFields"
              :page-name="resolvedCmsPage"
              field-key="dashboard_lead"
              type="text"
              label="Dashboard — lead"
              tag="span"
              :fallback="lead"
            />
            <template v-else>
              {{ lead }}
            </template>
          </p>
          <div v-if="badgeItems.length" class="mt-4 flex flex-wrap gap-2">
            <UBadge
              v-for="b in badgeItems"
              :key="b.label"
              :color="b.color || 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ b.label }}
            </UBadge>
          </div>
          </div>
          <span
            v-if="!avatarSrc"
            class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20"
          >
            <UIcon :name="icon" class="size-5" />
          </span>
        </div>

        <div
          v-if="actionItems.length"
          class="flex w-full shrink-0 flex-wrap gap-2"
          :class="avatarSrc ? 'lg:max-w-md lg:justify-end' : 'sm:justify-end'"
        >
          <UButton
            v-for="a in actionItems"
            :key="a.label"
            :to="a.to"
            size="md"
            :icon="a.icon"
            :variant="a.variant || 'soft'"
            :color="a.color || 'neutral'"
            class="min-h-10 flex-1 justify-center sm:flex-initial"
          >
            {{ a.label }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
