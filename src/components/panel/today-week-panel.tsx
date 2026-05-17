import { useMemo } from 'react'
import { Eraser } from 'lucide-react'
import type { PanelTab } from '@/types/domain'
import type { PanelItem } from '@/services/db/queries'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { PanelGroup } from './panel-group'
import { useTodayItems } from '@/hooks/use-today-items'
import { useWeekItems } from '@/hooks/use-week-items'
import { useActiveTab } from '@/hooks/use-active-tab'
import { clearCompletedToday } from '@/services/list-refs/today'
import { clearCompletedWeek } from '@/services/list-refs/week'

interface Group {
  cardId: string
  cardTitle: string
  boardName: string
  items: PanelItem[]
}

const groupByCard = (items: PanelItem[]): Group[] => {
  const map = new Map<string, Group>()
  for (const entry of items) {
    const key = entry.card.id
    const existing = map.get(key)
    if (existing) {
      existing.items.push(entry)
    } else {
      map.set(key, {
        cardId: key,
        cardTitle: entry.card.title,
        boardName: entry.board.name,
        items: [entry],
      })
    }
  }
  return [...map.values()]
}

export const TodayWeekPanel = () => {
  const [tab, setTab] = useActiveTab()
  const today = useTodayItems()
  const week = useWeekItems()

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
          <ClearButton tab={tab} today={today} week={week} />
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

interface ClearButtonProps {
  tab: PanelTab
  today: PanelItem[] | undefined
  week: PanelItem[] | undefined
}

const ClearButton = ({ tab, today, week }: ClearButtonProps) => {
  const list = tab === 'today' ? today : week
  const hasCompleted = list?.some((p) => p.item.completed) ?? false
  const onClick = () => (tab === 'today' ? clearCompletedToday() : clearCompletedWeek())
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onClick()}
      disabled={!hasCompleted}
      aria-label="Clear completed"
    >
      <Eraser className="h-3.5 w-3.5" />
      Clear done
    </Button>
  )
}

interface PanelListProps {
  tab: PanelTab
  items: PanelItem[] | undefined
  emptyHint: string
}

const PanelList = ({ tab, items, emptyHint }: PanelListProps) => {
  const groups = useMemo(() => (items ? groupByCard(items) : []), [items])

  if (items === undefined) return <PanelSkeleton />

  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-[var(--rule)] bg-[var(--bg)] px-4 py-8 text-center">
        <p className="font-display text-base italic text-[var(--fg-3)]">An open page.</p>
        <p className="mt-1 text-xs text-[var(--fg-3)]">{emptyHint}</p>
      </div>
    )
  }

  return (
    <div className="scrollbar-paper mt-2 max-h-[calc(100vh-260px)] space-y-5 overflow-y-auto pr-1">
      {groups.map((g) => (
        <PanelGroup
          key={g.cardId}
          cardTitle={g.cardTitle}
          boardName={g.boardName}
          items={g.items}
          tab={tab}
        />
      ))}
    </div>
  )
}

const PanelSkeleton = () => (
  <div className="mt-4 space-y-5">
    {[0, 1].map((g) => (
      <div key={g} className="space-y-2">
        <div className="skeleton h-4 w-32" />
        <div className="space-y-1.5">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
        </div>
      </div>
    ))}
  </div>
)
