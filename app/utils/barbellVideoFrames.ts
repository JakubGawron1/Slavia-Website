/**
 * Ekstrakcja klatek JPEG z elementu wideo (do analizy vision AI toru sztangi).
 */

export interface BarbellVideoFrame {
  t: number
  jpegBase64: string
}

async function waitForVideoFrame(v: HTMLVideoElement): Promise<void> {
  if (typeof v.requestVideoFrameCallback === 'function') {
    await new Promise<void>(resolve => {
      v.requestVideoFrameCallback(() => resolve())
    })
    return
  }
  await new Promise<void>(r => requestAnimationFrame(() => r()))
}

export async function seekVideoToTime(
  v: HTMLVideoElement,
  timeSec: number,
  timeoutMs = 15_000
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
    v.currentTime = target
  })
  await waitForVideoFrame(v)
}

/** Równomierny wybór timestampów z próbek toru (max N klatek). */
export function pickFrameTimesFromSamples(samples: { t: number }[], max = 10): number[] {
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
  options?: { maxWidth?: number; quality?: number }
): Promise<BarbellVideoFrame[]> {
  const maxWidth = options?.maxWidth ?? 640
  const quality = options?.quality ?? 0.72
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
  for (const t of times) {
    await seekVideoToTime(video, t)
    ctx.drawImage(video, 0, 0, cw, ch)
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    const jpegBase64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '')
    frames.push({ t, jpegBase64 })
  }
  return frames
}
