<script setup lang="ts">
/**
 * BARBELL LAB — TESTY ALGORYTMÓW ŚLEDZENIA
 * Dostępne tylko dla superadmina.
 */
definePageMeta({ middleware: 'superadmin' })

useSeoMeta({
  title: 'Barbell Lab — Testy śledzenia',
  robots: 'noindex, nofollow'
})

const toast = useToast()

// Metody analizy
type AnalysisMethod = 'mediapipe_direct' | 'tfjs_blazepose' | 'opencv_custom'
const selectedMethod = ref<AnalysisMethod>('tfjs_blazepose')

const methods = [
  { label: 'MediaPipe (Direct)', value: 'mediapipe_direct' as const, icon: 'i-lucide-zap' },
  { label: 'TF.js (BlazePose)', value: 'tfjs_blazepose' as const, icon: 'i-lucide-activity' },
  { label: 'OpenCV (Custom)', value: 'opencv_custom' as const, icon: 'i-lucide-circle' }
]

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const clipUrl = ref<string | null>(null)

const isProcessing = ref(false)
const results = ref<Record<string, unknown>[]>([])

const stats = reactive({
  fps: 0,
  latency: 0,
  confidence: 0,
  framesProcessed: 0
})

function onFileChange(e: Event) {
  if (!import.meta.client) return
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  if (clipUrl.value) URL.revokeObjectURL(clipUrl.value)
  clipUrl.value = URL.createObjectURL(file)
  
  nextTick(() => {
    if (videoRef.value) {
      videoRef.value.src = clipUrl.value!
      videoRef.value.load()
    }
  })
}

// --- ŁADOWANIE BIBLIOTEK ---

const isMpLoaded = ref(false)
const isCvLoaded = ref(false)

function loadExternalLibs() {
  if (!import.meta.client) return

  if (selectedMethod.value === 'mediapipe_direct' && !isMpLoaded.value) {
    const s1 = document.createElement('script')
    s1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
    s1.async = true
    document.head.appendChild(s1)
    
    const s2 = document.createElement('script')
    s2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'
    s2.async = true
    document.head.appendChild(s2)
    
    isMpLoaded.value = true
  }
  
  if (selectedMethod.value === 'opencv_custom' && !isCvLoaded.value) {
    const script = document.createElement('script')
    script.src = 'https://docs.opencv.org/4.10.0/opencv.js'
    script.async = true
    script.onload = () => { isCvLoaded.value = true }
    document.head.appendChild(script)
  }
}

watch(selectedMethod, () => {
  loadExternalLibs()
})

onMounted(() => {
  loadExternalLibs()
})

// --- IMPLEMENTACJE SILNIKÓW ---

async function analyzeWithTfjs() {
  const tf = await import('@tensorflow/tfjs')
  const poseDetection = await import('@tensorflow-models/pose-detection')
  
  await tf.ready()
  const detector = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {
    runtime: 'tfjs',
    modelType: 'full'
  })

  await processVideo(async (video) => {
    const start = performance.now()
    const poses = await detector.estimatePoses(video, { maxPoses: 1, flipHorizontal: false })
    stats.latency = Math.round(performance.now() - start)
    
    if (poses[0]) {
      const kp = poses[0].keypoints
      const lw = kp.find(k => k.name === 'left_wrist')
      const rw = kp.find(k => k.name === 'right_wrist')
      if (lw && rw) {
        stats.confidence = Math.round(((lw.score || 0) + (rw.score || 0)) / 2 * 100)
        return { x: (lw.x + rw.x) / 2, y: (lw.y + rw.y) / 2 }
      }
    }
    return null
  })
  
  detector.dispose()
}

interface MpResults {
  poseLandmarks?: Array<{ x: number, y: number, z: number, visibility?: number }>
}

