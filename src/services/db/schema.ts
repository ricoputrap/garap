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
    this.version(3)
      .stores({
        items: 'id, cardId, completed, createdAt, completedAt, order',
        todayRefs: 'itemId, addedAt, order',
        weekRefs: 'itemId, addedAt, order',
      })
      .upgrade(async (tx) => {
        const GAP = 1000
        const items = await tx.table('items').toArray()
        const byCard = new Map<string, Item[]>()
        for (const it of items as Item[]) {
          const list = byCard.get(it.cardId) ?? []
          list.push(it)
          byCard.set(it.cardId, list)
        }
        for (const [, list] of byCard) {
          list.sort((a, b) => a.createdAt - b.createdAt)
          for (let i = 0; i < list.length; i += 1) {
            list[i].order = (i + 1) * GAP
          }
        }
        await tx.table('items').bulkPut(items)

        const backfillRefs = async (table: string) => {
          const refs = (await tx.table(table).toArray()) as { itemId: string; addedAt: number; order: number }[]
          if (refs.length === 0) return
          const itemMap = new Map((items as Item[]).map((i) => [i.id, i]))
          const groups = new Map<string, typeof refs>()
          for (const r of refs) {
            const item = itemMap.get(r.itemId)
            const key = item?.cardId ?? '__orphan__'
            const list = groups.get(key) ?? []
            list.push(r)
            groups.set(key, list)
          }
          for (const [, list] of groups) {
            list.sort((a, b) => a.addedAt - b.addedAt)
            for (let i = 0; i < list.length; i += 1) {
              list[i].order = (i + 1) * GAP
            }
          }
          await tx.table(table).bulkPut(refs)
        }
        await backfillRefs('todayRefs')
        await backfillRefs('weekRefs')
      })
  }
}

export const db = new GarapDB()
