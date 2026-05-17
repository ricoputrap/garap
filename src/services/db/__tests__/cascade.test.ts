import { describe, expect, it } from 'vitest'
import { db } from '@/services/db/schema'
import {
  createBoard,
  createCard,
  createItem,
  deleteBoard,
  deleteCard,
  deleteItem,
} from '@/services/db'
import { addToToday, addToWeek } from '@/services/list-refs'

describe('cascade delete', () => {
  it('deleting a board removes its cards, items, and refs', async () => {
    const board = await createBoard('B')
    const sibling = await createBoard('Other')
    const card = await createCard(board.id, 'C')
    const item = await createItem(card.id, 'I')
    await addToToday(item.id)
    await addToWeek(item.id)

    const siblingCard = await createCard(sibling.id, 'Keep')
    const siblingItem = await createItem(siblingCard.id, 'Keep me')

    await deleteBoard(board.id)

    expect(await db.boards.get(board.id)).toBeUndefined()
    expect(await db.cards.get(card.id)).toBeUndefined()
    expect(await db.items.get(item.id)).toBeUndefined()
    expect(await db.todayRefs.get(item.id)).toBeUndefined()
    expect(await db.weekRefs.get(item.id)).toBeUndefined()

    // Sibling untouched
    expect(await db.boards.get(sibling.id)).toBeDefined()
    expect(await db.cards.get(siblingCard.id)).toBeDefined()
    expect(await db.items.get(siblingItem.id)).toBeDefined()
  })

  it('deleting a card removes its items and refs but leaves siblings', async () => {
    const board = await createBoard('B')
    const target = await createCard(board.id, 'Target')
    const keep = await createCard(board.id, 'Keep')

    const targetItem = await createItem(target.id, 'i1')
    const keepItem = await createItem(keep.id, 'i2')
    await addToToday(targetItem.id)
    await addToWeek(keepItem.id)

    await deleteCard(target.id)

    expect(await db.cards.get(target.id)).toBeUndefined()
    expect(await db.items.get(targetItem.id)).toBeUndefined()
    expect(await db.todayRefs.get(targetItem.id)).toBeUndefined()

    expect(await db.cards.get(keep.id)).toBeDefined()
    expect(await db.items.get(keepItem.id)).toBeDefined()
    expect(await db.weekRefs.get(keepItem.id)).toBeDefined()
  })

  it('deleting an item removes its refs but leaves siblings', async () => {
    const board = await createBoard('B')
    const card = await createCard(board.id, 'C')
    const target = await createItem(card.id, 'Delete me')
    const keep = await createItem(card.id, 'Keep me')

    await addToToday(target.id)
    await addToWeek(target.id)
    await addToToday(keep.id)

    await deleteItem(target.id)

    expect(await db.items.get(target.id)).toBeUndefined()
    expect(await db.todayRefs.get(target.id)).toBeUndefined()
    expect(await db.weekRefs.get(target.id)).toBeUndefined()

    expect(await db.items.get(keep.id)).toBeDefined()
    expect(await db.todayRefs.get(keep.id)).toBeDefined()
  })
})
