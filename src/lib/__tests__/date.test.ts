import { describe, expect, it } from 'vitest'
import {
  nextLocalMidnight,
  nextLocalWeekStart,
  startOfLocalDay,
  startOfLocalWeek,
} from '@/lib/date'

/**
 * All these tests run in the host's local timezone. They focus on shape
 * properties (idempotence, ordering, monotonic stepping) that hold regardless
 * of which timezone the runner happens to live in.
 */

const at = (y: number, m: number, d: number, h = 0, min = 0): number =>
  new Date(y, m - 1, d, h, min, 0, 0).getTime()

describe('startOfLocalDay', () => {
  it('returns the same instant for any time on that local day', () => {
    const morning = at(2026, 5, 17, 0, 0)
    const noon = at(2026, 5, 17, 12, 30)
    const lateNight = at(2026, 5, 17, 23, 59)
    expect(startOfLocalDay(morning)).toBe(morning)
    expect(startOfLocalDay(noon)).toBe(morning)
    expect(startOfLocalDay(lateNight)).toBe(morning)
  })

  it('is idempotent', () => {
    const t = at(2026, 5, 17, 9, 12)
    expect(startOfLocalDay(startOfLocalDay(t))).toBe(startOfLocalDay(t))
  })
})

describe('nextLocalMidnight', () => {
  it('jumps forward by one local day', () => {
    const t = at(2026, 5, 17, 9, 12)
    expect(nextLocalMidnight(t)).toBe(at(2026, 5, 18, 0, 0))
  })

  it('survives DST spring-forward (US/Pacific 2026-03-08 02:00 → 03:00)', () => {
    // 1am the day of spring-forward — next midnight must be 24 calendar
    // hours later in wall-clock terms, even though only 23 actual hours pass.
    const t = at(2026, 3, 8, 1, 0)
    const next = nextLocalMidnight(t)
    const nextDay = new Date(next)
    expect(nextDay.getHours()).toBe(0)
    expect(nextDay.getDate()).toBe(9)
  })
})

describe('startOfLocalWeek', () => {
  it('snaps any day to the most-recent Monday 00:00', () => {
    // 2026-05-17 is a Sunday — Monday should be 2026-05-11.
    expect(startOfLocalWeek(at(2026, 5, 17, 23, 59))).toBe(at(2026, 5, 11, 0, 0))
    expect(startOfLocalWeek(at(2026, 5, 13, 8, 0))).toBe(at(2026, 5, 11, 0, 0))
    expect(startOfLocalWeek(at(2026, 5, 11, 0, 0))).toBe(at(2026, 5, 11, 0, 0))
  })

  it('is idempotent', () => {
    const t = at(2026, 5, 14, 15, 30)
    expect(startOfLocalWeek(startOfLocalWeek(t))).toBe(startOfLocalWeek(t))
  })
})

describe('nextLocalWeekStart', () => {
  it('returns the upcoming Monday 00:00', () => {
    expect(nextLocalWeekStart(at(2026, 5, 11, 0, 0))).toBe(at(2026, 5, 18, 0, 0))
    expect(nextLocalWeekStart(at(2026, 5, 14, 12, 0))).toBe(at(2026, 5, 18, 0, 0))
    expect(nextLocalWeekStart(at(2026, 5, 17, 23, 59))).toBe(at(2026, 5, 18, 0, 0))
  })
})
