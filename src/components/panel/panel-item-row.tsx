import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import { GripVertical, X } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Item, PanelTab } from '@/types/domain'
import { cn } from '@/lib/cn'
import { Checkbox } from '@/components/item/checkbox'
import { toggleCompleted } from '@/services/completion-sync'
import { removeFromToday, removeFromWeek } from '@/services/list-refs'

interface PanelItemRowProps {
  item: Item
  tab: PanelTab
  dragHandle?: ReactNode
  liStyle?: CSSProperties
  liAttributes?: Record<string, unknown>
}

const PanelItemRowInner = forwardRef<HTMLLIElement, PanelItemRowProps>(
  function PanelItemRowInner({ item, tab, dragHandle, liStyle, liAttributes }, ref) {
    const handleRemove = () =>
      tab === 'today' ? removeFromToday(item.id) : removeFromWeek(item.id)

    return (
      <li
        ref={ref}
        style={liStyle}
        className="group flex items-start gap-1 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-[var(--bg)]"
        {...liAttributes}
      >
        {dragHandle}
        <div className="flex h-6 items-center">
          <Checkbox checked={item.completed} onChange={() => toggleCompleted(item.id)} />
        </div>
        <span
          className={cn(
            'flex-1 text-sm leading-snug break-words',
            item.completed
              ? 'text-[var(--fg-3)] line-through decoration-[var(--fg-3)]/60'
              : 'text-[var(--fg)]',
          )}
        >
          {item.name}
        </span>
        <button
          type="button"
          onClick={handleRemove}
          className="mt-0 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--fg-3)] opacity-0 transition-all hover:bg-[var(--accent-soft)] hover:text-[var(--accent-2)] group-hover:opacity-100"
          aria-label={`Remove from ${tab === 'today' ? 'Today' : 'Week'}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </li>
    )
  },
)

export const PanelItemRow = ({ item, tab }: { item: Item; tab: PanelTab }) => (
  <PanelItemRowInner item={item} tab={tab} />
)

interface SortablePanelItemRowProps {
  item: Item
  tab: PanelTab
}

export const SortablePanelItemRow = ({ item, tab }: SortablePanelItemRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <PanelItemRowInner
      ref={setNodeRef}
      item={item}
      tab={tab}
      liStyle={style}
      liAttributes={{ 'data-dragging': isDragging || undefined }}
      dragHandle={
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label="Reorder task"
          className="flex h-6 w-4 shrink-0 cursor-grab items-center justify-center text-[var(--fg-3)] opacity-0 transition-opacity hover:text-[var(--fg)] group-hover:opacity-100 active:cursor-grabbing"
          {...(attributes as unknown as Record<string, unknown>)}
          {...(listeners as unknown as Record<string, unknown>)}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      }
    />
  )
}
