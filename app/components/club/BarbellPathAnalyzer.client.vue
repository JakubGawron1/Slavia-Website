<script setup lang="ts">
import type { Pose } from '@tensorflow-models/pose-detection'
import { loadPoseDetector, MODEL_PROGRESS_READY, type PoseDetector } from '~/utils/loadPoseDetector'
import { buildBiomechanicalFeedback, buildTechniqueMetrics, clampPathSamples, projectToLiftPlane, assessCameraQuality, samplesUntilTime, smoothSamplesForFps, type BarbellSample, type BarbellTechniqueMetrics, type CameraQualityAssessment } from '~/utils/barbellPathAnalysis'
import { drawPremiumBarbellOverlay, drawVelocityColoredPath } from '~/utils/barbellPathDraw'
import { useBarbellPathAi, type BarbellPathTrackingProviderId } from '~/composables/useBarbellPathAi'
import { pickFrameTimesFromSamples } from '~/utils/barbellVideoFrames'

const props = withDefaults(
  defineProps<{
    /** Osadzenie w panelu AI — ukrywa karty heurystyk (pokazuje je panel nadrzędny). */
    aiPanelEmbed?: boolean
    /** Osadzenie w BarbellAnalysisPanel — kompaktowy układ bez duplikatów metryk. */
    panelEmbed?: boolean
    /** Pełny overlay Torokhtiy (gradient, fazy, panel boczny). Domyślnie włączony. */
    premiumOverlay?: boolean
    /** Po detekcji MoveNet — AI koryguje tor (vision + numeric). */
    aiRefinePath?: boolean
    liftType?: 'snatch' | 'clean_jerk' | 'unknown'
    trackingProvider?: BarbellPathTrackingProviderId
  }>(),
  {
    aiPanelEmbed: false,
    panelEmbed: false,
    premiumOverlay: true,
    aiRefinePath: false,
    liftType: 'unknown',
    trackingProvider: 'auto'
  }
)

const emit = defineEmits<{
  analyzed: [payload: {
    samples: BarbellSample[]
    rawSamples: BarbellSample[]
    metrics: BarbellTechniqueMetrics
    feedback: string[]
    pathSource: 'ai' | 'algorithm'
    refineMeta?: { model: string; provider: string; method: string } | null
    refineNotes?: string | null
    cameraQuality?: CameraQualityAssessment | null
  }]
  playbackTime: [t: number]
}>()

const toast = useToast()
const { refinePath, trackingProvider: trackingProviderRef, lastRefineMeta, refineError, refineNotes: refineNotesRef, refineBlockedReason } = useBarbellPathAi()

watch(
  () => props.trackingProvider,
  (v) => {
    trackingProviderRef.value = v
  },
  { immediate: true }
)
const expPlateTracking = useExperimentalFlag('barbell_plate_tracking')
const expBodyRefTracking = useExperimentalFlag('barbell_body_reference_tracking')

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const clipUrl = ref<string | null>(null)

const busy = ref(false)
const busyLabel = ref('')
const progress = ref(0)
/** 1 = model, 2 = wideo, 3 = klatki */
const phaseStep = ref(0)
const frameProgress = ref({ current: 0, total: 0 })
const feedback = ref<string[]>([])
const samplesCount = ref(0)
const analyzedSamples = ref<BarbellSample[]>([])
/** Surowy tor z MoveNet — do porównania gdy AI skoryguje ścieżkę. */
const rawAlgorithmSamples = ref<BarbellSample[]>([])
const pathSource = ref<'ai' | 'algorithm'>('algorithm')
const metrics = ref<BarbellTechniqueMetrics | null>(null)
const cameraQuality = ref<CameraQualityAssessment | null>(null)
const stabilizeToHips = ref(true)
const currentPlaybackSec = ref<number | undefined>(undefined)
const playbackReady = computed(() => analyzedSamples.value.length >= 2 && !!videoRef.value)
const pathPlaybackRange = ref<{ start: number, end: number } | null>(null)
const isPlaybackPlaying = ref(false)

/** Tempo odtwarzania wideo (HTML5 `playbackRate`). */
const playbackSpeed = ref(0.5)
const playbackSpeedItems = [
  { label: '0,25× — bardzo wolno', value: 0.25 },
  { label: '0,33×', value: 0.33 },
  { label: '0,5× — wolno', value: 0.5 },
  { label: '0,75×', value: 0.75 },
  { label: '1× — normalnie', value: 1 }
] as const

function applyVideoPlaybackSpeed(v: HTMLVideoElement | null | undefined = videoRef.value) {
  if (!v) return
  try {
    v.playbackRate = playbackSpeed.value
    v.defaultPlaybackRate = playbackSpeed.value
  } catch {
    /* ignore — starsze WebView */
  }
}

watch(playbackSpeed, () => applyVideoPlaybackSpeed())

type TrackingMode =
  | 'bar_center'
  | 'shoulders'
  | 'elbows'
  | 'plates_left'
  | 'plates_right'
  | 'plates_axis'

const trackingMode = ref<TrackingMode>('bar_center')

type PlateKeyframe = {
  t: number
  left?: { x: number, y: number }
  right?: { x: number, y: number }
}

const plateKeyframes = ref<PlateKeyframe[]>([])
const plateClickMode = ref<'left' | 'right' | 'both'>('both')

const trackingModeItems = computed(() => {
  const base = [{ label: 'Środek (nadgarstki)', value: 'bar_center' as const }]
  const body = expBodyRefTracking.value
    ? [
        { label: 'Barki (środek)', value: 'shoulders' as const },
        { label: 'Łokcie (środek)', value: 'elbows' as const }
      ]
    : []
  const plates = expPlateTracking.value
    ? [
        { label: 'Talerz lewy (klik)', value: 'plates_left' as const },
        { label: 'Talerz prawy (klik)', value: 'plates_right' as const },
        { label: 'Oś sztangi (L+P klik)', value: 'plates_axis' as const }
      ]
    : []
  return [...base, ...body, ...plates]
})

watch(
  () => expPlateTracking.value,
  (on) => {
    if (!on && trackingMode.value.startsWith('plates')) {
      trackingMode.value = 'bar_center'
    }
  }
)

let detector: PoseDetector | null = null

// „Token” aktualnej analizy — rośnie przy nowym uruchomieniu lub unmount.
// Dzięki temu pętle async (seek + estimatePoses) kończą się szybko po zmianie strony.
let analysisRunId = 0

const hasClip = computed(() => !!clipUrl.value)

function pickVideo() {
  fileInputRef.value?.click()
}

function onVideoFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !file.type.startsWith('video/')) {
    toast.add({ title: 'Wybierz plik wideo', color: 'warning' })
    return
  }
  if (clipUrl.value) {
    URL.revokeObjectURL(clipUrl.value)
    clipUrl.value = null
  }
  clipUrl.value = URL.createObjectURL(file)
  feedback.value = []
  samplesCount.value = 0
  metrics.value = null
  progress.value = 0
  phaseStep.value = 0
  frameProgress.value = { current: 0, total: 0 }
  pathPlaybackRange.value = null
  isPlaybackPlaying.value = false
  stopPlaybackOverlayLoop()
  nextTick(() => {
    const v = videoRef.value
    if (!v || !clipUrl.value) {
      return
    }
    v.src = clipUrl.value
    v.load()
  })
}

