import { describe, expect, it } from 'vitest'
import {
  createBoard,
  createCard,
  createItem,
  listItemsForCard,
  reorderItem,
} from '@/services/db'
import { setCompleted } from '@/services/completion-sync'
import { db } from '@/services/db/schema'
import { REBALANCE_THRESHOLD } from '@/lib/ordering'

const tick = () => new Promise<void>((r) => setTimeout(r, 5))

const setupCard = async (n: number) => {
  const board = await createBoard('B')
  const card = await createCard(board.id, 'C')
  const items = []
  for (let i = 0; i < n; i += 1) {
    items.push(await createItem(card.id, `i${i}`))
    await tick()
  }
  return { card, items }
}

describe('reorderItem', () => {
  it('appends new items in order', async () => {
    const { card, items } = await setupCard(3)
    const listed = await listItemsForCard(card.id)
    expect(listed.map((i) => i.id)).toEqual(items.map((i) => i.id))
  })

  it('moves item to top', async () => {
    const { card, items } = await setupCard(3)
    const [a, b, c] = items
    await reorderItem(c.id, null, a.id)
    const listed = await listItemsForCard(card.id)
    expect(listed.map((i) => i.id)).toEqual([c.id, a.id, b.id])
  })

  it('moves item to bottom', async () => {
    const { card, items } = await setupCard(3)
    const [a, b, c] = items
    await reorderItem(a.id, c.id, null)
    const listed = await listItemsForCard(card.id)
    expect(listed.map((i) => i.id)).toEqual([b.id, c.id, a.id])
  })

  it('moves item to middle', async () => {
    const { card, items } = await setupCard(4)
    const [a, b, c, d] = items
    // Move d between a and b.
    await reorderItem(d.id, a.id, b.id)
    const listed = await listItemsForCard(card.id)
    expect(listed.map((i) => i.id)).toEqual([a.id, d.id, b.id, c.id])
  })

  it('ignores completed items in active sort', async () => {
    const { card, items } = await setupCard(3)
    const [a, b, c] = items
    await setCompleted(b.id, true)
    await reorderItem(c.id, null, a.id)
    const listed = await listItemsForCard(card.id)
    // active: c, a — completed: b
    expect(listed.map((i) => i.id)).toEqual([c.id, a.id, b.id])
  })

  it('rebalances when gap collapses', async () => {
    const { card, items } = await setupCard(3)
    const [a, b, c] = items
    // Force a tiny gap directly by writing.
    await db.items.update(b.id, { order: a.order + REBALANCE_THRESHOLD / 4 })
    await reorderItem(c.id, a.id, b.id)
    const listed = await listItemsForCard(card.id)
    const orders = listed.filter((i) => !i.completed).map((i) => i.order)
    for (let i = 1; i < orders.length; i += 1) {
      expect(orders[i] - orders[i - 1]).toBeGreaterThanOrEqual(REBALANCE_THRESHOLD)
    }
  })

  it('survives a no-op (drag to same spot)', async () => {
    const { card, items } = await setupCard(3)
    const [a, b, c] = items
    await reorderItem(b.id, a.id, c.id)
    const listed = await listItemsForCard(card.id)
    expect(listed.map((i) => i.id)).toEqual([a.id, b.id, c.id])
  })
})
