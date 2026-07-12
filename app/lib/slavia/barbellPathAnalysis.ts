/** Punkt toru (współrzędne znormalizowane 0–1 względem klatki wideo). */
export interface BarbellSample {
  t: number
  barX: number
  barY: number
  hipMidX: number
  shoulderMidX: number
  /** Dodatkowe punkty z detekcji (znormalizowane 0–1) do innych trybów śledzenia. */
  shoulderMidY?: number
  elbowMidX?: number
  elbowMidY?: number
  wristMidX?: number
  wristMidY?: number
  /** Szerokość nadgarstków w kadrze (0–1) — proxy głębi / kąta kamery. */
  wristSpread?: number
  /** Szerokość barków w kadrze (0–1). */
  shoulderSpread?: number
}

export type CameraAngleKind = 'profile' | 'oblique' | 'frontal' | 'unknown'

export interface CameraQualityAssessment {
  score: number
  angle: CameraAngleKind
  warnings: string[]
  medianWristSpread: number
  hipDrift: number
}

export interface BarbellTechniqueMetrics {
  meanDeviation: number
  trajectoryLength: number
  stabilityScore: number
  maxVerticalSpeed: number
  maxHorizontalDeviation: number
}

export type LiftPhaseKind = 'clean' | 'jerk' | 'snatch' | 'pull' | 'unknown'

export interface LiftPhaseSegment {
  phase: LiftPhaseKind
  label: string
  startIdx: number
  endIdx: number
}

export interface PathVelocitySample extends BarbellSample {
  vX: number
  vY: number
  speed: number
}

export interface LiftPhaseAnalysis {
  segments: LiftPhaseSegment[]
  /** Indeks punktu podziału clean → jerk (podrzut). */
  splitIdx: number | null
  /** Y w układzie 0–1 dla etykiety CLEAN (start). */
  cleanMarkerY: number | null
  /** Y w układzie 0–1 dla etykiety JERK (przed finiszem). */
  jerkMarkerY: number | null
}

export const MAX_PATH_SAMPLES = 150

function safeMax(values: number[], fallback = 0): number {
  if (values.length === 0) return fallback
  let m = values[0]!
  for (let i = 1; i < values.length; i++) {
    const v = values[i]!
    if (v > m) m = v
  }
  return m
}

function safeMin(values: number[], fallback = 0): number {
  if (values.length === 0) return fallback
  let m = values[0]!
  for (let i = 1; i < values.length; i++) {
    const v = values[i]!
    if (v < m) m = v
  }
  return m
}

export function clampPathSamples(samples: BarbellSample[]): BarbellSample[] {
  if (samples.length <= MAX_PATH_SAMPLES) return samples
  const step = samples.length / MAX_PATH_SAMPLES
  const out: BarbellSample[] = []
  for (let i = 0; i < MAX_PATH_SAMPLES; i++) {
    out.push(samples[Math.min(samples.length - 1, Math.floor(i * step))]!)
  }
  return out
}

function indexOfMax(values: number[]): number {
  if (values.length === 0) return 0
  let idx = 0
  let m = values[0]!
  for (let i = 1; i < values.length; i++) {
    if (values[i]! > m) {
      m = values[i]!
      idx = i
    }
  }
  return idx
}

function indexOfMin(values: number[]): number {
  if (values.length === 0) return 0
  let idx = 0
  let m = values[0]!
  for (let i = 1; i < values.length; i++) {
    if (values[i]! < m) {
      m = values[i]!
      idx = i
    }
  }
  return idx
}

export function smoothSamples(samples: BarbellSample[], window = 3): BarbellSample[] {
  if (samples.length < window) {
    return samples
  }
  const half = Math.floor(window / 2)
  const out: BarbellSample[] = []
  for (let i = 0; i < samples.length; i++) {
    const from = Math.max(0, i - half)
    const to = Math.min(samples.length - 1, i + half)
    let sx = 0
    let sy = 0
    let hx = 0
    let sh = 0
    let c = 0
    for (let j = from; j <= to; j++) {
      const p = samples[j]!
      sx += p.barX
      sy += p.barY
      hx += p.hipMidX
      sh += p.shoulderMidX
      c++
    }
    const cur = samples[i]!
    out.push({
      t: cur.t,
      barX: sx / c,
      barY: sy / c,
      hipMidX: hx / c,
      shoulderMidX: sh / c
    })
  }
  return out
}