function resizeCanvasToVideo() {
  const v = videoRef.value
  const c = canvasRef.value
  if (!v || !c) {
    return
  }
  const rect = v.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  c.style.width = `${rect.width}px`
  applyVideoPlaybackSpeed(v)
  c.style.height = `${rect.height}px`
  c.width = Math.round(rect.width * dpr)
  c.height = Math.round(rect.height * dpr)
  const ctx = c.getContext('2d')
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
}

function videoContentBox(v: HTMLVideoElement) {
  // Obszar „prawdziwego obrazu” wewnątrz elementu wideo (uwzględnia letterboxing/pillarboxing).
  // To jest kluczowe dla poprawnego rysowania overlay przy object-fit: contain.
  const elW = v.clientWidth
  const elH = v.clientHeight
  const vidW = v.videoWidth || 0
  const vidH = v.videoHeight || 0
  if (!elW || !elH || !vidW || !vidH) {
    return { x: 0, y: 0, w: elW, h: elH }
  }
  const elRatio = elW / elH
  const vidRatio = vidW / vidH
  if (vidRatio > elRatio) {
    // obraz szerszy → pasy góra/dół
    const w = elW
    const h = w / vidRatio
    const y = (elH - h) / 2
    return { x: 0, y, w, h }
  }
  // obraz wyższy → pasy lewo/prawo
  const h = elH
  const w = h * vidRatio
  const x = (elW - w) / 2
  return { x, y: 0, w, h }
}

