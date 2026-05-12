import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useStore } from '../store';
import { CardView } from './CardView';

export function Board() {
  const { cards, tasks, reorderCards, reorderTasks, moveTaskBetweenCards } = useStore();
  const [activeType, setActiveType] = useState<'card' | 'task' | null>(null);
  const [activeId, setActiveId] = useState<string | number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const sortedCards = useMemo(() => [...cards].sort((a, b) => a.order - b.order), [cards]);
  const tasksByCard = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const c of cards) map.set(c.id, []);
    for (const t of tasks) {
      if (!map.has(t.cardId)) map.set(t.cardId, []);
      map.get(t.cardId)!.push(t);
    }
    return map;
  }, [cards, tasks]);

  function onDragStart(e: DragStartEvent) {
    const type = (e.active.data.current as { type?: string } | undefined)?.type;
    setActiveType(type === 'card' ? 'card' : type === 'task' ? 'task' : null);
    setActiveId(e.active.id);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveType(null);
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeData = active.data.current as { type?: string; cardId?: string } | undefined;
    const overData = over.data.current as { type?: string; cardId?: string } | undefined;

    if (activeData?.type === 'card') {
      if (active.id === over.id) return;
      const oldIndex = sortedCards.findIndex((c) => c.id === active.id);
      const newIndex = sortedCards.findIndex((c) => c.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = [...sortedCards];
      const [moved] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, moved);
      reorderCards(next.map((c) => c.id));
      return;
    }

    if (activeData?.type === 'task') {
      const fromCardId = activeData.cardId!;
      if (overData?.type === 'card-drop') {
        const toCardId = overData.cardId!;
        if (toCardId === fromCardId) return;
        const destLen = (tasksByCard.get(toCardId) ?? []).length;
        moveTaskBetweenCards(String(active.id), toCardId, destLen);
        return;
      }
      if (overData?.type === 'task') {
        const toCardId = overData.cardId!;
        const destTasks = (tasksByCard.get(toCardId) ?? []).sort((a, b) => a.order - b.order);
        const overIndex = destTasks.findIndex((t) => t.id === over.id);
        if (toCardId === fromCardId) {
          const same = destTasks;
          const oldIndex = same.findIndex((t) => t.id === active.id);
          if (oldIndex < 0 || overIndex < 0 || oldIndex === overIndex) return;
          const next = [...same];
          const [moved] = next.splice(oldIndex, 1);
          next.splice(overIndex, 0, moved);
          reorderTasks(toCardId, next.map((t) => t.id));
        } else {
          moveTaskBetweenCards(String(active.id), toCardId, overIndex);
        }
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex-1 overflow-auto scrollbar p-6">
        <SortableContext
          items={sortedCards.map((c) => c.id)}
          strategy={rectSortingStrategy}
          disabled={activeType === 'task'}
        >
          <div
            className="grid gap-4 items-start"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            {sortedCards.map((c) => (
              <CardView key={c.id} card={c} tasks={tasksByCard.get(c.id) ?? []} activeTaskId={activeId} />
            ))}
          </div>
        </SortableContext>
        {sortedCards.length === 0 && (
          <p className="text-center text-stone-400 mt-20 text-sm">
            No cards yet. Click <b>+ New card</b> to start.
          </p>
        )}
      </div>
    </DndContext>
  );
}
