import { create } from 'zustand';
import type { Card, Task } from './types';
import {
  getCards,
  getTasks,
  saveCards,
  saveTasks,
  getString,
  setString,
  KEY_TODAY_RESET,
  KEY_WEEK_RESET,
} from './lib/storage';
import { runFlagReset } from './lib/flagReset';
import { uid } from './lib/id';

export type NavTab = 'board' | 'today' | 'week';

interface State {
  cards: Card[];
  tasks: Task[];
  hideCompleted: boolean;
  sidePanelOpen: boolean;
  currentTab: NavTab;

  addCard: (title: string, color?: string) => void;
  updateCard: (id: string, patch: Partial<Pick<Card, 'title' | 'color'>>) => void;
  deleteCard: (id: string) => void;
  reorderCards: (orderedIds: string[]) => void;

  addTask: (cardId: string, text: string) => void;
  updateTask: (id: string, patch: Partial<Pick<Task, 'text'>>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  setTaskTodayFlag: (id: string, value: boolean) => void;
  setTaskWeekFlag: (id: string, value: boolean) => void;
  reorderTasks: (cardId: string, orderedIds: string[]) => void;
  moveTaskBetweenCards: (taskId: string, toCardId: string, toIndex: number) => void;

  toggleHideCompleted: () => void;
  toggleSidePanel: () => void;
  setCurrentTab: (tab: NavTab) => void;
}

function persist(get: () => State) {
  const s = get();
  saveCards(s.cards);
  saveTasks(s.tasks);
}

function initialLoad(): { cards: Card[]; tasks: Task[] } {
  const cards = getCards();
  const tasks = getTasks();
  const out = runFlagReset({
    tasks,
    lastTodayReset: getString(KEY_TODAY_RESET),
    lastWeekReset: getString(KEY_WEEK_RESET),
  });
  setString(KEY_TODAY_RESET, out.todayKey);
  setString(KEY_WEEK_RESET, out.weekKey);
  if (out.didResetToday || out.didResetWeek) {
    saveTasks(out.tasks);
  }
  return { cards, tasks: out.tasks };
}

export const useStore = create<State>((set, get) => {
  const { cards, tasks } = initialLoad();

  const after = () => persist(get);

  return {
    cards,
    tasks,
    hideCompleted: false,
    sidePanelOpen: true,
    currentTab: 'board',

    addCard: (title, color) => {
      const order = get().cards.length;
      set((s) => ({ cards: [...s.cards, { id: uid(), title, color, order }] }));
      after();
    },
    updateCard: (id, patch) => {
      set((s) => ({
        cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
      after();
    },
    deleteCard: (id) => {
      set((s) => ({
        cards: s.cards.filter((c) => c.id !== id),
        tasks: s.tasks.filter((t) => t.cardId !== id),
      }));
      after();
    },
    reorderCards: (orderedIds) => {
      set((s) => {
        const byId = new Map(s.cards.map((c) => [c.id, c]));
        const next: Card[] = [];
        orderedIds.forEach((id, i) => {
          const c = byId.get(id);
          if (c) next.push({ ...c, order: i });
        });
        // append any not in orderedIds
        s.cards.forEach((c) => {
          if (!orderedIds.includes(c.id)) next.push({ ...c, order: next.length });
        });
        return { cards: next };
      });
      after();
    },

    addTask: (cardId, text) => {
      if (!text.trim()) return;
      set((s) => {
        const order = s.tasks.filter((t) => t.cardId === cardId).length;
        return {
          tasks: [
            ...s.tasks,
            {
              id: uid(),
              cardId,
              text: text.trim(),
              completed: false,
              todayFlag: false,
              weekFlag: false,
              order,
            },
          ],
        };
      });
      after();
    },
    updateTask: (id, patch) => {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      }));
      after();
    },
    deleteTask: (id) => {
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      after();
    },
    toggleTaskComplete: (id) => {
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t,
        ),
      }));
      after();
    },
    setTaskTodayFlag: (id, value) => {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, todayFlag: value } : t)),
      }));
      after();
    },
    setTaskWeekFlag: (id, value) => {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, weekFlag: value } : t)),
      }));
      after();
    },
    reorderTasks: (cardId, orderedIds) => {
      set((s) => {
        const cardTasks = new Map(
          s.tasks.filter((t) => t.cardId === cardId).map((t) => [t.id, t]),
        );
        const others = s.tasks.filter((t) => t.cardId !== cardId);
        const reordered: Task[] = [];
        orderedIds.forEach((id, i) => {
          const t = cardTasks.get(id);
          if (t) reordered.push({ ...t, order: i });
        });
        return { tasks: [...others, ...reordered] };
      });
      after();
    },
    moveTaskBetweenCards: (taskId, toCardId, toIndex) => {
      set((s) => {
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task) return s;
        const moved: Task = { ...task, cardId: toCardId };
        const remaining = s.tasks.filter((t) => t.id !== taskId);
        const destTasks = remaining
          .filter((t) => t.cardId === toCardId)
          .sort((a, b) => a.order - b.order);
        destTasks.splice(toIndex, 0, moved);
        const others = remaining.filter((t) => t.cardId !== toCardId);
        const reindexed = destTasks.map((t, i) => ({ ...t, order: i }));
        return { tasks: [...others, ...reindexed] };
      });
      after();
    },

    toggleHideCompleted: () => {
      set((s) => ({ hideCompleted: !s.hideCompleted }));
    },
    toggleSidePanel: () => {
      set((s) => ({ sidePanelOpen: !s.sidePanelOpen }));
    },
    setCurrentTab: (tab) => set({ currentTab: tab }),
  };
});