export function smoothSamplesForFps(samples: BarbellSample[], fps = 30): BarbellSample[] {
  const normalized = Number.isFinite(fps) ? Math.max(12, Math.min(120, Math.round(fps))) : 30
  const window = normalized <= 24 ? 3 : normalized <= 50 ? 5 : 7
  return smoothSamples(samples, window)
}

function std(nums: number[]): number {
  if (nums.length < 2) {
    return 0
  }
  const m = nums.reduce((a, b) => a + b, 0) / nums.length
  const v = nums.reduce((s, x) => s + (x - m) ** 2, 0) / nums.length
  return Math.sqrt(v)
}

/**
 * Heurystyki pod kątem dwuboju (rwanie / podrzut) przy nagraniu z profilu.
 * Bazuje na środku nadgarstków jako przybliżeniu pozycji sztangi vs linia bioder.
 */
export function buildBiomechanicalFeedback(samples: BarbellSample[]): string[] {
  const msgs: string[] = []
  if (samples.length < 10) {
    msgs.push(
      'Za mało stabilnych klatek z widoczną sztangą. Użyj nagrania z profilu, dobrego światła i uploadu krótszego klipu (kilka–kilkanaście sekund podejścia).'
    )
    return msgs
  }

  const estimatedFps = samples.length >= 2
    ? Math.min(120, Math.max(12, Math.round((samples.length - 1) / Math.max(0.001, samples[samples.length - 1]!.t - samples[0]!.t))))
    : 30
  const smooth = smoothSamplesForFps(clampPathSamples(samples), estimatedFps)
  const relX = smooth.map((s) => s.barX - s.hipMidX)
  const barXs = smooth.map((s) => s.barX)
  const barYs = smooth.map((s) => s.barY)
  const spread = safeMax(barXs) - safeMin(barXs)
  const verticalTravel = safeMin(barYs) - safeMax(barYs)
  const lateralStd = std(smooth.map((s) => s.barX))

  if (spread > 0.16) {
    msgs.push('Tor ruchu jest zbyt szeroki w osi poziomej — kontroluj zbliżenie sztangi po udach i prostą ścieżkę nad kolanami.')
  } else if (spread > 0.11) {
    msgs.push('Zauważalne „chodzenie” sztangi na boki — dopracuj zbliżenie i kontakt z nogami.')
  }

  if (lateralStd > 0.045) {
    msgs.push('Nieregularny tor poziomy — dużo korekt na boki; warto zwolnić tempo kontaktu i utrzymać barki nad sztangą.')
  }

  const maxForward = safeMax(relX.map(Math.abs))
  const forwardBias = relX.reduce((a, b) => a + b, 0) / relX.length

  if (maxForward > 0.085 || forwardBias > 0.035) {
    msgs.push('Sztanga ucieka od ciała / za bardzo na przód — myśl o „ściąganiu” po nogach i wiecznym kontakcie z udami.')
  } else if (maxForward > 0.055) {
    msgs.push('Lekkie wychylenie sztangi od pionu bioder — sprawdź start barków nad gryfem i drugi pociąg.')
  }

  let directionChanges = 0
  for (let i = 2; i < relX.length; i++) {
    const x0 = relX[i - 2]
    const x1 = relX[i - 1]
    const x2 = relX[i]
    if (x0 === undefined || x1 === undefined || x2 === undefined) {
      continue
    }
    const a = x1 - x0
    const b = x2 - x1
    if (a * b < 0 && Math.abs(b) > 0.012) {
      directionChanges++
    }
  }
  if (directionChanges >= 5) {
    msgs.push('Tor jest „poszarpany” — wiele zmian kierunku w fazie pociągu; uprość ruch (jedna linia nad stopą środkową).')
  }

  if (verticalTravel < 0.06) {
    msgs.push('Słabo widoczny ruch pionowy na nagraniu — ustaw kamerę tak, by widać było całe podejście od podłogi nad głowę.')
  }

  if (msgs.length === 0) {
    msgs.push(
      'Tor wygląda relatywnie zbliżony i kontrolowany — kontynuuj pracę nad stałym kontaktem z nogami i stabilnym „slotem” nad głową.'
    )
  }

  return msgs
}

