import { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';
import { useStore } from '../store';

interface Props {
  task: Task;
  isDragging?: boolean;
  disabled?: boolean;
}

export function TaskItem({ task, isDragging: isDraggingProp, disabled = false }: Props) {
  const { updateTask, deleteTask, toggleTaskComplete, setTaskTodayFlag, setTaskWeekFlag } =
    useStore();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { type: 'task', cardId: task.cardId }, disabled });

  const isBeingDragged = isDraggingProp ?? isDragging;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isBeingDragged ? 0.4 : 1,
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

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-testid={`task-${task.id}`}
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

      <span className="flex items-start gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setTaskTodayFlag(task.id, !task.todayFlag)}
          className={`p-1 rounded transition-opacity ${task.todayFlag ? 'text-yellow-600 bg-yellow-100' : 'text-stone-300 hover:text-yellow-600 hover:bg-yellow-100 opacity-0 group-hover:opacity-100'}`}
          aria-label={task.todayFlag ? 'Unflag from Today' : 'Flag for Today'}
          title={task.todayFlag ? 'Unflag from Today' : 'Flag for Today'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setTaskWeekFlag(task.id, !task.weekFlag)}
          className={`p-1 rounded transition-opacity ${task.weekFlag ? 'text-blue-600 bg-blue-100' : 'text-stone-300 hover:text-blue-600 hover:bg-blue-100 opacity-0 group-hover:opacity-100'}`}
          aria-label={task.weekFlag ? 'Unflag from This Week' : 'Flag for This Week'}
          title={task.weekFlag ? 'Unflag from This Week' : 'Flag for This Week'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => deleteTask(task.id)}
          className="p-1 rounded text-stone-300 hover:text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete task"
          title="Delete task"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
        </button>
      </span>
    </li>
  );
}
