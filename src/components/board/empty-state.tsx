import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  onCreate: () => void
}

export const EmptyState = ({ onCreate }: EmptyStateProps) => (
  <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-[var(--rule)] bg-[var(--bg)] px-8 py-14 text-center shadow-[var(--shadow-paper)]">
    <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-2)]">
      <Sparkles className="h-5 w-5" />
    </div>
    <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--fg)]">
      A blank page is a good place to start.
    </h2>
    <p className="mt-3 text-sm leading-relaxed text-[var(--fg-3)]">
      Boards group the parts of your life — work, family, projects, learning. Spin one up and
      start jotting cards inside it.
    </p>
    <div className="mt-7 flex justify-center">
      <Button variant="primary" size="lg" onClick={onCreate}>
        Create your first board
      </Button>
    </div>
  </div>
)
