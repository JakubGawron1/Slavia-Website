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
  /** Gdy true a brak wpłaty za miesiąc — badge „Przelew stały” (info), nie „Nieopłacony”. */
  hasStandingOrder?: boolean | null
  /** Jeśli false, profil jest nieaktywny w kadrze (ukryty na liście publicznej). */
  isActive?: boolean | null
  chartHistory: AthleteChartPoint[]
  maxHistory: number
  /** Najlepszy trening (tylko dla zalogowanych) — osobny pas KPI w kolorze treningowym. */
  trainingStrip?: {
    snatch: number
    cleanAndJerk: number
    total: number
    sinclair: number
  } | null
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

const membershipBadgeLabel = computed(() => {
  const a = athlete.value
  if (a.membershipPaid === true) return 'Opłacony'
  if (a.hasStandingOrder === true) return 'Przelew stały'
  return 'Nieopłacony'
})

const membershipBadgeColor = computed(() => {
  const a = athlete.value
  if (a.membershipPaid === true) return 'success' as const
  if (a.hasStandingOrder === true) return 'info' as const
  return 'error' as const
})
</script>

<template>
  <UCard
    class="group/card h-full cursor-pointer overflow-hidden rounded-2xl border border-default/55 bg-card text-default shadow-sm ring-1 ring-default/15 transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md hover:ring-primary/20 dark:border-default/45 dark:bg-card dark:ring-default/15 dark:hover:border-primary/40 dark:hover:ring-primary/25"
    :ui="{ body: 'p-0' }"
  >
    <!-- Nagłówek: spójny z motywem UI (jasny / ciemny) -->
    <div
      class="flex flex-col gap-4 border-b border-default/45 bg-muted/12 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-5 dark:border-default/50 dark:bg-muted/15"
    >
      <div
        class="mx-auto w-28 shrink-0 overflow-hidden rounded-xl bg-muted/25 ring-2 ring-default/20 sm:mx-0 sm:w-32 dark:bg-muted/30 dark:ring-default/35"
      >
        <div class="aspect-square w-full">
          <img
            :src="athlete.photo || '/athlete-placeholder.svg'"
            :alt="athlete.name"
            width="176"
            height="176"
            loading="lazy"
            decoding="async"
            class="block h-full w-full object-cover object-center transition duration-200 group-hover/card:scale-[1.03]"
          >
        </div>
      </div>

      <div class="min-w-0 flex-1 text-center sm:text-left">
        <h3 class="text-balance text-xl font-bold leading-tight tracking-tight text-highlighted sm:text-2xl">
          {{ athlete.name }}
        </h3>
        <p class="mt-1 text-sm text-muted">
          Rocznik {{ athlete.birthYear }}
        </p>
        <div class="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <UBadge color="primary" variant="subtle" size="sm" class="font-medium">
            <template v-if="athlete.weightCategory > 0">
              Kat. {{ athlete.weightCategoryText }} kg
            </template>
            <template v-else>
              Kat. —
            </template>
          </UBadge>
          <UBadge
            v-if="athlete.membershipPaid !== undefined && athlete.membershipPaid !== null"
            :color="membershipBadgeColor"
            variant="subtle"
            size="sm"
          >
            {{ membershipBadgeLabel }}
          </UBadge>
        </div>

        <div
          v-if="athlete.isActive === false"
          class="mt-3 rounded-lg border border-warning/35 bg-warning/6 px-3 py-2 text-left dark:border-warning/40 dark:bg-warning/12"
        >
          <UBadge color="warning" variant="subtle" size="sm">
            Nieaktywny w kadrze
          </UBadge>
          <p class="mt-1.5 text-[11px] leading-snug text-muted">
            Ukryty na liście publicznej.
          </p>
        </div>

        <p
          v-if="athlete.description"
          class="mt-3 text-pretty text-sm leading-relaxed text-muted line-clamp-3"
        >
          {{ athlete.description }}
        </p>
      </div>
    </div>

    <!-- Zawody -->
    <div class="border-b border-default/40 dark:border-default/45">
      <div class="flex items-center gap-2 border-l-4 border-primary bg-primary/5 px-3 py-2 dark:bg-primary/10">
        <UIcon name="i-lucide-trophy" class="size-4 shrink-0 text-primary" />
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-wide text-highlighted">
            Zawody
          </p>
          <p class="text-[11px] text-muted">
            Oficjalne PB
          </p>
        </div>
      </div>
      <div class="grid min-w-0 grid-cols-2 divide-x divide-y divide-default/35 bg-muted/10 sm:grid-cols-4 sm:divide-y-0 dark:divide-default/45 dark:bg-muted/20">
        <div class="flex min-h-24 min-w-0 flex-col items-center justify-center gap-0.5 bg-elevated/75 px-2 py-3 text-center dark:bg-elevated/50">
          <UIcon name="i-game-icons-weight-lifting-up" class="size-4 text-primary" />
          <span class="text-[10px] font-medium uppercase tracking-wide text-muted">Rwanie</span>
          <span class="min-w-0 truncate font-mono text-lg font-bold tabular-nums text-highlighted">{{ athlete.snatch }}</span>
          <span class="text-[10px] text-muted">kg</span>
        </div>
        <div class="flex min-h-24 min-w-0 flex-col items-center justify-center gap-0.5 bg-elevated/75 px-2 py-3 text-center dark:bg-elevated/50">
          <UIcon name="i-game-icons-weight-lifting-down" class="size-4 text-primary" />
          <span class="text-[10px] font-medium uppercase tracking-wide text-muted">Podrzut</span>
          <span class="min-w-0 truncate font-mono text-lg font-bold tabular-nums text-highlighted">{{ athlete.cleanAndJerk }}</span>
          <span class="text-[10px] text-muted">kg</span>
        </div>
        <div class="flex min-h-24 min-w-0 flex-col items-center justify-center gap-0.5 bg-primary/10 px-2 py-3 text-center dark:bg-primary/15">
          <span class="text-[10px] font-bold uppercase tracking-wide text-primary">Total</span>
          <span class="min-w-0 truncate font-mono text-lg font-bold tabular-nums text-highlighted">{{ athlete.total }}</span>
          <span class="text-[10px] text-muted">kg</span>
        </div>
        <div class="flex min-h-24 min-w-0 flex-col items-center justify-center gap-0.5 bg-warning/8 px-2 py-3 text-center dark:bg-warning/12">
          <span class="text-[10px] font-bold uppercase tracking-wide text-warning">Sinclair</span>
          <span class="min-w-0 truncate font-mono text-lg font-bold tabular-nums text-highlighted">{{ athlete.sinclair }}</span>
          <span class="text-[10px] text-muted">pkt</span>
        </div>
      </div>
    </div>

    <!-- Trening -->
    <template v-if="athlete.trainingStrip">
      <div class="border-b border-default/40 dark:border-default/45">
        <div class="flex items-center gap-2 border-l-4 border-info bg-info/6 px-3 py-2 dark:bg-info/12">
          <UIcon name="i-lucide-dumbbell" class="size-4 shrink-0 text-info" />
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-wide text-highlighted">
              Trening
            </p>
            <p class="text-[11px] text-muted">
              Sala — najlepszy zapisany wynik
            </p>
          </div>
        </div>
        <div class="grid min-w-0 grid-cols-2 divide-x divide-y divide-default/35 bg-muted/10 sm:grid-cols-4 sm:divide-y-0 dark:divide-default/45 dark:bg-muted/20">
          <div class="flex min-h-24 min-w-0 flex-col items-center justify-center gap-0.5 bg-elevated/75 px-2 py-3 text-center dark:bg-elevated/50">
            <UIcon name="i-game-icons-weight-lifting-up" class="size-4 text-info" />
            <span class="text-[10px] font-medium uppercase tracking-wide text-muted">Rwanie</span>
            <span class="min-w-0 truncate font-mono text-lg font-bold tabular-nums text-highlighted">{{ athlete.trainingStrip.snatch }}</span>
            <span class="text-[10px] text-muted">kg</span>
          </div>
          <div class="flex min-h-24 min-w-0 flex-col items-center justify-center gap-0.5 bg-elevated/75 px-2 py-3 text-center dark:bg-elevated/50">
            <UIcon name="i-game-icons-weight-lifting-down" class="size-4 text-info" />
            <span class="text-[10px] font-medium uppercase tracking-wide text-muted">Podrzut</span>
            <span class="min-w-0 truncate font-mono text-lg font-bold tabular-nums text-highlighted">{{ athlete.trainingStrip.cleanAndJerk }}</span>
            <span class="text-[10px] text-muted">kg</span>
          </div>
          <div class="flex min-h-24 min-w-0 flex-col items-center justify-center gap-0.5 bg-info/10 px-2 py-3 text-center dark:bg-info/15">
            <span class="text-[10px] font-bold uppercase tracking-wide text-info">Total</span>
            <span class="min-w-0 truncate font-mono text-lg font-bold tabular-nums text-highlighted">{{ athlete.trainingStrip.total }}</span>
            <span class="text-[10px] text-muted">kg</span>
          </div>
          <div class="flex min-h-24 min-w-0 flex-col items-center justify-center gap-0.5 bg-elevated/75 px-2 py-3 text-center dark:bg-elevated/50">
            <span class="text-[10px] font-medium uppercase tracking-wide text-muted">Sinclair</span>
            <span class="min-w-0 truncate font-mono text-lg font-bold tabular-nums text-highlighted">{{ athlete.trainingStrip.sinclair }}</span>
            <span class="text-[10px] text-muted">pkt</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Progresja -->
    <div class="border-t border-default/35 bg-muted/8 p-4 dark:border-default/45 dark:bg-muted/12 sm:p-5">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p class="flex items-center gap-2 text-sm font-semibold text-highlighted">
          <UIcon name="i-lucide-trending-up" class="size-4 text-primary" />
          Progresja totalu
        </p>
        <p class="text-[11px] text-muted">
          Najedź — szczegóły startu
        </p>
      </div>

      <div
        v-if="chartPaths"
        class="relative h-29 w-full overflow-visible rounded-xl border border-default/50 bg-linear-to-b from-muted/20 to-muted/5 dark:border-default/45 dark:from-muted/30 dark:to-muted/10"
        @click.stop.prevent
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
                    <span class="text-lg font-mono font-black text-success">{{ tooltipPoint.total }}</span>
                    <span class="text-[11px] font-semibold text-muted">kg total</span>
                  </div>
                  <div class="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                    <span class="text-muted">Rwanie</span>
                    <span class="font-mono font-bold text-highlighted text-right">{{ tooltipPoint.snatch }} kg</span>
                    <span class="text-muted">Podrzut</span>
                    <span class="font-mono font-bold text-highlighted text-right">{{ tooltipPoint.clean_and_jerk }} kg</span>
                    <span class="text-muted">Sinclair</span>
                    <span class="font-mono font-bold text-warning text-right">
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
                    stop-color="var(--slavia-chart-accent)"
                    stop-opacity="0.38"
                  />
                  <stop
                    offset="50%"
                    stop-color="var(--slavia-chart-accent)"
                    stop-opacity="0.1"
                  />
                  <stop
                    offset="100%"
                    stop-color="var(--slavia-chart-accent)"
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
                    stop-color="var(--slavia-chart-accent)"
                  />
                  <stop
                    offset="100%"
                    stop-color="var(--slavia-chart-accent-2)"
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

        <div class="pointer-events-none absolute bottom-1 right-2 flex items-center gap-1.5 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-mono font-bold text-muted shadow-sm ring-1 ring-default/30">
          skala {{ Math.round(chartPaths.minV) }}–{{ Math.round(chartPaths.maxV) }} kg
        </div>
      </div>

      <div
        v-else-if="athlete.chartHistory.length === 1"
        class="relative overflow-visible rounded-xl border border-default/50 bg-muted/15 px-4 py-6 dark:border-default/45 dark:bg-muted/25"
        @click.stop.prevent
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
                <span class="text-lg font-mono font-black text-success">{{ athlete.chartHistory[0].total }}</span>
                <span class="text-[11px] text-muted font-semibold">kg total</span>
              </div>
              <div class="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                <span class="text-muted">Rwanie</span>
                <span class="font-mono font-bold text-right">{{ athlete.chartHistory[0].snatch }} kg</span>
                <span class="text-muted">Podrzut</span>
                <span class="font-mono font-bold text-right">{{ athlete.chartHistory[0].clean_and_jerk }} kg</span>
                <span class="text-muted">Sinclair</span>
                <span class="font-mono font-bold text-warning text-right">
                  {{ athlete.chartHistory[0].sinclair != null ? athlete.chartHistory[0].sinclair : '—' }}
                </span>
              </div>
            </div>
          </div>
        </Transition>
        <div
          class="relative flex h-24 cursor-crosshair items-end justify-center gap-2"
          @mouseenter="chartHoverIndex = 0"
        >
          <div
            class="relative min-w-[52px] rounded-t-xl bg-linear-to-t from-primary/50 to-primary/25 shadow-inner ring-1 ring-primary/20 transition-all duration-200 hover:from-primary hover:to-primary/80"
            :style="{ height: `${Math.min(100, ((athlete.chartHistory[0]?.total ?? 0) / athlete.maxHistory) * 100)}%` }"
          >
            <span class="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-xs font-black text-primary tabular-nums">
              {{ athlete.chartHistory[0]?.total ?? 0 }} kg
            </span>
          </div>
        </div>
      </div>

      <div
        v-else
        class="flex h-28 items-center justify-center rounded-xl border border-dashed border-default/50 bg-muted/10 px-3 dark:border-default/40 dark:bg-muted/15"
      >
        <p class="max-w-sm text-center text-xs leading-relaxed text-muted">
          Brak zatwierdzonych wyników startowych — po akceptacji zgłoszenia pojawi się tu wykres z podziałem rwanie / podrzut i pkt Sinclair.
        </p>
      </div>
    </div>
  </UCard>
</template>
