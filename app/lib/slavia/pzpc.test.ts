import { describe, expect, it } from 'vitest'
import vectors from './test-vectors/pzpc-parse.json' with { type: 'json' }
import { parsePzpcWeightCategoryStored } from './pzpcWeightCategories'

describe('pzpc parse', () => {
  for (const c of vectors.cases) {
    it(`parse "${c.input}"`, () => {
      expect(parsePzpcWeightCategoryStored(c.input)).toEqual(c.expected)
    })
  }
})
