/**
 * Ekstrakcja klatek JPEG z elementu wideo (do analizy vision AI toru sztangi).
 */

export interface BarbellVideoFrame {
  t: number
  jpegBase64: string
}

export interface CaptureVideoFramesOptions {
  maxWidth?: number
  quality?: number
  seekTimeoutMs?: number
  frameTimeoutMs?: number
  /** Po tym czasie (ms od startu) przerywa kolejne klatki. */
  budgetMs?: number
  onProgress?: (done: number, total: number) => void
}

async function waitForVideoFrame(v: HTMLVideoElement, timeoutMs = 4_000): Promise<void> {
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

export async function seekVideoToTime(
  v: HTMLVideoElement,
  timeSec: number,
  timeoutMs = 12_000
): Promise<void> {
  const duration = v.duration
  if (!Number.isFinite(duration) || duration <= 0) return
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

/** Równomierny wybór timestampów z próbek toru (max N klatek). */
export function pickFrameTimesFromSamples(samples: { t: number }[], max = 6): number[] {
  if (samples.length === 0) return []
  if (samples.length <= max) return samples.map(s => s.t)
  const out: number[] = []
  for (let i = 0; i < max; i++) {
    const idx = Math.round((i / (max - 1)) * (samples.length - 1))
    out.push(samples[idx]!.t)
  }
  return out
}

export async function captureVideoFrames(
  video: HTMLVideoElement,
  times: number[],
  options?: CaptureVideoFramesOptions
): Promise<BarbellVideoFrame[]> {
  if (times.length === 0) return []

  const maxWidth = options?.maxWidth ?? 480
  const quality = options?.quality ?? 0.68
  const seekTimeoutMs = options?.seekTimeoutMs ?? 8_000
  const frameTimeoutMs = options?.frameTimeoutMs ?? 3_000
  const onProgress = options?.onProgress
  const startedAt = Date.now()
  const budgetMs = options?.budgetMs ?? 40_000

  try {
    video.pause()
  } catch {
    /* ignore */
  }

  const vw = video.videoWidth || 640
  const vh = video.videoHeight || 360
  const scale = vw > maxWidth ? maxWidth / vw : 1
  const cw = Math.round(vw * scale)
  const ch = Math.round(vh * scale)

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) return []

  const frames: BarbellVideoFrame[] = []
  let done = 0

  for (const t of times) {
    if (Date.now() - startedAt > budgetMs) {
      console.warn('[barbellVideoFrames] budget exceeded, stopping at', done, 'frames')
      break
    }
    try {
      await seekVideoToTime(video, t, seekTimeoutMs)
      await waitForVideoFrame(video, frameTimeoutMs)
      ctx.drawImage(video, 0, 0, cw, ch)
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      const jpegBase64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '')
      if (jpegBase64.length > 0) {
        frames.push({ t, jpegBase64 })
      }
    } catch (err) {
      console.warn('[barbellVideoFrames] skip frame at', t, err)
    }
    done++
    onProgress?.(done, times.length)
    await new Promise<void>(r => requestAnimationFrame(() => r()))
  }

  return frames
}

/** @deprecated Użyj captureVideoFrames z opcją budgetMs */
export async function captureVideoFramesWithBudget(
  video: HTMLVideoElement,
  times: number[],
  budgetMs: number,
  options?: CaptureVideoFramesOptions
): Promise<BarbellVideoFrame[]> {
  const frames = await captureVideoFrames(video, times, { ...options, budgetMs })
  if (frames.length === 0 && times.length > 0) {
    throw new Error(`Timeout ekstrakcji klatek (${Math.round(budgetMs / 1000)}s).`)
  }
  return frames
}
