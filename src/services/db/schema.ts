import Dexie, { type EntityTable } from 'dexie'
import type {
  Board,
  Card,
  Item,
  TodayHistory,
  TodayRef,
  WeekHistory,
  WeekRef,
} from '@/types/domain'

export class GarapDB extends Dexie {
  boards!: EntityTable<Board, 'id'>
  cards!: EntityTable<Card, 'id'>
  items!: EntityTable<Item, 'id'>
  todayRefs!: EntityTable<TodayRef, 'itemId'>
  weekRefs!: EntityTable<WeekRef, 'itemId'>
  todayHistory!: EntityTable<TodayHistory, 'date'>
  weekHistory!: EntityTable<WeekHistory, 'weekStart'>

  constructor() {
    super('garap')
    this.version(1).stores({
      boards: 'id, createdAt',
      cards: 'id, boardId, createdAt',
      items: 'id, cardId, completed, createdAt, completedAt',
      todayRefs: 'itemId, addedAt',
      weekRefs: 'itemId, addedAt',
    })
    this.version(2).stores({
      todayHistory: 'date, clearedAt',
      weekHistory: 'weekStart, clearedAt',
    })
  }
}

export const db = new GarapDB()
