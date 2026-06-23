import { describe, expect, it } from 'vitest'
import { EXERCISES } from './weightliftingRatios'

describe('weightliftingRatios', () => {
  it('includes base lifts with unit ratio', () => {
    const snatch = EXERCISES.find(e => e.id === 'snatch')
    const cj = EXERCISES.find(e => e.id === 'clean_jerk')
    expect(snatch?.ratio).toEqual({ min: 1, max: 1, source: 'Wartość bazowa' })
    expect(cj?.ratio).toEqual({ min: 1, max: 1, source: 'Wartość bazowa' })
  })

  it('back squat ratio references clean jerk', () => {
    const squat = EXERCISES.find(e => e.id === 'back_squat')
    expect(squat?.from).toBe('clean_jerk')
    expect(squat?.ratio.min).toBeGreaterThan(1)
    expect(squat?.ratio.max).toBeGreaterThan(squat!.ratio.min)
  })

  it('every exercise has Polish label', () => {
    for (const ex of EXERCISES) {
      expect(ex.pl.length).toBeGreaterThan(2)
    }
  })
})
