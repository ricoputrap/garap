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

export const addToWeek = async (itemId: string): Promise<void> => {
  await db.transaction('rw', db.weekRefs, db.items, async () => {
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
  })
}

export const removeFromWeek = (itemId: string): Promise<void> =>
  db.weekRefs.delete(itemId)

export const isInWeek = async (itemId: string): Promise<boolean> =>
  (await db.weekRefs.get(itemId)) != null

export const clearCompletedWeek = (): Promise<number> =>
  db.transaction('rw', db.weekRefs, db.items, async () => {
    const refs = await db.weekRefs.toArray()
    const ids = refs.map((r) => r.itemId)
    const items = await db.items.bulkGet(ids)
    const doneIds = items.filter((i) => i?.completed).map((i) => i!.id)
    await db.weekRefs.where('itemId').anyOf(doneIds).delete()
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