function drawPath(
  samples: BarbellSample[],
  untilSec?: number,
  referenceSamples?: BarbellSample[]
) {
  const v = videoRef.value
  const c = canvasRef.value
  if (!v || !c || samples.length < 2) {
    return
  }

  const isSyncPlayback = typeof untilSec === 'number'
  const visibleRaw = isSyncPlayback
    ? samplesUntilTime(samples, untilSec)
    : samples

  resizeCanvasToVideo()
  const ctx = c.getContext('2d')
  if (!ctx) {
    return
  }
  const w = v.clientWidth
  const h = v.clientHeight
  const box = videoContentBox(v)
  ctx.clearRect(0, 0, w, h)

  if (visibleRaw.length === 0) {
    return
  }

  const estimatedFps = samples.length >= 2
    ? Math.min(120, Math.max(12, Math.round((samples.length - 1) / Math.max(0.001, samples[samples.length - 1]!.t - samples[0]!.t))))
    : 30
  const visible = visibleRaw.length >= 2
    ? smoothSamplesForFps(visibleRaw, estimatedFps)
    : visibleRaw

  let refVisible: BarbellSample[] = []
  if (referenceSamples && referenceSamples.length >= 2) {
    const refRaw = isSyncPlayback
      ? samplesUntilTime(referenceSamples, untilSec)
      : referenceSamples
    refVisible = refRaw.length >= 2 ? smoothSamplesForFps(refRaw, estimatedFps) : []
  }

  if (props.premiumOverlay) {
    drawPremiumBarbellOverlay(ctx, visible, box, {
      liftType: props.liftType,
      referenceSamples: refVisible.length >= 2 ? refVisible : undefined,
      fullSamplesForPhases: isSyncPlayback ? samples : undefined,
      showSidePanel: props.aiPanelEmbed || props.premiumOverlay,
      showLegend: true,
      lineWidth: props.aiPanelEmbed ? 7 : 6,
      playbackHead: isSyncPlayback
    })
    return
  }

  if (visible.length < 2) {
    return
  }

  ctx.strokeStyle = 'rgba(34, 197, 94, 0.45)'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 6])
  const hip = visible[Math.floor(visible.length / 2)]!
  ctx.beginPath()
  ctx.moveTo(box.x + hip.hipMidX * box.w, box.y)
  ctx.lineTo(box.x + hip.hipMidX * box.w, box.y + box.h)
  ctx.stroke()
  ctx.setLineDash([])

  if (refVisible.length >= 2) {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.75)'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 5])
    ctx.beginPath()
    for (let i = 0; i < refVisible.length; i++) {
      const pt = refVisible[i]!
      const x = box.x + pt.barX * box.w
      const y = box.y + pt.barY * box.h
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])
  }

  ctx.strokeStyle = 'rgba(250, 204, 21, 0.95)'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  if (props.aiPanelEmbed) {
    drawVelocityColoredPath(ctx, visible, box, {
      lineWidth: 7,
      shadowBlur: 14
    })
  } else {
    ctx.beginPath()
    for (let i = 0; i < visible.length; i++) {
      const pt = visible[i]!
      const x = box.x + pt.barX * box.w
      const y = box.y + pt.barY * box.h
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(251, 191, 36, 0.9)'
  const last = visible[visible.length - 1]!
  if (!props.aiPanelEmbed) {
    ctx.beginPath()
    ctx.arc(box.x + last.barX * box.w, box.y + last.barY * box.h, 6, 0, Math.PI * 2)
    ctx.fill()
  }
}

function mid(a: number, b: number) {
  return (a + b) / 2
}

function extractSample(pose: Pose, videoW: number, videoH: number): BarbellSample | null {
  const lw = pose.keypoints.find(k => k.name === 'left_wrist')
  const rw = pose.keypoints.find(k => k.name === 'right_wrist')
  const lh = pose.keypoints.find(k => k.name === 'left_hip')
  const rh = pose.keypoints.find(k => k.name === 'right_hip')
  const ls = pose.keypoints.find(k => k.name === 'left_shoulder')
  const rs = pose.keypoints.find(k => k.name === 'right_shoulder')
  const le = pose.keypoints.find(k => k.name === 'left_elbow')
  const re = pose.keypoints.find(k => k.name === 'right_elbow')
  if (!lh || !rh) {
    return null
  }

  const hipMidX = mid(lh.x, rh.x) / videoW
  const shoulderMidX = ls && rs ? mid(ls.x, rs.x) / videoW : hipMidX
  const shoulderMidY = ls && rs ? mid(ls.y, rs.y) / videoH : undefined
  const elbowMidX = le && re ? mid(le.x, re.x) / videoW : undefined
  const elbowMidY = le && re ? mid(le.y, re.y) / videoH : undefined

  const lwScore = lw?.score ?? 0
  const rwScore = rw?.score ?? 0
  const leScore = le?.score ?? 0
  const reScore = re?.score ?? 0
  const lsScore = ls?.score ?? 0
  const rsScore = rs?.score ?? 0

  let barX: number
  let barY: number
  let wristSpread: number | undefined
  let wristMidX: number | undefined
  let wristMidY: number | undefined

  const wristMinScore = 0.14
  if (lw && rw && lwScore >= wristMinScore && rwScore >= wristMinScore) {
    wristMidX = mid(lw.x, rw.x) / videoW
    wristMidY = mid(lw.y, rw.y) / videoH
    wristSpread = Math.abs(lw.x - rw.x) / videoW
    barX = wristMidX
    barY = wristMidY
  } else if (le && re && leScore >= 0.18 && reScore >= 0.18) {
    barX = mid(le.x, re.x) / videoW
    barY = mid(le.y, re.y) / videoH - 0.012
    wristSpread = Math.abs(le.x - re.x) / videoW * 1.05
    wristMidX = barX
    wristMidY = barY
  } else if (ls && rs && lsScore >= 0.2 && rsScore >= 0.2) {
    barX = mid(ls.x, rs.x) / videoW
    barY = Math.min(ls.y, rs.y) / videoH - 0.04
    wristSpread = Math.abs(ls.x - rs.x) / videoW * 0.85
    wristMidX = barX
    wristMidY = barY
  } else {
    return null
  }

  const shoulderSpread = ls && rs ? Math.abs(ls.x - rs.x) / videoW : undefined
  return {
    t: 0,
    barX: clamp01(barX),
    barY: clamp01(barY),
    hipMidX: clamp01(hipMidX),
    shoulderMidX: clamp01(shoulderMidX),
    shoulderMidY: shoulderMidY != null ? clamp01(shoulderMidY) : undefined,
    elbowMidX: elbowMidX != null ? clamp01(elbowMidX) : undefined,
    elbowMidY: elbowMidY != null ? clamp01(elbowMidY) : undefined,
    wristMidX: wristMidX != null ? clamp01(wristMidX) : undefined,
    wristMidY: wristMidY != null ? clamp01(wristMidY) : undefined,
    wristSpread: wristSpread != null ? clamp01(wristSpread) : undefined,
    shoulderSpread: shoulderSpread != null ? clamp01(shoulderSpread) : undefined
  }
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

function filterActiveLiftWindow(samples: BarbellSample[]): BarbellSample[] {
  if (samples.length < 8) return samples
  const withVel = samples.map((s, i) => {
    if (i === 0) return { i, vY: 0 }
    const prev = samples[i - 1]!
    const dt = Math.max(0.001, s.t - prev.t)
    return { i, vY: (s.barY - prev.barY) / dt }
  })
  const upThreshold = -0.02
  const downThreshold = 0.015
  const startIdx = withVel.findIndex(v => v.vY < upThreshold)
  if (startIdx <= 0) return samples
  let peakIdx = startIdx
  for (let i = startIdx; i < samples.length; i++) {
    if (samples[i]!.barY < samples[peakIdx]!.barY) peakIdx = i
  }
  let stopIdx = samples.length - 1
  for (let i = peakIdx + 1; i < withVel.length; i++) {
    if (withVel[i]!.vY > downThreshold && samples[i]!.barY >= samples[startIdx]!.barY - 0.04) {
      stopIdx = i
      break
    }
  }
  const slice = samples.slice(startIdx, stopIdx + 1)
  if (slice.length >= 10) return slice
  // Zbyt agresywne okno — zwróć szerszy fragment (np. przy kącie 3/4 i mało klatek)
  const pad = Math.max(2, Math.floor(samples.length * 0.08))
  return samples.slice(Math.max(0, startIdx - pad), Math.min(samples.length, stopIdx + pad + 1))
}

function stabilizeSamplesToHipLine(samples: BarbellSample[]): BarbellSample[] {
  if (samples.length < 2) return samples
  const baseHip = samples.reduce((acc, s) => acc + s.hipMidX, 0) / samples.length
  return samples.map(s => ({
    ...s,
    barX: clamp01((s.barX - s.hipMidX) + baseHip),
    hipMidX: clamp01(baseHip),
    shoulderMidX: clamp01((s.shoulderMidX - s.hipMidX) + baseHip),
    elbowMidX: s.elbowMidX != null ? clamp01((s.elbowMidX - s.hipMidX) + baseHip) : undefined,
    wristMidX: s.wristMidX != null ? clamp01((s.wristMidX - s.hipMidX) + baseHip) : undefined
  }))
}

function sortedPlateKeyframes() {
  return plateKeyframes.value.slice().sort((a, b) => a.t - b.t)
}

function upsertPlateKeyframe(t: number, patch: Partial<PlateKeyframe>) {
  const ts = Math.max(0, Number(t.toFixed(3)))
  const existing = plateKeyframes.value.find(k => Math.abs(k.t - ts) < 0.0005)
  if (existing) {
    if (patch.left) existing.left = patch.left
    if (patch.right) existing.right = patch.right
  } else {
    plateKeyframes.value.push({ t: ts, left: patch.left, right: patch.right })
  }
}

function interpPointAt(
  keyframes: PlateKeyframe[],
  t: number,
  side: 'left' | 'right'
): { x: number, y: number } | null {
  const kf = keyframes.filter(k => !!k[side])
  if (kf.length === 0) return null
  const exact = kf.find(k => Math.abs(k.t - t) < 0.0005)
  if (exact && exact[side]) return exact[side]!
  let prev: PlateKeyframe | null = null
  let next: PlateKeyframe | null = null
  for (let i = 0; i < kf.length; i++) {
    const k = kf[i]!
    if (k.t <= t) prev = k
    if (k.t >= t) {
      next = k
      break
    }
  }
  if (!prev && next && next[side]) return next[side]!
  if (prev && !next && prev[side]) return prev[side]!
  if (!prev || !next || !prev[side] || !next[side]) return null
  const dt = Math.max(0.001, next.t - prev.t)
  const a = (t - prev.t) / dt
  const p0 = prev[side]!
  const p1 = next[side]!
  return {
    x: clamp01(p0.x + (p1.x - p0.x) * a),
    y: clamp01(p0.y + (p1.y - p0.y) * a)
  }
}

const displaySamples = computed(() => {
  const base = analyzedSamples.value
  if (base.length < 2) return []
  const m = trackingMode.value
  if (m === 'plates_left' || m === 'plates_right' || m === 'plates_axis') {
    const keyframes = sortedPlateKeyframes()
    const out: BarbellSample[] = []
    for (const s of base) {
      const L = interpPointAt(keyframes, s.t, 'left')
      const R = interpPointAt(keyframes, s.t, 'right')
      if (m === 'plates_left' && L) {
        out.push({ ...s, barX: L.x, barY: L.y })
      } else if (m === 'plates_right' && R) {
        out.push({ ...s, barX: R.x, barY: R.y })
      } else if (m === 'plates_axis' && L && R) {
        out.push({ ...s, barX: mid(L.x, R.x), barY: mid(L.y, R.y) })
      }
    }
    return stabilizeToHips.value ? stabilizeSamplesToHipLine(out) : out
  }

  const out = base.map((s) => {
    if (m === 'shoulders') {
      const y = s.shoulderMidY ?? s.barY
      return { ...s, barX: s.shoulderMidX, barY: y }
    }
    if (m === 'elbows') {
      const x = s.elbowMidX ?? s.barX
      const y = s.elbowMidY ?? s.barY
      return { ...s, barX: x, barY: y }
    }
    // bar_center (nadgarstki) – domyślnie już w barX/barY
    return s
  })
  return stabilizeToHips.value ? stabilizeSamplesToHipLine(out) : out
})

async function prepareSyncedPlaybackPreview() {
  const v = videoRef.value
  const pts = displaySamples.value
  if (!v || pts.length < 2) return

  pathPlaybackRange.value = {
    start: pts[0]!.t,
    end: pts[pts.length - 1]!.t
  }

  try {
    v.pause()
  } catch {
    /* ignore */
  }

  const startT = Math.max(0, pathPlaybackRange.value.start - 0.04)
  try {
    v.currentTime = startT
  } catch {
    /* ignore */
  }

  await new Promise<void>((resolve) => {
    if (Math.abs(v.currentTime - startT) < 0.05) {
      resolve()
      return
    }
    const onSeeked = () => {
      v.removeEventListener('seeked', onSeeked)
      resolve()
    }
    v.addEventListener('seeked', onSeeked, { once: true })
    window.setTimeout(resolve, 400)
  })

  currentPlaybackSec.value = v.currentTime
  drawPathForDisplay(pts, v.currentTime)
  emit('playbackTime', v.currentTime)
}

async function playSyncedPlayback() {
  const v = videoRef.value
  if (!v || displaySamples.value.length < 2) return

  if (!pathPlaybackRange.value) {
    await prepareSyncedPlaybackPreview()
  }

  const range = pathPlaybackRange.value
  if (range && (v.currentTime >= range.end - 0.05 || v.currentTime < range.start - 0.1)) {
    v.currentTime = Math.max(0, range.start - 0.04)
    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        v.removeEventListener('seeked', onSeeked)
        resolve()
      }
      v.addEventListener('seeked', onSeeked, { once: true })
      window.setTimeout(resolve, 400)
    })
    drawPathForDisplay(displaySamples.value, v.currentTime)
  }

  try {
    applyVideoPlaybackSpeed(v)
    await v.play()
    isPlaybackPlaying.value = true
    startPlaybackOverlayLoop()
  } catch {
    toast.add({
      title: 'Nie udało się odtworzyć wideo',
      description: 'Kliknij play na odtwarzaczu lub sprawdź blokadę autoplay w przeglądarce.',
      color: 'warning'
    })
  }
}

