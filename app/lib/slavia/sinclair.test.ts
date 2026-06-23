import { describe, expect, it } from 'vitest'
import vectors from './test-vectors/sinclair.json' with { type: 'json' }
import { sinclairCoefficient, sinclairTotal } from './sinclair'

describe('sinclair', () => {
  for (const c of vectors.cases) {
    if ('expectedCoefficient' in c) {
      it(`coefficient ${c.gender} ${c.bodyweight}kg`, () => {
        const coef = sinclairCoefficient(c.bodyweight, c.gender as 'male' | 'female')
        if (c.expectedCoefficient == null) {
          expect(Number.isNaN(coef)).toBe(true)
          return
        }
        expect(coef).toBeCloseTo(c.expectedCoefficient, 5)
      })
    }

    if ('expectedTotal' in c) {
      it(`total ${c.gender} ${c.bodyweight}kg / ${c.total}kg`, () => {
        const total = sinclairTotal(c.total, c.bodyweight, c.gender as 'male' | 'female')
        if (c.expectedTotal == null) {
          expect(Number.isNaN(total)).toBe(true)
          return
        }
        expect(total).toBeCloseTo(c.expectedTotal, 5)
      })
    }
  }
})
