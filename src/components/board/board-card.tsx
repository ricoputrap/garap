import { useState } from 'react'
import { MoreHorizontal, Trash2, Eraser } from 'lucide-react'
import type { Card } from '@/types/domain'
import { useCardItems } from '@/hooks/use-card-items'
import { InlineEdit } from '@/components/inline/inline-edit'
import { ItemRow } from '@/components/item/item-row'
import { NewItemInput } from '@/components/item/new-item-input'
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog'
import { clearCompletedInCard, deleteCard, renameCard } from '@/services/db'
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
        <ul className={cn('scrollbar-paper flex-1 overflow-y-auto px-2 py-1.5')}>
          {items === undefined ? (
            <ItemsSkeleton />
          ) : items.length === 0 ? (
            <li className="px-2 py-4 text-center text-xs italic text-[var(--fg-3)]">
              Nothing here yet — type below.
            </li>
          ) : (
            items.map((item) => <ItemRow key={item.id} item={item} />)
          )}
        </ul>
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

const ItemsSkeleton = () => (
  <div className="space-y-2 px-2 py-2">
    {[0.95, 0.7, 0.85].map((w, i) => (
      <div key={i} className="skeleton h-4" style={{ width: `${w * 100}%` }} />
    ))}
  </div>
)
