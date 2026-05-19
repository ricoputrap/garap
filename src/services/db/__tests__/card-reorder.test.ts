import { describe, expect, it } from 'vitest'
import {
  createBoard,
  createCard,
  createItem,
  deleteCard,
  deleteItem,
  listCards,
  reorderCard,
} from '@/services/db'
import {
  addToToday,
  addToWeek,
  clearCompletedToday,
  clearCompletedWeek,
  removeFromToday,
  removeFromWeek,
  reorderTodayCardGroup,
  reorderWeekCardGroup,
} from '@/services/list-refs'
import { setCompleted } from '@/services/completion-sync'
import { db } from '@/services/db/schema'

const tick = () => new Promise<void>((r) => setTimeout(r, 5))

const setupBoard = async (n: number) => {
  const board = await createBoard('B')
  const cards = []
  for (let i = 0; i < n; i += 1) {
    cards.push(await createCard(board.id, `c${i}`))
    await tick()
  }
  return { board, cards }
}

describe('reorderCard', () => {
  it('appends new cards in order', async () => {
    const { board, cards } = await setupBoard(3)
    const listed = await listCards(board.id)
    expect(listed.map((c) => c.id)).toEqual(cards.map((c) => c.id))
  })

  it('moves card to top', async () => {
    const { board, cards } = await setupBoard(3)
    const [a, b, c] = cards
    await reorderCard(c.id, null, a.id)
    const listed = await listCards(board.id)
    expect(listed.map((c) => c.id)).toEqual([c.id, a.id, b.id])
  })

  it('moves card to middle', async () => {
    const { board, cards } = await setupBoard(4)
    const [a, b, c, d] = cards
    await reorderCard(d.id, a.id, b.id)
    const listed = await listCards(board.id)
    expect(listed.map((x) => x.id)).toEqual([a.id, d.id, b.id, c.id])
  })

  it('reorders scoped to board', async () => {
    const boardA = await createBoard('A')
    const boardB = await createBoard('B')
    const a1 = await createCard(boardA.id, 'a1')
    await tick()
    const a2 = await createCard(boardA.id, 'a2')
    await createCard(boardB.id, 'b1')
    await reorderCard(a2.id, null, a1.id)
    const listedA = await listCards(boardA.id)
    expect(listedA.map((c) => c.id)).toEqual([a2.id, a1.id])
  })
})

describe('today card-order lifecycle', () => {
  it('adds a card-order row on first item added to today', async () => {
    const board = await createBoard('B')
    const card = await createCard(board.id, 'C')
    const item = await createItem(card.id, 'i')
    await addToToday(item.id)
    expect(await db.todayCardOrders.get(card.id)).toBeTruthy()
  })

  it('does not duplicate the card-order on second item added', async () => {
    const board = await createBoard('B')
    const card = await createCard(board.id, 'C')
    const i1 = await createItem(card.id, 'i1')
    const i2 = await createItem(card.id, 'i2')
    await addToToday(i1.id)
    await addToToday(i2.id)
    expect(await db.todayCardOrders.count()).toBe(1)
  })

  it('drops the card-order when last ref is removed', async () => {
    const board = await createBoard('B')
    const card = await createCard(board.id, 'C')
    const i1 = await createItem(card.id, 'i1')
    const i2 = await createItem(card.id, 'i2')
    await addToToday(i1.id)
    await addToToday(i2.id)
    await removeFromToday(i1.id)
    expect(await db.todayCardOrders.get(card.id)).toBeTruthy()
    await removeFromToday(i2.id)
    expect(await db.todayCardOrders.get(card.id)).toBeUndefined()
  })

  it('drops the card-order when clearCompletedToday empties the group', async () => {
    const board = await createBoard('B')
    const card = await createCard(board.id, 'C')
    const item = await createItem(card.id, 'i')
    await addToToday(item.id)
    await setCompleted(item.id, true)
    await clearCompletedToday()
    expect(await db.todayCardOrders.get(card.id)).toBeUndefined()
  })

  it('drops the card-order when the only ref-bearing item is deleted', async () => {
    const board = await createBoard('B')
    const card = await createCard(board.id, 'C')
    const item = await createItem(card.id, 'i')
    await addToToday(item.id)
    await deleteItem(item.id)
    expect(await db.todayCardOrders.get(card.id)).toBeUndefined()
  })

  it('drops the card-order when the card itself is deleted', async () => {
    const board = await createBoard('B')
    const card = await createCard(board.id, 'C')
    const item = await createItem(card.id, 'i')
    await addToToday(item.id)
    await deleteCard(card.id)
    expect(await db.todayCardOrders.get(card.id)).toBeUndefined()
  })

  it('reorders today card-groups independently of week', async () => {
    const board = await createBoard('B')
    const c1 = await createCard(board.id, 'c1')
    const c2 = await createCard(board.id, 'c2')
    const i1 = await createItem(c1.id, 'i1')
    const i2 = await createItem(c2.id, 'i2')
    await addToToday(i1.id)
    await addToToday(i2.id)
    await addToWeek(i1.id)
    await addToWeek(i2.id)

    await reorderTodayCardGroup(c2.id, null, c1.id)

    const today = await db.todayCardOrders.toArray()
    today.sort((a, b) => a.order - b.order)
    expect(today.map((o) => o.cardId)).toEqual([c2.id, c1.id])

    const week = await db.weekCardOrders.toArray()
    week.sort((a, b) => a.order - b.order)
    expect(week.map((o) => o.cardId)).toEqual([c1.id, c2.id])
  })
})

describe('week card-order lifecycle', () => {
  it('drops the card-order when last week ref is removed', async () => {
    const board = await createBoard('B')
    const card = await createCard(board.id, 'C')
    const item = await createItem(card.id, 'i')
    await addToWeek(item.id)
    expect(await db.weekCardOrders.get(card.id)).toBeTruthy()
    await removeFromWeek(item.id)
    expect(await db.weekCardOrders.get(card.id)).toBeUndefined()
  })

  it('drops the card-order on clearCompletedWeek of last item', async () => {
    const board = await createBoard('B')
    const card = await createCard(board.id, 'C')
    const item = await createItem(card.id, 'i')
    await addToWeek(item.id)
    await setCompleted(item.id, true)
    await clearCompletedWeek()
    expect(await db.weekCardOrders.get(card.id)).toBeUndefined()
  })

  it('reorderWeekCardGroup moves a group', async () => {
    const board = await createBoard('B')
    const c1 = await createCard(board.id, 'c1')
    const c2 = await createCard(board.id, 'c2')
    const c3 = await createCard(board.id, 'c3')
    const i1 = await createItem(c1.id, 'i1')
    const i2 = await createItem(c2.id, 'i2')
    const i3 = await createItem(c3.id, 'i3')
    await addToWeek(i1.id)
    await addToWeek(i2.id)
    await addToWeek(i3.id)
    await reorderWeekCardGroup(c3.id, c1.id, c2.id)
    const rows = await db.weekCardOrders.toArray()
    rows.sort((a, b) => a.order - b.order)
    expect(rows.map((r) => r.cardId)).toEqual([c1.id, c3.id, c2.id])
  })
})
