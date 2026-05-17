import { db } from '@/services/db/schema'

export const addToWeek = async (itemId: string): Promise<void> => {
  const existing = await db.weekRefs.get(itemId)
  if (existing) return
  await db.weekRefs.add({ itemId, addedAt: Date.now() })
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
