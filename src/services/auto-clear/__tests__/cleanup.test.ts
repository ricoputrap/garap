import { describe, expect, it } from 'vitest'
import { db } from '@/services/db/schema'
import {
  createBoard,
  createCard,
  createItem,
} from '@/services/db'
import { addToToday, addToWeek } from '@/services/list-refs'
import { setCompleted } from '@/services/completion-sync'
import { runCleanup } from '@/services/auto-clear'

const seedWithMixedState = async () => {
  const board = await createBoard('B')
  const card = await createCard(board.id, 'C')
  const active = await createItem(card.id, 'active')
  const done = await createItem(card.id, 'done')
  await addToToday(active.id)
  await addToToday(done.id)
  await addToWeek(active.id)
  await addToWeek(done.id)
  await setCompleted(done.id, true)
  return { active, done }
}

describe('runCleanup', () => {
  it('removes only completed refs from Today; uncompleted refs carry over', async () => {
    const { active, done } = await seedWithMixedState()

    const result = await runCleanup({ today: true, week: false })

    expect(result.todayCleared).toBe(1)
    expect(result.weekCleared).toBe(0)
    expect(await db.todayRefs.get(active.id)).toBeDefined()
    expect(await db.todayRefs.get(done.id)).toBeUndefined()
    // Week store untouched
    expect(await db.weekRefs.get(done.id)).toBeDefined()
  })

  it('underlying Item rows are never deleted by cleanup', async () => {
    const { done } = await seedWithMixedState()
    await runCleanup({ today: true, week: true })
    expect(await db.items.get(done.id)).toBeDefined()
  })

  it('is idempotent — second run is a no-op', async () => {
    await seedWithMixedState()
    const first = await runCleanup({ today: true, week: true })
    const second = await runCleanup({ today: true, week: true })
    expect(first.todayCleared + first.weekCleared).toBeGreaterThan(0)
    expect(second.todayCleared).toBe(0)
    expect(second.weekCleared).toBe(0)
  })
})