function pauseSyncedPlayback() {
  const v = videoRef.value
  try {
    v?.pause()
  } catch {
    /* ignore */
  }
  isPlaybackPlaying.value = false
  stopPlaybackOverlayLoop()
}

function toggleSyncedPlayback() {
  if (isPlaybackPlaying.value) {
    pauseSyncedPlayback()
  } else {
    void playSyncedPlayback()
  }
}

let playbackOverlayRaf: number | null = null

function startPlaybackOverlayLoop() {
  stopPlaybackOverlayLoop()
  const tick = () => {
    const v = videoRef.value
    if (!v || v.paused || displaySamples.value.length < 2) {
      playbackOverlayRaf = null
      isPlaybackPlaying.value = false
      return
    }
    const t = v.currentTime
    currentPlaybackSec.value = t
    drawPathForDisplay(displaySamples.value, t)
    emit('playbackTime', t)

    const range = pathPlaybackRange.value
    if (range && t >= range.end + 0.08) {
      try {
        v.pause()
      } catch {
        /* ignore */
      }
      isPlaybackPlaying.value = false
      playbackOverlayRaf = null
      drawPathForDisplay(displaySamples.value, range.end)
      emit('playbackTime', range.end)
      return
    }

    playbackOverlayRaf = window.requestAnimationFrame(tick)
  }
  playbackOverlayRaf = window.requestAnimationFrame(tick)
}

function stopPlaybackOverlayLoop() {
  if (playbackOverlayRaf != null) {
    window.cancelAnimationFrame(playbackOverlayRaf)
    playbackOverlayRaf = null
  }
}

function syncOverlayToVideoTime() {
  const v = videoRef.value
  if (!v || displaySamples.value.length < 2) return
  const t = v.currentTime
  currentPlaybackSec.value = t
  drawPathForDisplay(displaySamples.value, t)
  emit('playbackTime', t)
}

function redrawNow() {
  const v = videoRef.value
  if (!v || displaySamples.value.length < 2) return
  syncOverlayToVideoTime()
}

function drawPathForDisplay(samples: BarbellSample[], untilSec?: number) {
  const ref = pathSource.value === 'ai' && rawAlgorithmSamples.value.length >= 2
    ? rawAlgorithmSamples.value
    : undefined
  drawPath(samples, untilSec, ref)
}

function onCanvasClick(e: MouseEvent) {
  const v = videoRef.value
  const c = canvasRef.value
  if (!v || !c) return
  const m = trackingMode.value
  if (m !== 'plates_left' && m !== 'plates_right' && m !== 'plates_axis') return

  const rect = c.getBoundingClientRect()
  const cx = e.clientX - rect.left
  const cy = e.clientY - rect.top
  const box = videoContentBox(v)
  const nx = (cx - box.x) / Math.max(1, box.w)
  const ny = (cy - box.y) / Math.max(1, box.h)
  if (nx < 0 || nx > 1 || ny < 0 || ny > 1) {
    toast.add({ title: 'Kliknij w obszar wideo', color: 'warning' })
    return
  }
  const t = v.currentTime || 0
  const pt = { x: clamp01(nx), y: clamp01(ny) }
  if (plateClickMode.value === 'left') {
    upsertPlateKeyframe(t, { left: pt })
    toast.add({ title: 'Zapisano: lewy talerz', color: 'success' })
  } else if (plateClickMode.value === 'right') {
    upsertPlateKeyframe(t, { right: pt })
    toast.add({ title: 'Zapisano: prawy talerz', color: 'success' })
  } else {
    // both: pierwszy klik ustawia lewy, drugi prawy dla tej samej klatki
    const ts = Math.max(0, Number(t.toFixed(3)))
    const existing = plateKeyframes.value.find(k => Math.abs(k.t - ts) < 0.0005)
    if (!existing || !existing.left) {
      upsertPlateKeyframe(t, { left: pt })
      toast.add({ title: 'Zapisano: lewy talerz (kliknij jeszcze raz: prawy)', color: 'info' })
    } else if (!existing.right) {
      upsertPlateKeyframe(t, { right: pt })
      toast.add({ title: 'Zapisano: prawy talerz', color: 'success' })
    } else {
      // nadpisz bliższy (heurystyka)
      const dl = Math.hypot(existing.left.x - pt.x, existing.left.y - pt.y)
      const dr = Math.hypot(existing.right.x - pt.x, existing.right.y - pt.y)
      upsertPlateKeyframe(t, dl <= dr ? { left: pt } : { right: pt })
      toast.add({ title: 'Zaktualizowano punkt talerza', color: 'success' })
    }
  }
  redrawNow()
}