async function analyzeWithMediaPipe() {
  // @ts-expect-error: MediaPipe library is not typed
  if (typeof window.Pose === 'undefined') {
    toast.add({ title: 'Oczekiwanie na MediaPipe...', color: 'info' })
    await new Promise(r => setTimeout(r, 2500))
  }

  // @ts-expect-error: MediaPipe library is not typed
  if (typeof window.Pose === 'undefined') {
    throw new Error('Nie udało się załadować biblioteki MediaPipe Pose.')
  }

  // @ts-expect-error: MediaPipe library is not typed
  const mpPose = new window.Pose({
    locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  })

  mpPose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  })

  let currentPoint: { x: number, y: number } | null = null

  mpPose.onResults((results: MpResults) => {
    if (results.poseLandmarks) {
      const lw = results.poseLandmarks[15]
      const rw = results.poseLandmarks[16]
      const v = videoRef.value
      if (lw && rw && v) {
        currentPoint = {
          x: (lw.x + rw.x) / 2 * v.videoWidth,
          y: (lw.y + rw.y) / 2 * v.videoHeight
        }
      } else {
        currentPoint = null
      }
    } else {
      currentPoint = null
    }
  })

  await processVideo(async (video) => {
    const start = performance.now()
    await mpPose.send({ image: video })
    stats.latency = Math.round(performance.now() - start)
    return currentPoint
  })
}

async function analyzeWithOpenCV() {
  // @ts-expect-error: OpenCV library is not typed
  if (typeof cv === 'undefined' || !cv.Mat) {
    toast.add({ title: 'Oczekiwanie na OpenCV...', color: 'info' })
    await new Promise(r => setTimeout(r, 2000))
  }
  // @ts-expect-error: OpenCV library is not typed
  if (typeof cv === 'undefined' || !cv.Mat) {
    throw new Error('Nie udało się załadować biblioteki OpenCV.js.')
  }

  // @ts-expect-error: OpenCV library is not typed
  const cvInst = cv
  const cap = new cvInst.VideoCapture(videoRef.value!)
  const frame = new cvInst.Mat(videoRef.value!.videoHeight, videoRef.value!.videoWidth, cvInst.CV_8UC4)
  const gray = new cvInst.Mat()
  
  await processVideo(async (_video) => {
    const start = performance.now()
    cap.read(frame)
    cvInst.cvtColor(frame, gray, cvInst.COLOR_RGBA2GRAY)
    const result = cvInst.minMaxLoc(gray)
    stats.latency = Math.round(performance.now() - start)
    return { x: result.maxLoc.x, y: result.maxLoc.y }
  })

  frame.delete()
  gray.delete()
}

async function processVideo(stepFn: (video: HTMLVideoElement) => Promise<{x: number, y: number} | null>) {
  if (!videoRef.value || !canvasRef.value) return
  const v = videoRef.value
  const c = canvasRef.value
  const ctx = c.getContext('2d')!
  
  // Upewnij się, że wideo jest załadowane
  if (v.readyState < 2) {
    await new Promise(r => v.onloadedmetadata = r)
  }

  c.width = v.videoWidth
  c.height = v.videoHeight
  
  v.currentTime = 0
  const path: {x: number, y: number}[] = []
  stats.framesProcessed = 0
  
  // Funkcja pomocnicza do czekania na klatkę
  const waitForFrame = () => new Promise(r => {
    const onSeeked = () => {
      v.removeEventListener('seeked', onSeeked)
      r(null)
    }
    v.addEventListener('seeked', onSeeked)
  })

  while (v.currentTime < v.duration && isProcessing.value) {
    await waitForFrame()
    
    const point = await stepFn(v)
    if (point) {
      console.log(`[Lab] Found point:`, point)
      path.push(point)
      drawResults(ctx, point, path)
    }
    
    v.currentTime += (1 / 30)
    stats.framesProcessed++
    
    // Pozwól UI odetchnąć i zrenderować canvas
    await new Promise(r => setTimeout(r, 0))
    
    if (v.currentTime >= v.duration) break
  }
}

async function runAnalysis() {
  if (!videoRef.value) return
  isProcessing.value = true
  results.value = []
  stats.framesProcessed = 0
  toast.add({ title: 'Benchmark start...', color: 'info' })
  
  try {
    if (selectedMethod.value === 'tfjs_blazepose') {
      await analyzeWithTfjs()
    } else if (selectedMethod.value === 'mediapipe_direct') {
      await analyzeWithMediaPipe()
    } else {
      await analyzeWithOpenCV()
    }
    results.value = [{ method: selectedMethod.value, ...stats }]
    toast.add({ title: 'Benchmark zakończony', color: 'success' })
  } catch (err) {
    console.error('[Lab Error]', err)
    toast.add({ title: 'Błąd', description: String(err), color: 'error' })
  } finally {
    isProcessing.value = false
  }
}

