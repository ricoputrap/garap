import { useMemo, useState } from 'react';
import { useStore } from '../store';

type Tab = 'today' | 'week';

export function SidePanel() {
  const { cards, tasks, sidePanelOpen, toggleSidePanel, toggleTaskComplete } = useStore();
  const [tab, setTab] = useState<Tab>('today');

  const grouped = useMemo(() => {
    const flagKey = tab === 'today' ? 'todayFlag' : 'weekFlag';
    const cardById = new Map(cards.map((c) => [c.id, c]));
    const groups = new Map<string, { card: { id: string; title: string; color?: string }; items: typeof tasks }>();
    for (const t of tasks) {
      if (!t[flagKey] || t.completed) continue;
      const card = cardById.get(t.cardId);
      if (!card) continue;
      if (!groups.has(card.id)) groups.set(card.id, { card, items: [] });
      groups.get(card.id)!.items.push(t);
    }
    return Array.from(groups.values()).sort(
      (a, b) =>
        (cardById.get(a.card.id)?.order ?? 0) - (cardById.get(b.card.id)?.order ?? 0),
    );
  }, [tab, tasks, cards]);

  if (!sidePanelOpen) {
    return (
      <aside className="border-l border-stone-200 bg-white shrink-0">
        <button
          type="button"
          onClick={toggleSidePanel}
          className="px-2 py-3 text-stone-400 hover:text-stone-700 h-full"
          aria-label="Open side panel"
          title="Open side panel"
        >
          ‹
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-80 shrink-0 border-l border-stone-200 bg-white flex flex-col">
      <div className="flex items-center border-b border-stone-200">
        <button
          type="button"
          onClick={() => setTab('today')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${tab === 'today' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setTab('week')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${tab === 'week' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
        >
          Week
        </button>
        <button
          type="button"
          onClick={toggleSidePanel}
          className="px-3 py-3 text-stone-400 hover:text-stone-700"
          aria-label="Collapse side panel"
          title="Collapse"
        >
          ›
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar p-4 space-y-4 text-sm" data-testid={`panel-${tab}`}>
        {grouped.length === 0 ? (
          <p className="text-stone-400 text-center mt-12 text-xs">
            Nothing flagged for {tab}.
          </p>
        ) : (
          grouped.map(({ card, items }) => (
            <div key={card.id}>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: card.color ?? '#d6d3d1' }}
                />
                <h4 className="font-semibold text-stone-700 text-xs uppercase tracking-wide">
                  {card.title}
                </h4>
              </div>
              <ul className="space-y-1 ml-4">
                {items.map((t) => (
                  <li key={t.id} className="flex items-start gap-2 text-stone-700">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => toggleTaskComplete(t.id)}
                      className="mt-0.5 accent-stone-700 shrink-0"
                      aria-label={`Complete ${t.text}`}
                    />
                    <span className={t.completed ? 'line-through text-stone-400' : ''}>
                      {t.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
