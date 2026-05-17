import { X } from 'lucide-react'
import type { Item, PanelTab } from '@/types/domain'
import { cn } from '@/lib/cn'
import { Checkbox } from '@/components/item/checkbox'
import { toggleCompleted } from '@/services/completion-sync'
import { removeFromToday, removeFromWeek } from '@/services/list-refs'

interface PanelItemRowProps {
  item: Item
  tab: PanelTab
}

export const PanelItemRow = ({ item, tab }: PanelItemRowProps) => {
  const handleRemove = () =>
    tab === 'today' ? removeFromToday(item.id) : removeFromWeek(item.id)

  return (
    <li className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--bg)]">
      <Checkbox checked={item.completed} onChange={() => toggleCompleted(item.id)} />
      <span
        className={cn(
          'flex-1 truncate text-sm leading-snug',
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
        className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--fg-3)] opacity-0 transition-all hover:bg-[var(--accent-soft)] hover:text-[var(--accent-2)] group-hover:opacity-100"
        aria-label={`Remove from ${tab === 'today' ? 'Today' : 'Week'}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}
