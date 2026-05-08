<script setup lang="ts">
export interface AthleteChartPoint {
  date: string
  total: number
  snatch: number
  clean_and_jerk: number
  sinclair: number | null
}

const props = withDefaults(defineProps<{
  series: AthleteChartPoint[]
  height?: number
}>(), {
  height: 120
})

const CHART_W = 420
const PAD_TOP = 14
const PAD_BOTTOM = 14

const chartHoverIndex = ref<number | null>(null)

watch(
  () => props.series,
  () => {
    chartHoverIndex.value = null
  }
)

function fmtPlDate(iso: string) {
  const d = iso.slice(0, 10)
  if (d.length < 10) return iso
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

function gridLineYs(h: number): number[] {
  const plotTop = PAD_TOP
  const plotBot = h - PAD_BOTTOM
  const plotH = plotBot - plotTop
  return [1, 2, 3].map(k => plotTop + (plotH * k) / 4)
}

function buildPlotCoords(totals: number[], h: number) {
  const max = Math.max(...totals) * 1.06 || 1
  const min = Math.min(...totals) * 0.94
  const range = max - min || 1
  const plotH = h - PAD_TOP - PAD_BOTTOM
  const n = totals.length
  const denom = Math.max(1, n - 1)
  return totals.map((v, i) => ({
    x: (i / denom) * CHART_W,
    y: PAD_TOP + plotH - ((v - min) / range) * plotH
  }))
}

function smoothLinePath(pts: Array<{ x: number, y: number }>) {
  if (pts.length === 0) return ''
  const first = pts[0]
  if (!first || pts.length === 1) return first ? `M ${first.x} ${first.y}` : ''
  let d = `M ${first.x} ${first.y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

const chartSvgIds = computed(() => {
  const raw = String(props.series?.[0]?.date || 'chart')
  const slug = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'athlete'
  return {
    gradArea: `slavia-area-${slug}`,
    gradLine: `slavia-line-${slug}`,
    filterGlow: `slavia-glow-${slug}`
  }
})

const chartPaths = computed(() => {
  const series = props.series || []
  if (series.length < 2) return null
  const totals = series.map(s => s.total)
  const pts = buildPlotCoords(totals, props.height)
  const lineD = smoothLinePath(pts)
  const bottom = props.height - 1
  const lastPt = pts[pts.length - 1]
  const firstPt = pts[0]
  if (!lastPt || !firstPt) return null
  const areaD = `${lineD} L ${lastPt.x} ${bottom} L ${firstPt.x} ${bottom} Z`
  return {
    lineD,
    areaD,
    pts,
    series,
    gridYs: gridLineYs(props.height),
    minV: Math.min(...totals),
    maxV: Math.max(...totals)
  }
})

const tooltipPoint = computed(() => {
  const i = chartHoverIndex.value
  if (i === null) return null
  const ch = props.series
  return ch?.[i] ?? null
})

const tooltipLeftPct = computed(() => {
  const i = chartHoverIndex.value
  const n = props.series.length
  if (i === null || n < 2) return 50
  return (i / (n - 1)) * 100
})
</script>

<template>
  <div
    v-if="chartPaths"
    class="relative w-full rounded-xl bg-linear-to-b from-primary/[0.07] via-muted/20 to-muted/5 ring-1 ring-inset ring-primary/10 overflow-visible"
    :style="{ height: `${height}px` }"
    @mouseleave="chartHoverIndex = null"
  >
    <Transition
      enter-active-class="transition-opacity duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="tooltipPoint"
        class="pointer-events-none absolute z-40 bottom-full mb-2 w-max max-w-[min(calc(100vw-2rem),18rem)]"
        :style="{ left: `${tooltipLeftPct}%`, transform: 'translateX(-50%)' }"
      >
        <div class="rounded-xl border border-primary/25 bg-background/95 px-3.5 py-2.5 shadow-xl shadow-primary/10 ring-1 ring-default/40 backdrop-blur-md">
          <p class="text-[11px] font-bold uppercase tracking-wide text-primary mb-1.5">
            {{ fmtPlDate(tooltipPoint.date) }}
          </p>
          <div class="flex items-baseline gap-2 flex-wrap">
            <span class="text-lg font-mono font-black text-emerald-400">{{ tooltipPoint.total }}</span>
            <span class="text-[11px] font-semibold text-muted">kg total</span>
          </div>
          <div class="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
            <span class="text-muted">Rwanie</span>
            <span class="font-mono font-bold text-highlighted text-right">{{ tooltipPoint.snatch }} kg</span>
            <span class="text-muted">Podrzut</span>
            <span class="font-mono font-bold text-highlighted text-right">{{ tooltipPoint.clean_and_jerk }} kg</span>
            <span class="text-muted">Sinclair</span>
            <span class="font-mono font-bold text-amber-400 text-right">
              {{ tooltipPoint.sinclair != null ? tooltipPoint.sinclair : '—' }}
              <span v-if="tooltipPoint.sinclair != null" class="text-[10px] font-normal text-muted">pkt</span>
            </span>
          </div>
        </div>
      </div>
    </Transition>

    <svg
      :viewBox="`0 0 ${CHART_W} ${height}`"
      class="w-full h-full block"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient :id="chartSvgIds.gradArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--slavia-chart-accent)" stop-opacity="0.38" />
          <stop offset="50%" stop-color="var(--slavia-chart-accent)" stop-opacity="0.10" />
          <stop offset="100%" stop-color="var(--slavia-chart-accent)" stop-opacity="0" />
        </linearGradient>
        <linearGradient :id="chartSvgIds.gradLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="var(--slavia-chart-accent)" />
          <stop offset="100%" stop-color="var(--slavia-chart-accent-2)" />
        </linearGradient>
        <filter :id="chartSvgIds.filterGlow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="0.85" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <line
        v-for="(gy, gi) in chartPaths.gridYs"
        :key="'g-' + gi"
        x1="4"
        :y1="gy"
        :x2="CHART_W - 4"
        :y2="gy"
        stroke="currentColor"
        stroke-width="1"
        stroke-dasharray="5 7"
        class="text-default/12 pointer-events-none"
      />

      <path :d="chartPaths.areaD" :fill="`url(#${chartSvgIds.gradArea})`" class="pointer-events-none" />
      <path
        :d="chartPaths.lineD"
        fill="none"
        :stroke="`url(#${chartSvgIds.gradLine})`"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        :filter="`url(#${chartSvgIds.filterGlow})`"
        class="pointer-events-none"
      />

      <circle
        v-for="(pt, i) in chartPaths.pts"
        :key="'hit-' + i"
        :cx="pt.x"
        :cy="pt.y"
        r="18"
        fill="transparent"
        class="cursor-crosshair"
        @mouseenter="chartHoverIndex = i"
      />

      <circle
        v-for="(pt, i) in chartPaths.pts"
        :key="'ring-' + i"
        :cx="pt.x"
        :cy="pt.y"
        :r="chartHoverIndex === i ? 7 : 5"
        class="pointer-events-none fill-white stroke-2 stroke-primary dark:fill-neutral-950 transition-all duration-150"
        :class="chartHoverIndex === i ? 'stroke-emerald-400' : ''"
      />
      <circle
        v-for="(pt, i) in chartPaths.pts"
        :key="'dot-' + i"
        :cx="pt.x"
        :cy="pt.y"
        :r="chartHoverIndex === i ? 3 : 2.25"
        class="pointer-events-none fill-primary transition-all duration-150"
      />
    </svg>
  </div>
  <div
    v-else-if="(series || []).length === 1"
    class="rounded-xl bg-linear-to-b from-primary/[0.07] to-muted/10 ring-1 ring-inset ring-primary/10 px-4 py-6 text-sm text-muted"
  >
    Za mało danych na wykres (1 start).
  </div>
  <div
    v-else
    class="rounded-xl bg-muted/10 ring-1 ring-inset ring-default/30 px-4 py-6 text-sm text-muted"
  >
    Brak danych do wykresu.
  </div>
</template>

