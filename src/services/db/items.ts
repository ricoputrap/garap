import type { Item } from '@/types/domain'
import { newId } from '@/lib/id'
import { db } from './schema'

export const listItemsForCard = async (cardId: string): Promise<Item[]> => {
  const all = await db.items.where('cardId').equals(cardId).toArray()
  // Active first (createdAt asc), then completed (completedAt asc).
  return all.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    if (a.completed) return (a.completedAt ?? 0) - (b.completedAt ?? 0)
    return a.createdAt - b.createdAt
  })
}

export const createItem = async (cardId: string, name: string): Promise<Item> => {
  const item: Item = {
    id: newId(),
    cardId,
    name: name.trim(),
    completed: false,
    completedAt: null,
    createdAt: Date.now(),
  }
  await db.items.add(item)
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
