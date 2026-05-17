import { db } from '@/services/db/schema'

/**
 * Single source of truth for an item's completion state. Card view, Today panel,
 * and Week panel all route here so the flag stays symmetric across contexts.
 */
export const setCompleted = (itemId: string, completed: boolean): Promise<number> =>
  db.items.update(itemId, {
    completed,
    completedAt: completed ? Date.now() : null,
  })

export const toggleCompleted = async (itemId: string): Promise<void> => {
  const item = await db.items.get(itemId)
  if (!item) return
  await setCompleted(itemId, !item.completed)
}
