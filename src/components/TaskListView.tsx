import { useMemo } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useStore } from '../store';
import { TaskListItem } from './TaskListItem';

type ListTab = 'today' | 'week';

interface Props {
  tab: ListTab;
  searchQuery?: string;
}

export function TaskListView({ tab, searchQuery = '' }: Props) {
  const { cards, tasks, todayTaskOrders, weekTaskOrders, reorderListTasks } = useStore();

  const orderMap = tab === 'today' ? todayTaskOrders : weekTaskOrders;

  const grouped = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const flagKey = tab === 'today' ? 'todayFlag' : 'weekFlag';
    const cardById = new Map(cards.map((c) => [c.id, c]));
    const groups = new Map<string, { card: { id: string; title: string; color?: string }; items: typeof tasks }>();
    for (const t of tasks) {
      if (!t[flagKey]) continue;
      const card = cardById.get(t.cardId);
      if (!card) continue;
      if (q && !card.title.toLowerCase().includes(q) && !t.text.toLowerCase().includes(q)) continue;
      if (!groups.has(card.id)) groups.set(card.id, { card, items: [] });
      groups.get(card.id)!.items.push(t);
    }
    const sorted = Array.from(groups.values());
    for (const g of sorted) {
      const cardOrder = orderMap[g.card.id] ?? [];
      g.items.sort((a, b) => {
        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
        const ai = cardOrder.indexOf(a.id);
        const bi = cardOrder.indexOf(b.id);
        return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
      });
    }
    return sorted.sort(
      (a, b) => (cardById.get(a.card.id)?.order ?? 0) - (cardById.get(b.card.id)?.order ?? 0),
    );
  }, [tab, tasks, cards, searchQuery, orderMap]);

  if (grouped.length === 0) {
    return (
      <p className="text-stone-400 text-center mt-12 text-xs">
        Nothing flagged for {tab}.
      </p>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      {grouped.map(({ card, items }) => {
        const incomplete = items.filter((t) => !t.completed);
        const completed = items.filter((t) => t.completed);

        function handleDragEnd(event: DragEndEvent) {
          const { active, over } = event;
          if (!over || active.id === over.id) return;
          const oldOrder = incomplete.map((t) => t.id);
          const oldIdx = oldOrder.indexOf(active.id as string);
          const newIdx = oldOrder.indexOf(over.id as string);
          if (oldIdx === -1 || newIdx === -1) return;
          const next = [...oldOrder];
          next.splice(oldIdx, 1);
          next.splice(newIdx, 0, active.id as string);
          reorderListTasks(tab, card.id, next);
        }

        return (
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
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={incomplete.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-1 ml-4">
                  {incomplete.map((t) => (
                    <TaskListItem key={t.id} task={t} tab={tab} />
                  ))}
                  {completed.map((t) => (
                    <TaskListItem key={t.id} task={t} tab={tab} disabled />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        );
      })}
    </div>
  );
}
