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
  activeTaskId?: string | number | null;
}

const DEFAULT_ACCENT = '#dc6b53';

export function CardView({ card, tasks, activeTaskId }: Props) {
  const { updateCard, deleteCard, addTask, hideCompleted } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card.title);
  const [newTask, setNewTask] = useState('');
  const [showPalette, setShowPalette] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const accent = card.color ?? DEFAULT_ACCENT;

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
    gridTemplateRows: 'auto auto auto 1fr auto',
  };

  useEffect(() => {
    if (editing) titleInputRef.current?.select();
  }, [editing]);

  const visibleTasks = (hideCompleted ? tasks.filter((t) => !t.completed) : tasks).sort(
    (a, b) => a.order - b.order,
  );

  const doneCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

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
      className={`group/card relative grid bg-white rounded-xl shadow-sm border border-stone-200 max-h-[350px] overflow-hidden ${isOver ? 'ring-2 ring-stone-400' : ''}`}
    >
      <div
        className="h-[3px] w-full"
        style={{ background: accent }}
      />

      <div className="flex items-center gap-2 px-4 pt-3 pb-3">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-stone-300 hover:text-stone-600 select-none opacity-0 group-hover/card:opacity-100 transition-opacity -ml-2"
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
            className="flex-1 text-base font-bold text-stone-900 bg-transparent outline-none"
            aria-label="Edit card title"
          />
        ) : (
          <h3
            className="flex-1 text-base font-semibold text-stone-900 truncate cursor-text"
            onDoubleClick={() => {
              setDraft(card.title);
              setEditing(true);
            }}
            title="Double-click to rename"
          >
            {card.title}
          </h3>
        )}
        <span className="text-xs font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md tabular-nums">
          {doneCount}/{totalCount}
        </span>
        <button
          type="button"
          onClick={() => setShowPalette((v) => !v)}
          className="text-stone-400 hover:text-stone-700 text-base leading-none opacity-0 group-hover/card:opacity-100 transition-opacity"
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
          className="text-stone-300 hover:text-red-500 text-xs opacity-0 group-hover/card:opacity-100 transition-opacity"
          aria-label="Delete card"
          title="Delete card"
        >
          ✕
        </button>
      </div>

      <div className="px-4 pb-2">
        <div className="h-[3px] w-full bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${progressPct}%`, background: accent }}
          />
        </div>
      </div>

      {showPalette && (
        <div className="px-4 pb-1 flex gap-1.5">
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

      <div ref={setDropRef} className="px-3 py-1 min-h-[8px] overflow-y-auto">
        <SortableContext
          items={visibleTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-0.5">
            {visibleTasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                isDragging={activeTaskId === t.id}
                accent={accent}
              />
            ))}
          </ul>
        </SortableContext>
      </div>

      <form
        onSubmit={submitTask}
        className="flex items-center gap-2 px-4 py-2"
      >
        <span className="text-stone-300 select-none">+</span>
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add task"
          className="flex-1 text-sm bg-transparent placeholder-stone-400 text-stone-600 focus:outline-none"
          aria-label={`Add task to ${card.title}`}
        />
      </form>
    </div>
  );
}
