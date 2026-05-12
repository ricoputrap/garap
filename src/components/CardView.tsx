import { useEffect, useRef, useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Card, Task } from '../types';
import { useStore } from '../store';
import { TaskItem } from './TaskItem';
import { CARD_COLORS } from '../types';

interface Props {
  card: Card;
  tasks: Task[];
}

export function CardView({ card, tasks }: Props) {
  const { updateCard, deleteCard, addTask, hideCompleted } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card.title);
  const [newTask, setNewTask] = useState('');
  const [showPalette, setShowPalette] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, data: { type: 'card' } });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `card-drop-${card.id}`,
    data: { type: 'card-drop', cardId: card.id },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderTop: card.color ? `4px solid ${card.color}` : '4px solid transparent',
    gridTemplateRows: 'auto auto 1fr auto',
  };

  useEffect(() => {
    if (editing) titleInputRef.current?.select();
  }, [editing]);

  const visibleTasks = (hideCompleted ? tasks.filter((t) => !t.completed) : tasks).sort(
    (a, b) => a.order - b.order,
  );

  function commitTitle() {
    const next = draft.trim();
    if (next && next !== card.title) updateCard(card.id, { title: next });
    else setDraft(card.title);
    setEditing(false);
  }

  function submitTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    addTask(card.id, newTask);
    setNewTask('');
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid bg-white rounded-lg shadow-sm border border-stone-200 max-h-[350px] ${isOver ? 'ring-2 ring-stone-400' : ''}`}
    >
      <div className="flex items-center gap-2 px-3 pt-2 pb-1">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-stone-300 hover:text-stone-600 select-none"
          aria-label="Drag card"
        >
          ⋮⋮
        </span>
        {editing ? (
          <input
            ref={titleInputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') {
                setDraft(card.title);
                setEditing(false);
              }
            }}
            className="flex-1 text-sm font-semibold text-stone-800 bg-transparent outline-none"
            aria-label="Edit card title"
          />
        ) : (
          <h3
            className="flex-1 text-sm font-semibold text-stone-800 truncate cursor-text"
            onDoubleClick={() => {
              setDraft(card.title);
              setEditing(true);
            }}
            title="Double-click to rename"
          >
            {card.title}
          </h3>
        )}
        <button
          type="button"
          onClick={() => setShowPalette((v) => !v)}
          className="text-stone-400 hover:text-stone-700 text-base leading-none"
          aria-label="Pick color"
          title="Color"
        >
          ●
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Delete card "${card.title}" and its tasks?`)) deleteCard(card.id);
          }}
          className="text-stone-300 hover:text-red-500 text-xs"
          aria-label="Delete card"
          title="Delete card"
        >
          ✕
        </button>
      </div>

      {showPalette && (
        <div className="px-3 pb-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              updateCard(card.id, { color: undefined });
              setShowPalette(false);
            }}
            className="shrink-0"
            aria-label="No color"
            title="No color"
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: `2px solid ${!card.color ? '#111827' : '#d6d3d1'}`,
              background: '#fff',
              cursor: 'pointer',
            }}
          />
          {CARD_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                updateCard(card.id, { color: c });
                setShowPalette(false);
              }}
              className="shrink-0"
              aria-label={`Color ${c}`}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: `2px solid ${card.color === c ? '#111827' : 'transparent'}`,
                background: c,
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}

      <div ref={setDropRef} className="px-2 py-1 min-h-[8px] overflow-y-auto">
        <SortableContext
          items={visibleTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-0.5">
            {visibleTasks.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </ul>
        </SortableContext>
      </div>

      <form
        onSubmit={submitTask}
        className="flex items-center gap-2 px-3 py-2 border-t border-stone-100"
      >
        <span className="text-stone-300 select-none">+</span>
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add task"
          className="flex-1 text-sm bg-transparent placeholder-stone-300 focus:outline-none"
          aria-label={`Add task to ${card.title}`}
        />
      </form>
    </div>
  );
}