/** Klatki UI — bez blokady, jeśli zdarzenie już minęło */
async function yieldToBrowser(): Promise<void> {
  await new Promise<void>(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
}

/**
 * `loadeddata` często już nastąpiło po wgraniu pliku — samo `addEventListener(..., once)`
 * wtedy nigdy nie wywoła callbacku i analiza „wisi” na np. 62 %.
 */
async function waitVideoDecoded(v: HTMLVideoElement, timeoutMs: number): Promise<void> {
  if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    return
  }
  await new Promise<void>((resolve, reject) => {
    const to = window.setTimeout(() => {
      cleanup()
      reject(new Error('Przekroczono czas oczekiwania na dekodowanie wideo. Spróbuj krótszego pliku lub innego formatu (MP4/H.264).'))
    }, timeoutMs)
    const onData = () => {
      cleanup()
      resolve()
    }
    const onErr = () => {
      cleanup()
      reject(new Error('Nie udało się wczytać pliku wideo.'))
    }
    function cleanup() {
      clearTimeout(to)
      v.removeEventListener('loadeddata', onData)
      v.removeEventListener('canplay', onData)
      v.removeEventListener('error', onErr)
    }
    v.addEventListener('loadeddata', onData, { once: true })
    v.addEventListener('canplay', onData, { once: true })
    v.addEventListener('error', onErr, { once: true })
    if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      cleanup()
      resolve()
    }
  })
}

/**
 * Seek bez zawieszenia: przy tym samym `currentTime` przeglądarka często nie wywołuje `seeked`.
 */
async function seekToTime(v: HTMLVideoElement, timeSec: number, timeoutMs: number): Promise<void> {
  const duration = v.duration
  if (!Number.isFinite(duration) || duration <= 0) {
    return
  }
  const target = Math.min(Math.max(0, timeSec), Math.max(0, duration - 1 / 30))
  if (Math.abs(v.currentTime - target) < 0.04) {
    await waitForVideoFrame(v)
    return
  }

  await new Promise<void>((resolve, reject) => {
    const to = window.setTimeout(() => {
      cleanup()
      reject(new Error('Timeout podczas przewijania klatki wideo.'))
    }, timeoutMs)
    const onSeeked = () => {
      cleanup()
      resolve()
    }
    const onErr = () => {
      cleanup()
      reject(new Error('Błąd odtwarzacza wideo przy seek.'))
    }
    function cleanup() {
      clearTimeout(to)
      v.removeEventListener('seeked', onSeeked)
      v.removeEventListener('error', onErr)
    }
    v.addEventListener('seeked', onSeeked, { once: true })
    v.addEventListener('error', onErr, { once: true })
    try {
      v.currentTime = target
    } catch (err) {
      cleanup()
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
  await waitForVideoFrame(v)
}

/** Po seeku — poczekaj na klatkę (z timeoutem; RVFC potrafi nigdy nie wrócić). */
async function waitForVideoFrame(v: HTMLVideoElement, timeoutMs = 4_000): Promise<void> {
  await yieldToBrowser()
  await new Promise<void>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      clearTimeout(to)
      resolve()
    }
    const to = window.setTimeout(finish, timeoutMs)
    if (typeof v.requestVideoFrameCallback === 'function') {
      try {
        v.requestVideoFrameCallback(() => finish())
      } catch {
        finish()
      }
      return
    }
    requestAnimationFrame(() => requestAnimationFrame(() => finish()))
  })
}

async function estimatePosesWithTimeout(
  det: PoseDetector,
  source: HTMLCanvasElement | HTMLVideoElement,
  timeoutMs = 15_000
) {
  return Promise.race([
    det.estimatePoses(source, { maxPoses: 1, flipHorizontal: false }),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('MoveNet — timeout detekcji klatki')), timeoutMs)
    })
  ])
}

/**
 * Przygotuj pierwszą klatkę — czasem `loadeddata` już minęło, a `readyState` wisi na METADATA.
 */
async function ensureVideoReadyForAnalysis(v: HTMLVideoElement, timeoutMs: number): Promise<void> {
  if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && v.videoWidth > 0) {
    return
  }
  await waitVideoDecoded(v, timeoutMs)
  if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && v.videoWidth > 0) {
    return
  }
  try {
    v.pause()
  } catch {
    /* ignore */
  }
  await seekToTime(v, 0.001, Math.min(timeoutMs, 12_000))
  if (v.videoWidth === 0) {
    throw new Error('Nie udało się zdekodować wideo (brak wymiarów klatki). Użyj MP4 (H.264).')
  }
}

const ANALYSIS_PROGRESS_START = MODEL_PROGRESS_READY

async function ensureDetector(onProgress?: (pct: number) => void) {
  phaseStep.value = 1
  detector = await loadPoseDetector(detector, onProgress, (label) => {
    busyLabel.value = label
  })
  return detector
}

