import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Plus, Trash2 } from 'lucide-react'
import type { Board } from '@/types/domain'
import { useBoards } from '@/hooks/use-boards'
import { createBoard, deleteBoard, renameBoard } from '@/services/db'
import { Button } from '@/components/ui/button'
import { InlineEdit } from '@/components/inline/inline-edit'
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog'
import { EmptyState } from './empty-state'
import { formatRelative } from '@/lib/date'

export const BoardIndexList = () => {
  const boards = useBoards()
  const [pendingDelete, setPendingDelete] = useState<Board | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setError(null)
    try {
      await createBoard('Untitled board')
    } catch {
      setError('Could not create the board. Try again.')
    }
  }

  if (boards === undefined) return <IndexSkeleton />

  if (boards.length === 0) {
    return (
      <div className="space-y-8">
        <Header onCreate={handleCreate} disabled={false} />
        {error && (
          <p role="alert" className="text-sm text-[var(--accent-2)]">
            {error}
          </p>
        )}
        <EmptyState onCreate={handleCreate} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Header onCreate={handleCreate} disabled={false} />
      {error && (
        <p role="alert" className="text-sm text-[var(--accent-2)]">
          {error}
        </p>
      )}
      <ul
        className="grid gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
      >
        {boards.map((board) => (
          <li key={board.id}>
            <BoardTile board={board} onDelete={() => setPendingDelete(board)} />
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.name ?? ''}"?`}
        description="Everything inside — cards, tasks, and Today/Week entries — goes with it. There is no undo."
        confirmLabel="Delete board"
        destructive
        onConfirm={async () => {
          if (pendingDelete) await deleteBoard(pendingDelete.id)
        }}
      />
    </div>
  )
}

interface HeaderProps {
  onCreate: () => void
  disabled: boolean
}

const Header = ({ onCreate, disabled }: HeaderProps) => (
  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--rule)] pb-6">
    <div>
      <p className="smallcaps text-[var(--accent)]">today’s edition</p>
      <h1 className="font-display text-5xl font-medium leading-[1.05] tracking-tight text-[var(--fg)]">
        Your boards.
      </h1>
      <p className="mt-2 max-w-md text-sm text-[var(--fg-3)]">
        One board per slice of life. Pick one to dive in, or start a new column on the front page.
      </p>
    </div>
    <Button variant="primary" size="md" onClick={onCreate} disabled={disabled}>
      <Plus className="h-4 w-4" />
      New board
    </Button>
  </div>
)

interface BoardTileProps {
  board: Board
  onDelete: () => void
}

const BoardTile = ({ board, onDelete }: BoardTileProps) => (
  <div className="group relative flex h-full flex-col justify-between rounded-2xl border border-[var(--rule)] bg-[var(--bg)] p-5 shadow-[var(--shadow-paper)] transition-all hover:-translate-y-0.5 hover:border-[var(--fg-3)]/40">
    <div className="rule-line pb-3">
      <p className="smallcaps text-[var(--fg-3)]">Board</p>
      <InlineEdit
        value={board.name}
        onSave={(next) => renameBoard(board.id, next)}
        className="mt-1 block w-full"
        inputClassName="font-display text-2xl font-medium tracking-tight w-full"
        renderRead={(v) => (
          <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-[var(--fg)]">
            {v}
          </h2>
        )}
        ariaLabel="Edit board name"
      />
    </div>
    <div className="mt-4 flex items-center justify-between">
      <span className="text-xs text-[var(--fg-3)]">
        Created {formatRelative(board.createdAt)}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--fg-3)] opacity-0 transition-all hover:bg-[var(--accent-soft)] hover:text-[var(--accent-2)] group-hover:opacity-100"
          aria-label={`Delete ${board.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <Link
          to="/board/$boardId"
          params={{ boardId: board.id }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--bg-2)] px-3 py-1.5 text-sm font-medium text-[var(--fg)] transition-all hover:bg-[var(--accent)] hover:text-white"
        >
          Open
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  </div>
)

const IndexSkeleton = () => (
  <div className="space-y-8">
    <div className="space-y-3 border-b border-[var(--rule)] pb-6">
      <div className="skeleton h-3 w-32" />
      <div className="skeleton h-12 w-72" />
    </div>
    <div
      className="grid gap-5"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-[var(--rule)] bg-[var(--bg)] p-5 shadow-[var(--shadow-paper)]">
          <div className="skeleton h-3 w-12" />
          <div className="skeleton h-7 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      ))}
    </div>
  </div>
)
