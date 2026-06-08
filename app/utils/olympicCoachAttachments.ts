export interface OlympicCoachAttachmentPayload {
  kind: 'image' | 'text'
  name: string
  mime_type?: string
  data_base64?: string
  text_content?: string
}

export interface OlympicCoachAttachmentDraft {
  id: string
  kind: 'image' | 'video' | 'file'
  name: string
  mimeType: string
  previewUrl?: string
  payload: OlympicCoachAttachmentPayload[]
}

const MAX_ATTACHMENTS = 4
const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const MAX_TEXT_FILE_BYTES = 48 * 1024
const MAX_VIDEO_BYTES = 24 * 1024 * 1024
const MAX_VIDEO_FRAMES = 5
const MAX_IMAGE_DIMENSION = 1600

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.csv', '.json', '.log', '.xml', '.yaml', '.yml'])

function fileExt(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx).toLowerCase() : ''
}

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Nie udało się odczytać pliku'))
    reader.readAsDataURL(file)
  })
}

function readFileAsText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Nie udało się odczytać pliku tekstowego'))
    reader.readAsText(file)
  })
}

async function resizeImageFile(file: File): Promise<{ mimeType: string, dataBase64: string }> {
  const dataUrl = await readFileAsDataUrl(file)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Nieprawidłowy obraz'))
    img.src = dataUrl
  })

  let { width, height } = img
  const maxSide = Math.max(width, height)
  if (maxSide > MAX_IMAGE_DIMENSION) {
    const scale = MAX_IMAGE_DIMENSION / maxSide
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Brak kontekstu canvas')
  ctx.drawImage(img, 0, 0, width, height)

  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const quality = mimeType === 'image/jpeg' ? 0.85 : undefined
  const outUrl = canvas.toDataURL(mimeType, quality)
  const dataBase64 = outUrl.split(',')[1]
  if (!dataBase64) throw new Error('Błąd konwersji obrazu')
  return { mimeType, dataBase64 }
}

async function extractVideoFrames(file: File): Promise<OlympicCoachAttachmentPayload[]> {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.src = url

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('Nie można wczytać wideo'))
    })

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Brak kontekstu canvas')

    const frames: OlympicCoachAttachmentPayload[] = []
    for (let i = 0; i < MAX_VIDEO_FRAMES; i += 1) {
      const t = Math.min(duration - 0.05, (duration * (i + 0.5)) / MAX_VIDEO_FRAMES)
      video.currentTime = Math.max(0, t)
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve()
      })

      const maxW = Math.min(video.videoWidth || 1280, 1280)
      const scale = maxW / (video.videoWidth || maxW)
      canvas.width = maxW
      canvas.height = Math.round((video.videoHeight || maxW) * scale)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
      const dataBase64 = dataUrl.split(',')[1]
      if (!dataBase64) continue

      frames.push({
        kind: 'image',
        name: `${file.name} [klatka ${i + 1}/${MAX_VIDEO_FRAMES}]`,
        mime_type: 'image/jpeg',
        data_base64: dataBase64
      })
    }

    if (frames.length === 0) {
      throw new Error('Nie udało się wyciągnąć klatek z wideo')
    }
    return frames
  } finally {
    URL.revokeObjectURL(url)
    video.remove()
  }
}

export function olympicCoachAttachmentLimit(): number {
  return MAX_ATTACHMENTS
}

export async function buildOlympicCoachAttachment(
  file: File
): Promise<OlympicCoachAttachmentDraft> {
  const id = crypto.randomUUID()
  const ext = fileExt(file.name)

  if (file.type.startsWith('image/')) {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error('Obraz jest za duży (max 4 MB)')
    }
    const { mimeType, dataBase64 } = await resizeImageFile(file)
    const previewUrl = URL.createObjectURL(file)
    return {
      id,
      kind: 'image',
      name: file.name,
      mimeType,
      previewUrl,
      payload: [{
        kind: 'image',
        name: file.name,
        mime_type: mimeType,
        data_base64: dataBase64
      }]
    }
  }

  if (file.type.startsWith('video/')) {
    if (file.size > MAX_VIDEO_BYTES) {
      throw new Error('Wideo jest za duże (max 24 MB)')
    }
    const payload = await extractVideoFrames(file)
    return {
      id,
      kind: 'video',
      name: file.name,
      mimeType: file.type,
      previewUrl: URL.createObjectURL(file),
      payload
    }
  }

  const isTextMime = file.type.startsWith('text/')
    || file.type === 'application/json'
    || file.type === 'application/xml'
  if (isTextMime || TEXT_EXTENSIONS.has(ext)) {
    if (file.size > MAX_TEXT_FILE_BYTES) {
      throw new Error('Plik tekstowy jest za duży (max 48 KB)')
    }
    const text = (await readFileAsText(file)).trim()
    if (!text) throw new Error('Plik tekstowy jest pusty')
    return {
      id,
      kind: 'file',
      name: file.name,
      mimeType: file.type || 'text/plain',
      payload: [{
        kind: 'text',
        name: file.name,
        mime_type: file.type || 'text/plain',
        text_content: text.slice(0, 12_000)
      }]
    }
  }

  throw new Error('Obsługiwane: zdjęcia, wideo (klatki) oraz pliki tekstowe (.txt, .md, .csv, .json)')
}

export function releaseOlympicCoachAttachmentPreview(draft: OlympicCoachAttachmentDraft) {
  if (draft.previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(draft.previewUrl)
  }
}

export function flattenAttachmentPayload(
  drafts: OlympicCoachAttachmentDraft[]
): OlympicCoachAttachmentPayload[] {
  return drafts.flatMap(d => d.payload)
}