async function analyzeVideo() {
  const v = videoRef.value
  if (!v || !clipUrl.value) {
    toast.add({ title: 'Najpierw wgraj nagranie', color: 'warning' })
    return
  }

  // Pozwala przerwać długą analizę jeśli użytkownik zmieni stronę lub wgra nowy plik.
  const runId = ++analysisRunId

  busy.value = true
  progress.value = 0
  phaseStep.value = 1
  frameProgress.value = { current: 0, total: 0 }
  feedback.value = []
  samplesCount.value = 0
  analyzedSamples.value = []
  rawAlgorithmSamples.value = []
  pathSource.value = 'algorithm'
  pathPlaybackRange.value = null
  isPlaybackPlaying.value = false
  stopPlaybackOverlayLoop()

  try {
    const det = await ensureDetector((pct) => {
      progress.value = pct
    })
    if (runId !== analysisRunId) return

    phaseStep.value = 2
    busyLabel.value = 'Wczytywanie i dekodowanie wideo…'
    progress.value = Math.max(progress.value, ANALYSIS_PROGRESS_START + 1)
    try {
      v.pause()
    } catch {
      /* ignore */
    }
    await ensureVideoReadyForAnalysis(v, 60_000)
    if (runId !== analysisRunId) return

    let duration = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 0
    if (duration < 0.15 && v.readyState >= HTMLMediaElement.HAVE_METADATA) {
      await yieldToBrowser()
      duration = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 0
    }

    if (duration < 0.15) {
      toast.add({
        title: 'Nie można odczytać długości nagrania',
        description: 'Spróbuj innego pliku (np. MP4 z H.264) lub otwórz wideo w innym programie i wyeksportuj ponownie.',
        color: 'warning'
      })
      return
    }

    const maxFrames = 56
    const steps = Math.min(maxFrames, Math.max(20, Math.round(duration * 12)))
    const raw: BarbellSample[] = []

    phaseStep.value = 3
    busyLabel.value = 'MoveNet — analiza klatek…'
    frameProgress.value = { current: 0, total: steps + 1 }

    const vw = v.videoWidth || 640
    const vh = v.videoHeight || 360
    const MAX_INFER_W = 448
    const inferScale = vw > MAX_INFER_W ? MAX_INFER_W / vw : 1
    const inferW = Math.max(1, Math.round(vw * inferScale))
    const inferH = Math.max(1, Math.round(vh * inferScale))

    const frameCanvas = document.createElement('canvas')
    frameCanvas.width = inferW
    frameCanvas.height = inferH
    const frameCtx = frameCanvas.getContext('2d')
    if (!frameCtx) {
      throw new Error('Canvas 2D niedostępny — odśwież stronę.')
    }

    const span = 100 - ANALYSIS_PROGRESS_START

    for (let i = 0; i <= steps; i++) {
      if (runId !== analysisRunId) return
      const targetT = (i / steps) * duration
      frameProgress.value = { current: i, total: steps + 1 }
      progress.value = ANALYSIS_PROGRESS_START + Math.round((i / Math.max(1, steps)) * span)
      busyLabel.value = `MoveNet — klatka ${i + 1}/${steps + 1}…`

      try {
        await seekToTime(v, Math.min(targetT, Math.max(0, duration - 1 / 30)), 6_000)
      } catch (seekErr) {
        console.warn('[MoveNet] seek skip', i, seekErr)
        continue
      }
      if (runId !== analysisRunId) return

      const sampleTime = Number.isFinite(v.currentTime) ? v.currentTime : targetT
      try {
        frameCtx.drawImage(v, 0, 0, inferW, inferH)
        const poses = await estimatePosesWithTimeout(det, frameCanvas, 8_000)
        const pose = poses[0]
        if (pose) {
          const s = extractSample(pose, inferW, inferH)
          if (s) {
            raw.push({ ...s, t: sampleTime })
          }
        }
      } catch (poseErr) {
        console.warn('[MoveNet] frame skip', i, poseErr)
      }

      frameProgress.value = { current: i + 1, total: steps + 1 }
      progress.value = ANALYSIS_PROGRESS_START + Math.round(((i + 1) / Math.max(1, steps + 1)) * span)
      if (i % 5 === 0) {
        await yieldToBrowser()
      }
    }

    let activeLift = filterActiveLiftWindow(raw)
    activeLift = projectToLiftPlane(activeLift)
    cameraQuality.value = assessCameraQuality(activeLift)
    if (stabilizeToHips.value) {
      activeLift = stabilizeSamplesToHipLine(activeLift)
    }
    samplesCount.value = activeLift.length
    if (activeLift.length < 8) {
      feedback.value = buildBiomechanicalFeedback([])
      drawPath([])
      toast.add({
        title: 'Mało punktów toru',
        description: 'Spróbuj kadru z profilu i wyraźnie widocznych nadgarstków.',
        color: 'warning'
      })
      return
    }

    rawAlgorithmSamples.value = activeLift.map(s => ({ ...s }))
    let finalSamples = activeLift
    pathSource.value = 'algorithm'

    if (props.aiRefinePath) {
      if (refineBlockedReason.value) {
        toast.add({
          title: 'Limit toru AI (free tier)',
          description: refineBlockedReason.value,
          color: 'warning'
        })
      } else {
      phaseStep.value = 4
      busyLabel.value = 'AI — ekstrakcja klatek i korekta toru…'
      progress.value = Math.max(progress.value, 92)
      await yieldToBrowser()
      if (runId !== analysisRunId) return

      try {
        const v = videoRef.value
        if (v) {
          try {
            v.pause()
          } catch {
            /* ignore */
          }
        }

        const provider = trackingProviderRef.value
        const useVision = provider !== 'groq_numeric'
        let frames: Awaited<ReturnType<typeof captureVideoFrames>> = []

        if (useVision) {
          const frameTimes = pickFrameTimesFromSamples(activeLift, 6)
          busyLabel.value = `AI — klatki wideo (0/${frameTimes.length})…`
          progress.value = 93

          const { captureVideoFramesWithBudget } = await import('~/utils/barbellVideoFrames')
          try {
            frames = await captureVideoFramesWithBudget(v!, frameTimes, 40_000, {
              maxWidth: 480,
              quality: 0.68,
              budgetMs: 40_000,
              onProgress: (done, total) => {
                busyLabel.value = `AI — klatki wideo (${done}/${total})…`
                progress.value = 93 + Math.round((done / Math.max(1, total)) * 4)
              }
            })
          } catch (frameErr) {
            console.warn('[Barbell AI frames]', frameErr)
            if (frames.length === 0) {
              toast.add({
                title: 'Klatki wideo pominięte',
                description: 'Korekta toru AI bez vision (tylko numeryczna).',
                color: 'warning'
              })
            }
          }
        }

        busyLabel.value = frames.length
          ? `AI — Groq Vision (${frames.length} klatek)…`
          : 'AI — Groq numeric (korekta toru)…'
        progress.value = 98
        await yieldToBrowser()
        if (runId !== analysisRunId) return

        const refined = await refinePath({
          rawSamples: activeLift,
          frames: frames.length ? frames : undefined,
          liftType: props.liftType
        })

        if (refined && refined.samples.length >= 4) {
          finalSamples = refined.samples
          pathSource.value = 'ai'
        } else if (refineError.value) {
          toast.add({
            title: 'Korekta AI niedostępna',
            description: refineError.value,
            color: 'warning'
          })
        }
      } catch (e) {
        console.warn('[Barbell AI refine]', e)
        toast.add({
          title: 'Korekta AI nie powiodła się',
          description: 'Użyto toru z detekcji MoveNet.',
          color: 'warning'
        })
      }
      }
    }

    finalSamples = clampPathSamples(finalSamples)
    analyzedSamples.value = finalSamples
    const display = clampPathSamples(
      displaySamples.value.length >= 2 ? displaySamples.value : finalSamples
    )
    await prepareSyncedPlaybackPreview()
    feedback.value = [
      ...buildBiomechanicalFeedback(display),
      ...(cameraQuality.value?.warnings ?? [])
    ]
    metrics.value = buildTechniqueMetrics(display)
    emit('analyzed', {
      samples: display,
      rawSamples: clampPathSamples(rawAlgorithmSamples.value),
      metrics: metrics.value,
      feedback: feedback.value,
      pathSource: pathSource.value,
      refineMeta: lastRefineMeta.value,
      refineNotes: refineNotesRef.value,
      cameraQuality: cameraQuality.value
    })
    toast.add({
      title: pathSource.value === 'ai' ? 'Analiza zakończona (tor AI)' : 'Analiza zakończona',
      description: 'Uruchom odtwarzanie — tor rysuje się na żywo wraz z ruchem sztangi.',
      color: 'success'
    })
  } catch (e) {
    console.error(e)
    toast.add({
      title: 'Błąd analizy',
      description: String(e),
      color: 'error'
    })
    feedback.value = [
      'Nie udało się dokończyć analizy.',
      'Typowe przyczyny: nietypowy kontener wideo, bardzo długi seek lub brak WebGL — odśwież stronę lub spróbuj krótszego nagrania MP4.'
    ]
    metrics.value = null
  } finally {
    busy.value = false
    busyLabel.value = ''
    phaseStep.value = 0
    frameProgress.value = { current: 0, total: 0 }
    progress.value = 100
  }
}

let rafTimeUpdate: number | null = null
function onVideoTimeUpdate() {
  const v = videoRef.value
  if (!v || displaySamples.value.length < 2) return
  if (isPlaybackPlaying.value) return
  if (rafTimeUpdate != null) return
  const t = v.currentTime
  rafTimeUpdate = window.requestAnimationFrame(() => {
    rafTimeUpdate = null
    syncOverlayToVideoTime()
  })
}

function onVideoSeeked() {
  if (isPlaybackPlaying.value) return
  syncOverlayToVideoTime()
}

