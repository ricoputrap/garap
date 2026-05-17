import { startOfLocalDay, startOfLocalWeek } from '@/lib/date'

export const shouldClearToday = (lastClearedAt: number | null, now: number): boolean => {
  if (lastClearedAt == null) return true
  return startOfLocalDay(now) > startOfLocalDay(lastClearedAt)
}

export const shouldClearWeek = (lastClearedAt: number | null, now: number): boolean => {
  if (lastClearedAt == null) return true
  return startOfLocalWeek(now) > startOfLocalWeek(lastClearedAt)
}
