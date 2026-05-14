import { useMemo } from 'react';
import { useStore } from '../store';

type ListTab = 'today' | 'week';

interface Props {
  tab: ListTab;
  searchQuery?: string;
}

export function TaskListView({ tab, searchQuery = '' }: Props) {
  const { cards, tasks, toggleTaskComplete } = useStore();

  const grouped = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const flagKey = tab === 'today' ? 'todayFlag' : 'weekFlag';
    const cardById = new Map(cards.map((c) => [c.id, c]));
    const groups = new Map<string, { card: { id: string; title: string; color?: string }; items: typeof tasks }>();
    for (const t of tasks) {
      if (!t[flagKey] || t.completed) continue;
      const card = cardById.get(t.cardId);
      if (!card) continue;
      if (q && !card.title.toLowerCase().includes(q) && !t.text.toLowerCase().includes(q)) continue;
      if (!groups.has(card.id)) groups.set(card.id, { card, items: [] });
      groups.get(card.id)!.items.push(t);
    }
    return Array.from(groups.values()).sort(
      (a, b) =>
        (cardById.get(a.card.id)?.order ?? 0) - (cardById.get(b.card.id)?.order ?? 0),
    );
  }, [tab, tasks, cards, searchQuery]);

  if (grouped.length === 0) {
    return (
      <p className="text-stone-400 text-center mt-12 text-xs">
        Nothing flagged for {tab}.
      </p>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      {grouped.map(({ card, items }) => (
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
      ))}
    </div>
  );
}
