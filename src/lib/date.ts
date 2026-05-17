/**
 * Local-time boundary helpers for Today (midnight) and Week (Monday 00:00).
 * All math uses the host's local timezone — never UTC.
 */

export const startOfLocalDay = (ts: number): number => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const nextLocalMidnight = (ts: number): number => {
  const d = new Date(ts)
  d.setHours(24, 0, 0, 0)
  return d.getTime()
}

/** Most-recent Monday at 00:00 local. ISO week: Monday = 1. */
export const startOfLocalWeek = (ts: number): number => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0=Sun..6=Sat
  const diff = (day + 6) % 7 // back to Monday
  d.setDate(d.getDate() - diff)
  return d.getTime()
}

export const nextLocalWeekStart = (ts: number): number => {
  const start = startOfLocalWeek(ts)
  const d = new Date(start)
  d.setDate(d.getDate() + 7)
  return d.getTime()
}

export const formatRelative = (ts: number, now = Date.now()): string => {
  const diff = now - ts
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
