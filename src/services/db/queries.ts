import type { Board, Card, Item } from '@/types/domain'
import { db } from './schema'

export interface PanelItem {
  item: Item
  card: Card
  board: Board
  addedAt: number
  refOrder: number
}

interface Ref {
  itemId: string
  addedAt: number
  order: number
}

const loadJoined = async (refs: Ref[]): Promise<PanelItem[]> => {
  if (refs.length === 0) return []
  const items = await db.items.bulkGet(refs.map((r) => r.itemId))
  const present = items.filter((i): i is Item => i != null)
  const cardIds = [...new Set(present.map((i) => i.cardId))]
  const cards = await db.cards.bulkGet(cardIds)
  const cardMap = new Map(cards.filter((c): c is Card => c != null).map((c) => [c.id, c]))
  const boardIds = [...new Set([...cardMap.values()].map((c) => c.boardId))]
  const boards = await db.boards.bulkGet(boardIds)
  const boardMap = new Map(boards.filter((b): b is Board => b != null).map((b) => [b.id, b]))
  const refMap = new Map(refs.map((r) => [r.itemId, r]))

  // Group by cardId. Each group: active first sorted by ref.order, completed last by completedAt.
  // Across groups preserve first-appearance order of cards by the global ref.order ascending —
  // this keeps the panel stable as users reorder within a group.
  const cardOrder: string[] = []
  const seen = new Set<string>()
  for (const ref of refs) {
    const item = present.find((i) => i.id === ref.itemId)
    if (!item) continue
    if (!seen.has(item.cardId)) {
      seen.add(item.cardId)
      cardOrder.push(item.cardId)
    }
  }

  const byCard = new Map<string, PanelItem[]>()
  for (const item of present) {
    const card = cardMap.get(item.cardId)
    if (!card) continue
    const board = boardMap.get(card.boardId)
    if (!board) continue
    const ref = refMap.get(item.id)!
    const entry: PanelItem = {
      item,
      card,
      board,
      addedAt: ref.addedAt,
      refOrder: ref.order,
    }
    const list = byCard.get(card.id) ?? []
    list.push(entry)
    byCard.set(card.id, list)
  }

  const out: PanelItem[] = []
  for (const cardId of cardOrder) {
    const list = byCard.get(cardId) ?? []
    list.sort((a, b) => {
      if (a.item.completed !== b.item.completed) return a.item.completed ? 1 : -1
      if (a.item.completed) return (a.item.completedAt ?? 0) - (b.item.completedAt ?? 0)
      return a.refOrder - b.refOrder
    })
    out.push(...list)
  }
  return out
}

export const loadTodayPanel = async (): Promise<PanelItem[]> => {
  const refs = await db.todayRefs.orderBy('order').toArray()
  return loadJoined(refs)
}

export const loadWeekPanel = async (): Promise<PanelItem[]> => {
  const refs = await db.weekRefs.orderBy('order').toArray()
  return loadJoined(refs)
}
