import { describe, expect, it } from 'vitest'
import vectors from './test-vectors/barbell-path.json' with { type: 'json' }
import { buildTechniqueMetrics } from './barbellPathAnalysis'

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
