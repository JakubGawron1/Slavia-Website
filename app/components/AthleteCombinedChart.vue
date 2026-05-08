<script setup lang="ts">
/**
 * Wykres łączący wyniki z zawodów i z treningów na jednej osi czasu.
 * Dwie linie + kropki w innych kolorach, wspólna oś Y (dwubój), oś X — proporcjonalna do daty.
 *
 * Komponent pokazuje rzeczywiste odstępy czasowe między startami / treningami,
 * dzięki czemu od razu widać tempo progresu, plateau i okresy bez wpisów.
 */
export interface CombinedChartPoint {
  date: string
  total: number
  snatch: number
  clean_and_jerk: number
  sinclair: number | null
  kind: 'competition' | 'training'
}

const props = withDefaults(defineProps<{
  series: CombinedChartPoint[]
  height?: number
}>(), {
  height: 220
})

const CHART_W = 460
const PAD_TOP = 18
const PAD_BOTTOM = 22
const PAD_LEFT = 6
const PAD_RIGHT = 6

const hoverIndex = ref<number | null>(null)

watch(
  () => props.series,
  () => {
    hoverIndex.value = null
  }
)

function fmtPlDate(iso: string) {
  const d = (iso || '').slice(0, 10)
  if (d.length < 10) return iso
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

function tsFromIso(iso: string): number {
  const ms = Date.parse((iso || '').slice(0, 10))
  return Number.isFinite(ms) ? ms : 0
}

interface PointXY {
  x: number
  y: number
  idx: number
  src: CombinedChartPoint
}

const chartPaths = computed(() => {
  const all = (props.series || [])
    .filter(p => Number.isFinite(p.total) && p.total > 0)
    .slice()
    .sort((a, b) => tsFromIso(a.date) - tsFromIso(b.date))

  if (all.length < 1) return null

  const totals = all.map(p => p.total)
  const maxV = Math.max(...totals) * 1.06
  const minV = Math.min(...totals) * 0.92
  const range = (maxV - minV) || 1
  const plotW = CHART_W - PAD_LEFT - PAD_RIGHT
  const plotH = props.height - PAD_TOP - PAD_BOTTOM

  const tMin = tsFromIso(all[0]!.date)
  const tMax = tsFromIso(all[all.length - 1]!.date)
  const tRange = Math.max(1, tMax - tMin)

  const points: PointXY[] = all.map((p, idx) => {
    const t = tsFromIso(p.date)
    const x = PAD_LEFT + ((t - tMin) / tRange) * plotW
    const y = PAD_TOP + plotH - ((p.total - minV) / range) * plotH
    return { x, y, idx, src: p }
  })

  const compPts = points.filter(pt => pt.src.kind === 'competition')
  const trainPts = points.filter(pt => pt.src.kind === 'training')

  return {
    points,
    compPts,
    trainPts,
    minV,
    maxV,
    plotTop: PAD_TOP,
    plotBot: PAD_TOP + plotH,
    gridYs: [1, 2, 3].map(k => PAD_TOP + (plotH * k) / 4),
    yLabels: [
      { y: PAD_TOP, label: Math.round(maxV) },
      { y: PAD_TOP + plotH / 2, label: Math.round((maxV + minV) / 2) },
      { y: PAD_TOP + plotH, label: Math.round(minV) }
    ]
  }
})

function smoothLinePath(pts: PointXY[]) {
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

const compLineD = computed(() => smoothLinePath(chartPaths.value?.compPts ?? []))
const trainLineD = computed(() => smoothLinePath(chartPaths.value?.trainPts ?? []))

const tooltipPoint = computed(() => {
  const i = hoverIndex.value
  if (i === null) return null
  return chartPaths.value?.points[i] ?? null
})

const tooltipLeftPct = computed(() => {
  const pt = tooltipPoint.value
  if (!pt) return 50
  return (pt.x / CHART_W) * 100
})
</script>

<template>
  <div
    v-if="chartPaths && chartPaths.points.length >= 1"
    class="relative w-full rounded-xl bg-linear-to-b from-primary/5 via-sky-500/5 to-muted/5 ring-1 ring-inset ring-default/40 overflow-visible"
    :style="{ height: `${height}px` }"
    @mouseleave="hoverIndex = null"
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
        class="pointer-events-none absolute z-40 bottom-full mb-2 w-max max-w-[min(calc(100vw-2rem),20rem)]"
        :style="{ left: `${tooltipLeftPct}%`, transform: 'translateX(-50%)' }"
      >
        <div class="rounded-xl border border-default/40 bg-background/95 px-3.5 py-2.5 shadow-xl ring-1 ring-default/30 backdrop-blur-md">
          <div class="flex items-center gap-2 mb-1.5">
            <span
              class="size-2 rounded-full"
              :class="tooltipPoint.src.kind === 'competition' ? 'bg-primary' : 'bg-sky-500'"
            />
            <span
              class="text-[10px] font-bold uppercase tracking-wide"
              :class="tooltipPoint.src.kind === 'competition' ? 'text-primary' : 'text-sky-600 dark:text-sky-400'"
            >
              {{ tooltipPoint.src.kind === 'competition' ? 'Zawody' : 'Trening' }}
            </span>
            <span class="text-[10px] text-muted">·</span>
            <span class="text-[11px] font-bold text-highlighted">{{ fmtPlDate(tooltipPoint.src.date) }}</span>
          </div>
          <div class="flex items-baseline gap-2 flex-wrap">
            <span
              class="text-lg font-mono font-black"
              :class="tooltipPoint.src.kind === 'competition' ? 'text-primary' : 'text-sky-600 dark:text-sky-400'"
            >{{ tooltipPoint.src.total }}</span>
            <span class="text-[11px] font-semibold text-muted">kg total</span>
          </div>
          <div class="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
            <span class="text-muted">Rwanie</span>
            <span class="font-mono font-bold text-highlighted text-right">{{ tooltipPoint.src.snatch }} kg</span>
            <span class="text-muted">Podrzut</span>
            <span class="font-mono font-bold text-highlighted text-right">{{ tooltipPoint.src.clean_and_jerk }} kg</span>
            <template v-if="tooltipPoint.src.sinclair != null">
              <span class="text-muted">Sinclair</span>
              <span class="font-mono font-bold text-amber-500 text-right">{{ tooltipPoint.src.sinclair }} pkt</span>
            </template>
          </div>
        </div>
      </div>
    </Transition>

    <svg
      :viewBox="`0 0 ${CHART_W} ${height}`"
      class="w-full h-full block"
      preserveAspectRatio="xMidYMid meet"
    >

      <line
        v-for="(gy, gi) in chartPaths.gridYs"
        :key="'g-' + gi"
        x1="4"
        :y1="gy"
        :x2="CHART_W - 4"
        :y2="gy"
        stroke="currentColor"
        stroke-width="1"
        stroke-dasharray="4 6"
        class="text-default/15 pointer-events-none"
      />

      <text
        v-for="(yl, idx) in chartPaths.yLabels"
        :key="'yl-' + idx"
        :x="CHART_W - 6"
        :y="yl.y - 3"
        text-anchor="end"
        class="fill-muted text-[9px] font-mono font-semibold"
      >
        {{ yl.label }}
      </text>

      <path
        v-if="trainLineD"
        :d="trainLineD"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-dasharray="5 4"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.9"
        class="pointer-events-none text-sky-500 dark:text-sky-400"
      />
      <path
        v-if="compLineD"
        :d="compLineD"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="pointer-events-none text-primary"
      />

      <circle
        v-for="(pt, i) in chartPaths.points"
        :key="'hit-' + i"
        :cx="pt.x"
        :cy="pt.y"
        r="18"
        fill="transparent"
        class="cursor-crosshair"
        @mouseenter="hoverIndex = i"
      />

      <circle
        v-for="(pt, i) in chartPaths.points"
        :key="'ring-' + i"
        :cx="pt.x"
        :cy="pt.y"
        :r="hoverIndex === i ? 6.5 : 4.5"
        class="pointer-events-none fill-white dark:fill-neutral-950 transition-all duration-150 stroke-2"
        :class="pt.src.kind === 'competition' ? 'stroke-primary' : 'stroke-sky-500'"
      />
      <circle
        v-for="(pt, i) in chartPaths.points"
        :key="'dot-' + i"
        :cx="pt.x"
        :cy="pt.y"
        :r="hoverIndex === i ? 3 : 2"
        class="pointer-events-none transition-all duration-150"
        :class="pt.src.kind === 'competition' ? 'fill-primary' : 'fill-sky-500'"
      />
    </svg>
  </div>
  <div
    v-else
    class="rounded-xl bg-muted/10 ring-1 ring-inset ring-default/30 px-4 py-6 text-sm text-muted"
  >
    Brak danych do wykresu — dodaj zatwierdzony wynik z zawodów lub treningu.
  </div>
</template>
