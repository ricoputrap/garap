import { GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { PanelTab } from '@/types/domain'
import type { PanelItem } from '@/services/db/queries'
import { PanelGroup } from './panel-group'

interface SortablePanelGroupProps {
  cardId: string
  cardTitle: string
  boardName: string
  items: PanelItem[]
  tab: PanelTab
}

export const SortablePanelGroup = ({
  cardId,
  cardTitle,
  boardName,
  items,
  tab,
}: SortablePanelGroupProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cardId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : undefined,
  }

  return (
    <PanelGroup
      ref={setNodeRef}
      cardTitle={cardTitle}
      boardName={boardName}
      items={items}
      tab={tab}
      sectionStyle={style}
      sectionAttributes={{ 'data-dragging': isDragging || undefined }}
      dragHandle={
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label="Reorder card group"
          className="flex h-5 w-4 shrink-0 cursor-grab items-center justify-center text-[var(--fg-3)] opacity-0 transition-opacity hover:text-[var(--fg)] group-hover:opacity-100 active:cursor-grabbing"
          {...(attributes as unknown as Record<string, unknown>)}
          {...(listeners as unknown as Record<string, unknown>)}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      }
    />
  )
}
