import { describe, expect, it } from 'vitest'
import {
  createBoard,
  createCard,
  createItem,
  listItemsForCard,
} from '@/services/db'
import { db } from '@/services/db/schema'
import { setCompleted, toggleCompleted } from '@/services/completion-sync'

const seed = async () => {
  const board = await createBoard('B')
  const card = await createCard(board.id, 'C')
  const a = await createItem(card.id, 'a')
  await new Promise((r) => setTimeout(r, 2))
  const b = await createItem(card.id, 'b')
  return { card, a, b }
}

describe('setCompleted', () => {
  it('marks an item completed and stamps completedAt', async () => {
    const { a } = await seed()
    await setCompleted(a.id, true)
    const stored = await db.items.get(a.id)
    expect(stored?.completed).toBe(true)
    expect(stored?.completedAt).toBeTypeOf('number')
  })

  it('clears completedAt when set back to false', async () => {
    const { a } = await seed()
    await setCompleted(a.id, true)
    await setCompleted(a.id, false)
    const stored = await db.items.get(a.id)
    expect(stored?.completed).toBe(false)
    expect(stored?.completedAt).toBeNull()
  })

  it('sorts a completed item to the bottom of its card', async () => {
    const { card, a, b } = await seed()
    await setCompleted(a.id, true)
    const items = await listItemsForCard(card.id)
    expect(items.map((i) => i.id)).toEqual([b.id, a.id])
  })
})

describe('toggleCompleted', () => {
  it('flips the flag from any starting state', async () => {
    const { a } = await seed()
    await toggleCompleted(a.id)
    expect((await db.items.get(a.id))?.completed).toBe(true)
    await toggleCompleted(a.id)
    expect((await db.items.get(a.id))?.completed).toBe(false)
  })

  it('is symmetric — same end state regardless of caller context', async () => {
    const { a } = await seed()
    await toggleCompleted(a.id) // imagine: from card view
    const fromCard = await db.items.get(a.id)
    await toggleCompleted(a.id) // imagine: from today panel
    await toggleCompleted(a.id) // imagine: from week panel
    const final = await db.items.get(a.id)
    expect(fromCard?.completed).toBe(true)
    expect(final?.completed).toBe(true)
  })
})
