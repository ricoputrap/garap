import type { Card } from '@/types/domain'
import { newId } from '@/lib/id'
import { db } from './schema'

export const listCards = (boardId: string): Promise<Card[]> =>
  db.cards.where('boardId').equals(boardId).sortBy('createdAt')

export const createCard = async (boardId: string, title: string): Promise<Card> => {
  const card: Card = {
    id: newId(),
    boardId,
    title: title.trim(),
    createdAt: Date.now(),
  }
  await db.cards.add(card)
  return card
}

export const renameCard = (id: string, title: string): Promise<number> =>
  db.cards.update(id, { title: title.trim() })

export const deleteCard = (id: string): Promise<void> =>
  db.transaction('rw', db.cards, db.items, db.todayRefs, db.weekRefs, async () => {
    const items = await db.items.where('cardId').equals(id).toArray()
    const itemIds = items.map((i) => i.id)
    await db.todayRefs.where('itemId').anyOf(itemIds).delete()
    await db.weekRefs.where('itemId').anyOf(itemIds).delete()
    await db.items.where('cardId').equals(id).delete()
    await db.cards.delete(id)
  })

export const clearCompletedInCard = (cardId: string): Promise<void> =>
  db.transaction('rw', db.items, db.todayRefs, db.weekRefs, async () => {
    const done = await db.items
      .where('cardId')
      .equals(cardId)
      .filter((i) => i.completed)
      .toArray()
    const ids = done.map((i) => i.id)
    await db.todayRefs.where('itemId').anyOf(ids).delete()
    await db.weekRefs.where('itemId').anyOf(ids).delete()
    await db.items.where('id').anyOf(ids).delete()
  })
