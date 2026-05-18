import { describe, expect, it } from 'vitest'
import {
  createBoard,
  createCard,
  createItem,
  loadTodayPanel,
  loadWeekPanel,
} from '@/services/db'
import {
  addToToday,
  addToWeek,
  reorderTodayRef,
  reorderWeekRef,
} from '@/services/list-refs'

const tick = () => new Promise<void>((r) => setTimeout(r, 5))

const setupTodayCard = async () => {
  const board = await createBoard('B')
  const card = await createCard(board.id, 'C')
  const a = await createItem(card.id, 'a')
  await tick()
  const b = await createItem(card.id, 'b')
  await tick()
  const c = await createItem(card.id, 'c')
  await addToToday(a.id)
  await tick()
  await addToToday(b.id)
  await tick()
  await addToToday(c.id)
  return { card, a, b, c }
}

describe('reorderTodayRef', () => {
  it('move to top within card-group', async () => {
    const { a, b, c } = await setupTodayCard()
    await reorderTodayRef(c.id, null, a.id)
    const panel = await loadTodayPanel()
    expect(panel.map((p) => p.item.id)).toEqual([c.id, a.id, b.id])
  })

  it('move to middle', async () => {
    const { a, b, c } = await setupTodayCard()
    await reorderTodayRef(c.id, a.id, b.id)
    const panel = await loadTodayPanel()
    expect(panel.map((p) => p.item.id)).toEqual([a.id, c.id, b.id])
  })

  it('does not affect card view ordering', async () => {
    const { card, a, c } = await setupTodayCard()
    await reorderTodayRef(c.id, null, a.id)
    const { listItemsForCard } = await import('@/services/db')
    const list = await listItemsForCard(card.id)
    expect(list.map((i) => i.id)).toEqual([a.id, expect.any(String), expect.any(String)])
    // First item still 'a' — Today reorder did not touch Item.order.
    expect(list[0].id).toBe(a.id)
  })
})

describe('reorderWeekRef', () => {
  it('move to top within card-group', async () => {
    const board = await createBoard('B')
    const card = await createCard(board.id, 'C')
    const a = await createItem(card.id, 'a')
    await tick()
    const b = await createItem(card.id, 'b')
    await tick()
    const c = await createItem(card.id, 'c')
    await addToWeek(a.id)
    await tick()
    await addToWeek(b.id)
    await tick()
    await addToWeek(c.id)

    await reorderWeekRef(c.id, null, a.id)
    const panel = await loadWeekPanel()
    expect(panel.map((p) => p.item.id)).toEqual([c.id, a.id, b.id])
  })
})
