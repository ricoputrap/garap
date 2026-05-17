import { useCallback, useState } from 'react'
import type { PanelTab } from '@/types/domain'
import { settings } from '@/services/settings'

export const useActiveTab = (): [PanelTab, (tab: PanelTab) => void] => {
  const [tab, setTabState] = useState<PanelTab>(() => settings.getActiveTab())
  const setTab = useCallback((next: PanelTab) => {
    settings.setActiveTab(next)
    setTabState(next)
  }, [])
  return [tab, setTab]
}
