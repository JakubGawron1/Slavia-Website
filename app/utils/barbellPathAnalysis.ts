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
}

export interface BarbellTechniqueMetrics {
  meanDeviation: number
  trajectoryLength: number
  stabilityScore: number
  maxVerticalSpeed: number
  maxHorizontalDeviation: number
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
  const smooth = smoothSamplesForFps(samples, estimatedFps)
  const relX = smooth.map((s) => s.barX - s.hipMidX)
  const spread = Math.max(...smooth.map((s) => s.barX)) - Math.min(...smooth.map((s) => s.barX))
  const verticalTravel = Math.min(...smooth.map((s) => s.barY)) - Math.max(...smooth.map((s) => s.barY))
  const lateralStd = std(smooth.map((s) => s.barX))

  if (spread > 0.16) {
    msgs.push('Tor ruchu jest zbyt szeroki w osi poziomej — kontroluj zbliżenie sztangi po udach i prostą ścieżkę nad kolanami.')
  } else if (spread > 0.11) {
    msgs.push('Zauważalne „chodzenie” sztangi na boki — dopracuj zbliżenie i kontakt z nogami.')
  }

  if (lateralStd > 0.045) {
    msgs.push('Nieregularny tor poziomy — dużo korekt na boki; warto zwolnić tempo kontaktu i utrzymać barki nad sztangą.')
  }

  const maxForward = Math.max(...relX.map(Math.abs))
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

export function buildTechniqueMetrics(samples: BarbellSample[]): BarbellTechniqueMetrics {
  if (samples.length < 2) {
    return { meanDeviation: 0, trajectoryLength: 0, stabilityScore: 0, maxVerticalSpeed: 0, maxHorizontalDeviation: 0 }
  }
  const centerX = samples.reduce((acc, s) => acc + s.hipMidX, 0) / samples.length
  const meanDeviation = samples.reduce((acc, s) => acc + Math.abs(s.barX - centerX), 0) / samples.length
  const maxHorizontalDeviation = Math.max(...samples.map(s => Math.abs(s.barX - centerX)))
  let trajectoryLength = 0
  let maxVerticalSpeed = 0
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1]!
    const b = samples[i]!
    trajectoryLength += Math.hypot(b.barX - a.barX, b.barY - a.barY)
    const dt = Math.max(0.001, b.t - a.t)
    const vY = Math.abs((b.barY - a.barY) / dt)
    if (vY > maxVerticalSpeed) maxVerticalSpeed = vY
  }
  const stabilityScore = Math.max(0, Math.min(100, 100 - std(samples.map(s => s.barX)) * 1400))
  return {
    meanDeviation: Number(meanDeviation.toFixed(4)),
    trajectoryLength: Number(trajectoryLength.toFixed(4)),
    stabilityScore: Number(stabilityScore.toFixed(1)),
    maxVerticalSpeed: Number(maxVerticalSpeed.toFixed(4)),
    maxHorizontalDeviation: Number(maxHorizontalDeviation.toFixed(4))
  }
}
