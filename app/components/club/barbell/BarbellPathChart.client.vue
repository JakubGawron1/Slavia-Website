<script setup lang="ts">
import { smoothSamplesForFps, type BarbellSample } from '~/utils/barbellPathAnalysis'

const props = withDefaults(
  defineProps<{
    samples: BarbellSample[]
    /** Surowy tor algorytmu (szary) — gdy AI skorygowało ścieżkę. */
    referenceSamples?: BarbellSample[]
    /** Ogranicza tor do punktów do tego czasu (synchronizacja z odtwarzaniem wideo). */
    untilSec?: number
    hipLine?: boolean
  }>(),
  {
    hipLine: true,
    referenceSamples: undefined,
    untilSec: undefined
  }
)

const displaySamples = computed(() => {
  const raw =
    typeof props.untilSec === 'number'
      ? props.samples.filter(s => s.t <= props.untilSec!)
      : props.samples
  if (raw.length < 2) return raw
  const duration = raw[raw.length - 1]!.t - raw[0]!.t
  const fps =
    duration > 0.001
      ? Math.min(120, Math.max(12, Math.round((raw.length - 1) / duration)))
      : 30
  return smoothSamplesForFps(raw, fps)
})

const displayReference = computed(() => {
  const src = props.referenceSamples
  if (!src || src.length < 2) return []
  const raw =
    typeof props.untilSec === 'number'
      ? src.filter(s => s.t <= props.untilSec!)
      : src
  if (raw.length < 2) return []
  const duration = raw[raw.length - 1]!.t - raw[0]!.t
  const fps =
    duration > 0.001
      ? Math.min(120, Math.max(12, Math.round((raw.length - 1) / duration)))
      : 30
  return smoothSamplesForFps(raw, fps)
})

/** Współrzędne 0–100 (Y rośnie w dół — jak na ekranie). */
function pt(s: BarbellSample) {
  return { x: s.barX * 100, y: s.barY * 100 }
}

const pathD = computed(() => {
  const pts = displaySamples.value
  if (pts.length < 2) return ''
  return pts
    .map((s, i) => {
      const p = pt(s)
      return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
    })
    .join(' ')
})

const referencePathD = computed(() => {
  const pts = displayReference.value
  if (pts.length < 2) return ''
  return pts
    .map((s, i) => {
      const p = pt(s)
      return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
    })
    .join(' ')
})

const hipLineX = computed(() => {
  const pts = displaySamples.value
  if (!pts.length) return null
  return pts[Math.floor(pts.length / 2)]!.hipMidX * 100
})

const cursor = computed(() => {
  const pts = displaySamples.value
  if (pts.length < 1) return null
  return pt(pts[pts.length - 1]!)
})

const hasPath = computed(() => displaySamples.value.length >= 2)
</script>

<template>
  <div
    class="overflow-hidden rounded-2xl border border-default/60 bg-neutral-950/95 ring-1 ring-default/40"
    role="img"
    aria-label="Wykres toru ruchu sztangi"
  >
    <div class="border-b border-default/40 px-4 py-2.5">
      <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
        Tor sztangi (widok 2D)
      </p>
      <p class="text-xs text-muted">
        Oś X — pozycja · Oś Y — wysokość. Żółty = tor AI, szary przerywany = MoveNet.
      </p>
    </div>
    <div class="aspect-16/10 w-full p-3 sm:p-4">
      <svg
        v-if="hasPath"
        viewBox="0 0 100 100"
        class="size-full"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="barbell-lab-grid"
            width="25"
            height="25"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 25 0 L 0 0 0 25"
              fill="none"
              stroke="rgba(148,163,184,0.12)"
              stroke-width="0.35"
            />
          </pattern>
        </defs>
        <rect
          width="100"
          height="100"
          fill="url(#barbell-lab-grid)"
        />
        <line
          v-if="hipLine && hipLineX != null"
          :x1="hipLineX"
          y1="0"
          :x2="hipLineX"
          y2="100"
          stroke="rgba(34,197,94,0.45)"
          stroke-width="0.6"
          stroke-dasharray="2 2"
        />
        <path
          v-if="referencePathD"
          :d="referencePathD"
          fill="none"
          stroke="rgba(148,163,184,0.85)"
          stroke-width="1"
          stroke-dasharray="3 3"
          stroke-linecap="round"
        />
        <path
          :d="pathD"
          fill="none"
          stroke="rgb(250,204,21)"
          stroke-width="1.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle
          v-if="cursor"
          :cx="cursor.x"
          :cy="cursor.y"
          r="1.8"
          fill="rgb(250,204,21)"
          stroke="white"
          stroke-width="0.5"
        />
      </svg>
      <div
        v-else
        class="flex size-full flex-col items-center justify-center gap-2 text-center text-muted"
      >
        <UIcon
          name="i-lucide-line-chart"
          class="size-8 opacity-30"
        />
        <p class="text-sm">
          Wykres pojawi się po analizie (min. 2 punkty toru)
        </p>
      </div>
    </div>
  </div>
</template>
