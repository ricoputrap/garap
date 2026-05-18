import { useMemo, useState } from 'react'
import { MoreHorizontal, Trash2, Eraser } from 'lucide-react'
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
import type { Card, Item } from '@/types/domain'
import { useCardItems } from '@/hooks/use-card-items'
import { InlineEdit } from '@/components/inline/inline-edit'
import { ItemRow } from '@/components/item/item-row'
import { SortableItemRow } from '@/components/item/sortable-item-row'
import { NewItemInput } from '@/components/item/new-item-input'
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog'
import { clearCompletedInCard, deleteCard, renameCard, reorderItem } from '@/services/db'
import { cn } from '@/lib/cn'

interface BoardCardProps {
  card: Card
  autoFocus?: boolean
}

export const BoardCard = ({ card, autoFocus = false }: BoardCardProps) => {
  const items = useCardItems(card.id)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const activeCount = items?.filter((i) => !i.completed).length ?? 0
  const totalCount = items?.length ?? 0
  const hasCompleted = (items?.length ?? 0) > activeCount

  return (
    <article className="group relative flex flex-col rounded-2xl border border-[var(--rule)] bg-[var(--bg)] shadow-[var(--shadow-paper)] transition-all hover:border-[var(--fg-3)]/40 hover:shadow-[0_2px_0_var(--rule),0_18px_36px_-24px_rgba(0,0,0,0.28)]">
      <div className="rule-line flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <InlineEdit
            value={card.title}
            onSave={(next) => renameCard(card.id, next)}
            className="block w-full"
            inputClassName="font-display text-lg font-medium text-[var(--fg)] w-full"
            renderRead={(v) => (
              <h3 className="font-display text-lg font-medium tracking-tight text-[var(--fg)]">
                {v}
              </h3>
            )}
            ariaLabel="Edit card title"
            autoEdit={autoFocus}
          />
          <p className="smallcaps mt-1 text-[var(--fg-3)]">
            {activeCount} active · {totalCount} total
          </p>
        </div>
        <CardMenu
          hasCompleted={hasCompleted}
          onClear={() => clearCompletedInCard(card.id)}
          onDelete={() => setConfirmDelete(true)}
        />
      </div>

      <div className="flex max-h-[260px] min-h-[40px] flex-1 flex-col">
        <div className={cn('scrollbar-paper flex-1 overflow-y-auto px-2 py-1.5')}>
          {items === undefined ? (
            <ItemsSkeleton />
          ) : items.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs italic text-[var(--fg-3)]">
              Nothing here yet — type below.
            </p>
          ) : (
            <CardItems items={items} />
          )}
        </div>
        <NewItemInput cardId={card.id} />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${card.title}"?`}
        description="This removes the card and every task inside it. It also pulls any of those tasks out of Today and Week."
        confirmLabel="Delete card"
        destructive
        onConfirm={() => deleteCard(card.id)}
      />
    </article>
  )
}

interface CardMenuProps {
  hasCompleted: boolean
  onClear: () => void
  onDelete: () => void
}

const CardMenu = ({ hasCompleted, onClear, onDelete }: CardMenuProps) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--fg-3)] opacity-0 transition-all hover:bg-[var(--bg-2)] hover:text-[var(--fg)] group-hover:opacity-100 data-[open=true]:opacity-100"
        data-open={open}
        aria-label="Card actions"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 min-w-[180px] rounded-xl border border-[var(--rule)] bg-[var(--bg)] py-1 shadow-[var(--shadow-paper)]">
            <button
              type="button"
              disabled={!hasCompleted}
              onClick={() => {
                onClear()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--fg)] transition-colors hover:bg-[var(--bg-2)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear completed
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--accent-2)] transition-colors hover:bg-[var(--accent-soft)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete card
            </button>
          </div>
        </>
      )}
    </div>
  )
}

interface CardItemsProps {
  items: Item[]
}

const CardItems = ({ items }: CardItemsProps) => {
  const active = useMemo(() => items.filter((i) => !i.completed), [items])
  const completed = useMemo(() => items.filter((i) => i.completed), [items])
  const activeIds = useMemo(() => active.map((i) => i.id), [active])

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
    void reorderItem(String(dragged.id), before, after)
  }

  return (
    <ul className="space-y-0">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={activeIds} strategy={verticalListSortingStrategy}>
          {active.map((item) => (
            <SortableItemRow key={item.id} item={item} />
          ))}
        </SortableContext>
      </DndContext>
      {completed.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </ul>
  )
}

const ItemsSkeleton = () => (
  <div className="space-y-2 px-2 py-2">
    {[0.95, 0.7, 0.85].map((w, i) => (
      <div key={i} className="skeleton h-4" style={{ width: `${w * 100}%` }} />
    ))}
  </div>
)
