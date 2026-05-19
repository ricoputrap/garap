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

const loadJoined = async (
  refs: Ref[],
  groupOrders: Map<string, number>,
): Promise<PanelItem[]> => {
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

  // First-appearance fallback for cards lacking an explicit group-order entry
  // (transient state between insert and prune).
  const fallbackRank = new Map<string, number>()
  let nextFallback = 0
  for (const ref of refs) {
    const item = present.find((i) => i.id === ref.itemId)
    if (!item) continue
    if (fallbackRank.has(item.cardId)) continue
    fallbackRank.set(item.cardId, nextFallback)
    nextFallback += 1
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

  const cardOrder = [...byCard.keys()].sort((a, b) => {
    const oa = groupOrders.get(a)
    const ob = groupOrders.get(b)
    if (oa != null && ob != null) return oa - ob
    if (oa != null) return -1
    if (ob != null) return 1
    return (fallbackRank.get(a) ?? 0) - (fallbackRank.get(b) ?? 0)
  })

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
  const orders = await db.todayCardOrders.toArray()
  const groupOrders = new Map(orders.map((o) => [o.cardId, o.order]))
  return loadJoined(refs, groupOrders)
}

export const loadWeekPanel = async (): Promise<PanelItem[]> => {
  const refs = await db.weekRefs.orderBy('order').toArray()
  const orders = await db.weekCardOrders.toArray()
  const groupOrders = new Map(orders.map((o) => [o.cardId, o.order]))
  return loadJoined(refs, groupOrders)
}
