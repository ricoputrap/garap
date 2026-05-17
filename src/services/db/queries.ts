import type { Board, Card, Item } from '@/types/domain'
import { db } from './schema'

export interface PanelItem {
  item: Item
  card: Card
  board: Board
  addedAt: number
}

const loadJoined = async (refs: { itemId: string; addedAt: number }[]): Promise<PanelItem[]> => {
  if (refs.length === 0) return []
  const items = await db.items.bulkGet(refs.map((r) => r.itemId))
  const present = items.filter((i): i is Item => i != null)
  const cardIds = [...new Set(present.map((i) => i.cardId))]
  const cards = await db.cards.bulkGet(cardIds)
  const cardMap = new Map(cards.filter((c): c is Card => c != null).map((c) => [c.id, c]))
  const boardIds = [...new Set([...cardMap.values()].map((c) => c.boardId))]
  const boards = await db.boards.bulkGet(boardIds)
  const boardMap = new Map(boards.filter((b): b is Board => b != null).map((b) => [b.id, b]))
  const addedAtMap = new Map(refs.map((r) => [r.itemId, r.addedAt]))

  return present
    .map((item) => {
      const card = cardMap.get(item.cardId)
      if (!card) return null
      const board = boardMap.get(card.boardId)
      if (!board) return null
      return { item, card, board, addedAt: addedAtMap.get(item.id) ?? 0 }
    })
    .filter((x): x is PanelItem => x != null)
    .sort((a, b) => {
      if (a.item.completed !== b.item.completed) return a.item.completed ? 1 : -1
      return a.addedAt - b.addedAt
    })
}

export const loadTodayPanel = async (): Promise<PanelItem[]> => {
  const refs = await db.todayRefs.orderBy('addedAt').toArray()
  return loadJoined(refs)
}

export const loadWeekPanel = async (): Promise<PanelItem[]> => {
  const refs = await db.weekRefs.orderBy('addedAt').toArray()
  return loadJoined(refs)
}
