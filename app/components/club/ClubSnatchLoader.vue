<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' }
)
</script>

<template>
  <div
    class="slavia-snatch-loader"
    :class="`slavia-snatch-loader--${size}`"
    role="status"
    aria-label="Ładowanie strony"
  >
    <svg
      class="slavia-snatch-loader__svg"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <!-- Platform -->
      <ellipse
        cx="60"
        cy="92"
        rx="42"
        ry="4"
        class="slavia-snatch-loader__platform"
      />

      <!-- Athlete -->
      <g class="slavia-snatch-loader__athlete">
        <circle cx="60" cy="28" r="5.5" class="slavia-snatch-loader__body" />
        <path
          d="M60 33.5 L60 52 M52 40 L68 40 M56 52 L52 68 M64 52 L68 68"
          class="slavia-snatch-loader__limbs"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>

      <!-- Barbell -->
      <g class="slavia-snatch-loader__barbell">
        <rect x="18" y="38" width="84" height="3" rx="1.5" class="slavia-snatch-loader__bar" />
        <rect x="12" y="32" width="8" height="15" rx="1.5" class="slavia-snatch-loader__plate" />
        <rect x="100" y="32" width="8" height="15" rx="1.5" class="slavia-snatch-loader__plate" />
        <rect x="22" y="34" width="5" height="11" rx="1" class="slavia-snatch-loader__plate-inner" />
        <rect x="93" y="34" width="5" height="11" rx="1" class="slavia-snatch-loader__plate-inner" />
      </g>
    </svg>
    <p class="slavia-snatch-loader__label">
      Ładowanie…
    </p>
  </div>
</template>
