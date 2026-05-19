import { GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from '@/types/domain'
import { BoardCard } from './board-card'

interface SortableBoardCardProps {
  card: Card
  autoFocus?: boolean
}

export const SortableBoardCard = ({ card, autoFocus }: SortableBoardCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : undefined,
  }

  return (
    <BoardCard
      ref={setNodeRef}
      card={card}
      autoFocus={autoFocus}
      articleStyle={style}
      articleAttributes={{ 'data-dragging': isDragging || undefined }}
      dragHandle={
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label="Reorder card"
          className="flex h-7 w-5 shrink-0 cursor-grab items-center justify-center text-[var(--fg-3)] opacity-0 transition-opacity hover:text-[var(--fg)] group-hover:opacity-100 active:cursor-grabbing"
          {...(attributes as unknown as Record<string, unknown>)}
          {...(listeners as unknown as Record<string, unknown>)}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      }
    />
  )
}
