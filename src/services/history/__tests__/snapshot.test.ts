import { describe, expect, it } from 'vitest'
import { db } from '@/services/db/schema'
import { createBoard, createCard, createItem } from '@/services/db'
import { addToToday, addToWeek } from '@/services/list-refs'
import { setCompleted } from '@/services/completion-sync'
import { snapshotAndClearToday, snapshotAndClearWeek } from '@/services/history'

const seed = async () => {
  const board = await createBoard('Work')
  const card = await createCard(board.id, 'Sprint')
  const active = await createItem(card.id, 'active')
  const done = await createItem(card.id, 'done')
  await addToToday(active.id)
  await addToToday(done.id)
  await addToWeek(active.id)
  await addToWeek(done.id)
  await setCompleted(done.id, true)
  return { board, card, active, done }
}

const localDateKey = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('snapshotAndClearToday', () => {
  it('writes a history row and deletes only completed refs', async () => {
    const { active, done } = await seed()
    const now = Date.now()

    const result = await snapshotAndClearToday(now)

    expect(result.count).toBe(1)
    expect(result.items[0].itemId).toBe(done.id)
    expect(await db.todayRefs.get(active.id)).toBeDefined()
    expect(await db.todayRefs.get(done.id)).toBeUndefined()
    const row = await db.todayHistory.get(localDateKey(now))
    expect(row).toBeDefined()
    expect(row!.items).toHaveLength(1)
    expect(row!.items[0]).toMatchObject({
      itemId: done.id,
      name: 'done',
      cardTitle: 'Sprint',
      boardName: 'Work',
    })
  })

  it('skips writing when no completed items', async () => {
    const board = await createBoard('B')
    const card = await createCard(board.id, 'C')
    const item = await createItem(card.id, 'i')
    await addToToday(item.id)
    const now = Date.now()
    const result = await snapshotAndClearToday(now)
    expect(result.count).toBe(0)
    expect(await db.todayHistory.get(localDateKey(now))).toBeUndefined()
  })

  it('is idempotent on duplicate date key', async () => {
    await seed()
    const now = Date.now()
    await snapshotAndClearToday(now)
    const before = await db.todayHistory.get(localDateKey(now))
    await snapshotAndClearToday(now)
    const after = await db.todayHistory.get(localDateKey(now))
    expect(after).toEqual(before)
  })

  it('history survives deletion of the underlying card/board', async () => {
    const { done, card, board } = await seed()
    const now = Date.now()
    await snapshotAndClearToday(now)
    await db.cards.delete(card.id)
    await db.boards.delete(board.id)
    const row = await db.todayHistory.get(localDateKey(now))
    expect(row!.items[0]).toMatchObject({
      itemId: done.id,
      name: 'done',
      cardTitle: 'Sprint',
      boardName: 'Work',
    })
  })

  it('does not touch week refs or week history', async () => {
    const { done } = await seed()
    await snapshotAndClearToday(Date.now())
    expect(await db.weekRefs.get(done.id)).toBeDefined()
    expect(await db.weekHistory.count()).toBe(0)
  })
})

describe('snapshotAndClearWeek', () => {
  it('writes a week history row keyed by Monday', async () => {
    const { done } = await seed()
    const now = Date.now()
    const result = await snapshotAndClearWeek(now)
    expect(result.count).toBe(1)
    const rows = await db.weekHistory.toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].items[0].itemId).toBe(done.id)
    expect(await db.weekRefs.get(done.id)).toBeUndefined()
  })

  it('skips empty boundaries', async () => {
    const board = await createBoard('B')
    const card = await createCard(board.id, 'C')
    const item = await createItem(card.id, 'i')
    await addToWeek(item.id)
    await snapshotAndClearWeek(Date.now())
    expect(await db.weekHistory.count()).toBe(0)
  })
})