function onVideoPlay() {
  if (displaySamples.value.length < 2) return
  if (!pathPlaybackRange.value) {
    void prepareSyncedPlaybackPreview()
  }
  applyVideoPlaybackSpeed()
  isPlaybackPlaying.value = true
  startPlaybackOverlayLoop()
}

function onVideoPause() {
  isPlaybackPlaying.value = false
  stopPlaybackOverlayLoop()
  syncOverlayToVideoTime()
}

function onVideoEnded() {
  if (displaySamples.value.length < 2) return
  isPlaybackPlaying.value = false
  stopPlaybackOverlayLoop()
  const range = pathPlaybackRange.value
  const endT = range?.end ?? displaySamples.value[displaySamples.value.length - 1]!.t
  drawPathForDisplay(displaySamples.value, endT)
  emit('playbackTime', endT)
}

onMounted(() => {
  window.addEventListener('resize', resizeCanvasToVideo)
})

onBeforeUnmount(() => {
  analysisRunId++
  stopPlaybackOverlayLoop()
  window.removeEventListener('resize', resizeCanvasToVideo)
  if (rafTimeUpdate != null) {
    window.cancelAnimationFrame(rafTimeUpdate)
    rafTimeUpdate = null
  }
  try {
    videoRef.value?.pause?.()
  } catch {
    /* ignore */
  }
  try {
    detector?.dispose?.()
  } catch {
    /* ignore */
  }
  detector = null
  if (clipUrl.value) {
    URL.revokeObjectURL(clipUrl.value)
    clipUrl.value = null
  }
})
</script>

