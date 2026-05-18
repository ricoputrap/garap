import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Item } from '@/types/domain'
import { DragHandle, ItemRow } from './item-row'

interface SortableItemRowProps {
  item: Item
}

export const SortableItemRow = ({ item }: SortableItemRowProps) => {
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
    <ItemRow
      ref={setNodeRef}
      item={item}
      liStyle={style}
      liAttributes={{ 'data-dragging': isDragging || undefined }}
      dragHandle={
        <DragHandle
          attributes={attributes as unknown as Record<string, unknown>}
          listeners={listeners as unknown as Record<string, unknown>}
          setRef={setActivatorNodeRef}
        />
      }
    />
  )
}
