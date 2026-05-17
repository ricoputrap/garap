import type { Board } from '@/types/domain'
import { newId } from '@/lib/id'
import { db } from './schema'

export const listBoards = (): Promise<Board[]> =>
  db.boards.orderBy('createdAt').toArray()

export const getBoard = (id: string): Promise<Board | undefined> =>
  db.boards.get(id)

export const createBoard = async (name: string): Promise<Board> => {
  const board: Board = {
    id: newId(),
    name: name.trim(),
    createdAt: Date.now(),
  }
  await db.boards.add(board)
  return board
}

export const renameBoard = (id: string, name: string): Promise<number> =>
  db.boards.update(id, { name: name.trim() })

/** Cascade delete: board → its cards → their items → their refs. */
export const deleteBoard = (id: string): Promise<void> =>
  db.transaction(
    'rw',
    [db.boards, db.cards, db.items, db.todayRefs, db.weekRefs],
    async () => {
      const cards = await db.cards.where('boardId').equals(id).toArray()
      const cardIds = cards.map((c) => c.id)
      const items = await db.items.where('cardId').anyOf(cardIds).toArray()
      const itemIds = items.map((i) => i.id)

      await db.todayRefs.where('itemId').anyOf(itemIds).delete()
      await db.weekRefs.where('itemId').anyOf(itemIds).delete()
      await db.items.where('cardId').anyOf(cardIds).delete()
      await db.cards.where('boardId').equals(id).delete()
      await db.boards.delete(id)
    },
  )
