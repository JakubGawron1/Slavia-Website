import { describe, expect, it } from 'vitest'
import catalog from './test-vectors/pzpc-weight-classes.json' with { type: 'json' }
import { pzpcAgeGroups, pzpcWeightClassLabels } from './pzpcWeightCategories'

type PzpcCatalogJson = {
  ageGroups: { id: string }[]
  classesByAge: Record<string, { male?: string[], female?: string[] }>
}

describe('pzpc catalog parity JSON ↔ TS', () => {
  const data = catalog as PzpcCatalogJson

  it('age groups match catalog keys', () => {
    const jsonIds = data.ageGroups.map(g => g.id)
    const tsIds = pzpcAgeGroups().map(g => g.id)
    expect(tsIds).toEqual(jsonIds)
  })

  it('male senior labels match JSON catalog', () => {
    const jsonSeniorMale = data.classesByAge.Senior?.male ?? []
    const tsLabels = pzpcWeightClassLabels('Senior', 'male')
    expect(tsLabels).toEqual(jsonSeniorMale)
  })

  it('female U17 labels match JSON catalog', () => {
    const jsonU17Female = data.classesByAge.U17?.female ?? []
    const tsLabels = pzpcWeightClassLabels('U17', 'female')
    expect(tsLabels).toEqual(jsonU17Female)
  })

  it('all age groups and genders match JSON catalog', () => {
    for (const group of pzpcAgeGroups()) {
      for (const gender of ['male', 'female'] as const) {
        const jsonLabels = data.classesByAge[group.id]?.[gender] ?? []
        expect(pzpcWeightClassLabels(group.id, gender)).toEqual(jsonLabels)
      }
    }
  })
})