/** Prędkość punktów toru (piksel/s w układzie znormalizowanym). */
export function computePathVelocities(samples: BarbellSample[]): PathVelocitySample[] {
  if (samples.length === 0) return []
  const out: PathVelocitySample[] = []
  for (let i = 0; i < samples.length; i++) {
    const cur = samples[i]!
    if (i === 0) {
      out.push({ ...cur, vX: 0, vY: 0, speed: 0 })
      continue
    }
    const prev = samples[i - 1]!
    const dt = Math.max(0.001, cur.t - prev.t)
    const vX = (cur.barX - prev.barX) / dt
    const vY = (cur.barY - prev.barY) / dt
    out.push({ ...cur, vX, vY, speed: Math.hypot(vX, vY) })
  }
  return out
}

function localMinIndices(values: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < values.length - 1; i++) {
    const v = values[i]!
    if (v <= values[i - 1]! && v <= values[i + 1]!) out.push(i)
  }
  return out
}

function localMaxIndices(values: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < values.length - 1; i++) {
    const v = values[i]!
    if (v >= values[i - 1]! && v >= values[i + 1]!) out.push(i)
  }
  return out
}

function buildSnatchPhaseResult(
  smooth: BarbellSample[],
  window: BarbellSample[],
  windowYs: number[],
  lo: number,
  hi: number
): LiftPhaseAnalysis {
  const velocities = computePathVelocities(window)
  const searchEnd = Math.max(2, Math.floor(window.length * 0.88))

  let apexRel = 0
  let minY = windowYs[0]!
  for (let i = 1; i <= searchEnd; i++) {
    if (windowYs[i]! < minY) {
      minY = windowYs[i]!
      apexRel = i
    }
  }

  let peakVelRel = 1
  let maxUpSpeed = 0
  for (let i = 1; i < window.length - 1; i++) {
    const vy = velocities[i]?.vY ?? 0
    const upSpeed = -vy
    if (upSpeed > maxUpSpeed && i <= apexRel + 2) {
      maxUpSpeed = upSpeed
      peakVelRel = i
    }
  }

  const splitRel = Math.min(
    Math.max(Math.max(apexRel, peakVelRel), 2),
    window.length - 3
  )
  const pullEndIdx = lo + splitRel
  const snatchStartIdx = pullEndIdx

  return {
    segments: [
      {
        phase: 'pull',
        label: 'PULL',
        startIdx: lo,
        endIdx: pullEndIdx
      },
      {
        phase: 'snatch',
        label: 'SNATCH',
        startIdx: snatchStartIdx,
        endIdx: hi
      }
    ],
    splitIdx: snatchStartIdx,
    cleanMarkerY: smooth[lo]!.barY,
    jerkMarkerY: smooth[snatchStartIdx]?.barY ?? smooth[pullEndIdx]!.barY
  }
}

/**
 * Wykrywa fazy ruchu (clean / jerk dla podrzutu, pull / snatch dla rwania).
 * barY rośnie w dół — niższe barY = wyższa pozycja sztangi.
 */
