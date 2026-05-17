import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'
import type { HistoryItem, TodayHistory, WeekHistory } from '@/types/domain'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTodayHistory } from '@/hooks/use-today-history'
import { useWeekHistory } from '@/hooks/use-week-history'

export const Route = createFileRoute('/history')({ component: HistoryPage })

type Tab = 'today' | 'week'

function HistoryPage() {
  const [tab, setTab] = useState<Tab>('today')
  const today = useTodayHistory()
  const week = useWeekHistory()

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
        <div className="mt-3">
          <p className="smallcaps text-[var(--accent)]">archive</p>
          <h1 className="mt-1 font-display text-5xl font-medium leading-[1.05] tracking-tight text-[var(--fg)]">
            History
          </h1>
          <p className="mt-2 text-sm text-[var(--fg-3)]">
            What you finished, kept as the lists were cleared.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="today">By day</TabsTrigger>
          <TabsTrigger value="week">By week</TabsTrigger>
        </TabsList>
        <TabsContent value="today">
          <TodayList rows={today} />
        </TabsContent>
        <TabsContent value="week">
          <WeekList rows={week} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const formatDay = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

const formatWeek = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `Week of ${fmt(start)} – ${fmt(end)}, ${start.getFullYear()}`
}

const Empty = ({ hint }: { hint: string }) => (
  <div className="mt-6 rounded-xl border border-dashed border-[var(--rule)] bg-[var(--bg)] px-6 py-12 text-center">
    <p className="font-display text-base italic text-[var(--fg-3)]">Nothing recorded yet.</p>
    <p className="mt-1 text-xs text-[var(--fg-3)]">{hint}</p>
  </div>
)

const TodayList = ({ rows }: { rows: TodayHistory[] | undefined }) => {
  if (rows === undefined) return <ListSkeleton />
  if (rows.length === 0)
    return <Empty hint="At midnight, completed items from Today move here." />
  return (
    <div className="mt-4 space-y-4">
      {rows.map((r) => (
        <PeriodGroup key={r.date} title={formatDay(r.date)} items={r.items} />
      ))}
    </div>
  )
}

const WeekList = ({ rows }: { rows: WeekHistory[] | undefined }) => {
  if (rows === undefined) return <ListSkeleton />
  if (rows.length === 0)
    return <Empty hint="At the start of each week, completed items from Week move here." />
  return (
    <div className="mt-4 space-y-4">
      {rows.map((r) => (
        <PeriodGroup key={r.weekStart} title={formatWeek(r.weekStart)} items={r.items} />
      ))}
    </div>
  )
}

const PeriodGroup = ({ title, items }: { title: string; items: HistoryItem[] }) => {
  const [open, setOpen] = useState(true)
  return (
    <section className="rounded-xl border border-[var(--rule)] bg-[var(--bg)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-2)]"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-[var(--fg-3)]" /> : <ChevronRight className="h-4 w-4 text-[var(--fg-3)]" />}
          <h2 className="font-display text-lg font-medium tracking-tight text-[var(--fg)]">{title}</h2>
        </div>
        <span className="rounded-full border border-[var(--rule)] bg-[var(--bg-2)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--fg-3)]">
          {items.length} done
        </span>
      </button>
      {open && (
        <ul className="divide-y divide-[var(--rule)]">
          {items.map((it) => (
            <li key={it.itemId} className="flex items-start justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm text-[var(--fg)] line-through decoration-[var(--fg-3)]">
                  {it.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-[var(--fg-3)]">
                  {it.cardTitle} · {it.boardName}
                </p>
              </div>
              <time className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[var(--fg-3)]">
                {new Date(it.completedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const ListSkeleton = () => (
  <div className="mt-4 space-y-3">
    {[0, 1, 2].map((i) => (
      <div key={i} className="skeleton h-16 w-full rounded-xl" />
    ))}
  </div>
)
