import { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';
import { useStore } from '../store';

interface Props {
  task: Task;
  tab: 'today' | 'week';
  disabled?: boolean;
}

export function TaskListItem({ task, tab, disabled = false }: Props) {
  const { updateTask, deleteTask, toggleTaskComplete, setTaskTodayFlag, setTaskWeekFlag } = useStore();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { type: 'task', cardId: task.cardId }, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      const el = inputRef.current;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
      el.focus();
    }
  }, [editing]);

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  function commitEdit() {
    const next = draft.trim();
    if (!next) {
      deleteTask(task.id);
    } else if (next !== task.text) {
      updateTask(task.id, { text: next });
    }
    setEditing(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      setDraft(task.text);
      setEditing(false);
    } else if (e.key === 'Backspace' && draft === '') {
      e.preventDefault();
      deleteTask(task.id);
    }
  }

  function removeFromList() {
    if (tab === 'today') {
      setTaskTodayFlag(task.id, false);
    } else {
      setTaskWeekFlag(task.id, false);
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-2 px-2 py-1 rounded text-sm"
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-stone-200 group-hover:text-stone-400 select-none mt-0.5"
        aria-label="Drag task"
      >
        ⋮⋮
      </span>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => toggleTaskComplete(task.id)}
        aria-label={`Complete ${task.text}`}
        className="accent-stone-700 shrink-0 mt-0.5"
      />
      {editing ? (
        <textarea
          ref={inputRef}
          value={draft}
          rows={1}
          onChange={(e) => {
            setDraft(e.target.value);
            autoResize(e.target);
          }}
          onBlur={commitEdit}
          onKeyDown={onKeyDown}
          className="flex-1 min-w-0 bg-transparent outline-none text-sm resize-none overflow-hidden break-all leading-snug"
          aria-label="Edit task"
        />
      ) : (
        <span
          onDoubleClick={() => {
            setDraft(task.text);
            setEditing(true);
          }}
          className={`flex-1 min-w-0 break-all cursor-text ${task.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}
          title="Double-click to edit"
        >
          {task.text}
        </span>
      )}
      <button
        type="button"
        onClick={removeFromList}
        className="p-1 rounded text-stone-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        aria-label="Remove from list"
        title="Remove from list"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </li>
  );
}
