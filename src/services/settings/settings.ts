import type { PanelTab } from '@/types/domain'

const KEYS = {
  activeTab: 'garap.activeTab',
  lastToday: 'garap.lastClearedAtToday',
  lastWeek: 'garap.lastClearedAtWeek',
} as const

const readNumber = (key: string): number | null => {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

const writeNumber = (key: string, value: number): void => {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // localStorage may be unavailable (private mode / quota); silently degrade.
  }
}

export const settings = {
  getActiveTab(): PanelTab {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEYS.activeTab) : null
    return raw === 'week' ? 'week' : 'today'
  },
  setActiveTab(tab: PanelTab): void {
    try {
      localStorage.setItem(KEYS.activeTab, tab)
    } catch {
      /* noop */
    }
  },
  getLastClearedToday: () => readNumber(KEYS.lastToday),
  setLastClearedToday: (ts: number) => writeNumber(KEYS.lastToday, ts),
  getLastClearedWeek: () => readNumber(KEYS.lastWeek),
  setLastClearedWeek: (ts: number) => writeNumber(KEYS.lastWeek, ts),
}
