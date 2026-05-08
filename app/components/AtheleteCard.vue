<script lang="ts" setup>
export interface AthleteChartPoint {
  date: string
  total: number
  snatch: number
  clean_and_jerk: number
  sinclair: number | null
}

export interface Athlete {
  id?: string
  name: string
  birthYear: number
  weightCategory: number
  weightCategoryText: string
  bodyweight?: number | null
  snatch: number
  cleanAndJerk: number
  total: number
  sinclair: number
  description: string
  photo?: string
  /** Widoczność tylko dla zalogowanych zawodników (kolory: zielony/czerwony). */
  membershipPaid?: boolean | null
  chartHistory: AthleteChartPoint[]
  maxHistory: number
}

const athlete = defineModel<Athlete>({
  required: true
})

const CHART_W = 300
const CHART_H = 100
const PAD_TOP = 14
const PAD_BOTTOM = 12

const chartHoverIndex = ref<number | null>(null)

watch(() => athlete.value.chartHistory, () => {
  chartHoverIndex.value = null
})

function fmtPlDate(iso: string) {
  const d = iso.slice(0, 10)
  if (d.length < 10) return iso
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

const chartSvgIds = computed(() => {
  const raw = athlete.value.id || athlete.value.name || 'chart'
  const slug = String(raw).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'athlete'
  return {
    gradArea: `slavia-area-${slug}`,
    gradLine: `slavia-line-${slug}`,
    filterGlow: `slavia-glow-${slug}`
  }
})

function buildPlotCoords(totals: number[]) {
  const max = Math.max(...totals) * 1.06 || 1
  const min = Math.min(...totals) * 0.94
  const range = max - min || 1
  const plotH = CHART_H - PAD_TOP - PAD_BOTTOM
  const n = totals.length
  const denom = Math.max(1, n - 1)
  return totals.map((v, i) => ({
    x: (i / denom) * CHART_W,
    y: PAD_TOP + plotH - ((v - min) / range) * plotH
  }))
}

function gridLineYs(): number[] {
  const plotTop = PAD_TOP
  const plotBot = CHART_H - PAD_BOTTOM
  const plotH = plotBot - plotTop
  return [1, 2, 3].map(k => plotTop + (plotH * k) / 4)
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

const chartPaths = computed(() => {
  const series = athlete.value.chartHistory
  if (!series || series.length < 2) return null
  const totals = series.map(s => s.total)
  const pts = buildPlotCoords(totals)
  const lineD = smoothLinePath(pts)
  const bottom = CHART_H - 1
  const lastPt = pts[pts.length - 1]
  const firstPt = pts[0]
  if (!lastPt || !firstPt) return null
  const areaD = `${lineD} L ${lastPt.x} ${bottom} L ${firstPt.x} ${bottom} Z`
  const maxV = Math.max(...totals)
  const minV = Math.min(...totals)
  return {
    lineD,
    areaD,
    pts,
    series,
    gridYs: gridLineYs(),
    minV,
    maxV
  }
})

const tooltipPoint = computed(() => {
  const i = chartHoverIndex.value
  if (i === null) return null
  const ch = athlete.value.chartHistory
  if (!ch[i]) return null
  return ch[i]
})

const tooltipLeftPct = computed(() => {
  const i = chartHoverIndex.value
  const n = athlete.value.chartHistory.length
  if (i === null || n < 2) return 50
  return (i / (n - 1)) * 100
})

function clearHover() {
  chartHoverIndex.value = null
}
</script>

<template>
  <UCard class="h-full overflow-visible border-default/60 shadow-lg transition-all duration-300 hover:border-primary/30 hover:shadow-primary/10 cursor-pointer">
    <div class="grid gap-6 md:grid-cols-12">
      <div class="md:col-span-4 flex flex-col items-center text-center">
        <div class="relative group">
          <div class="absolute inset-0 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <img
            :src="athlete.photo || '/athlete-placeholder.svg'"
            :alt="athlete.name"
            class="relative h-44 w-44 rounded-xl object-cover border-2 border-primary/20 group-hover:border-primary transition-all shadow-md"
          >
          <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
            <template v-if="athlete.weightCategory > 0">
              Kat. {{ athlete.weightCategoryText }} kg
            </template>
            <template v-else>
              Kat. —
            </template>
          </div>
        </div>

        <div
          v-if="athlete.membershipPaid !== undefined && athlete.membershipPaid !== null"
          class="mt-5"
        >
          <UBadge
            :color="athlete.membershipPaid ? 'success' : 'error'"
            variant="subtle"
            size="sm"
          >
            {{ athlete.membershipPaid ? 'Opłacony' : 'Nieopłacony' }}
          </UBadge>
        </div>

        <h3 class="mt-7 text-xl font-bold text-highlighted leading-tight">
          {{ athlete.name }}
        </h3>
        <p class="text-sm text-muted font-medium mt-0.5">
          Rocznik: {{ athlete.birthYear }}
        </p>

        <div class="mt-4 w-full rounded-xl border border-default/40 bg-muted/20 p-3 text-sm text-muted text-left leading-relaxed wrap-break-word">
          {{ athlete.description }}
        </div>
      </div>

      <div class="md:col-span-8 space-y-5">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="min-h-28 rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 to-primary/10 p-3 text-center flex flex-col justify-center gap-1">
            <p class="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-primary/70 font-bold">
              <UIcon
                name="i-game-icons-weight-lifting-up"
                class="size-4 shrink-0 opacity-95"
              />
              Rwanie
            </p>
            <p class="text-xl sm:text-2xl font-mono font-bold text-primary leading-none wrap-break-word">
              {{ athlete.snatch }}
            </p>
            <p class="text-[11px] text-primary/60 font-medium">
              kg
            </p>
          </div>

          <div class="min-h-28 rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 to-primary/10 p-3 text-center flex flex-col justify-center gap-1">
            <p class="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-primary/70 font-bold">
              <UIcon
                name="i-game-icons-weight-lifting-down"
                class="size-4 shrink-0 opacity-95"
              />
              Podrzut
            </p>
            <p class="text-xl sm:text-2xl font-mono font-bold text-primary leading-none wrap-break-word">
              {{ athlete.cleanAndJerk }}
            </p>
            <p class="text-[11px] text-primary/60 font-medium">
              kg
            </p>
          </div>

          <div class="min-h-28 rounded-xl border border-emerald-500/30 bg-linear-to-br from-emerald-500/10 to-primary/10 p-3 text-center flex flex-col justify-center gap-1">
            <p class="text-[10px] uppercase tracking-wide text-emerald-500/80 font-bold">
              Total
            </p>
            <p class="text-xl sm:text-2xl font-mono font-bold text-emerald-400 leading-none wrap-break-word">
              {{ athlete.total }}
            </p>
            <p class="text-[11px] text-emerald-500/60 font-medium">
              kg
            </p>
          </div>

          <div class="min-h-28 rounded-xl border border-amber-500/30 bg-linear-to-br from-amber-500/10 to-orange-500/10 p-3 text-center flex flex-col justify-center gap-1">
            <p class="text-[10px] uppercase tracking-wide text-amber-400/80 font-bold">
              Sinclair
            </p>
            <p class="text-xl sm:text-2xl font-mono font-bold text-amber-300 leading-none wrap-break-word">
              {{ athlete.sinclair }}
            </p>
            <p class="text-[11px] text-amber-400/70 font-medium">
              pkt
            </p>
          </div>
        </div>

        <div class="rounded-xl border border-default/30 bg-muted/5 p-4">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p class="text-xs font-bold text-muted flex items-center gap-2 uppercase tracking-wider">
              <UIcon
                name="i-lucide-trending-up"
                class="text-primary size-4"
              />
              Progresja totalu
            </p>
            <p class="text-[10px] text-muted font-medium">
              Najedź punkt na wykresie — szczegóły startu
            </p>
          </div>

          <div
            v-if="chartPaths"
            class="relative h-29 w-full rounded-xl bg-linear-to-b from-primary/[0.07] via-muted/20 to-muted/5 ring-1 ring-inset ring-primary/10 overflow-visible"
            @mouseleave="clearHover"
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
                <div
                  class="rounded-xl border border-primary/25 bg-background/95 px-3.5 py-2.5 shadow-xl shadow-primary/10 ring-1 ring-default/40 backdrop-blur-md"
                >
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
                      <span
                        v-if="tooltipPoint.sinclair != null"
                        class="text-[10px] font-normal text-muted"
                      >pkt</span>
                    </span>
                  </div>
                </div>
              </div>
            </Transition>

            <svg
              :viewBox="`0 0 ${CHART_W} ${CHART_H}`"
              class="w-full h-full block"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient
                  :id="chartSvgIds.gradArea"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stop-color="rgb(var(--ui-primary))"
                    stop-opacity="0.38"
                  />
                  <stop
                    offset="50%"
                    stop-color="rgb(var(--ui-primary))"
                    stop-opacity="0.1"
                  />
                  <stop
                    offset="100%"
                    stop-color="rgb(var(--ui-primary))"
                    stop-opacity="0"
                  />
                </linearGradient>
                <linearGradient
                  :id="chartSvgIds.gradLine"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop
                    offset="0%"
                    stop-color="rgb(var(--ui-primary))"
                  />
                  <stop
                    offset="100%"
                    stop-color="#22c55e"
                  />
                </linearGradient>
                <filter
                  :id="chartSvgIds.filterGlow"
                  x="-25%"
                  y="-25%"
                  width="150%"
                  height="150%"
                >
                  <feGaussianBlur
                    stdDeviation="0.85"
                    result="blur"
                  />
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

              <text
                x="6"
                :y="PAD_TOP + 4"
                fill="currentColor"
                font-size="9"
                font-weight="700"
                class="text-muted pointer-events-none"
              >
                {{ Math.round(chartPaths.maxV) }}
              </text>
              <text
                x="6"
                :y="CHART_H - PAD_BOTTOM"
                fill="currentColor"
                font-size="9"
                font-weight="700"
                class="text-muted pointer-events-none"
              >
                {{ Math.round(chartPaths.minV) }}
              </text>

              <path
                :d="chartPaths.areaD"
                :fill="`url(#${chartSvgIds.gradArea})`"
                class="pointer-events-none"
              />
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

            <div class="pointer-events-none absolute bottom-1 right-2 flex items-center gap-1.5 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-mono font-bold text-muted shadow-sm ring-1 ring-default/30">
              skala {{ Math.round(chartPaths.minV) }}–{{ Math.round(chartPaths.maxV) }} kg
            </div>
          </div>

          <div
            v-else-if="athlete.chartHistory.length === 1"
            class="relative rounded-xl bg-linear-to-b from-primary/[0.07] to-muted/10 ring-1 ring-inset ring-primary/10 overflow-visible px-4 py-6"
            @mouseleave="clearHover"
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
                v-if="chartHoverIndex === 0 && athlete.chartHistory[0]"
                class="pointer-events-none absolute z-40 bottom-full left-1/2 mb-2 w-max max-w-[18rem] -translate-x-1/2"
              >
                <div class="rounded-xl border border-primary/25 bg-background/95 px-3.5 py-2.5 shadow-lg ring-1 ring-default/40 backdrop-blur-md">
                  <p class="text-[11px] font-bold uppercase tracking-wide text-primary mb-1">
                    {{ fmtPlDate(athlete.chartHistory[0].date) }}
                  </p>
                  <div class="flex items-baseline gap-2">
                    <span class="text-lg font-mono font-black text-emerald-400">{{ athlete.chartHistory[0].total }}</span>
                    <span class="text-[11px] text-muted font-semibold">kg total</span>
                  </div>
                  <div class="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                    <span class="text-muted">Rwanie</span>
                    <span class="font-mono font-bold text-right">{{ athlete.chartHistory[0].snatch }} kg</span>
                    <span class="text-muted">Podrzut</span>
                    <span class="font-mono font-bold text-right">{{ athlete.chartHistory[0].clean_and_jerk }} kg</span>
                    <span class="text-muted">Sinclair</span>
                    <span class="font-mono font-bold text-amber-400 text-right">
                      {{ athlete.chartHistory[0].sinclair != null ? athlete.chartHistory[0].sinclair : '—' }}
                    </span>
                  </div>
                </div>
              </div>
            </Transition>
            <div
              class="relative flex items-end justify-center h-24 gap-2 cursor-crosshair"
              @mouseenter="chartHoverIndex = 0"
            >
              <div
                class="bg-linear-to-t from-primary/50 to-primary/25 rounded-t-xl hover:from-primary hover:to-primary/80 transition-all duration-200 relative min-w-[52px] shadow-inner ring-1 ring-primary/20"
                :style="{ height: `${Math.min(100, ((athlete.chartHistory[0]?.total ?? 0) / athlete.maxHistory) * 100)}%` }"
              >
                <span class="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-mono font-black text-primary whitespace-nowrap tabular-nums">
                  {{ athlete.chartHistory[0]?.total ?? 0 }} kg
                </span>
              </div>
            </div>
          </div>

          <div
            v-else
            class="flex h-28 items-center justify-center px-2 rounded-xl bg-muted/10 ring-1 ring-dashed ring-default/40"
          >
            <p class="text-center text-xs text-muted leading-relaxed max-w-sm">
              Brak zatwierdzonych wyników startowych — po akceptacji zgłoszenia pojawi się tu wykres z podziałem rwanie / podrzut i pkt Sinclair.
            </p>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
