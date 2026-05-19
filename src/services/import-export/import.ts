import type { Card, Item, TodayRef, WeekRef } from '@/types/domain'
import { ORDER_GAP } from '@/lib/ordering'
import { db } from '@/services/db/schema'
import { snapshotSchema, type Snapshot } from './schema'

export class ImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportError'
  }
}

const parse = (raw: string): Snapshot => {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    throw new ImportError('File is not valid JSON.')
  }
  const result = snapshotSchema.safeParse(json)
  if (!result.success) {
    throw new ImportError('Backup shape is invalid — wrong file?')
  }
  return result.data
}

const backfillCardOrder = (cards: Snapshot['cards']): Card[] => {
  const grouped = new Map<string, typeof cards>()
  for (const c of cards) {
    const list = grouped.get(c.boardId) ?? []
    list.push(c)
    grouped.set(c.boardId, list)
  }
  const out: Card[] = []
  for (const [, list] of grouped) {
    const needs = list.some((c) => c.order == null)
    const sorted = needs ? [...list].sort((a, b) => a.createdAt - b.createdAt) : list
    sorted.forEach((c, i) => {
      out.push({ ...c, order: c.order ?? (i + 1) * ORDER_GAP })
    })
  }
  return out
}

const backfillItemOrder = (items: Snapshot['items']): Item[] => {
  const grouped = new Map<string, typeof items>()
  for (const it of items) {
    const list = grouped.get(it.cardId) ?? []
    list.push(it)
    grouped.set(it.cardId, list)
  }
  const out: Item[] = []
  for (const [, list] of grouped) {
    const needs = list.some((i) => i.order == null)
    const sorted = needs ? [...list].sort((a, b) => a.createdAt - b.createdAt) : list
    sorted.forEach((it, i) => {
      out.push({
        ...it,
        order: it.order ?? (i + 1) * ORDER_GAP,
      })
    })
  }
  return out
}

const backfillRefOrder = <T extends { itemId: string; addedAt: number; order?: number }>(
  refs: T[],
  itemsByCard: Map<string, string>,
): (T & { order: number })[] => {
  const grouped = new Map<string, T[]>()
  for (const r of refs) {
    const cardId = itemsByCard.get(r.itemId) ?? '__orphan__'
    const list = grouped.get(cardId) ?? []
    list.push(r)
    grouped.set(cardId, list)
  }
  const out: (T & { order: number })[] = []
  for (const [, list] of grouped) {
    const needs = list.some((r) => r.order == null)
    const sorted = needs ? [...list].sort((a, b) => a.addedAt - b.addedAt) : list
    sorted.forEach((r, i) => {
      out.push({ ...r, order: r.order ?? (i + 1) * ORDER_GAP } as T & { order: number })
    })
  }
  return out
}

/** Atomically replaces the entire database with the snapshot. */
export const importFromJson = async (raw: string): Promise<void> => {
  const snapshot = parse(raw)
  const cards = backfillCardOrder(snapshot.cards)
  const items = backfillItemOrder(snapshot.items)
  const itemsByCard = new Map(items.map((i) => [i.id, i.cardId]))
  const todayRefs: TodayRef[] = backfillRefOrder(snapshot.todayRefs, itemsByCard)
  const weekRefs: WeekRef[] = backfillRefOrder(snapshot.weekRefs, itemsByCard)

  // Seed panel card-order tables by first-appearance card order within each panel.
  const seedCardOrders = (
    refs: { itemId: string; order: number }[],
  ): { cardId: string; order: number }[] => {
    const sorted = [...refs].sort((a, b) => a.order - b.order)
    const seen = new Set<string>()
    const cardOrder: string[] = []
    for (const r of sorted) {
      const cardId = itemsByCard.get(r.itemId)
      if (!cardId || seen.has(cardId)) continue
      seen.add(cardId)
      cardOrder.push(cardId)
    }
    return cardOrder.map((cardId, i) => ({ cardId, order: (i + 1) * ORDER_GAP }))
  }
  const todayCardOrders = seedCardOrders(todayRefs)
  const weekCardOrders = seedCardOrders(weekRefs)

  await db.transaction(
    'rw',
    [
      db.boards,
      db.cards,
      db.items,
      db.todayRefs,
      db.weekRefs,
      db.todayHistory,
      db.weekHistory,
      db.todayCardOrders,
      db.weekCardOrders,
    ],
    async () => {
      await Promise.all([
        db.boards.clear(),
        db.cards.clear(),
        db.items.clear(),
        db.todayRefs.clear(),
        db.weekRefs.clear(),
        db.todayHistory.clear(),
        db.weekHistory.clear(),
        db.todayCardOrders.clear(),
        db.weekCardOrders.clear(),
      ])
      await Promise.all([
        db.boards.bulkAdd(snapshot.boards),
        db.cards.bulkAdd(cards),
        db.items.bulkAdd(items),
        db.todayRefs.bulkAdd(todayRefs),
        db.weekRefs.bulkAdd(weekRefs),
        db.todayHistory.bulkAdd(snapshot.todayHistory),
        db.weekHistory.bulkAdd(snapshot.weekHistory),
        db.todayCardOrders.bulkAdd(todayCardOrders),
        db.weekCardOrders.bulkAdd(weekCardOrders),
      ])
    },
  )
}
