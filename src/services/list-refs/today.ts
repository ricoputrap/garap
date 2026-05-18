import { db } from '@/services/db/schema'
import {
  appendAfter,
  needsRebalance,
  orderBetween,
  rebalanced,
} from '@/lib/ordering'

const groupOrdersForCard = async (cardId: string, excludeItemId?: string) => {
  const refs = await db.todayRefs.toArray()
  if (refs.length === 0) return []
  const items = await db.items.bulkGet(refs.map((r) => r.itemId))
  const itemMap = new Map(items.filter((i) => i != null).map((i) => [i!.id, i!]))
  return refs
    .filter((r) => itemMap.get(r.itemId)?.cardId === cardId && r.itemId !== excludeItemId)
    .sort((a, b) => a.order - b.order)
}

export const addToToday = async (itemId: string): Promise<void> => {
  await db.transaction('rw', db.todayRefs, db.items, async () => {
    const existing = await db.todayRefs.get(itemId)
    if (existing) return
    const item = await db.items.get(itemId)
    const cardId = item?.cardId
    const siblings = cardId ? await groupOrdersForCard(cardId) : []
    const lastOrder = siblings.length > 0 ? siblings[siblings.length - 1].order : null
    await db.todayRefs.add({
      itemId,
      addedAt: Date.now(),
      order: appendAfter(lastOrder),
    })
  })
}

export const removeFromToday = (itemId: string): Promise<void> =>
  db.todayRefs.delete(itemId)

export const isInToday = async (itemId: string): Promise<boolean> =>
  (await db.todayRefs.get(itemId)) != null

export const clearCompletedToday = (): Promise<number> =>
  db.transaction('rw', db.todayRefs, db.items, async () => {
    const refs = await db.todayRefs.toArray()
    const ids = refs.map((r) => r.itemId)
    const items = await db.items.bulkGet(ids)
    const doneIds = items.filter((i) => i?.completed).map((i) => i!.id)
    await db.todayRefs.where('itemId').anyOf(doneIds).delete()
    return doneIds.length
  })

/**
 * Reorder an active item within its card-group inside the Today panel.
 * `beforeId` / `afterId` are the neighbour active item ids inside the same card-group.
 */
export const reorderTodayRef = async (
  itemId: string,
  beforeId: string | null,
  afterId: string | null,
): Promise<void> => {
  await db.transaction('rw', db.todayRefs, db.items, async () => {
    const item = await db.items.get(itemId)
    if (!item) return
    const groupAll = await groupOrdersForCard(item.cardId, itemId)
    // Drag scope is active items only; filter completed out for neighbour math.
    const items = await db.items.bulkGet(groupAll.map((r) => r.itemId))
    const completed = new Set(
      items.filter((i) => i?.completed).map((i) => i!.id),
    )
    const siblings = groupAll.filter((r) => !completed.has(r.itemId))

    const before = beforeId ? siblings.find((s) => s.itemId === beforeId) ?? null : null
    const after = afterId ? siblings.find((s) => s.itemId === afterId) ?? null : null
    const newOrder = orderBetween(before?.order ?? null, after?.order ?? null)

    const projected = [
      ...siblings,
      { itemId, addedAt: 0, order: newOrder },
    ].sort((a, b) => a.order - b.order)

    if (needsRebalance(projected)) {
      const updates = rebalanced(
        projected.map((r) => ({ id: r.itemId, order: r.order })),
      )
      await Promise.all(updates.map((u) => db.todayRefs.update(u.id, { order: u.order })))
    } else {
      await db.todayRefs.update(itemId, { order: newOrder })
    }
  })
}
