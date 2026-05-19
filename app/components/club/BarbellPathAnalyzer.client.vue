<script setup lang="ts">
import type { Pose } from '@tensorflow-models/pose-detection'
import { buildBiomechanicalFeedback, buildTechniqueMetrics, smoothSamplesForFps, type BarbellSample, type BarbellTechniqueMetrics } from '~/utils/barbellPathAnalysis'

const toast = useToast()
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
const metrics = ref<BarbellTechniqueMetrics | null>(null)
const stabilizeToHips = ref(true)
const playbackReady = computed(() => analyzedSamples.value.length >= 2 && !!videoRef.value)

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

let detector: Awaited<
  ReturnType<typeof import('@tensorflow-models/pose-detection').createDetector>
> | null = null

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

function drawPath(samples: BarbellSample[], untilSec?: number) {
  const v = videoRef.value
  const c = canvasRef.value
  if (!v || !c || samples.length < 2) {
    return
  }
  const visibleRaw = typeof untilSec === 'number'
    ? samples.filter(s => s.t <= untilSec)
    : samples
  if (visibleRaw.length < 2) return

  const estimatedFps = visibleRaw.length >= 2
    ? Math.min(120, Math.max(12, Math.round((visibleRaw.length - 1) / Math.max(0.001, visibleRaw[visibleRaw.length - 1]!.t - visibleRaw[0]!.t))))
    : 30
  const visible = smoothSamplesForFps(visibleRaw, estimatedFps)

  resizeCanvasToVideo()
  const ctx = c.getContext('2d')
  if (!ctx) {
    return
  }
  const w = v.clientWidth
  const h = v.clientHeight
  const box = videoContentBox(v)
  ctx.clearRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(34, 197, 94, 0.45)'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 6])
  const hip = visible[Math.floor(visible.length / 2)]!
  ctx.beginPath()
  ctx.moveTo(box.x + hip.hipMidX * box.w, box.y)
  ctx.lineTo(box.x + hip.hipMidX * box.w, box.y + box.h)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.strokeStyle = 'rgba(250, 204, 21, 0.95)'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
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

  ctx.fillStyle = 'rgba(251, 191, 36, 0.9)'
  const last = visible[visible.length - 1]!
  ctx.beginPath()
  ctx.arc(box.x + last.barX * box.w, box.y + last.barY * box.h, 6, 0, Math.PI * 2)
  ctx.fill()
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
  if (!lw || !rw || !lh || !rh) {
    return null
  }
  if ((lw.score ?? 0) < 0.22 || (rw.score ?? 0) < 0.22) {
    return null
  }
  const wristMidX = mid(lw.x, rw.x) / videoW
  const wristMidY = mid(lw.y, rw.y) / videoH
  const barX = wristMidX
  const barY = wristMidY
  const hipMidX = mid(lh.x, rh.x) / videoW
  const shoulderMidX = ls && rs ? mid(ls.x, rs.x) / videoW : hipMidX
  const shoulderMidY = ls && rs ? mid(ls.y, rs.y) / videoH : undefined
  const elbowMidX = le && re ? mid(le.x, re.x) / videoW : undefined
  const elbowMidY = le && re ? mid(le.y, re.y) / videoH : undefined
  return {
    t: 0,
    barX: clamp01(barX),
    barY: clamp01(barY),
    hipMidX: clamp01(hipMidX),
    shoulderMidX: clamp01(shoulderMidX),
    shoulderMidY: shoulderMidY != null ? clamp01(shoulderMidY) : undefined,
    elbowMidX: elbowMidX != null ? clamp01(elbowMidX) : undefined,
    elbowMidY: elbowMidY != null ? clamp01(elbowMidY) : undefined,
    wristMidX: clamp01(wristMidX),
    wristMidY: clamp01(wristMidY)
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
  const upThreshold = -0.025
  const downThreshold = 0.018
  const startIdx = withVel.findIndex(v => v.vY < upThreshold)
  if (startIdx <= 0) return samples
  let peakIdx = startIdx
  for (let i = startIdx; i < samples.length; i++) {
    if (samples[i]!.barY < samples[peakIdx]!.barY) peakIdx = i
  }
  let stopIdx = samples.length - 1
  for (let i = peakIdx + 1; i < withVel.length; i++) {
    if (withVel[i]!.vY > downThreshold && samples[i]!.barY >= samples[startIdx]!.barY - 0.03) {
      stopIdx = i
      break
    }
  }
  return samples.slice(startIdx, stopIdx + 1)
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

function redrawNow() {
  const v = videoRef.value
  if (!v || displaySamples.value.length < 2) return
  drawPath(displaySamples.value, v.currentTime)
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
      v.removeEventListener('error', onErr)
    }
    v.addEventListener('loadeddata', onData, { once: true })
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

/** Po seeku — poczekaj na zdekodowaną klatkę (timeline + MoveNet). */
async function waitForVideoFrame(v: HTMLVideoElement): Promise<void> {
  await yieldToBrowser()
  if (typeof v.requestVideoFrameCallback === 'function') {
    await new Promise<void>((resolve) => {
      v.requestVideoFrameCallback(() => resolve())
    })
    return
  }
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

const MODEL_PROGRESS_READY = 62
const ANALYSIS_PROGRESS_START = MODEL_PROGRESS_READY

function bumpLoadProgress(onProgress: ((pct: number) => void) | undefined, pct: number) {
  onProgress?.(Math.min(100, Math.max(0, Math.round(pct))))
}

async function ensureDetector(onProgress?: (pct: number) => void) {
  if (detector) {
    bumpLoadProgress(onProgress, MODEL_PROGRESS_READY)
    return detector
  }

  phaseStep.value = 1
  busyLabel.value = 'TensorFlow.js — start…'
  bumpLoadProgress(onProgress, 4)
  const tf = await import('@tensorflow/tfjs')
  bumpLoadProgress(onProgress, 10)
  await tf.ready()
  bumpLoadProgress(onProgress, 16)
  try {
    busyLabel.value = 'TensorFlow.js — backend WebGL…'
    await tf.setBackend('webgl')
    await tf.ready()
    bumpLoadProgress(onProgress, 22)
  } catch {
    busyLabel.value = 'WebGL niedostępny — backend CPU (wolniejszy)…'
    await tf.setBackend('cpu')
    await tf.ready()
    bumpLoadProgress(onProgress, 22)
  }
  busyLabel.value = 'MoveNet — pobieranie modelu…'
  bumpLoadProgress(onProgress, 26)
  const poseDetection = await import('@tensorflow-models/pose-detection')
  bumpLoadProgress(onProgress, 30)

  let simulated = 30
  const cap = 56
  const timer = window.setInterval(() => {
    simulated += Math.max(0.35, (cap - simulated) * 0.06)
    if (simulated > cap) {
      simulated = cap
    }
    bumpLoadProgress(onProgress, simulated)
  }, 120)

  try {
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
    })
  } finally {
    window.clearInterval(timer)
  }
  bumpLoadProgress(onProgress, MODEL_PROGRESS_READY)
  busyLabel.value = 'Model MoveNet gotowy — przygotowanie wideo…'
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

  try {
    const det = await ensureDetector((pct) => {
      progress.value = pct
    })
    if (runId !== analysisRunId) return

    phaseStep.value = 2
    busyLabel.value = 'Wczytywanie i dekodowanie wideo…'
    progress.value = Math.max(progress.value, ANALYSIS_PROGRESS_START)
    await waitVideoDecoded(v, 60_000)
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

    const maxFrames = 96
    const steps = Math.min(maxFrames, Math.max(18, Math.round(duration * 20)))
    const raw: BarbellSample[] = []

    phaseStep.value = 3
    busyLabel.value = 'MoveNet — analiza klatek…'
    frameProgress.value = { current: 0, total: steps + 1 }

    const vw = v.videoWidth || 640
    const vh = v.videoHeight || 360

    const span = 100 - ANALYSIS_PROGRESS_START

    for (let i = 0; i <= steps; i++) {
      if (runId !== analysisRunId) return
      const targetT = (i / steps) * duration
      await seekToTime(v, Math.min(targetT, Math.max(0, duration - 1 / 30)), 15_000)
      if (runId !== analysisRunId) return

      const sampleTime = Number.isFinite(v.currentTime) ? v.currentTime : targetT
      const poses = await det.estimatePoses(v, { maxPoses: 1, flipHorizontal: false })
      const pose = poses[0]
      if (pose) {
        const s = extractSample(pose, vw, vh)
        if (s) {
          raw.push({ ...s, t: sampleTime })
        }
      }
      frameProgress.value = { current: i + 1, total: steps + 1 }
      progress.value = ANALYSIS_PROGRESS_START + Math.round((i / steps) * span)
      if (i % 4 === 0) {
        await yieldToBrowser()
      }
    }

    let activeLift = filterActiveLiftWindow(raw)
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

    analyzedSamples.value = activeLift
    drawPath(displaySamples.value.length ? displaySamples.value : activeLift)
    feedback.value = buildBiomechanicalFeedback(displaySamples.value.length ? displaySamples.value : activeLift)
    metrics.value = buildTechniqueMetrics(displaySamples.value.length ? displaySamples.value : activeLift)
    toast.add({ title: 'Analiza zakończona', color: 'success' })
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
  // timeupdate potrafi strzelać bardzo często — rysujemy max 1× per frame, żeby nie zatykać UI/routera.
  if (rafTimeUpdate != null) return
  const t = v.currentTime
  rafTimeUpdate = window.requestAnimationFrame(() => {
    rafTimeUpdate = null
    drawPath(displaySamples.value, t)
  })
}

function onVideoEnded() {
  if (displaySamples.value.length < 2) return
  drawPath(displaySamples.value)
}

onMounted(() => {
  window.addEventListener('resize', resizeCanvasToVideo)
})

onBeforeUnmount(() => {
  analysisRunId++
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
  <div class="space-y-8">
    <!-- Karta główna narzędzia -->
    <div
      class="overflow-hidden rounded-[1.75rem] border border-default/60 bg-card shadow-sm ring-1 ring-primary/10 sm:rounded-3xl"
    >
      <div
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
                Wybierz „Co śledzić” (nadgarstki / barki / łokcie / talerze). Plik nie jest wysyłany na serwer.
              </p>
            </div>
          </div>
          <UAlert
            color="info"
            variant="subtle"
            class="max-w-md shrink-0 rounded-2xl text-sm"
            title="Nagrywanie"
            description="Profil od boku, całe podejście w kadrze. Pierwsze uruchomienie pobiera model — potem jest szybciej."
          />
        </div>
      </div>

      <div class="space-y-6 p-5 sm:p-8">
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

        <div class="flex flex-col gap-3 rounded-2xl border border-default/60 bg-muted/5 p-4 sm:flex-row sm:items-end sm:justify-between">
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
            @loadedmetadata="resizeCanvasToVideo"
            @timeupdate="onVideoTimeUpdate"
            @ended="onVideoEnded"
          />
          <canvas
            ref="canvasRef"
            class="absolute left-0 top-0"
            :class="trackingMode.startsWith('plates') ? 'cursor-crosshair' : 'pointer-events-none'"
            @click="onCanvasClick"
          />
        </div>

        <p
          v-if="samplesCount > 0 && !busy"
          class="flex items-center gap-2 text-xs text-muted"
        >
          <UIcon
            name="i-lucide-check-circle"
            class="size-4 text-primary"
          />
          Wykorzystano {{ samplesCount }} próbek z widoczną postacią (MoveNet).
        </p>
        <p
          v-if="playbackReady && !busy"
          class="text-xs text-muted"
        >
          Odtwarzanie rysuje trajektorię w czasie rzeczywistym tylko dla fazy aktywnego podnoszenia (bez odkładania).
        </p>
      </div>
    </div>

    <UCard
      v-if="feedback.length"
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
      v-if="metrics"
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
