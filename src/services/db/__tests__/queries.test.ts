import { describe, expect, it } from 'vitest'
import {
  clearCompletedInCard,
  createBoard,
  createCard,
  createItem,
  listBoards,
  listCards,
  listItemsForCard,
  loadTodayPanel,
  loadWeekPanel,
} from '@/services/db'
import { setCompleted } from '@/services/completion-sync'
import { addToToday, addToWeek } from '@/services/list-refs'
import { db } from '@/services/db/schema'

// Force separate createdAt values so ordering is deterministic.
const tick = () => new Promise<void>((r) => setTimeout(r, 5))

describe('list ordering', () => {
  it('boards sorted by createdAt ascending', async () => {
    const a = await createBoard('A')
    await tick()
    const b = await createBoard('B')
    await tick()
    const c = await createBoard('C')

    const boards = await listBoards()
    expect(boards.map((x) => x.id)).toEqual([a.id, b.id, c.id])
  })

  it('cards sorted by createdAt ascending', async () => {
    const board = await createBoard('B')
    const c1 = await createCard(board.id, 'c1')
    await tick()
    const c2 = await createCard(board.id, 'c2')

    expect((await listCards(board.id)).map((x) => x.id)).toEqual([c1.id, c2.id])
  })

  it('items list places active first (createdAt asc), completed at bottom', async () => {
    const board = await createBoard('B')
    const card = await createCard(board.id, 'C')
    const a = await createItem(card.id, 'a')
    await tick()
    const b = await createItem(card.id, 'b')
    await tick()
    const c = await createItem(card.id, 'c')

    await setCompleted(a.id, true)

    const items = await listItemsForCard(card.id)
    expect(items.map((i) => i.id)).toEqual([b.id, c.id, a.id])
  })
})

describe('clearCompletedInCard', () => {
  it('removes only completed items and their refs', async () => {
    const board = await createBoard('B')
    const card = await createCard(board.id, 'C')
    const keep = await createItem(card.id, 'keep')
    const drop = await createItem(card.id, 'drop')

    await addToToday(keep.id)
    await addToToday(drop.id)
    await setCompleted(drop.id, true)

    await clearCompletedInCard(card.id)

    expect(await db.items.get(keep.id)).toBeDefined()
    expect(await db.items.get(drop.id)).toBeUndefined()
    expect(await db.todayRefs.get(keep.id)).toBeDefined()
    expect(await db.todayRefs.get(drop.id)).toBeUndefined()
  })
})

describe('panel joined queries', () => {
  it('today panel joins item → card → board and orders active before completed', async () => {
    const board = await createBoard('Work')
    const card = await createCard(board.id, 'Sprint')
    const i1 = await createItem(card.id, 'ship')
    await tick()
    const i2 = await createItem(card.id, 'review')

    await addToToday(i1.id)
    await tick()
    await addToToday(i2.id)
    await setCompleted(i1.id, true)

    const panel = await loadTodayPanel()
    expect(panel.map((p) => p.item.id)).toEqual([i2.id, i1.id])
    expect(panel[0].board.name).toBe('Work')
    expect(panel[0].card.title).toBe('Sprint')
  })

  it('week panel ignores items that were hard-deleted under it', async () => {
    const board = await createBoard('W')
    const card = await createCard(board.id, 'C')
    const item = await createItem(card.id, 'i')
    await addToWeek(item.id)
    // Simulate a stale ref pointing to nothing.
    await db.items.delete(item.id)

    const panel = await loadWeekPanel()
    expect(panel).toEqual([])
  })
})
