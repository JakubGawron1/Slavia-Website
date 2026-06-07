<script setup lang="ts">
import type { PanelArea } from '~/composables/useSlaviaPanelArea'
import { panelEyebrow } from '~/composables/useSlaviaPanelArea'

const props = withDefaults(
  defineProps<{
    area?: PanelArea
    eyebrow?: string
    title: string
    description?: string
    icon?: string
    tone?: 'default' | 'superadmin' | 'danger'
    variant?: 'page' | 'hero'
    enableCms?: boolean
    cmsPage?: string
  }>(),
  {
    tone: 'default',
    variant: 'page',
    area: undefined,
    eyebrow: undefined,
    description: undefined,
    icon: undefined,
    enableCms: true,
    cmsPage: undefined
  }
)

const cms = useCms()

const resolvedCmsPage = computed(
  () => props.cmsPage || cms.routePageName.value
)

const useCmsFields = computed(() => props.enableCms && cms.cmsEnabledOnRoute.value)

const resolvedEyebrow = computed(() => {
  if (props.eyebrow) return props.eyebrow
  if (props.area) return panelEyebrow(props.area)
  return undefined
})

const eyebrowClass = computed(() => {
  if (props.tone === 'superadmin' || props.tone === 'danger') return 'text-error'
  return 'text-primary'
})

const rootClass = computed(() =>
  props.variant === 'hero'
    ? 'slavia-public-hero'
    : 'mb-6 sm:mb-8'
)
</script>

<template>
  <header
    v-slavia-reveal="'fade-up'"
    :class="rootClass"
  >
    <div class="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0 flex-1">
        <p
          v-if="resolvedEyebrow"
          class="text-[11px] font-black uppercase tracking-[0.22em]"
          :class="[eyebrowClass, variant === 'hero' ? 'slavia-public-hero__eyebrow' : '']"
        >
          <CmsEditable
            v-if="useCmsFields && eyebrow"
            :page-name="resolvedCmsPage"
            field-key="header_eyebrow"
            type="text"
            label="Panel — odznaka"
            tag="span"
            :fallback="eyebrow"
          />
          <CmsEditable
            v-else-if="useCmsFields && !eyebrow && area"
            :page-name="resolvedCmsPage"
            field-key="header_eyebrow"
            type="text"
            label="Panel — odznaka"
            tag="span"
            :fallback="resolvedEyebrow"
          />
          <template v-else>
            {{ resolvedEyebrow }}
          </template>
        </p>
        <h1
          class="slavia-display font-bold tracking-tight text-highlighted"
          :class="variant === 'hero' ? 'mt-1 text-xl sm:mt-1.5 sm:text-2xl lg:text-[1.65rem]' : 'mt-1.5 text-2xl sm:text-3xl'"
        >
          <CmsEditable
            v-if="useCmsFields"
            :page-name="resolvedCmsPage"
            field-key="header_title"
            type="text"
            label="Panel — tytuł"
            tag="span"
            :fallback="title"
          />
          <template v-else>
            {{ title }}
          </template>
        </h1>
        <p
          v-if="description || $slots.description"
          class="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted"
        >
          <slot v-if="$slots.description" name="description" />
          <CmsEditable
            v-else-if="useCmsFields && description"
            :page-name="resolvedCmsPage"
            field-key="header_description"
            type="text"
            label="Panel — opis"
            tag="span"
            :fallback="description"
          />
          <template v-else>
            {{ description }}
          </template>
        </p>
        <div v-if="$slots.badges" class="mt-2 flex flex-wrap gap-2">
          <slot name="badges" />
        </div>
      </div>

      <span
        v-if="icon"
        class="flex size-9 shrink-0 items-center justify-center rounded-xl ring-1"
        :class="
          tone === 'superadmin'
            ? 'bg-error/12 text-error ring-error/20'
            : 'bg-primary/10 text-primary ring-primary/20'
        "
      >
        <UIcon :name="icon" class="size-4" />
      </span>

      <div
        v-if="$slots.actions"
        class="flex shrink-0 flex-wrap gap-2 sm:justify-end"
      >
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
