import { snapshotAndClearToday, snapshotAndClearWeek } from '@/services/history'

export interface CleanupResult {
  todayCleared: number
  weekCleared: number
}

export const runCleanup = async (
  which: { today: boolean; week: boolean },
  now: number = Date.now(),
): Promise<CleanupResult> => {
  const todayCleared = which.today ? (await snapshotAndClearToday(now)).count : 0
  const weekCleared = which.week ? (await snapshotAndClearWeek(now)).count : 0
  return { todayCleared, weekCleared }
}
