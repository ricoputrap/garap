import { db } from '@/services/db/schema'
import type { Snapshot } from './schema'

export const exportSnapshot = async (): Promise<Snapshot> => {
  const [boards, cards, items, todayRefs, weekRefs, todayHistory, weekHistory] =
    await Promise.all([
      db.boards.toArray(),
      db.cards.toArray(),
      db.items.toArray(),
      db.todayRefs.toArray(),
      db.weekRefs.toArray(),
      db.todayHistory.toArray(),
      db.weekHistory.toArray(),
    ])
  return {
    version: 2,
    exportedAt: Date.now(),
    boards,
    cards,
    items,
    todayRefs,
    weekRefs,
    todayHistory,
    weekHistory,
  }
}

export const exportToJson = async (): Promise<string> => {
  const snapshot = await exportSnapshot()
  return JSON.stringify(snapshot, null, 2)
}

export const downloadJson = async (): Promise<void> => {
  const json = await exportToJson()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const stamp = new Date().toISOString().slice(0, 10)
  const link = document.createElement('a')
  link.href = url
  link.download = `garap-backup-${stamp}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
