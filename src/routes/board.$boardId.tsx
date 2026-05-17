import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useBoard } from '@/hooks/use-board'
import { renameBoard } from '@/services/db'
import { InlineEdit } from '@/components/inline/inline-edit'
import { BoardGrid } from '@/components/board/board-grid'

export const Route = createFileRoute('/board/$boardId')({ component: BoardPage })

function BoardPage() {
  const { boardId } = Route.useParams()
  const board = useBoard(boardId)

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--rule)] pb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--fg-3)] transition-colors hover:text-[var(--accent)]"
        >
          <ArrowLeft className="h-3 w-3" />
          All boards
        </Link>
        {board === undefined ? (
          <div className="mt-3 space-y-2">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-12 w-80" />
          </div>
        ) : board === null || !board ? (
          <NotFound />
        ) : (
          <div className="mt-3">
            <p className="smallcaps text-[var(--accent)]">board</p>
            <InlineEdit
              value={board.name}
              onSave={(next) => renameBoard(board.id, next)}
              className="mt-1 block w-full"
              inputClassName="font-display text-5xl font-medium tracking-tight w-full"
              renderRead={(v) => (
                <h1 className="mt-1 font-display text-5xl font-medium leading-[1.05] tracking-tight text-[var(--fg)]">
                  {v}
                </h1>
              )}
              ariaLabel="Edit board name"
            />
          </div>
        )}
      </div>

      {board && <BoardGrid boardId={board.id} />}
    </div>
  )
}

const NotFound = () => (
  <div className="mt-6 rounded-2xl border border-dashed border-[var(--rule)] bg-[var(--bg)] px-6 py-12 text-center">
    <p className="font-display text-2xl text-[var(--fg)]">This board doesn’t exist.</p>
    <p className="mt-2 text-sm text-[var(--fg-3)]">It may have been deleted from another tab.</p>
    <Link
      to="/"
      className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-2)]"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to boards
    </Link>
  </div>
)
