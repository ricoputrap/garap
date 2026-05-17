import { nextLocalMidnight, nextLocalWeekStart } from '@/lib/date'
import { settings } from '@/services/settings'
import { shouldClearToday, shouldClearWeek } from './boundaries'
import { runCleanup } from './cleanup'

const SAFETY_BUFFER_MS = 250

/**
 * Idempotent boundary maintenance: prunes on load if a boundary was crossed
 * while the app was closed, then schedules timers until the next boundaries.
 */
export const startAutoClear = (): (() => void) => {
  let todayTimer: number | undefined
  let weekTimer: number | undefined
  let disposed = false

  const tick = async () => {
    if (disposed) return
    const now = Date.now()
    const lastToday = settings.getLastClearedToday()
    const lastWeek = settings.getLastClearedWeek()
    const need = {
      today: shouldClearToday(lastToday, now),
      week: shouldClearWeek(lastWeek, now),
    }
    if (need.today || need.week) {
      await runCleanup(need)
      if (need.today) settings.setLastClearedToday(now)
      if (need.week) settings.setLastClearedWeek(now)
    }
    if (disposed) return
    todayTimer = window.setTimeout(tick, nextLocalMidnight(now) - now + SAFETY_BUFFER_MS)
    weekTimer = window.setTimeout(tick, nextLocalWeekStart(now) - now + SAFETY_BUFFER_MS)
  }

  void tick()

  return () => {
    disposed = true
    if (todayTimer) clearTimeout(todayTimer)
    if (weekTimer) clearTimeout(weekTimer)
  }
}
