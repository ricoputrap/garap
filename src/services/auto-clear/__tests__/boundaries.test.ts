import { describe, expect, it } from 'vitest'
import { shouldClearToday, shouldClearWeek } from '@/services/auto-clear/boundaries'

const at = (y: number, m: number, d: number, h = 0, min = 0): number =>
  new Date(y, m - 1, d, h, min, 0, 0).getTime()

describe('shouldClearToday', () => {
  it('returns true when no previous clear recorded', () => {
    expect(shouldClearToday(null, at(2026, 5, 17, 12))).toBe(true)
  })

  it('returns false within the same local day', () => {
    const last = at(2026, 5, 17, 0, 5)
    expect(shouldClearToday(last, at(2026, 5, 17, 9))).toBe(false)
    expect(shouldClearToday(last, at(2026, 5, 17, 23, 59))).toBe(false)
  })

  it('returns true after local midnight crossing', () => {
    const last = at(2026, 5, 17, 22, 0)
    expect(shouldClearToday(last, at(2026, 5, 18, 0, 1))).toBe(true)
  })

  it('survives DST spring-forward (no false negative)', () => {
    // 2026-03-08 in US/Pacific spring-forwards. Last cleared the day before,
    // now is after the boundary — should clear.
    const last = at(2026, 3, 7, 23, 0)
    const now = at(2026, 3, 8, 4, 0)
    expect(shouldClearToday(last, now)).toBe(true)
  })
})

describe('shouldClearWeek', () => {
  it('returns true when no previous clear recorded', () => {
    expect(shouldClearWeek(null, at(2026, 5, 17))).toBe(true)
  })

  it('returns false within the same Mon–Sun span', () => {
    const last = at(2026, 5, 11, 0, 5) // Mon
    expect(shouldClearWeek(last, at(2026, 5, 12, 9))).toBe(false)
    expect(shouldClearWeek(last, at(2026, 5, 17, 23, 59))).toBe(false) // Sun
  })

  it('returns true after crossing Monday 00:00 local', () => {
    const last = at(2026, 5, 17, 12) // Sun in the week of May 11
    expect(shouldClearWeek(last, at(2026, 5, 18, 0, 1))).toBe(true) // new Mon
  })
})
