import { db } from '@/services/db/schema'
import {
  appendAfter,
  needsRebalance,
  orderBetween,
  rebalanced,
} from '@/lib/ordering'

const groupOrdersForCard = async (cardId: string, excludeItemId?: string) => {
  const refs = await db.weekRefs.toArray()
  if (refs.length === 0) return []
  const items = await db.items.bulkGet(refs.map((r) => r.itemId))
  const itemMap = new Map(items.filter((i) => i != null).map((i) => [i!.id, i!]))
  return refs
    .filter((r) => itemMap.get(r.itemId)?.cardId === cardId && r.itemId !== excludeItemId)
    .sort((a, b) => a.order - b.order)
}

const ensureWeekCardOrder = async (cardId: string): Promise<void> => {
  const existing = await db.weekCardOrders.get(cardId)
  if (existing) return
  const all = await db.weekCardOrders.toArray()
  const lastOrder = all.length > 0 ? Math.max(...all.map((o) => o.order)) : null
  await db.weekCardOrders.add({ cardId, order: appendAfter(lastOrder) })
}

/**
 * Drop the week card-order entry for `cardId` if the card has no remaining
 * week refs. Safe to call after any weekRefs deletion. Idempotent.
 */
export const pruneWeekCardOrderIfEmpty = async (cardId: string): Promise<void> => {
  const items = await db.items.where('cardId').equals(cardId).toArray()
  if (items.length === 0) {
    await db.weekCardOrders.delete(cardId)
    return
  }
  const count = await db.weekRefs.where('itemId').anyOf(items.map((i) => i.id)).count()
  if (count === 0) await db.weekCardOrders.delete(cardId)
}

export const addToWeek = async (itemId: string): Promise<void> => {
  await db.transaction('rw', [db.weekRefs, db.items, db.weekCardOrders], async () => {
    const existing = await db.weekRefs.get(itemId)
    if (existing) return
    const item = await db.items.get(itemId)
    const cardId = item?.cardId
    const siblings = cardId ? await groupOrdersForCard(cardId) : []
    const lastOrder = siblings.length > 0 ? siblings[siblings.length - 1].order : null
    await db.weekRefs.add({
      itemId,
      addedAt: Date.now(),
      order: appendAfter(lastOrder),
    })
    if (cardId) await ensureWeekCardOrder(cardId)
  })
}

export const removeFromWeek = (itemId: string): Promise<void> =>
  db.transaction('rw', [db.weekRefs, db.items, db.weekCardOrders], async () => {
    const item = await db.items.get(itemId)
    await db.weekRefs.delete(itemId)
    if (item) await pruneWeekCardOrderIfEmpty(item.cardId)
  })

export const isInWeek = async (itemId: string): Promise<boolean> =>
  (await db.weekRefs.get(itemId)) != null

export const clearCompletedWeek = (): Promise<number> =>
  db.transaction('rw', [db.weekRefs, db.items, db.weekCardOrders], async () => {
    const refs = await db.weekRefs.toArray()
    const ids = refs.map((r) => r.itemId)
    const items = await db.items.bulkGet(ids)
    const doneItems = items.filter((i): i is NonNullable<typeof i> => i != null && i.completed)
    const doneIds = doneItems.map((i) => i.id)
    await db.weekRefs.where('itemId').anyOf(doneIds).delete()
    const affectedCards = Array.from(new Set(doneItems.map((i) => i.cardId)))
    for (const cardId of affectedCards) {
      await pruneWeekCardOrderIfEmpty(cardId)
    }
    return doneIds.length
  })

export const reorderWeekRef = async (
  itemId: string,
  beforeId: string | null,
  afterId: string | null,
): Promise<void> => {
  await db.transaction('rw', db.weekRefs, db.items, async () => {
    const item = await db.items.get(itemId)
    if (!item) return
    const groupAll = await groupOrdersForCard(item.cardId, itemId)
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
      await Promise.all(updates.map((u) => db.weekRefs.update(u.id, { order: u.order })))
    } else {
      await db.weekRefs.update(itemId, { order: newOrder })
    }
  })
}

/**
 * Reorder a card-group inside the Week panel. Neighbours are sibling card ids
 * adjacent to the drop position; either may be null (head/tail).
 */
export const reorderWeekCardGroup = async (
  cardId: string,
  beforeId: string | null,
  afterId: string | null,
): Promise<void> => {
  await db.transaction('rw', db.weekCardOrders, async () => {
    const current = await db.weekCardOrders.get(cardId)
    if (!current) return
    const siblings = (await db.weekCardOrders.toArray())
      .filter((s) => s.cardId !== cardId)
      .sort((a, b) => a.order - b.order)

    const before = beforeId ? siblings.find((s) => s.cardId === beforeId) ?? null : null
    const after = afterId ? siblings.find((s) => s.cardId === afterId) ?? null : null
    const newOrder = orderBetween(before?.order ?? null, after?.order ?? null)

    const projected = [...siblings, { cardId, order: newOrder }].sort((a, b) => a.order - b.order)
    if (needsRebalance(projected)) {
      const updates = rebalanced(projected.map((r) => ({ id: r.cardId, order: r.order })))
      await Promise.all(updates.map((u) => db.weekCardOrders.update(u.id, { order: u.order })))
    } else {
      await db.weekCardOrders.update(cardId, { order: newOrder })
    }
  })
}
