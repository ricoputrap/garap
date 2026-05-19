import type { Card } from '@/types/domain'
import { newId } from '@/lib/id'
import {
  appendAfter,
  needsRebalance,
  orderBetween,
  rebalanced,
} from '@/lib/ordering'
import { pruneTodayCardOrderIfEmpty } from '@/services/list-refs/today'
import { pruneWeekCardOrderIfEmpty } from '@/services/list-refs/week'
import { db } from './schema'

export const listCards = async (boardId: string): Promise<Card[]> => {
  const all = await db.cards.where('boardId').equals(boardId).toArray()
  return all.sort((a, b) => a.order - b.order)
}

export const createCard = async (boardId: string, title: string): Promise<Card> =>
  db.transaction('rw', db.cards, async () => {
    const siblings = await db.cards.where('boardId').equals(boardId).toArray()
    const lastOrder = siblings.length > 0
      ? Math.max(...siblings.map((s) => s.order))
      : null
    const card: Card = {
      id: newId(),
      boardId,
      title: title.trim(),
      createdAt: Date.now(),
      order: appendAfter(lastOrder),
    }
    await db.cards.add(card)
    return card
  })

export const renameCard = (id: string, title: string): Promise<number> =>
  db.cards.update(id, { title: title.trim() })

export const deleteCard = (id: string): Promise<void> =>
  db.transaction(
    'rw',
    [db.cards, db.items, db.todayRefs, db.weekRefs, db.todayCardOrders, db.weekCardOrders],
    async () => {
      const items = await db.items.where('cardId').equals(id).toArray()
      const itemIds = items.map((i) => i.id)
      await db.todayRefs.where('itemId').anyOf(itemIds).delete()
      await db.weekRefs.where('itemId').anyOf(itemIds).delete()
      await db.items.where('cardId').equals(id).delete()
      await db.todayCardOrders.delete(id)
      await db.weekCardOrders.delete(id)
      await db.cards.delete(id)
    },
  )

export const clearCompletedInCard = (cardId: string): Promise<void> =>
  db.transaction(
    'rw',
    [db.items, db.todayRefs, db.weekRefs, db.todayCardOrders, db.weekCardOrders],
    async () => {
      const done = await db.items
        .where('cardId')
        .equals(cardId)
        .filter((i) => i.completed)
        .toArray()
      const ids = done.map((i) => i.id)
      await db.todayRefs.where('itemId').anyOf(ids).delete()
      await db.weekRefs.where('itemId').anyOf(ids).delete()
      await db.items.where('id').anyOf(ids).delete()
      await pruneTodayCardOrderIfEmpty(cardId)
      await pruneWeekCardOrderIfEmpty(cardId)
    },
  )

/**
 * Reorder a card within its board. Neighbours are the active card ids
 * adjacent to the drop position; either may be null (head/tail).
 */
export const reorderCard = async (
  cardId: string,
  beforeId: string | null,
  afterId: string | null,
): Promise<void> => {
  await db.transaction('rw', db.cards, async () => {
    const card = await db.cards.get(cardId)
    if (!card) return
    const siblings = (await db.cards.where('boardId').equals(card.boardId).toArray())
      .filter((s) => s.id !== cardId)
      .sort((a, b) => a.order - b.order)

    const before = beforeId ? siblings.find((s) => s.id === beforeId) ?? null : null
    const after = afterId ? siblings.find((s) => s.id === afterId) ?? null : null
    const newOrder = orderBetween(before?.order ?? null, after?.order ?? null)
    card.order = newOrder

    const projected = [...siblings, card].sort((a, b) => a.order - b.order)
    if (needsRebalance(projected)) {
      const updates = rebalanced(projected)
      await Promise.all(updates.map((u) => db.cards.update(u.id, { order: u.order })))
    } else {
      await db.cards.update(cardId, { order: newOrder })
    }
  })
}

