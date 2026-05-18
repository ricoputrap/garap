import { describe, expect, it } from 'vitest'
import {
  ORDER_GAP,
  REBALANCE_THRESHOLD,
  appendAfter,
  backfillOrder,
  midpoint,
  needsRebalance,
  orderBetween,
  prependBefore,
  rebalanced,
} from '@/lib/ordering'

describe('midpoint', () => {
  it('halves the interval', () => {
    expect(midpoint(0, 2000)).toBe(1000)
    expect(midpoint(1000, 2000)).toBe(1500)
  })
})

describe('appendAfter / prependBefore', () => {
  it('appends with gap when list non-empty', () => {
    expect(appendAfter(3000)).toBe(3000 + ORDER_GAP)
  })
  it('returns base gap when list empty', () => {
    expect(appendAfter(null)).toBe(ORDER_GAP)
    expect(prependBefore(null)).toBe(ORDER_GAP)
  })
  it('prepends with negative gap', () => {
    expect(prependBefore(1000)).toBe(0)
  })
})

describe('orderBetween', () => {
  it('empty list', () => {
    expect(orderBetween(null, null)).toBe(ORDER_GAP)
  })
  it('head insert', () => {
    expect(orderBetween(null, 1000)).toBe(0)
  })
  it('tail insert', () => {
    expect(orderBetween(2000, null)).toBe(3000)
  })
  it('middle insert', () => {
    expect(orderBetween(1000, 2000)).toBe(1500)
  })
})

describe('needsRebalance', () => {
  it('false on healthy gaps', () => {
    expect(needsRebalance([{ order: 1000 }, { order: 2000 }, { order: 3000 }])).toBe(false)
  })
  it('false on single or empty', () => {
    expect(needsRebalance([])).toBe(false)
    expect(needsRebalance([{ order: 7 }])).toBe(false)
  })
  it('true when adjacent gap below threshold', () => {
    expect(
      needsRebalance([
        { order: 1000 },
        { order: 1000 + REBALANCE_THRESHOLD / 2 },
        { order: 2000 },
      ]),
    ).toBe(true)
  })
})

describe('rebalanced', () => {
  it('renumbers in iteration order at GAP', () => {
    expect(
      rebalanced([
        { id: 'a', order: 0.1 },
        { id: 'b', order: 0.2 },
        { id: 'c', order: 0.3 },
      ]),
    ).toEqual([
      { id: 'a', order: 1000 },
      { id: 'b', order: 2000 },
      { id: 'c', order: 3000 },
    ])
  })
})

describe('backfillOrder', () => {
  it('attaches order at GAP increments', () => {
    expect(backfillOrder([{ id: 'a' }, { id: 'b' }])).toEqual([
      { id: 'a', order: 1000 },
      { id: 'b', order: 2000 },
    ])
  })
})

describe('repeated midpoint chain triggers rebalance', () => {
  it('many midpoints collapse below threshold', () => {
    const prev = 0
    let next = ORDER_GAP
    const chain: { order: number }[] = [{ order: prev }, { order: next }]
    for (let i = 0; i < 60; i += 1) {
      const m = midpoint(prev, next)
      chain.splice(chain.length - 1, 0, { order: m })
      next = m
    }
    chain.sort((a, b) => a.order - b.order)
    expect(needsRebalance(chain)).toBe(true)
  })
})
