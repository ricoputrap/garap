import { clearCompletedToday } from '@/services/list-refs/today'
import { clearCompletedWeek } from '@/services/list-refs/week'

export interface CleanupResult {
  todayCleared: number
  weekCleared: number
}

export const runCleanup = async (which: { today: boolean; week: boolean }): Promise<CleanupResult> => {
  const todayCleared = which.today ? await clearCompletedToday() : 0
  const weekCleared = which.week ? await clearCompletedWeek() : 0
  return { todayCleared, weekCleared }
}
