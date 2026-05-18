export const ORDER_GAP = 1000
export const REBALANCE_THRESHOLD = 1e-4

export interface Ordered {
  order: number
}

/** Midpoint between two existing orders. */
export const midpoint = (prev: number, next: number): number => (prev + next) / 2

/** New order to place after the highest existing sibling. */
export const appendAfter = (last: number | null): number =>
  last == null ? ORDER_GAP : last + ORDER_GAP

/** New order to place before the lowest existing sibling. */
export const prependBefore = (first: number | null): number =>
  first == null ? ORDER_GAP : first - ORDER_GAP

/**
 * Compute the order value to assign to an item being inserted between
 * `prev` and `next`. Either bound may be null (head/tail insert).
 */
export const orderBetween = (prev: number | null, next: number | null): number => {
  if (prev == null && next == null) return ORDER_GAP
  if (prev == null) return prependBefore(next)
  if (next == null) return appendAfter(prev)
  return midpoint(prev, next)
}

/** True when the gap between any two adjacent siblings is too small to subdivide safely. */
export const needsRebalance = (siblings: readonly Ordered[]): boolean => {
  for (let i = 1; i < siblings.length; i += 1) {
    if (Math.abs(siblings[i].order - siblings[i - 1].order) < REBALANCE_THRESHOLD) {
      return true
    }
  }
  return false
}

/**
 * Renumber a sorted list of siblings as 1000, 2000, 3000, …
 * Returns a new array of (id, order) pairs the caller can persist.
 */
export const rebalanced = <T extends { id: string } & Ordered>(
  sortedSiblings: readonly T[],
): { id: string; order: number }[] =>
  sortedSiblings.map((s, i) => ({ id: s.id, order: (i + 1) * ORDER_GAP }))

/** Backfill helper: assign 1000, 2000, … in iteration order. */
export const backfillOrder = <T>(rows: readonly T[]): (T & { order: number })[] =>
  rows.map((row, i) => ({ ...row, order: (i + 1) * ORDER_GAP }))
