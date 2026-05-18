import { useTodayItems } from '@/hooks/use-today-items'
import { clearCompletedToday } from '@/services/list-refs/today'
import { ClearButton, PanelList } from './panel-list'

interface TodayListProps {
  showHeader?: boolean
}

export const TodayList = ({ showHeader = true }: TodayListProps) => {
  const items = useTodayItems()
  return (
    <div>
      {showHeader && (
        <div className="mb-2 flex items-center justify-end">
          <ClearButton items={items} onClear={() => clearCompletedToday()} />
        </div>
      )}
      <PanelList tab="today" items={items} emptyHint="Add items from any card to plan your day." />
    </div>
  )
}
