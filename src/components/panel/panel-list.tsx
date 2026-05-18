import { useMemo } from 'react'
import { Eraser } from 'lucide-react'
import type { PanelTab } from '@/types/domain'
import type { PanelItem } from '@/services/db/queries'
import { Button } from '@/components/ui/button'
import { PanelGroup } from './panel-group'

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

interface PanelListProps {
  tab: PanelTab
  items: PanelItem[] | undefined
  emptyHint: string
}

export const PanelList = ({ tab, items, emptyHint }: PanelListProps) => {
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
    <div className="scrollbar-paper mt-2 max-h-[calc(100vh-260px)] space-y-5 overflow-y-auto pr-1 md:max-h-[calc(100vh-260px)]">
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

interface ClearButtonProps {
  items: PanelItem[] | undefined
  onClear: () => void
}

export const ClearButton = ({ items, onClear }: ClearButtonProps) => {
  const hasCompleted = items?.some((p) => p.item.completed) ?? false
  return (
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
