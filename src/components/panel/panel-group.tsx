import { useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { PanelTab } from '@/types/domain'
import type { PanelItem } from '@/services/db/queries'
import { reorderTodayRef } from '@/services/list-refs/today'
import { reorderWeekRef } from '@/services/list-refs/week'
import { PanelItemRow, SortablePanelItemRow } from './panel-item-row'

interface PanelGroupProps {
  cardTitle: string
  boardName: string
  items: PanelItem[]
  tab: PanelTab
}

export const PanelGroup = ({ cardTitle, boardName, items, tab }: PanelGroupProps) => {
  const active = useMemo(() => items.filter((p) => !p.item.completed), [items])
  const completed = useMemo(() => items.filter((p) => p.item.completed), [items])
  const activeIds = useMemo(() => active.map((p) => p.item.id), [active])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active: dragged, over } = event
    if (!over || dragged.id === over.id) return
    const fromIdx = activeIds.indexOf(String(dragged.id))
    const toIdx = activeIds.indexOf(String(over.id))
    if (fromIdx < 0 || toIdx < 0) return
    const next = arrayMove(activeIds, fromIdx, toIdx)
    const newPos = next.indexOf(String(dragged.id))
    const before = newPos > 0 ? next[newPos - 1] : null
    const after = newPos < next.length - 1 ? next[newPos + 1] : null
    const reorder = tab === 'today' ? reorderTodayRef : reorderWeekRef
    void reorder(String(dragged.id), before, after)
  }

  return (
    <section className="space-y-2">
      <header className="flex items-baseline gap-2 px-1">
        <h3 className="font-display text-base font-medium tracking-tight text-[var(--fg)]">
          {cardTitle}
        </h3>
        <span className="rounded-full border border-[var(--rule)] bg-[var(--bg)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--fg-3)]">
          {boardName}
        </span>
      </header>
      <ul className="space-y-0.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={activeIds} strategy={verticalListSortingStrategy}>
            {active.map(({ item }) => (
              <SortablePanelItemRow key={item.id} item={item} tab={tab} />
            ))}
          </SortableContext>
        </DndContext>
        {completed.map(({ item }) => (
          <PanelItemRow key={item.id} item={item} tab={tab} />
        ))}
      </ul>
    </section>
  )
}
