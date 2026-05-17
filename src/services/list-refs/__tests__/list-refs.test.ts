import { describe, expect, it } from 'vitest'
import { db } from '@/services/db/schema'
import { createBoard, createCard, createItem } from '@/services/db'
import {
  addToToday,
  addToWeek,
  isInToday,
  isInWeek,
  removeFromToday,
} from '@/services/list-refs'

const seedItem = async () => {
  const board = await createBoard('B')
  const card = await createCard(board.id, 'C')
  return createItem(card.id, 'task')
}

describe('today refs', () => {
  it('adding the same item twice yields a single ref', async () => {
    const item = await seedItem()
    await addToToday(item.id)
    await addToToday(item.id)
    expect(await db.todayRefs.count()).toBe(1)
  })

  it('isInToday reflects membership', async () => {
    const item = await seedItem()
    expect(await isInToday(item.id)).toBe(false)
    await addToToday(item.id)
    expect(await isInToday(item.id)).toBe(true)
    await removeFromToday(item.id)
    expect(await isInToday(item.id)).toBe(false)
  })

  it('removing an absent ref is a no-op', async () => {
    await expect(removeFromToday('nope')).resolves.not.toThrow()
  })
})

describe('week refs', () => {
  it('adding the same item twice yields a single ref', async () => {
    const item = await seedItem()
    await addToWeek(item.id)
    await addToWeek(item.id)
    expect(await db.weekRefs.count()).toBe(1)
  })

  it('isInWeek reflects membership', async () => {
    const item = await seedItem()
    expect(await isInWeek(item.id)).toBe(false)
    await addToWeek(item.id)
    expect(await isInWeek(item.id)).toBe(true)
  })
})

describe('today and week are independent stores', () => {
  it('adding to Today does not touch Week and vice versa', async () => {
    const item = await seedItem()
    await addToToday(item.id)
    expect(await isInToday(item.id)).toBe(true)
    expect(await isInWeek(item.id)).toBe(false)

    await addToWeek(item.id)
    await removeFromToday(item.id)
    expect(await isInToday(item.id)).toBe(false)
    expect(await isInWeek(item.id)).toBe(true)
  })
})
