import {
  computePathVelocities,
  detectLiftPhases,
  maxPathSpeed,
  resamplePathSpline,
  smoothSamplesForFps,
  velocityColor,
  type BarbellSample,
  type LiftPhaseAnalysis
} from '~/utils/barbellPathAnalysis'

export interface VideoContentBox {
  x: number
  y: number
  w: number
  h: number
}

export function toScreen(
  sample: BarbellSample,
  box: VideoContentBox
): { x: number, y: number } {
  return {
    x: box.x + sample.barX * box.w,
    y: box.y + sample.barY * box.h
  }
}

function prepareDrawSamples(samples: BarbellSample[]): BarbellSample[] {
  if (samples.length < 2) return samples
  const visible = samples.length > 150 ? samples.slice(0, 150) : samples
  const duration = visible[visible.length - 1]!.t - visible[0]!.t
  const fps = duration > 0.001
    ? Math.min(120, Math.max(12, Math.round((visible.length - 1) / duration)))
    : 30
  const smooth = smoothSamplesForFps(visible, fps)
  return resamplePathSpline(smooth, 2)
}

/** Tor z gradientem prędkości (segment po segmencie) + delikatny glow. */
export function drawVelocityColoredPath(
  ctx: CanvasRenderingContext2D,
  samples: BarbellSample[],
  box: VideoContentBox,
  options?: {
    lineWidth?: number
    shadowBlur?: number
    maxSpeed?: number
  }
) {
  const smooth = prepareDrawSamples(samples)
  if (smooth.length < 2) return

  const velocities = computePathVelocities(smooth)
  const maxSpeed = options?.maxSpeed ?? maxPathSpeed(smooth)
  const lineWidth = options?.lineWidth ?? 6
  const shadowBlur = options?.shadowBlur ?? 12

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowBlur = shadowBlur
  ctx.shadowColor = 'rgba(0,0,0,0.45)'

  for (let i = 1; i < smooth.length; i++) {
    const a = smooth[i - 1]!
    const b = smooth[i]!
    const vel = velocities[i] ?? velocities[i - 1]!
    const p0 = toScreen(a, box)
    const p1 = toScreen(b, box)
    ctx.strokeStyle = velocityColor(vel.speed, maxSpeed)
    ctx.lineWidth = lineWidth
    ctx.shadowColor = ctx.strokeStyle
    ctx.beginPath()
    ctx.moveTo(p0.x, p0.y)
    ctx.lineTo(p1.x, p1.y)
    ctx.stroke()
  }

  ctx.restore()

  const last = smooth[smooth.length - 1]!
  const lp = toScreen(last, box)
  const lastSpeed = velocities[velocities.length - 1]?.speed ?? 0
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.beginPath()
  ctx.arc(lp.x, lp.y, lineWidth * 0.55, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = velocityColor(lastSpeed, maxSpeed)
  ctx.lineWidth = 2
  ctx.stroke()
}

function drawVerticalReference(
  ctx: CanvasRenderingContext2D,
  hipX: number,
  box: VideoContentBox
) {
  const x = box.x + hipX * box.w
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([7, 5])
  ctx.beginPath()
  ctx.moveTo(x, box.y)
  ctx.lineTo(x, box.y + box.h)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

function drawPhaseLines(
  ctx: CanvasRenderingContext2D,
  phaseAnalysis: LiftPhaseAnalysis,
  box: VideoContentBox,
  liftType: 'snatch' | 'clean_jerk' | 'unknown'
) {
  const labels: Array<{ y: number, text: string, color: string }> = []
  const isSnatch = liftType === 'snatch'
    || phaseAnalysis.segments.some(s => s.phase === 'snatch')

  if (isSnatch) {
    if (phaseAnalysis.cleanMarkerY != null) {
      labels.push({ y: phaseAnalysis.cleanMarkerY, text: 'PULL', color: 'rgb(239,68,68)' })
    }
    if (phaseAnalysis.jerkMarkerY != null) {
      labels.push({ y: phaseAnalysis.jerkMarkerY, text: 'SNATCH', color: 'rgb(34,197,94)' })
    }
  } else {
    if (phaseAnalysis.cleanMarkerY != null) {
      labels.push({ y: phaseAnalysis.cleanMarkerY, text: 'CLEAN', color: 'rgb(239,68,68)' })
    }
    if (phaseAnalysis.jerkMarkerY != null && phaseAnalysis.segments.some(s => s.phase === 'jerk')) {
      labels.push({ y: phaseAnalysis.jerkMarkerY, text: 'JERK', color: 'rgb(250,204,21)' })
    }
  }

  ctx.save()
  ctx.font = '700 11px system-ui, sans-serif'
  ctx.textBaseline = 'bottom'

  for (const lbl of labels) {
    const y = box.y + lbl.y * box.h
    ctx.strokeStyle = lbl.color
    ctx.globalAlpha = 0.65
    ctx.lineWidth = 1
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    ctx.moveTo(box.x, y)
    ctx.lineTo(box.x + box.w, y)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.globalAlpha = 0.92
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.fillText(lbl.text, box.x + 8, y - 4)
    ctx.fillStyle = lbl.color
    ctx.beginPath()
    ctx.arc(box.x + box.w * 0.72, y, 5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** Panel boczny — izolowany tor 2D (styl Torokhtiy) po prawej stronie kadru. */
function drawSidePathPanel(
  ctx: CanvasRenderingContext2D,
  samples: BarbellSample[],
  box: VideoContentBox,
  liftType: 'snatch' | 'clean_jerk' | 'unknown'
) {
  const smooth = prepareDrawSamples(samples)
  if (smooth.length < 4) return

  const panelW = box.w * 0.28
  const panelH = box.h * 0.72
  const panelX = box.x + box.w - panelW - 10
  const panelY = box.y + box.h * 0.12

  const relXs = smooth.map(s => s.barX - s.hipMidX)
  const relMin = Math.min(...relXs)
  const relMax = Math.max(...relXs)
  const padX = Math.max(0.04, (relMax - relMin) * 0.15)
  const xLo = relMin - padX
  const xHi = relMax + padX
  const yLo = Math.min(...smooth.map(s => s.barY))
  const yHi = Math.max(...smooth.map(s => s.barY))
  const yPad = Math.max(0.02, (yHi - yLo) * 0.08)

  const mapPt = (s: BarbellSample) => {
    const rx = (s.barX - s.hipMidX - xLo) / Math.max(0.001, xHi - xLo)
    const ry = (s.barY - yLo + yPad) / Math.max(0.001, yHi - yLo + yPad * 2)
    return {
      x: panelX + rx * panelW,
      y: panelY + ry * panelH
    }
  }

  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.52)'
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(panelX - 6, panelY - 6, panelW + 12, panelH + 12, 10)
  ctx.fill()
  ctx.stroke()

  const centerX = panelX + panelW * ((0 - xLo) / Math.max(0.001, xHi - xLo))
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(centerX, panelY)
  ctx.lineTo(centerX, panelY + panelH)
  ctx.stroke()
  ctx.setLineDash([])

  const velocities = computePathVelocities(smooth)
  const maxSpeed = maxPathSpeed(smooth)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowBlur = 8

  for (let i = 1; i < smooth.length; i++) {
    const p0 = mapPt(smooth[i - 1]!)
    const p1 = mapPt(smooth[i]!)
    const speed = velocities[i]?.speed ?? 0
    ctx.strokeStyle = velocityColor(speed, maxSpeed)
    ctx.shadowColor = ctx.strokeStyle
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(p0.x, p0.y)
    ctx.lineTo(p1.x, p1.y)
    ctx.stroke()
  }

  const phaseAnalysis = detectLiftPhases(smooth, liftType)
  for (const lbl of [
    { y: phaseAnalysis.cleanMarkerY, color: 'rgb(239,68,68)' },
    { y: phaseAnalysis.jerkMarkerY, color: 'rgb(250,204,21)' }
  ]) {
    if (lbl.y == null) continue
    const ry = (lbl.y - yLo + yPad) / Math.max(0.001, yHi - yLo + yPad * 2)
    const y = panelY + ry * panelH
    ctx.strokeStyle = lbl.color
    ctx.globalAlpha = 0.5
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(panelX, y)
    ctx.lineTo(panelX + panelW, y)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }

  ctx.restore()
}

function drawVelocityLegend(ctx: CanvasRenderingContext2D, box: VideoContentBox) {
  const w = 118
  const h = 10
  const x = box.x + 10
  const y = box.y + box.h - 22
  const grad = ctx.createLinearGradient(x, y, x + w, y)
  grad.addColorStop(0, velocityColor(0, 1))
  grad.addColorStop(0.5, velocityColor(0.5, 1))
  grad.addColorStop(1, velocityColor(1, 1))
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.beginPath()
  ctx.roundRect(x - 6, y - 16, w + 12, 28, 6)
  ctx.fill()
  ctx.fillStyle = grad
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '600 9px system-ui'
  ctx.fillText('wolno', x, y - 4)
  ctx.fillText('szybko', x + w - 32, y - 4)
  ctx.restore()
}

function drawPlaybackHead(
  ctx: CanvasRenderingContext2D,
  sample: BarbellSample,
  box: VideoContentBox,
  lineWidth = 7
) {
  const p = toScreen(sample, box)
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.strokeStyle = 'rgb(250,204,21)'
  ctx.lineWidth = 2.5
  ctx.shadowBlur = 10
  ctx.shadowColor = 'rgba(250,204,21,0.55)'
  ctx.beginPath()
  ctx.arc(p.x, p.y, lineWidth * 0.55, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

/** Pełny overlay premium: tor na sztance + linie faz + panel boczny + legenda. */
export function drawPremiumBarbellOverlay(
  ctx: CanvasRenderingContext2D,
  samples: BarbellSample[],
  box: VideoContentBox,
  options?: {
    liftType?: 'snatch' | 'clean_jerk' | 'unknown'
    referenceSamples?: BarbellSample[]
    /** Pełny tor — linie faz przy odtwarzaniu częściowego toru. */
    fullSamplesForPhases?: BarbellSample[]
    showSidePanel?: boolean
    showLegend?: boolean
    lineWidth?: number
    /** Marker bieżącej pozycji sztangi (odtwarzanie). */
    playbackHead?: boolean
  }
) {
  if (samples.length === 0) return

  const liftType = options?.liftType ?? 'unknown'
  const phaseSource = options?.fullSamplesForPhases && options.fullSamplesForPhases.length >= 2
    ? options.fullSamplesForPhases
    : samples

  const hipSample = samples[Math.floor(samples.length / 2)] ?? samples[0]!
  drawVerticalReference(ctx, hipSample.hipMidX, box)

  if (options?.referenceSamples && options.referenceSamples.length >= 2) {
    ctx.save()
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 5])
    const refSmooth = prepareDrawSamples(options.referenceSamples)
    ctx.beginPath()
    for (let i = 0; i < refSmooth.length; i++) {
      const p = toScreen(refSmooth[i]!, box)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  if (phaseSource.length >= 6) {
    const phaseAnalysis = detectLiftPhases(
      prepareDrawSamples(phaseSource),
      liftType
    )
    drawPhaseLines(ctx, phaseAnalysis, box, liftType)
  }

  const lineWidth = options?.lineWidth ?? 7
  if (samples.length >= 2) {
    drawVelocityColoredPath(ctx, samples, box, {
      lineWidth,
      shadowBlur: 16
    })
  }

  if (options?.showSidePanel !== false && samples.length >= 2) {
    drawSidePathPanel(ctx, samples, box, liftType)
  }
  if (options?.showLegend !== false) {
    drawVelocityLegend(ctx, box)
  }
  if (options?.playbackHead !== false && samples.length >= 1) {
    drawPlaybackHead(ctx, samples[samples.length - 1]!, box, lineWidth)
  }
}
