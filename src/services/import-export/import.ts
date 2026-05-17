import { db } from '@/services/db/schema'
import { snapshotSchema, type Snapshot } from './schema'

export class ImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportError'
  }
}

const parse = (raw: string): Snapshot => {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    throw new ImportError('File is not valid JSON.')
  }
  const result = snapshotSchema.safeParse(json)
  if (!result.success) {
    throw new ImportError('Backup shape is invalid — wrong file?')
  }
  return result.data
}

/** Atomically replaces the entire database with the snapshot. */
export const importFromJson = async (raw: string): Promise<void> => {
  const snapshot = parse(raw)
  await db.transaction(
    'rw',
    [db.boards, db.cards, db.items, db.todayRefs, db.weekRefs],
    async () => {
      await Promise.all([
        db.boards.clear(),
        db.cards.clear(),
        db.items.clear(),
        db.todayRefs.clear(),
        db.weekRefs.clear(),
      ])
      await Promise.all([
        db.boards.bulkAdd(snapshot.boards),
        db.cards.bulkAdd(snapshot.cards),
        db.items.bulkAdd(snapshot.items),
        db.todayRefs.bulkAdd(snapshot.todayRefs),
        db.weekRefs.bulkAdd(snapshot.weekRefs),
      ])
    },
  )
}
