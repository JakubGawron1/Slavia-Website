import { describe, expect, it } from 'vitest'
import type { MyCalendarEntry } from '~/types/models'
import {
  cloneDefaultChecklist,
  daysUntilDate,
  DEFAULT_PRESTART_CHECKLIST,
  findNearestCalendarEntry,
  goalCurrentValueFromAthlete,
  mergeChecklistWithSaved,
  resolvePreStartEntry,
  seasonGoalProgressPercent,
  shouldShowOverduePaymentAlert
} from './athleteDashboardLogic'

const TODAY = '2026-06-21'

function calendarEntry(date: string, category = 'competition', title = 'Start'): MyCalendarEntry {
  return {
    competition: { date, title, category, location: 'Hala' } as MyCalendarEntry['competition'],
    participants: []
  }
}

describe('athleteDashboardLogic — week preview [2001]', () => {
  it('findNearestCalendarEntry picks earliest future entry', () => {
    const entries = [
      calendarEntry('2026-06-25'),
      calendarEntry('2026-06-22'),
      calendarEntry('2026-06-20')
    ]
    expect(findNearestCalendarEntry(entries, TODAY)?.competition?.date).toBe('2026-06-22')
  })

  it('daysUntilDate returns whole days until event', () => {
    expect(daysUntilDate('2026-06-21', TODAY)).toBe(0)
    expect(daysUntilDate('2026-06-23', TODAY)).toBe(2)
  })
})

describe('athleteDashboardLogic — pre-start checklist [2013]', () => {
  it('resolvePreStartEntry shows only today/tomorrow non-training events', () => {
    const tomorrow = calendarEntry('2026-06-22')
    expect(resolvePreStartEntry(tomorrow, 1)).toEqual(tomorrow)
    expect(resolvePreStartEntry(tomorrow, 2)).toBeNull()
    expect(resolvePreStartEntry(calendarEntry('2026-06-22', 'training'), 1)).toBeNull()
  })

  it('mergeChecklistWithSaved preserves labels and applies saved state', () => {
    const merged = mergeChecklistWithSaved(DEFAULT_PRESTART_CHECKLIST, [
      { id: 'belt', checked: true },
      { id: 'missing', checked: true }
    ])
    expect(merged.find((i) => i.id === 'belt')?.checked).toBe(true)
    expect(merged.find((i) => i.id === 'singlet')?.checked).toBe(false)
    expect(merged).toHaveLength(DEFAULT_PRESTART_CHECKLIST.length)
  })

  it('cloneDefaultChecklist returns fresh unchecked copies', () => {
    const a = cloneDefaultChecklist()
    a[0]!.checked = true
    expect(cloneDefaultChecklist()[0]?.checked).toBe(false)
  })
})

describe('athleteDashboardLogic — season goal [2005]', () => {
  it('goalCurrentValueFromAthlete uses total_kg for total mode', () => {
    expect(goalCurrentValueFromAthlete({ total_kg: 220, bodyweight: 80 }, 'total')).toBe(220)
  })

  it('goalCurrentValueFromAthlete requires bodyweight for sinclair mode', () => {
    expect(goalCurrentValueFromAthlete({ total_kg: 220, bodyweight: 0 }, 'sinclair')).toBe(0)
    expect(goalCurrentValueFromAthlete({ total_kg: 220, bodyweight: 80 }, 'sinclair')).toBe(220)
  })

  it('seasonGoalProgressPercent caps at 100', () => {
    expect(seasonGoalProgressPercent(125, 250)).toBe(50)
    expect(seasonGoalProgressPercent(300, 250)).toBe(100)
    expect(seasonGoalProgressPercent(10, 0)).toBe(0)
  })
})

describe('athleteDashboardLogic — payment alert [2024]', () => {
  it('shouldShowOverduePaymentAlert requires athlete role and overdue unpaid status', () => {
    expect(shouldShowOverduePaymentAlert(false, { is_overdue: true, is_paid: false })).toBe(false)
    expect(shouldShowOverduePaymentAlert(true, null)).toBe(false)
    expect(shouldShowOverduePaymentAlert(true, { is_overdue: true, is_paid: true })).toBe(false)
    expect(shouldShowOverduePaymentAlert(true, { is_overdue: true, is_paid: false })).toBe(true)
  })
})