function drawResults(ctx: CanvasRenderingContext2D, current: {x: number, y: number}, path: {x: number, y: number}[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  
  if (path.length > 1) {
    // Rysuj cień/poświatę dla lepszej widoczności
    ctx.shadowBlur = 10
    ctx.shadowColor = 'rgba(34, 197, 94, 0.5)'
    
    ctx.beginPath()
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.moveTo(path[0]!.x, path[0]!.y)
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i]!.x, path[i]!.y)
    }
    ctx.stroke()
    
    // Reset cienia
    ctx.shadowBlur = 0
  }
  
  // Rysuj aktualny punkt (sztangę/nadgarstki)
  ctx.beginPath()
  ctx.fillStyle = '#fbbf24'
  ctx.arc(current.x, current.y, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 3
  ctx.stroke()
}
</script>

<template>
  <PanelPageLayout>
    <ClientOnly>
      <PanelPageHeader
        area="superadmin"
        tone="superadmin"
        eyebrow="Superadmin Experimental Lab"
        title="Barbell Tracker Benchmark"
        icon="i-lucide-beaker"
        description="Porównanie wydajności i dokładności silników śledzenia toru sztangi — wybór biblioteki dla produkcyjnego analizatora."
      />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside class="space-y-6">
          <UCard>
            <template #header><h3 class="font-bold">Konfiguracja testu</h3></template>
            <div class="space-y-4">
              <UFormField label="Wybierz silnik">
                <USelect v-model="selectedMethod" :items="methods" class="w-full" />
              </UFormField>
              <div class="pt-2">
                <UButton block icon="i-lucide-upload" variant="outline" @click="fileInputRef?.click()">Wgraj wideo</UButton>
                <input ref="fileInputRef" type="file" class="hidden" accept="video/*" @change="onFileChange" >
              </div>
              <UButton block color="primary" :loading="isProcessing" :disabled="!clipUrl" @click="runAnalysis">Uruchom benchmark</UButton>
            </div>
          </UCard>
          <UCard v-if="isProcessing" class="bg-primary/5 border-primary/20">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-primary" />
              <span class="text-sm font-medium">Analizowanie klatek...</span>
            </div>
          </UCard>
        </aside>

        <div class="lg:col-span-2 space-y-6">
          <div class="relative aspect-video bg-black rounded-2xl overflow-hidden border border-default shadow-2xl">
            <video ref="videoRef" class="w-full h-full object-contain" playsinline muted />
            <canvas ref="canvasRef" class="absolute inset-0 w-full h-full pointer-events-none" />
            <div v-if="!clipUrl" class="absolute inset-0 flex flex-col items-center justify-center text-muted">
              <UIcon name="i-lucide-video" class="size-12 opacity-20 mb-4" />
              <p class="text-sm">Brak wgranego materiału</p>
            </div>
          </div>
          <UCard>
            <template #header><h3 class="font-bold">Wyniki i metryki</h3></template>
            <div class="text-sm text-muted">
              <p v-if="results.length === 0">Uruchom analizę, aby zobaczyć porównanie.</p>
              <div v-else class="space-y-6">
                <div v-for="res in results" :key="res.method" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="p-3 rounded-xl bg-muted/20 border border-default">
                    <p class="text-[10px] uppercase font-bold text-muted mb-1">Silnik</p>
                    <p class="font-black text-highlighted">{{ res.method }}</p>
                  </div>
                  <div class="p-3 rounded-xl bg-muted/20 border border-default">
                    <p class="text-[10px] uppercase font-bold text-muted mb-1">Śr. Latencja</p>
                    <p class="font-black text-primary">{{ res.latency }} ms</p>
                  </div>
                  <div class="p-3 rounded-xl bg-muted/20 border border-default">
                    <p class="text-[10px] uppercase font-bold text-muted mb-1">Pewność</p>
                    <p class="font-black text-amber-500">{{ res.confidence }}%</p>
                  </div>
                  <div class="p-3 rounded-xl bg-muted/20 border border-default">
                    <p class="text-[10px] uppercase font-bold text-muted mb-1">Klatki</p>
                    <p class="font-black text-highlighted">{{ res.framesProcessed }}</p>
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </ClientOnly>
  </PanelPageLayout>
</template>
