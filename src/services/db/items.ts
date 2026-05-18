import type { Item } from '@/types/domain'
import { newId } from '@/lib/id'
import {
  appendAfter,
  needsRebalance,
  orderBetween,
  rebalanced,
} from '@/lib/ordering'
import { db } from './schema'

export const listItemsForCard = async (cardId: string): Promise<Item[]> => {
  const all = await db.items.where('cardId').equals(cardId).toArray()
  // Active first (order asc), then completed (completedAt asc).
  return all.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    if (a.completed) return (a.completedAt ?? 0) - (b.completedAt ?? 0)
    return a.order - b.order
  })
}

export const createItem = async (cardId: string, name: string): Promise<Item> => {
  const item: Item = await db.transaction('rw', db.items, async () => {
    const siblings = await db.items.where('cardId').equals(cardId).toArray()
    const activeOrders = siblings.filter((s) => !s.completed).map((s) => s.order)
    const lastOrder = activeOrders.length > 0 ? Math.max(...activeOrders) : null
    const row: Item = {
      id: newId(),
      cardId,
      name: name.trim(),
      completed: false,
      completedAt: null,
      createdAt: Date.now(),
      order: appendAfter(lastOrder),
    }
    await db.items.add(row)
    return row
  })
  return item
}

export const renameItem = (id: string, name: string): Promise<number> =>
  db.items.update(id, { name: name.trim() })

export const deleteItem = (id: string): Promise<void> =>
  db.transaction('rw', db.items, db.todayRefs, db.weekRefs, async () => {
    await db.todayRefs.where('itemId').equals(id).delete()
    await db.weekRefs.where('itemId').equals(id).delete()
    await db.items.delete(id)
  })

/**
 * Reorder an active item within its card. `beforeId` and `afterId` are the
 * neighbour active item ids — either may be null (head/tail insert).
 */
export const reorderItem = async (
  itemId: string,
  beforeId: string | null,
  afterId: string | null,
): Promise<void> => {
  await db.transaction('rw', db.items, async () => {
    const item = await db.items.get(itemId)
    if (!item) return
    const siblings = (await db.items.where('cardId').equals(item.cardId).toArray())
      .filter((s) => !s.completed && s.id !== itemId)
      .sort((a, b) => a.order - b.order)

    const before = beforeId ? siblings.find((s) => s.id === beforeId) ?? null : null
    const after = afterId ? siblings.find((s) => s.id === afterId) ?? null : null
    const newOrder = orderBetween(before?.order ?? null, after?.order ?? null)
    item.order = newOrder

    const projected = [...siblings, item].sort((a, b) => a.order - b.order)
    if (needsRebalance(projected)) {
      const updates = rebalanced(projected)
      await Promise.all(updates.map((u) => db.items.update(u.id, { order: u.order })))
    } else {
      await db.items.update(itemId, { order: newOrder })
    }
  })
}
