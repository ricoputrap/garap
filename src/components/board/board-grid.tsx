import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Card } from '@/types/domain'
import { useCards } from '@/hooks/use-cards'
import { createCard } from '@/services/db'
import { BoardCard } from './board-card'

interface BoardGridProps {
  boardId: string
}

export const BoardGrid = ({ boardId }: BoardGridProps) => {
  const cards = useCards(boardId)
  const [autoFocusCardId, setAutoFocusCardId] = useState<string | null>(null)

  if (cards === undefined) return <BoardGridSkeleton />

  const handleNewCard = async () => {
    const card = await createCard(boardId, 'New card')
    setAutoFocusCardId(card.id)
  }

  return (
    <div
      className="grid gap-5"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
    >
      {cards.map((card: Card) => (
        <BoardCard key={card.id} card={card} autoFocus={card.id === autoFocusCardId} />
      ))}
      <NewCardTile onClick={handleNewCard} />
    </div>
  )
}

const NewCardTile = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--rule)] bg-transparent text-[var(--fg-3)] transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/40 hover:text-[var(--accent-2)]"
  >
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--rule)] bg-[var(--bg)] transition-all group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
      <Plus className="h-4 w-4" />
    </span>
    <span className="text-sm font-medium">Add a card</span>
  </button>
)

const BoardGridSkeleton = () => (
  <div
    className="grid gap-5"
    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
  >
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex flex-col gap-3 rounded-2xl border border-[var(--rule)] bg-[var(--bg)] p-4 shadow-[var(--shadow-paper)]">
        <div className="skeleton h-5 w-2/3" />
        <div className="skeleton h-3 w-1/3" />
        <div className="mt-2 space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>
    ))}
  </div>
)