<template>
  <div :class="panelEmbed ? 'space-y-4' : 'space-y-8'">
    <div
      :class="
        panelEmbed
          ? 'space-y-4'
          : 'overflow-hidden rounded-[1.75rem] border border-default/60 bg-card shadow-sm ring-1 ring-primary/10 sm:rounded-3xl'
      "
    >
      <div
        v-if="!panelEmbed"
        class="relative border-b border-default/50 bg-linear-to-br from-primary/11 via-card to-card px-5 py-6 sm:px-8 sm:py-8"
      >
        <div class="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/20 blur-3xl" />
        <div class="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex items-start gap-4">
            <div
              class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/18 text-primary shadow-inner ring-1 ring-primary/25"
            >
              <UIcon
                name="i-lucide-scan-line"
                class="size-6"
              />
            </div>
            <div>
              <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                TensorFlow.js · MoveNet
              </p>
              <h2 class="mt-1 text-xl font-black tracking-tight text-highlighted sm:text-2xl">
                Analiza offline w przeglądarce
              </h2>
              <p class="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                Gradient prędkości, fazy CLEAN/JERK, panel boczny toru. Plik nie jest wysyłany na serwer (poza opcjonalnym AI w Lab).
              </p>
            </div>
          </div>
          <UAlert
            color="info"
            variant="subtle"
            class="max-w-md shrink-0 rounded-2xl text-sm"
            title="Nagrywanie"
            description="Profil boczny daje najlepszy wynik; lekki kąt 3/4 też działa (korekta perspektywy). Całe podejście w kadrze."
          />
        </div>
      </div>

      <div :class="panelEmbed ? 'space-y-4' : 'space-y-6 p-5 sm:p-8'">
        <input
          ref="fileInputRef"
          type="file"
          accept="video/*"
          class="sr-only"
          @change="onVideoFile"
        >

        <div class="flex flex-wrap gap-3">
          <UButton
            icon="i-lucide-upload"
            color="primary"
            size="lg"
            class="min-h-11"
            @click="pickVideo"
          >
            Wgraj wideo
          </UButton>
          <UButton
            icon="i-lucide-sparkles"
            color="neutral"
            variant="outline"
            size="lg"
            class="min-h-11 border-default/80"
            :loading="busy"
            :disabled="!hasClip"
            @click="analyzeVideo"
          >
            Uruchom analizę
          </UButton>
          <div class="flex min-h-11 items-center rounded-2xl border border-default/60 bg-muted/10 px-4 text-sm">
            <UCheckbox v-model="stabilizeToHips" class="mr-3" />
            <span class="font-semibold text-highlighted">Stabilizuj względem bioder</span>
            <span class="ml-2 text-xs text-muted">(redukuje „drgania” kamery)</span>
          </div>
        </div>

        <div
          :class="
            panelEmbed
              ? 'flex flex-col gap-2 rounded-xl border border-default/50 bg-muted/10 p-3 sm:flex-row sm:items-end sm:justify-between'
              : 'flex flex-col gap-3 rounded-2xl border border-default/60 bg-muted/5 p-4 sm:flex-row sm:items-end sm:justify-between'
          "
        >
          <div class="min-w-0">
            <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
              Co śledzić
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <USelect
                v-model="trackingMode"
                size="sm"
                :items="trackingModeItems"
                class="min-w-56"
              />
            </div>
            <p
              v-if="trackingMode.startsWith('plates')"
              class="mt-2 text-[11px] text-muted"
            >
              Tryb talerzy: klikaj w obraz na wideo, aby dodać punkty. Między klatkami punkty są interpolowane.
            </p>
          </div>

          <div
            v-if="trackingMode.startsWith('plates')"
            class="flex flex-wrap items-center gap-2"
          >
            <UButton
              size="sm"
              variant="outline"
              color="neutral"
              :icon="plateClickMode === 'left' ? 'i-lucide-check' : 'i-lucide-circle'"
              @click="plateClickMode = 'left'"
            >
              Klik: lewy
            </UButton>
            <UButton
              size="sm"
              variant="outline"
              color="neutral"
              :icon="plateClickMode === 'right' ? 'i-lucide-check' : 'i-lucide-circle'"
              @click="plateClickMode = 'right'"
            >
              Klik: prawy
            </UButton>
            <UButton
              size="sm"
              variant="outline"
              color="neutral"
              :icon="plateClickMode === 'both' ? 'i-lucide-check' : 'i-lucide-circle'"
              @click="plateClickMode = 'both'"
            >
              Klik: oba
            </UButton>
            <UButton
              size="sm"
              variant="soft"
              color="warning"
              icon="i-lucide-trash-2"
              @click="plateKeyframes = []; toast.add({ title: 'Wyczyszczono punkty talerzy', color: 'info' }); redrawNow()"
            >
              Wyczyść
            </UButton>
          </div>
        </div>

        <!-- Kroki postępu -->
        <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-default/50 bg-muted/20 px-4 py-3">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted">Etap</span>
          <div class="flex flex-wrap gap-2">
            <UBadge
              :color="phaseStep >= 1 ? 'primary' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              1 · Model
            </UBadge>
            <UBadge
              :color="phaseStep >= 2 ? 'primary' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              2 · Wideo
            </UBadge>
            <UBadge
              :color="phaseStep >= 3 ? 'primary' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              3 · Klatki
            </UBadge>
            <UBadge
              v-if="aiPanelEmbed && aiRefinePath"
              :color="phaseStep >= 4 ? 'primary' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              4 · AI tor
            </UBadge>
          </div>
          <span
            v-if="phaseStep === 3 && frameProgress.total > 0"
            class="ml-auto font-mono text-[11px] tabular-nums text-muted"
          >
            {{ frameProgress.current }} / {{ frameProgress.total }}
          </span>
        </div>

        <div
          v-if="busy"
          class="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 sm:px-5"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <p class="text-sm font-medium text-highlighted">
              {{ busyLabel || 'Przetwarzanie…' }}
            </p>
            <span class="font-mono text-xs font-bold tabular-nums text-primary">{{ progress }}%</span>
          </div>
          <div class="h-3 overflow-hidden rounded-full bg-muted ring-1 ring-default/30">
            <div
              class="h-full rounded-full bg-linear-to-r from-primary via-primary to-success/92 transition-[width] duration-200 ease-out"
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div>

        <div
          class="relative overflow-hidden rounded-2xl border border-default/70 bg-neutral-950 shadow-inner ring-1 ring-default/40"
        >
          <div
            v-if="!hasClip"
            class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/55 px-6 text-center backdrop-blur-[2px]"
          >
            <UIcon
              name="i-lucide-clapperboard"
              class="size-10 text-white/80"
            />
            <p class="text-sm font-semibold text-white">
              Wybierz nagranie podejścia
            </p>
            <p class="max-w-xs text-xs text-white/70">
              Obsługiwane są typowe formaty wideo — najpewniejszy jest MP4 (H.264).
            </p>
          </div>
          <video
            ref="videoRef"
            class="block max-h-[min(440px,54vh)] w-full bg-black object-contain"
            playsinline
            muted
            preload="auto"
            :controls="playbackReady"
            @loadedmetadata="resizeCanvasToVideo"
            @timeupdate="onVideoTimeUpdate"
            @seeked="onVideoSeeked"
            @play="onVideoPlay"
            @pause="onVideoPause"
            @ended="onVideoEnded"
          />
          <canvas
            ref="canvasRef"
            class="absolute left-0 top-0"
            :class="trackingMode.startsWith('plates') ? 'cursor-crosshair' : 'pointer-events-none'"
            @click="onCanvasClick"
          />
        </div>

        <div
          v-if="playbackReady && !busy"
          class="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 sm:gap-4 sm:px-4"
        >
          <UButton
            size="md"
            color="primary"
            :icon="isPlaybackPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
            class="min-h-10"
            @click="toggleSyncedPlayback"
          >
            {{ isPlaybackPlaying ? 'Pauza' : 'Odtwórz tor na żywo' }}
          </UButton>
          <UButton
            size="md"
            variant="outline"
            color="neutral"
            icon="i-lucide-rotate-ccw"
            class="min-h-10"
            @click="prepareSyncedPlaybackPreview().then(() => playSyncedPlayback())"
          >
            Od początku podejścia
          </UButton>
          <div class="flex min-w-44 flex-col gap-1">
            <span class="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              Tempo
            </span>
            <USelect
              v-model="playbackSpeed"
              size="sm"
              :items="[...playbackSpeedItems]"
              class="min-w-44"
            />
          </div>
          <p class="text-xs leading-relaxed text-muted">
            Linia toru rośnie synchronicznie z wideo — gradient prędkości pojawia się w miarę ruchu sztangi.
            <span v-if="pathPlaybackRange">
              Faza: {{ pathPlaybackRange.start.toFixed(1) }}–{{ pathPlaybackRange.end.toFixed(1) }} s
            </span>
            <span v-if="playbackSpeed < 1">
              · Odtwarzanie {{ playbackSpeed.toLocaleString('pl-PL') }}× wolniej niż real-time.
            </span>
          </p>
        </div>

        <p
          v-if="samplesCount > 0 && !busy && !panelEmbed"
          class="flex items-center gap-2 text-xs text-muted"
        >
          <UIcon
            name="i-lucide-check-circle"
            class="size-4 text-primary"
          />
          Wykorzystano {{ samplesCount }} próbek z widoczną postacią (MoveNet).
        </p>
        <p
          v-if="playbackReady && !busy && !panelEmbed"
          class="text-xs text-muted"
        >
          Odtwarzanie rysuje tor na żywo — linia pojawia się wraz z ruchem sztangi (przycisk powyżej, play na wideo lub wybór tempa).
          <span v-if="aiPanelEmbed"> Gradient prędkości (czerwony = wolno, zielony = szybko). Wykres 2D synchronizuje się z odtwarzaniem.</span>
          <span v-else-if="pathSource === 'ai'"> Szary przerywany = MoveNet, żółty = tor skorygowany przez AI.</span>
        </p>
      </div>
    </div>

    <UCard
      v-if="feedback.length && !aiPanelEmbed && !panelEmbed"
      class="overflow-hidden rounded-3xl border-primary/25 bg-linear-to-br from-primary/8 via-card to-card ring-1 ring-primary/15"
    >
      <div class="space-y-4 p-5 sm:p-6">
        <div class="flex items-center gap-3">
          <span class="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <UIcon
              name="i-lucide-message-circle"
              class="size-5"
            />
          </span>
          <div>
            <p class="font-bold text-highlighted">
              Wskazówki (heurystyki)
            </p>
            <p class="text-xs text-muted">
              Ogólne podpowiedzi na podstawie toru — nie zastępują oceny trenera.
            </p>
          </div>
        </div>
        <ul class="space-y-2.5 border-t border-default/50 pt-4 text-sm leading-relaxed text-muted">
          <li
            v-for="(line, idx) in feedback"
            :key="idx"
            class="flex gap-3 rounded-xl bg-muted/25 px-3 py-2"
          >
            <span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{{ line }}</span>
          </li>
        </ul>
      </div>
    </UCard>

    <UCard
      v-if="metrics && !aiPanelEmbed && !panelEmbed"
      class="rounded-3xl border-default/60"
    >
      <div class="grid gap-3 sm:grid-cols-5">
        <div class="rounded-xl border border-default/50 p-3">
          <p class="text-xs text-muted">Śr. odchyłka</p>
          <p class="text-xl font-black text-highlighted">{{ metrics.meanDeviation }}</p>
        </div>
        <div class="rounded-xl border border-default/50 p-3">
          <p class="text-xs text-muted">Długość trajektorii</p>
          <p class="text-xl font-black text-highlighted">{{ metrics.trajectoryLength }}</p>
        </div>
        <div class="rounded-xl border border-default/50 p-3">
          <p class="text-xs text-muted">Stabilność ruchu</p>
          <p class="text-xl font-black text-primary">{{ metrics.stabilityScore }}%</p>
        </div>
        <div class="rounded-xl border border-default/50 p-3">
          <p class="text-xs text-muted">Max prędkość (|vY|)</p>
          <p class="text-xl font-black text-highlighted">{{ metrics.maxVerticalSpeed }}</p>
        </div>
        <div class="rounded-xl border border-default/50 p-3">
          <p class="text-xs text-muted">Max odchyłka X</p>
          <p class="text-xl font-black text-highlighted">{{ metrics.maxHorizontalDeviation }}</p>
        </div>
      </div>
    </UCard>
  </div>
</template>