export function detectLiftPhases(
  samples: BarbellSample[],
  liftType: 'snatch' | 'clean_jerk' | 'unknown' = 'unknown'
): LiftPhaseAnalysis {
  const empty: LiftPhaseAnalysis = {
    segments: [],
    splitIdx: null,
    cleanMarkerY: null,
    jerkMarkerY: null
  }
  if (samples.length < 6) return empty

  const capped = clampPathSamples(samples)
  const estimatedFps = capped.length >= 2
    ? Math.min(120, Math.max(12, Math.round((capped.length - 1) / Math.max(0.001, capped[capped.length - 1]!.t - capped[0]!.t))))
    : 30
  const smooth = smoothSamplesForFps(capped, estimatedFps)
  const ys = smooth.map(s => s.barY)

  const floorIdx = indexOfMax(ys)
  const overheadIdx = indexOfMin(ys)
  if (floorIdx === overheadIdx) return empty

  const lo = Math.min(floorIdx, overheadIdx)
  const hi = Math.max(floorIdx, overheadIdx)
  const window = smooth.slice(lo, hi + 1)
  const windowYs = window.map(s => s.barY)
  const floorY = windowYs[0]!
  const overheadY = windowYs[windowYs.length - 1]!

  const midY = (floorY + overheadY) / 2
  const rangeY = Math.max(0.01, floorY - overheadY)
  const mins = localMinIndices(windowYs)
  const maxs = localMaxIndices(windowYs)

  let catchRel = mins.find(i => windowYs[i]! < midY && i > 2 && i < window.length - 4)
  if (catchRel == null && mins.length) {
    catchRel = mins.reduce((best, i) =>
      windowYs[i]! < windowYs[best]! ? i : best, mins[0]!)
  }
  if (catchRel == null) {
    catchRel = Math.floor(window.length * 0.55)
  }

  const afterCatchYs = windowYs.slice(catchRel)
  const dipAmount = safeMax(afterCatchYs) - windowYs[catchRel]!
  const hasDip = dipAmount > rangeY * 0.05

  if (liftType === 'snatch') {
    return buildSnatchPhaseResult(smooth, window, windowYs, lo, hi)
  }

  const isCleanJerk = liftType === 'clean_jerk'
    || (liftType === 'unknown' && hasDip && window.length >= 10)

  if (!isCleanJerk) {
    if (window.length >= 10) {
      return buildSnatchPhaseResult(smooth, window, windowYs, lo, hi)
    }
    return {
      segments: [{
        phase: 'pull',
        label: 'PULL',
        startIdx: lo,
        endIdx: hi
      }],
      splitIdx: null,
      cleanMarkerY: smooth[lo]!.barY,
      jerkMarkerY: null
    }
  }

  let dipRel = maxs.find(i => i > catchRel && i < window.length - 2)
  if (dipRel == null) {
    const afterCatch = windowYs.slice(catchRel)
    const sliceLen = Math.max(1, Math.floor(afterCatch.length * 0.35))
    const localMax = safeMax(afterCatch.slice(0, sliceLen), windowYs[catchRel]!)
    dipRel = catchRel + afterCatch.indexOf(localMax)
  }

  const splitRel = Math.min(Math.max(catchRel + 1, dipRel), window.length - 2)
  const splitIdx = lo + splitRel
  const cleanEndIdx = lo + catchRel
  const jerkStartIdx = splitIdx

  return {
    segments: [
      {
        phase: 'clean',
        label: 'CLEAN',
        startIdx: lo,
        endIdx: cleanEndIdx
      },
      {
        phase: 'jerk',
        label: 'JERK',
        startIdx: jerkStartIdx,
        endIdx: hi
      }
    ],
    splitIdx,
    cleanMarkerY: smooth[lo]!.barY,
    jerkMarkerY: smooth[jerkStartIdx]?.barY ?? smooth[cleanEndIdx]!.barY
  }
}

/** Maks. prędkość toru — bez spread (bezpieczne dla dużych tablic). */
export function maxPathSpeed(samples: BarbellSample[]): number {
  return safeMax(computePathVelocities(samples).map(v => v.speed), 0.001)
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = values.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!
}

function bodyScaleFromSample(s: BarbellSample): number | null {
  if (s.wristSpread != null && s.wristSpread > 0.03) return s.wristSpread
  const shoulderOffset = Math.abs(s.shoulderMidX - s.hipMidX) * 2.2
  if (shoulderOffset > 0.04) return shoulderOffset
  return null
}

/**
 * Korekta poziomego toru przy kącie 3/4 — skaluje odchyłkę X względem szerokości ciała w kadrze.
 */
export function projectToLiftPlane(samples: BarbellSample[]): BarbellSample[] {
  if (samples.length < 4) return samples

  const scales = samples
    .map(bodyScaleFromSample)
    .filter((v): v is number => v != null && v > 0.035)

  if (scales.length < 4) return samples

  const refScale = median(scales.slice(0, Math.max(3, Math.ceil(scales.length * 0.22)))) || median(scales)
  const safeRef = Math.max(0.06, refScale)

  return samples.map((s) => {
    const scale = bodyScaleFromSample(s) ?? safeRef
    const relX = s.barX - s.hipMidX
    const correctedRelX = relX * (safeRef / Math.max(0.045, scale))
    return {
      ...s,
      barX: Math.min(1, Math.max(0, s.hipMidX + correctedRelX)),
      hipMidX: s.hipMidX,
      shoulderMidX: Math.min(1, Math.max(0, s.hipMidX + (s.shoulderMidX - s.hipMidX) * (safeRef / Math.max(0.045, scale))))
    }
  })
}

