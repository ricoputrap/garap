import Dexie, { type EntityTable } from 'dexie'
import type { Board, Card, Item, TodayRef, WeekRef } from '@/types/domain'

export class GarapDB extends Dexie {
  boards!: EntityTable<Board, 'id'>
  cards!: EntityTable<Card, 'id'>
  items!: EntityTable<Item, 'id'>
  todayRefs!: EntityTable<TodayRef, 'itemId'>
  weekRefs!: EntityTable<WeekRef, 'itemId'>

  constructor() {
    super('garap')
    this.version(1).stores({
      boards: 'id, createdAt',
      cards: 'id, boardId, createdAt',
      items: 'id, cardId, completed, createdAt, completedAt',
      todayRefs: 'itemId, addedAt',
      weekRefs: 'itemId, addedAt',
    })
  }
}

export const db = new GarapDB()
