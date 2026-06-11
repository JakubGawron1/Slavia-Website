<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    lead?: string
    /** Nagłówek z przyciskiem po prawej (np. aktualności na home) */
    split?: boolean
    eyebrowAccent?: 'primary' | 'amber'
  }>(),
  {
    eyebrow: undefined,
    title: undefined,
    lead: undefined,
    split: false,
    eyebrowAccent: 'primary'
  }
)
</script>

<template>
  <div
    v-slavia-reveal="'fade-up'"
    class="slavia-public-section-head"
    :class="split ? 'slavia-public-section-head--split' : ''"
  >
    <div class="min-w-0">
      <p
        v-if="eyebrow || $slots.eyebrow"
        class="slavia-public-section-head__eyebrow"
        :class="eyebrowAccent === 'amber' ? 'slavia-public-section-head__eyebrow--amber' : ''"
      >
        <slot name="eyebrow">
          {{ eyebrow }}
        </slot>
      </p>
      <h2
        v-if="title || $slots.title"
        class="slavia-public-section-head__title"
      >
        <slot name="title">
          {{ title }}
        </slot>
      </h2>
      <p
        v-if="lead || $slots.lead"
        class="slavia-public-section-head__lead"
      >
        <slot name="lead">
          {{ lead }}
        </slot>
      </p>
    </div>
    <div
      v-if="$slots.actions"
      class="shrink-0"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
