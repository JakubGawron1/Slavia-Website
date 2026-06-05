<script setup lang="ts">
/** Stała warstwa dekoracyjna (dwubój / sztanga) — kolory i intensywność z presetów w main.css. */
</script>

<template>
  <div
    class="slavia-athletics-backdrop"
    aria-hidden="true"
  >
    <svg
      class="slavia-athletics-backdrop__svg"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="slavia-backdrop-bar-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="currentColor" stop-opacity="0" />
          <stop offset="40%" stop-color="currentColor" stop-opacity="0.78" />
          <stop offset="60%" stop-color="currentColor" stop-opacity="0.78" />
          <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Ścieżki belki (squat / bench) -->
      <g class="slavia-athletics-backdrop__paths" fill="none" stroke="url(#slavia-backdrop-bar-grad)" stroke-width="1.5">
        <path d="M 120 720 Q 360 520 620 640 T 1080 580" />
        <path d="M 200 180 Q 480 320 720 240 T 1280 200" opacity="0.82" />
        <path d="M 80 420 L 420 380 L 760 440 L 1100 360" opacity="0.55" stroke-dasharray="6 14" />
      </g>

      <!-- Sztanga + talerze (góra prawa) -->
      <g class="slavia-athletics-backdrop__barbell" transform="translate(980 120) rotate(-8)">
        <line x1="0" y1="0" x2="220" y2="0" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
        <rect x="-28" y="-18" width="24" height="36" rx="3" class="slavia-athletics-backdrop__plate" />
        <rect x="-52" y="-14" width="18" height="28" rx="2" class="slavia-athletics-backdrop__plate slavia-athletics-backdrop__plate--inner" />
        <rect x="224" y="-18" width="24" height="36" rx="3" class="slavia-athletics-backdrop__plate" />
        <rect x="254" y="-14" width="18" height="28" rx="2" class="slavia-athletics-backdrop__plate slavia-athletics-backdrop__plate--inner" />
        <circle cx="0" cy="0" r="5" fill="currentColor" opacity="0.5" />
        <circle cx="220" cy="0" r="5" fill="currentColor" opacity="0.5" />
      </g>

      <!-- Drugi zestaw (dół lewy, ławka) -->
      <g class="slavia-athletics-backdrop__barbell slavia-athletics-backdrop__barbell--alt" transform="translate(140 640) rotate(6)">
        <line x1="0" y1="0" x2="180" y2="0" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        <rect x="-22" y="-14" width="18" height="28" rx="2" class="slavia-athletics-backdrop__plate" />
        <rect x="184" y="-14" width="18" height="28" rx="2" class="slavia-athletics-backdrop__plate" />
      </g>

      <!-- Pierścienie talerzy (dekor) -->
      <g class="slavia-athletics-backdrop__rings" fill="none" stroke="currentColor">
        <circle cx="1180" cy="680" r="42" stroke-width="1.75" opacity="0.48" />
        <circle cx="1180" cy="680" r="58" stroke-width="1.25" opacity="0.32" />
        <circle cx="260" cy="260" r="36" stroke-width="1.5" opacity="0.4" />
        <circle cx="260" cy="260" r="50" stroke-width="1" opacity="0.28" />
      </g>

      <!-- Pył kredy -->
      <g class="slavia-athletics-backdrop__chalk" fill="currentColor">
        <circle cx="520" cy="160" r="3" opacity="0.5" />
        <circle cx="548" cy="178" r="2" opacity="0.42" />
        <circle cx="890" cy="420" r="2.5" opacity="0.48" />
        <circle cx="910" cy="438" r="1.75" opacity="0.36" />
        <circle cx="320" cy="520" r="2.25" opacity="0.44" />
        <circle cx="1080" cy="300" r="3" opacity="0.4" />
        <circle cx="640" cy="760" r="2" opacity="0.38" />
        <circle cx="1240" cy="480" r="2.25" opacity="0.34" />
      </g>
    </svg>

    <div class="slavia-athletics-backdrop__grid" />
  </div>
</template>
