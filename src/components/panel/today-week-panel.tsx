import type { PanelTab } from '@/types/domain'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Eraser } from 'lucide-react'
import { useActiveTab } from '@/hooks/use-active-tab'
import { useTodayItems } from '@/hooks/use-today-items'
import { useWeekItems } from '@/hooks/use-week-items'
import { clearCompletedToday } from '@/services/list-refs/today'
import { clearCompletedWeek } from '@/services/list-refs/week'
import { PanelList } from './panel-list'

export const TodayWeekPanel = () => {
  const [tab, setTab] = useActiveTab()
  const today = useTodayItems()
  const week = useWeekItems()
  const activeItems = tab === 'today' ? today : week
  const hasCompleted = activeItems?.some((p) => p.item.completed) ?? false
  const onClear = () => (tab === 'today' ? clearCompletedToday() : clearCompletedWeek())

  return (
    <div className="sticky top-8 flex h-full flex-col">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="smallcaps text-[var(--accent)]">the schedule</p>
          <h2 className="font-display text-2xl font-medium tracking-tight text-[var(--fg)]">
            What’s on
          </h2>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as PanelTab)}>
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={!hasCompleted}
            aria-label="Clear completed"
          >
            <Eraser className="h-3.5 w-3.5" />
            Clear done
          </Button>
        </div>

        <TabsContent value="today">
          <PanelList tab="today" items={today} emptyHint="Add items from any card to plan your day." />
        </TabsContent>
        <TabsContent value="week">
          <PanelList tab="week" items={week} emptyHint="Add items from any card to shape the week." />
        </TabsContent>
      </Tabs>
    </div>
  )
}
