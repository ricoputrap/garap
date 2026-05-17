import type { PanelTab } from '@/types/domain'
import type { PanelItem } from '@/services/db/queries'
import { PanelItemRow } from './panel-item-row'

interface PanelGroupProps {
  cardTitle: string
  boardName: string
  items: PanelItem[]
  tab: PanelTab
}

export const PanelGroup = ({ cardTitle, boardName, items, tab }: PanelGroupProps) => (
  <section className="space-y-2">
    <header className="flex items-baseline gap-2 px-1">
      <h3 className="font-display text-base font-medium tracking-tight text-[var(--fg)]">
        {cardTitle}
      </h3>
      <span className="rounded-full border border-[var(--rule)] bg-[var(--bg)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--fg-3)]">
        {boardName}
      </span>
    </header>
    <ul className="space-y-0.5">
      {items.map(({ item }) => (
        <PanelItemRow key={item.id} item={item} tab={tab} />
      ))}
    </ul>
  </section>
)
