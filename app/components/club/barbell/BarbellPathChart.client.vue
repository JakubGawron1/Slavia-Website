<script setup lang="ts">

import {

  clampPathSamples,

  computePathVelocities,

  detectLiftPhases,

  maxPathSpeed,

  resamplePathSpline,

  smoothSamplesForFps,

  toProfileRelativeSamples,

  velocityColor,

  type BarbellSample,

  type LiftPhaseAnalysis

} from '~/utils/barbellPathAnalysis'



const props = withDefaults(

  defineProps<{

    samples: BarbellSample[]

    referenceSamples?: BarbellSample[]

    untilSec?: number

    hipLine?: boolean

    liftType?: 'snatch' | 'clean_jerk' | 'unknown'

    labMode?: boolean

    /** Widok względem linii bioder — lepszy przy kącie 3/4. */

    profileRelative?: boolean

  }>(),

  {

    hipLine: true,

    referenceSamples: undefined,

    untilSec: undefined,

    liftType: 'unknown',

    labMode: false,

    profileRelative: true

  }

)



function transformSamples(raw: BarbellSample[]): BarbellSample[] {

  if (!props.profileRelative) return raw

  return toProfileRelativeSamples(raw)

}



const cappedSamples = computed(() => clampPathSamples(props.samples))



const smoothedFullSamples = computed(() => {

  const raw = cappedSamples.value

  if (raw.length < 2) return raw

  const duration = raw[raw.length - 1]!.t - raw[0]!.t

  const fps =

    duration > 0.001

      ? Math.min(120, Math.max(12, Math.round((raw.length - 1) / duration)))

      : 30

  const smooth = smoothSamplesForFps(raw, fps)

  return resamplePathSpline(smooth, 2)

})



const chartSamples = computed(() => transformSamples(smoothedFullSamples.value))



const displaySamples = computed(() => {

  const raw = chartSamples.value

  if (typeof props.untilSec !== 'number') return raw

  return raw.filter(s => s.t <= props.untilSec!)

})



const displayReference = computed(() => {

  const src = props.referenceSamples

  if (!src || src.length < 2) return []

  const capped = clampPathSamples(src)

  const raw =

    typeof props.untilSec === 'number'

      ? capped.filter(s => s.t <= props.untilSec!)

      : capped

  if (raw.length < 2) return []

  const duration = raw[raw.length - 1]!.t - raw[0]!.t

  const fps =

    duration > 0.001

      ? Math.min(120, Math.max(12, Math.round((raw.length - 1) / duration)))

      : 30

  const smooth = resamplePathSpline(smoothSamplesForFps(raw, fps), 2)

  return transformSamples(smooth)

})



const phaseAnalysis = computed((): LiftPhaseAnalysis => {

  if (smoothedFullSamples.value.length < 6) {

    return { segments: [], splitIdx: null, cleanMarkerY: null, jerkMarkerY: null }

  }

  return detectLiftPhases(smoothedFullSamples.value, props.liftType)

})



function pt(s: BarbellSample) {

  return { x: s.barX * 100, y: s.barY * 100 }

}



const velocitySegments = computed(() => {

  const pts = displaySamples.value

  if (pts.length < 2) return [] as Array<{ d: string, color: string }>

  const velocities = computePathVelocities(pts)

  const maxSpeed = maxPathSpeed(pts)

  const segments: Array<{ d: string, color: string }> = []

  for (let i = 1; i < pts.length; i++) {

    const a = pt(pts[i - 1]!)

    const b = pt(pts[i]!)

    const speed = velocities[i]?.speed ?? velocities[i - 1]?.speed ?? 0

    segments.push({

      d: `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} L ${b.x.toFixed(2)} ${b.y.toFixed(2)}`,

      color: velocityColor(speed, maxSpeed)

    })

  }

  return segments

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



const phaseLabels = computed(() => {

  const pa = phaseAnalysis.value

  const labels: Array<{ y: number, text: string, color: string }> = []

  const isSnatch = props.liftType === 'snatch'

    || pa.segments.some(s => s.phase === 'snatch')



  if (isSnatch) {

    if (pa.cleanMarkerY != null) {

      labels.push({ y: pa.cleanMarkerY * 100, text: 'PULL', color: 'rgb(239,68,68)' })

    }

    if (pa.jerkMarkerY != null) {

      labels.push({ y: pa.jerkMarkerY * 100, text: 'SNATCH', color: 'rgb(34,197,94)' })

    }

    return labels

  }



  if (pa.cleanMarkerY != null) {

    labels.push({ y: pa.cleanMarkerY * 100, text: 'CLEAN', color: 'rgb(239,68,68)' })

  }

  if (pa.jerkMarkerY != null && pa.segments.some(s => s.phase === 'jerk')) {

    labels.push({ y: pa.jerkMarkerY * 100, text: 'JERK', color: 'rgb(250,204,21)' })

  }

  return labels

})

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

        <template v-if="labMode">

          Gradient prędkości · fazy CLEAN/JERK lub PULL/SNATCH · oś względem bioder.

        </template>

        <template v-else>

          Oś pionowa = linia bioder · gradient prędkości na torze.

        </template>

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

            id="barbell-chart-grid"

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

          fill="url(#barbell-chart-grid)"

        />

        <line

          v-if="hipLine && hipLineX != null"

          :x1="hipLineX"

          y1="0"

          :x2="hipLineX"

          y2="100"

          stroke="rgba(255,255,255,0.42)"

          stroke-width="0.55"

          stroke-dasharray="2.5 2.5"

        />

        <template v-if="labMode || profileRelative">

          <line

            v-for="(lbl, idx) in phaseLabels"

            :key="`phase-${idx}`"

            x1="0"

            :y1="lbl.y"

            x2="100"

            :y2="lbl.y"

            :stroke="lbl.color"

            stroke-width="0.35"

            stroke-dasharray="1.5 2"

            opacity="0.55"

          />

          <text

            v-for="(lbl, idx) in phaseLabels"

            :key="`lbl-${idx}`"

            x="2"

            :y="lbl.y - 1.2"

            fill="rgba(255,255,255,0.85)"

            font-size="3.2"

            font-weight="700"

            letter-spacing="0.08em"

          >

            {{ lbl.text }}

          </text>

        </template>

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

          v-for="(seg, idx) in velocitySegments"

          :key="`vel-${idx}`"

          :d="seg.d"

          fill="none"

          :stroke="seg.color"

          :stroke-width="labMode ? 2 : 1.6"

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


