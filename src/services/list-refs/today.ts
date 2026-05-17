import { db } from '@/services/db/schema'

export const addToToday = async (itemId: string): Promise<void> => {
  const existing = await db.todayRefs.get(itemId)
  if (existing) return
  await db.todayRefs.add({ itemId, addedAt: Date.now() })
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
