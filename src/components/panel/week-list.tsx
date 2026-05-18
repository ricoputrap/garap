import { useWeekItems } from '@/hooks/use-week-items'
import { clearCompletedWeek } from '@/services/list-refs/week'
import { ClearButton, PanelList } from './panel-list'

interface WeekListProps {
  showHeader?: boolean
}

export const WeekList = ({ showHeader = true }: WeekListProps) => {
  const items = useWeekItems()
  return (
    <div>
      {showHeader && (
        <div className="mb-2 flex items-center justify-end">
          <ClearButton items={items} onClear={() => clearCompletedWeek()} />
        </div>
      )}
      <PanelList tab="week" items={items} emptyHint="Add items from any card to shape the week." />
    </div>
  )
}
