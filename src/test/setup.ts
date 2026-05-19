import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { db } from '@/services/db/schema'

afterEach(async () => {
  await Promise.all([
    db.boards.clear(),
    db.cards.clear(),
    db.items.clear(),
    db.todayRefs.clear(),
    db.weekRefs.clear(),
    db.todayHistory.clear(),
    db.weekHistory.clear(),
    db.todayCardOrders.clear(),
    db.weekCardOrders.clear(),
  ])
  localStorage.clear()
})