/** Ocena kadru — profil vs 3/4 vs frontal + dryf kamery. */
export function assessCameraQuality(samples: BarbellSample[]): CameraQualityAssessment {
  const empty: CameraQualityAssessment = {
    score: 0,
    angle: 'unknown',
    warnings: ['Za mało danych do oceny kąta kamery.'],
    medianWristSpread: 0,
    hipDrift: 0
  }
  if (samples.length < 6) return empty

  const spreads = samples
    .map(s => s.wristSpread ?? bodyScaleFromSample(s))
    .filter((v): v is number => v != null && v > 0.02)
  const hipXs = samples.map(s => s.hipMidX)
  const hipDrift = safeMax(hipXs) - safeMin(hipXs)
  const medianWristSpread = spreads.length ? median(spreads) : 0

  let angle: CameraAngleKind = 'unknown'
  if (medianWristSpread >= 0.11) angle = 'profile'
  else if (medianWristSpread >= 0.055) angle = 'oblique'
  else if (medianWristSpread > 0) angle = 'frontal'

  const warnings: string[] = []
  let score = 92

  if (angle === 'frontal') {
    score -= 45
    warnings.push('Kadrowanie zbyt z frontu — tor poziomy będzie mało wiarygodny. Najlepiej profil od boku.')
  } else if (angle === 'oblique') {
    score -= 22
    warnings.push('Kąt 3/4 — zastosowano korektę perspektywy; dla idealnej precyzji użyj profilu bocznego.')
  } else if (angle === 'profile') {
    warnings.push('Kadrowanie zbliżone do profilu — dobry wybór dla analizy toru.')
  }

  if (hipDrift > 0.07) {
    score -= 18
    warnings.push('Kamera wyraźnie się przesuwa — włącz stabilizację względem bioder lub ustaw statyw.')
  } else if (hipDrift > 0.045) {
    score -= 8
    warnings.push('Lekki ruch kamery — stabilizacja bioder zmniejszy szum toru.')
  }

  const verticalTravel = safeMin(samples.map(s => s.barY)) - safeMax(samples.map(s => s.barY))
  if (verticalTravel < 0.08) {
    score -= 12
    warnings.push('Mało ruchu pionowego w kadrze — upewnij się, że widać całe podejście od podłogi.')
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    angle,
    warnings,
    medianWristSpread: Number(medianWristSpread.toFixed(4)),
    hipDrift: Number(hipDrift.toFixed(4))
  }
}

