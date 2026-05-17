import { describe, expect, it } from 'vitest'
import { db } from '@/services/db/schema'
import {
  createBoard,
  createCard,
  createItem,
} from '@/services/db'
import { addToToday, addToWeek } from '@/services/list-refs'
import { setCompleted } from '@/services/completion-sync'
import { snapshotAndClearToday } from '@/services/history'
import {
  ImportError,
  exportToJson,
  importFromJson,
} from '@/services/import-export'

const seed = async () => {
  const work = await createBoard('Work')
  const home = await createBoard('Home')
  const sprint = await createCard(work.id, 'Sprint')
  const errands = await createCard(home.id, 'Errands')
  const ship = await createItem(sprint.id, 'Ship Garap')
  const review = await createItem(sprint.id, 'Review PR')
  const milk = await createItem(errands.id, 'Buy milk')
  await setCompleted(review.id, true)
  await addToToday(ship.id)
  await addToWeek(milk.id)
}

const snapshotCounts = async () => ({
  boards: await db.boards.count(),
  cards: await db.cards.count(),
  items: await db.items.count(),
  todayRefs: await db.todayRefs.count(),
  weekRefs: await db.weekRefs.count(),
  todayHistory: await db.todayHistory.count(),
  weekHistory: await db.weekHistory.count(),
})

describe('import-export round trip', () => {
  it('export → import reproduces an equivalent DB', async () => {
    await seed()
    const before = await snapshotCounts()
    const beforeItems = await db.items.toArray()

    const json = await exportToJson()
    // Wipe and reimport.
    await Promise.all([
      db.boards.clear(),
      db.cards.clear(),
      db.items.clear(),
      db.todayRefs.clear(),
      db.weekRefs.clear(),
      db.todayHistory.clear(),
      db.weekHistory.clear(),
    ])
    await importFromJson(json)

    expect(await snapshotCounts()).toEqual(before)
    const afterItems = await db.items.toArray()
    expect(afterItems.sort((a, b) => a.id.localeCompare(b.id))).toEqual(
      beforeItems.sort((a, b) => a.id.localeCompare(b.id)),
    )
  })

  it('replaces all existing data — no merge artifacts', async () => {
    await seed()
    const json = await exportToJson()

    // Put unrelated data in the DB then import.
    await Promise.all([
      db.boards.clear(),
      db.cards.clear(),
      db.items.clear(),
    ])
    const stray = await createBoard('Stray')
    await createCard(stray.id, 'stray card')

    await importFromJson(json)

    const boards = await db.boards.toArray()
    expect(boards.map((b) => b.name).sort()).toEqual(['Home', 'Work'])
  })

  it('rejects malformed JSON', async () => {
    await expect(importFromJson('{not json')).rejects.toBeInstanceOf(ImportError)
  })

  it('rejects valid JSON with the wrong shape', async () => {
    await expect(importFromJson(JSON.stringify({ hello: 'world' }))).rejects.toBeInstanceOf(
      ImportError,
    )
  })

  it('round-trips history rows', async () => {
    await seed()
    const all = await db.items.toArray()
    const done = all.find((i) => i.completed)
    if (done) {
      await addToToday(done.id)
      await snapshotAndClearToday(Date.now())
    }
    const historyBefore = await db.todayHistory.toArray()
    expect(historyBefore.length).toBeGreaterThan(0)

    const json = await exportToJson()
    await Promise.all([
      db.boards.clear(),
      db.cards.clear(),
      db.items.clear(),
      db.todayRefs.clear(),
      db.weekRefs.clear(),
      db.todayHistory.clear(),
      db.weekHistory.clear(),
    ])
    await importFromJson(json)

    const historyAfter = await db.todayHistory.toArray()
    expect(historyAfter).toEqual(historyBefore)
  })
})
