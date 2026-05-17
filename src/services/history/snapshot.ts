import { db } from '@/services/db/schema'
import { startOfLocalDay, startOfLocalWeek } from '@/lib/date'
import type { HistoryItem, Item } from '@/types/domain'

export interface SnapshotResult {
  count: number
  items: HistoryItem[]
}

const toLocalDateKey = (ts: number): string => {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const buildHistoryItems = async (items: Item[]): Promise<HistoryItem[]> => {
  const cardIds = Array.from(new Set(items.map((i) => i.cardId)))
  const cards = await db.cards.bulkGet(cardIds)
  const cardMap = new Map(cards.filter((c): c is NonNullable<typeof c> => c != null).map((c) => [c.id, c]))
  const boardIds = Array.from(new Set(cards.filter((c) => c != null).map((c) => c!.boardId)))
  const boards = await db.boards.bulkGet(boardIds)
  const boardMap = new Map(boards.filter((b): b is NonNullable<typeof b> => b != null).map((b) => [b.id, b]))
  return items.map((i) => {
    const card = cardMap.get(i.cardId)
    const board = card ? boardMap.get(card.boardId) : undefined
    return {
      itemId: i.id,
      name: i.name,
      cardId: i.cardId,
      cardTitle: card?.title ?? '(deleted card)',
      boardId: card?.boardId ?? '',
      boardName: board?.name ?? '(deleted board)',
      completedAt: i.completedAt ?? Date.now(),
    }
  })
}

export const snapshotAndClearToday = async (now: number = Date.now()): Promise<SnapshotResult> =>
  db.transaction(
    'rw',
    [db.todayRefs, db.items, db.cards, db.boards, db.todayHistory],
    async () => {
      const refs = await db.todayRefs.toArray()
      const ids = refs.map((r) => r.itemId)
      const items = await db.items.bulkGet(ids)
      const completed = items.filter((i): i is Item => i != null && i.completed)
      if (completed.length === 0) return { count: 0, items: [] }
      const historyItems = await buildHistoryItems(completed)
      const date = toLocalDateKey(startOfLocalDay(now))
      const existing = await db.todayHistory.get(date)
      if (!existing) {
        await db.todayHistory.add({ date, clearedAt: now, items: historyItems })
      }
      await db.todayRefs.where('itemId').anyOf(completed.map((i) => i.id)).delete()
      return { count: completed.length, items: historyItems }
    },
  )

export const snapshotAndClearWeek = async (now: number = Date.now()): Promise<SnapshotResult> =>
  db.transaction(
    'rw',
    [db.weekRefs, db.items, db.cards, db.boards, db.weekHistory],
    async () => {
      const refs = await db.weekRefs.toArray()
      const ids = refs.map((r) => r.itemId)
      const items = await db.items.bulkGet(ids)
      const completed = items.filter((i): i is Item => i != null && i.completed)
      if (completed.length === 0) return { count: 0, items: [] }
      const historyItems = await buildHistoryItems(completed)
      const weekStart = toLocalDateKey(startOfLocalWeek(now))
      const existing = await db.weekHistory.get(weekStart)
      if (!existing) {
        await db.weekHistory.add({ weekStart, clearedAt: now, items: historyItems })
      }
      await db.weekRefs.where('itemId').anyOf(completed.map((i) => i.id)).delete()
      return { count: completed.length, items: historyItems }
    },
  )
