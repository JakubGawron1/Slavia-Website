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
  /** Unikalny sufiks gradientów SVG — wiele wykresów na jednej stronie. */
  chartKey?: string
}>(), {
  height: 120,
  chartKey: ''
})

const CHART_W = 420
const PAD_TOP = 14
const PAD_BOTTOM = 14
const TOOLTIP_EST_WIDTH = 288
const TOOLTIP_MARGIN = 12

const chartRoot = ref<HTMLElement | null>(null)
const chartHoverIndex = ref<number | null>(null)
const tooltipAnchor = ref<{ x: number, y: number } | null>(null)

watch(
  () => props.series,
  () => {
    chartHoverIndex.value = null
    tooltipAnchor.value = null
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
  const raw = props.chartKey || String(props.series?.[0]?.date || 'chart')
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

function clampTooltipX(centerX: number) {
  if (!import.meta.client) return centerX
  const half = TOOLTIP_EST_WIDTH / 2
  const min = TOOLTIP_MARGIN + half
  const max = window.innerWidth - TOOLTIP_MARGIN - half
  return Math.min(max, Math.max(min, centerX))
}

const tooltipStyle = computed(() => {
  const anchor = tooltipAnchor.value
  if (!anchor) return null
  const x = clampTooltipX(anchor.x)
  return {
    left: `${x}px`,
    top: `${anchor.y - 8}px`,
    transform: 'translate(-50%, -100%)'
  }
})

function setHoverFromPoint(i: number, event: MouseEvent) {
  chartHoverIndex.value = i
  const target = event.currentTarget as Element | null
  if (!target) return
  const rect = target.getBoundingClientRect()
  tooltipAnchor.value = {
    x: rect.left + rect.width / 2,
    y: rect.top
  }
}

function clearHover() {
  chartHoverIndex.value = null
  tooltipAnchor.value = null
}

function onChartLeave() {
  clearHover()
}
</script>

<template>
  <div
    v-if="chartPaths"
    ref="chartRoot"
    class="relative w-full overflow-visible rounded-xl bg-linear-to-b from-primary/[0.07] via-muted/20 to-muted/5 ring-1 ring-inset ring-primary/10"
    :style="{ height: `${height}px` }"
    @mouseleave="onChartLeave"
  >
    <svg
      :viewBox="`0 0 ${CHART_W} ${height}`"
      class="block h-full w-full"
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
        class="pointer-events-none text-default/12"
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
        @mouseenter="setHoverFromPoint(i, $event)"
      />

      <circle
        v-for="(pt, i) in chartPaths.pts"
        :key="'ring-' + i"
        :cx="pt.x"
        :cy="pt.y"
        :r="chartHoverIndex === i ? 7 : 5"
        class="pointer-events-none fill-white stroke-2 stroke-primary transition-all duration-150 dark:fill-neutral-950"
        :class="chartHoverIndex === i ? 'stroke-success' : ''"
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

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-150 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="tooltipPoint && tooltipStyle"
          class="pointer-events-none fixed z-100 w-max max-w-[min(calc(100vw-1.5rem),18rem)]"
          :style="tooltipStyle"
        >
          <div class="rounded-xl border border-primary/25 bg-background/95 px-3.5 py-2.5 shadow-xl shadow-primary/10 ring-1 ring-default/40 backdrop-blur-md">
            <p class="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-primary">
              {{ fmtPlDate(tooltipPoint.date) }}
            </p>
            <div class="flex flex-wrap items-baseline gap-2">
              <span class="font-mono text-lg font-black text-success">{{ tooltipPoint.total }}</span>
              <span class="text-[11px] font-semibold text-muted">kg total</span>
            </div>
            <div class="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
              <span class="text-muted">Rwanie</span>
              <span class="text-right font-mono font-bold text-highlighted">{{ tooltipPoint.snatch }} kg</span>
              <span class="text-muted">Podrzut</span>
              <span class="text-right font-mono font-bold text-highlighted">{{ tooltipPoint.clean_and_jerk }} kg</span>
              <span class="text-muted">Sinclair</span>
              <span class="text-right font-mono font-bold text-amber-400">
                {{ tooltipPoint.sinclair != null ? tooltipPoint.sinclair : '—' }}
                <span v-if="tooltipPoint.sinclair != null" class="text-[10px] font-normal text-muted">pkt</span>
              </span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
  <div
    v-else-if="(series || []).length === 1"
    class="rounded-xl bg-linear-to-b from-primary/[0.07] to-muted/10 px-4 py-6 text-sm text-muted ring-1 ring-inset ring-primary/10"
  >
    Za mało danych na wykres (1 start).
  </div>
  <div
    v-else
    class="rounded-xl bg-muted/10 px-4 py-6 text-sm text-muted ring-1 ring-inset ring-default/30"
  >
    Brak danych do wykresu.
  </div>
</template>
