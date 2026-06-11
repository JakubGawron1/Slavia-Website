import { describe, expect, it } from 'vitest'
import {
  cardGender,
  formatWeightCategoryText,
  MALE_WEIGHT_CATEGORIES,
  resolveWeightCategoryThreshold
} from './zawodnicyRanking'

describe('zawodnicyRanking', () => {
  it('cardGender accepts male and female only', () => {
    expect(cardGender('male')).toBe('male')
    expect(cardGender('female')).toBe('female')
    expect(cardGender('other')).toBeNull()
  })

  it('resolveWeightCategoryThreshold picks PZPC-style bucket', () => {
    expect(resolveWeightCategoryThreshold('male', 72)).toBe(75)
    expect(resolveWeightCategoryThreshold('female', 48)).toBe(49)
  })

  it('formatWeightCategoryText shows threshold and bodyweight', () => {
    expect(formatWeightCategoryText(75, 72)).toContain('75')
    expect(formatWeightCategoryText(0)).toBe('—')
  })

  it('exports male categories ascending', () => {
    expect(MALE_WEIGHT_CATEGORIES[0]).toBe(60)
    expect(MALE_WEIGHT_CATEGORIES.at(-1)).toBe(110)
  })
})
