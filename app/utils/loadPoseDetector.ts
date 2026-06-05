/**
 * Lazy load TensorFlow.js + MoveNet — osobny chunk (~kilka MB przy pierwszym użyciu).
 */
const MODEL_PROGRESS_READY = 62

export type PoseDetector = Awaited<
  ReturnType<typeof import('@tensorflow-models/pose-detection').createDetector>
>

function bumpLoadProgress(onProgress: ((pct: number) => void) | undefined, pct: number) {
  onProgress?.(Math.min(100, Math.max(0, Math.round(pct))))
}

export async function loadPoseDetector(
  existing: PoseDetector | null,
  onProgress?: (pct: number) => void,
  onLabel?: (label: string) => void
): Promise<PoseDetector> {
  if (existing) {
    bumpLoadProgress(onProgress, MODEL_PROGRESS_READY)
    return existing
  }

  onLabel?.('TensorFlow.js — start…')
  bumpLoadProgress(onProgress, 4)
  const tf = await import('@tensorflow/tfjs')
  bumpLoadProgress(onProgress, 10)
  await tf.ready()
  bumpLoadProgress(onProgress, 16)
  try {
    onLabel?.('TensorFlow.js — backend WebGL…')
    await tf.setBackend('webgl')
    await tf.ready()
    bumpLoadProgress(onProgress, 22)
  } catch {
    onLabel?.('WebGL niedostępny — backend CPU (wolniejszy)…')
    await tf.setBackend('cpu')
    await tf.ready()
    bumpLoadProgress(onProgress, 22)
  }
  onLabel?.('MoveNet — pobieranie modelu (~5 MB przy pierwszym użyciu)…')
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
    const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
    })
    bumpLoadProgress(onProgress, MODEL_PROGRESS_READY)
    onLabel?.('Model MoveNet gotowy — przygotowanie wideo…')
    return detector
  } finally {
    window.clearInterval(timer)
  }
}

export { MODEL_PROGRESS_READY }