function catmullRom1D(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t
  const t3 = t2 * t
  return 0.5 * (
    (2 * p1)
    + (-p0 + p2) * t
    + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
    + (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  )
}

/** Gładka interpolacja Catmull-Rom — mniej „poszarpania” niż surowe punkty MoveNet. */
export function resamplePathSpline(samples: BarbellSample[], segmentsPerSpan = 3): BarbellSample[] {
  if (samples.length < 4) return samples
  if (segmentsPerSpan <= 1) return samples

  const out: BarbellSample[] = []
  for (let i = 0; i < samples.length - 1; i++) {
    const p0 = samples[Math.max(0, i - 1)]!
    const p1 = samples[i]!
    const p2 = samples[i + 1]!
    const p3 = samples[Math.min(samples.length - 1, i + 2)]!
    const steps = i === samples.length - 2 ? segmentsPerSpan : segmentsPerSpan
    for (let j = 0; j < steps; j++) {
      const t = j / steps
      out.push({
        t: catmullRom1D(p0.t, p1.t, p2.t, p3.t, t),
        barX: Math.min(1, Math.max(0, catmullRom1D(p0.barX, p1.barX, p2.barX, p3.barX, t))),
        barY: Math.min(1, Math.max(0, catmullRom1D(p0.barY, p1.barY, p2.barY, p3.barY, t))),
        hipMidX: catmullRom1D(p0.hipMidX, p1.hipMidX, p2.hipMidX, p3.hipMidX, t),
        shoulderMidX: catmullRom1D(p0.shoulderMidX, p1.shoulderMidX, p2.shoulderMidX, p3.shoulderMidX, t),
        shoulderMidY: p1.shoulderMidY,
        elbowMidX: p1.elbowMidX,
        elbowMidY: p1.elbowMidY,
        wristMidX: p1.wristMidX,
        wristMidY: p1.wristMidY,
        wristSpread: p1.wristSpread,
        shoulderSpread: p1.shoulderSpread
      })
    }
  }
  out.push({ ...samples[samples.length - 1]! })
  return clampPathSamples(out)
}

/** Punkty toru względem linii bioder (oś pionowa = 0) — lepszy wykres 2D przy skosie kamery. */
export function toProfileRelativeSamples(samples: BarbellSample[]): BarbellSample[] {
  return samples.map((s) => {
    const hip = s.hipMidX
    return {
      ...s,
      barX: s.barX - hip + 0.5,
      hipMidX: 0.5,
      shoulderMidX: s.shoulderMidX - hip + 0.5
    }
  })
}

/** Punkty toru do chwili `t` (+ interpolacja głowy dla płynnego odtwarzania). */
export function samplesUntilTime(samples: BarbellSample[], t: number): BarbellSample[] {
  if (samples.length === 0) return []
  if (t < samples[0]!.t) return []

  const out: BarbellSample[] = []
  for (const s of samples) {
    if (s.t <= t + 0.0005) out.push(s)
    else break
  }
  if (out.length === 0) return out

  const prev = out[out.length - 1]!
  if (prev.t >= t - 0.0005) return out

  const next = samples.find(s => s.t > prev.t)
  if (!next) return out

  const dt = next.t - prev.t
  if (dt <= 0.0001) return out

  const u = Math.min(1, Math.max(0, (t - prev.t) / dt))
  const lerp = (a: number, b: number) => a + (b - a) * u
  out.push({
    t,
    barX: lerp(prev.barX, next.barX),
    barY: lerp(prev.barY, next.barY),
    hipMidX: lerp(prev.hipMidX, next.hipMidX),
    shoulderMidX: lerp(prev.shoulderMidX, next.shoulderMidX),
    shoulderMidY: prev.shoulderMidY,
    elbowMidX: prev.elbowMidX,
    elbowMidY: prev.elbowMidY,
    wristMidX: prev.wristMidX,
    wristMidY: prev.wristMidY,
    wristSpread: prev.wristSpread,
    shoulderSpread: prev.shoulderSpread
  })
  return out
}

/** Kolor toru wg prędkości: czerwony (wolno) → żółty → zielony (szybko), jak w analizatorach WL. */
export function velocityColor(speed: number, maxSpeed: number): string {
  if (maxSpeed <= 0.0001) return 'rgb(239, 68, 68)'
  const t = Math.min(1, Math.max(0, speed / maxSpeed))
  if (t < 0.5) {
    const u = t / 0.5
    const r = Math.round(239 + (250 - 239) * u)
    const g = Math.round(68 + (204 - 68) * u)
    const b = Math.round(68 + (21 - 68) * u)
    return `rgb(${r}, ${g}, ${b})`
  }
  const u = (t - 0.5) / 0.5
  const r = Math.round(250 + (34 - 250) * u)
  const g = Math.round(204 + (197 - 204) * u)
  const b = Math.round(21 + (94 - 21) * u)
  return `rgb(${r}, ${g}, ${b})`
}

export function buildTechniqueMetrics(samples: BarbellSample[]): BarbellTechniqueMetrics {
  const capped = clampPathSamples(samples)
  if (capped.length < 2) {
    return { meanDeviation: 0, trajectoryLength: 0, stabilityScore: 0, maxVerticalSpeed: 0, maxHorizontalDeviation: 0 }
  }
  const centerX = capped.reduce((acc, s) => acc + s.hipMidX, 0) / capped.length
  const meanDeviation = capped.reduce((acc, s) => acc + Math.abs(s.barX - centerX), 0) / capped.length
  const maxHorizontalDeviation = safeMax(capped.map(s => Math.abs(s.barX - centerX)))
  let trajectoryLength = 0
  let maxVerticalSpeed = 0
  for (let i = 1; i < capped.length; i++) {
    const a = capped[i - 1]!
    const b = capped[i]!
    trajectoryLength += Math.hypot(b.barX - a.barX, b.barY - a.barY)
    const dt = Math.max(0.001, b.t - a.t)
    const vY = Math.abs((b.barY - a.barY) / dt)
    if (vY > maxVerticalSpeed) maxVerticalSpeed = vY
  }
  const stabilityScore = Math.max(0, Math.min(100, 100 - std(capped.map(s => s.barX)) * 1400))
  return {
    meanDeviation: Number(meanDeviation.toFixed(4)),
    trajectoryLength: Number(trajectoryLength.toFixed(4)),
    stabilityScore: Number(stabilityScore.toFixed(1)),
    maxVerticalSpeed: Number(maxVerticalSpeed.toFixed(4)),
    maxHorizontalDeviation: Number(maxHorizontalDeviation.toFixed(4))
  }
}
