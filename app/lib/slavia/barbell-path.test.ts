import { describe, expect, it } from 'vitest'
import vectors from './test-vectors/barbell-path.json' with { type: 'json' }
import {
  assessCameraQuality,
  buildTechniqueMetrics,
  computePathVelocities,
  detectLiftPhases,
  projectToLiftPlane,
  resamplePathSpline,
  toProfileRelativeSamples,
  samplesUntilTime,
  velocityColor,
  type BarbellSample
} from './barbellPathAnalysis'

describe('barbell path metrics', () => {
  for (const c of vectors.metricsCases) {
    it('buildTechniqueMetrics', () => {
      const m = buildTechniqueMetrics(c.samples)
      expect(m.meanDeviation).toBeGreaterThanOrEqual(c.expected.meanDeviationMin)
      expect(m.trajectoryLength).toBeGreaterThanOrEqual(c.expected.trajectoryLengthMin)
      expect(m.stabilityScore).toBeGreaterThanOrEqual(c.expected.stabilityScoreMin)
    })
  }
})

describe('barbell path velocity & phases', () => {
  it('computePathVelocities increases with faster movement', () => {
    const samples: BarbellSample[] = [
      { t: 0, barX: 0.5, barY: 0.9, hipMidX: 0.5, shoulderMidX: 0.5 },
      { t: 0.1, barX: 0.5, barY: 0.7, hipMidX: 0.5, shoulderMidX: 0.5 },
      { t: 0.2, barX: 0.5, barY: 0.4, hipMidX: 0.5, shoulderMidX: 0.5 }
    ]
    const v = computePathVelocities(samples)
    expect(v[2]!.speed).toBeGreaterThan(v[1]!.speed)
  })

  it('velocityColor maps slow to red and fast to green', () => {
    expect(velocityColor(0, 1)).toContain('239')
    expect(velocityColor(1, 1)).toContain('34')
  })

  it('detectLiftPhases splits pull & snatch for snatch lift', () => {
    const samples: BarbellSample[] = []
    for (let i = 0; i <= 18; i++) {
      const t = i * 0.05
      let barY = 0.92
      if (i <= 10) barY = 0.92 - i * 0.055
      else barY = 0.37 + (i - 10) * 0.008
      samples.push({ t, barX: 0.5 + i * 0.002, barY, hipMidX: 0.5, shoulderMidX: 0.5 })
    }
    const phases = detectLiftPhases(samples, 'snatch')
    expect(phases.segments.some(s => s.phase === 'pull')).toBe(true)
    expect(phases.segments.some(s => s.phase === 'snatch')).toBe(true)
    expect(phases.jerkMarkerY).not.toBeNull()
  })

  it('detectLiftPhases splits clean & jerk when dip is present', () => {
    const samples: BarbellSample[] = []
    for (let i = 0; i <= 20; i++) {
      const t = i * 0.05
      let barY = 0.9
      if (i <= 8) barY = 0.9 - i * 0.05
      else if (i <= 11) barY = 0.5 + (i - 8) * 0.04
      else barY = 0.62 - (i - 11) * 0.04
      samples.push({ t, barX: 0.5, barY, hipMidX: 0.5, shoulderMidX: 0.5 })
    }
    const phases = detectLiftPhases(samples, 'clean_jerk')
    expect(phases.segments.some(s => s.phase === 'clean')).toBe(true)
    expect(phases.segments.some(s => s.phase === 'jerk')).toBe(true)
  })

  it('detectLiftPhases handles large sample arrays without stack overflow', () => {
    const samples: BarbellSample[] = []
    for (let i = 0; i <= 500; i++) {
      samples.push({
        t: i * 0.02,
        barX: 0.5,
        barY: 0.9 - (i / 500) * 0.5,
        hipMidX: 0.5,
        shoulderMidX: 0.5
      })
    }
    expect(() => detectLiftPhases(samples, 'snatch')).not.toThrow()
    const phases = detectLiftPhases(samples, 'snatch')
    expect(phases.segments.length).toBeGreaterThanOrEqual(1)
  })

  it('projectToLiftPlane expands horizontal drift when wrist spread is compressed', () => {
    const samples: BarbellSample[] = [
      { t: 0, barX: 0.52, barY: 0.9, hipMidX: 0.5, shoulderMidX: 0.5, wristSpread: 0.08 },
      { t: 0.1, barX: 0.58, barY: 0.7, hipMidX: 0.5, shoulderMidX: 0.5, wristSpread: 0.05 },
      { t: 0.2, barX: 0.54, barY: 0.5, hipMidX: 0.5, shoulderMidX: 0.5, wristSpread: 0.06 },
      { t: 0.3, barX: 0.51, barY: 0.35, hipMidX: 0.5, shoulderMidX: 0.5, wristSpread: 0.07 }
    ]
    const projected = projectToLiftPlane(samples)
    const spread = Math.max(...projected.map(s => s.barX)) - Math.min(...projected.map(s => s.barX))
    const rawSpread = Math.max(...samples.map(s => s.barX)) - Math.min(...samples.map(s => s.barX))
    expect(spread).toBeGreaterThanOrEqual(rawSpread * 0.9)
  })

  it('assessCameraQuality detects oblique vs profile', () => {
    const profile: BarbellSample[] = Array.from({ length: 12 }, (_, i) => ({
      t: i * 0.05,
      barX: 0.5,
      barY: 0.9 - i * 0.04,
      hipMidX: 0.5,
      shoulderMidX: 0.5,
      wristSpread: 0.14
    }))
    const frontal: BarbellSample[] = profile.map(s => ({ ...s, wristSpread: 0.03 }))
    expect(assessCameraQuality(profile).angle).toBe('profile')
    expect(assessCameraQuality(frontal).angle).toBe('frontal')
    expect(assessCameraQuality(profile).score).toBeGreaterThan(assessCameraQuality(frontal).score)
  })

  it('resamplePathSpline produces more points than input', () => {
    const samples: BarbellSample[] = [
      { t: 0, barX: 0.5, barY: 0.9, hipMidX: 0.5, shoulderMidX: 0.5 },
      { t: 0.1, barX: 0.52, barY: 0.7, hipMidX: 0.5, shoulderMidX: 0.5 },
      { t: 0.2, barX: 0.5, barY: 0.5, hipMidX: 0.5, shoulderMidX: 0.5 },
      { t: 0.3, barX: 0.48, barY: 0.3, hipMidX: 0.5, shoulderMidX: 0.5 }
    ]
    const out = resamplePathSpline(samples, 3)
    expect(out.length).toBeGreaterThan(samples.length)
  })

  it('toProfileRelativeSamples centers hip line at 0.5', () => {
    const samples: BarbellSample[] = [
      { t: 0, barX: 0.55, barY: 0.9, hipMidX: 0.48, shoulderMidX: 0.5 },
      { t: 0.1, barX: 0.57, barY: 0.7, hipMidX: 0.49, shoulderMidX: 0.51 }
    ]
    const rel = toProfileRelativeSamples(samples)
    expect(rel[0]!.hipMidX).toBe(0.5)
    expect(rel[0]!.barX).toBeCloseTo(0.57, 2)
  })

  it('samplesUntilTime interpolates head for smooth playback', () => {
    const samples: BarbellSample[] = [
      { t: 0, barX: 0.5, barY: 0.9, hipMidX: 0.5, shoulderMidX: 0.5 },
      { t: 1, barX: 0.52, barY: 0.5, hipMidX: 0.5, shoulderMidX: 0.5 }
    ]
    const mid = samplesUntilTime(samples, 0.5)
    expect(mid.length).toBe(2)
    expect(mid[1]!.barY).toBeGreaterThan(0.5)
    expect(mid[1]!.barY).toBeLessThan(0.9)
  })
})
