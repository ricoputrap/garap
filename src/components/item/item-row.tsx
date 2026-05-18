import { forwardRef, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Calendar, CalendarRange, GripVertical, Trash2 } from 'lucide-react'
import type { Item } from '@/types/domain'
import { cn } from '@/lib/cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { InlineEdit } from '@/components/inline/inline-edit'
import { deleteItem, renameItem } from '@/services/db'
import { toggleCompleted } from '@/services/completion-sync'
import {
  addToToday,
  addToWeek,
  isInToday,
  isInWeek,
  removeFromToday,
  removeFromWeek,
} from '@/services/list-refs'
import { Checkbox } from './checkbox'

interface ItemRowProps {
  item: Item
  dragHandle?: ReactNode
  liStyle?: CSSProperties
  liClassName?: string
  liAttributes?: Record<string, unknown>
}

export const ItemRow = forwardRef<HTMLLIElement, ItemRowProps>(function ItemRow(
  { item, dragHandle, liStyle, liClassName, liAttributes },
  ref,
) {
  const [inToday, setInToday] = useState(false)
  const [inWeek, setInWeek] = useState(false)

  useEffect(() => {
    void isInToday(item.id).then(setInToday)
    void isInWeek(item.id).then(setInWeek)
  }, [item.id])

  const toggleToday = async () => {
    if (inToday) {
      await removeFromToday(item.id)
      setInToday(false)
    } else {
      await addToToday(item.id)
      setInToday(true)
    }
  }

  const toggleWeek = async () => {
    if (inWeek) {
      await removeFromWeek(item.id)
      setInWeek(false)
    } else {
      await addToWeek(item.id)
      setInWeek(true)
    }
  }

  return (
    <li
      ref={ref}
      style={liStyle}
      className={cn(
        'group flex items-start gap-1 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-[var(--bg-2)]',
        liClassName,
      )}
      {...liAttributes}
    >
      {dragHandle}
      <div className="flex h-7 items-center">
        <Checkbox checked={item.completed} onChange={() => toggleCompleted(item.id)} />
      </div>
      <div className="min-w-0 flex-1 py-1">
        <InlineEdit
          value={item.name}
          onSave={(next) => renameItem(item.id, next)}
          className="block w-full text-sm text-[var(--fg)]"
          renderRead={(v) => (
            <span
              className={cn(
                'block text-sm leading-snug break-words',
                item.completed
                  ? 'text-[var(--fg-3)] line-through decoration-[var(--fg-3)]/60'
                  : 'text-[var(--fg)]',
              )}
            >
              {v}
            </span>
          )}
          ariaLabel="Edit task name"
        />
      </div>
      <div className="flex h-7 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
        <IconToggle
          active={inToday}
          onClick={toggleToday}
          label={inToday ? 'Remove from Today' : 'Add to Today'}
        >
          <Calendar className="h-3.5 w-3.5" />
        </IconToggle>
        <IconToggle
          active={inWeek}
          onClick={toggleWeek}
          label={inWeek ? 'Remove from Week' : 'Add to Week'}
        >
          <CalendarRange className="h-3.5 w-3.5" />
        </IconToggle>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => deleteItem(item.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--fg-3)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent-2)]"
              aria-label="Delete task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </li>
  )
})

interface IconToggleProps {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}

const IconToggle = ({ active, onClick, label, children }: IconToggleProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={label}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
          active
            ? 'bg-[var(--accent-soft)] text-[var(--accent-2)]'
            : 'text-[var(--fg-3)] hover:bg-[var(--bg-3)] hover:text-[var(--fg)]',
        )}
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
)

interface DragHandleProps {
  attributes?: Record<string, unknown>
  listeners?: Record<string, unknown>
  setRef?: (el: HTMLElement | null) => void
}

export const DragHandle = ({ attributes, listeners, setRef }: DragHandleProps) => (
  <button
    type="button"
    ref={setRef}
    aria-label="Reorder task"
    className="flex h-7 w-4 shrink-0 cursor-grab items-center justify-center text-[var(--fg-3)] opacity-0 transition-opacity hover:text-[var(--fg)] group-hover:opacity-100 active:cursor-grabbing"
    {...attributes}
    {...listeners}
  >
    <GripVertical className="h-3.5 w-3.5" />
  </button>
)
