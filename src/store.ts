import { create } from 'zustand';
import type { Card, Task } from './types';
import {
  getCards,
  getTasks,
  saveCards,
  saveTasks,
  getTodayTaskOrders,
  saveTodayTaskOrders,
  getWeekTaskOrders,
  saveWeekTaskOrders,
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
  todayTaskOrders: Record<string, string[]>;
  weekTaskOrders: Record<string, string[]>;
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
  reorderListTasks: (tab: 'today' | 'week', cardId: string, orderedIds: string[]) => void;
  moveTaskBetweenCards: (taskId: string, toCardId: string, toIndex: number) => void;

  toggleHideCompleted: () => void;
  toggleSidePanel: () => void;
  setCurrentTab: (tab: NavTab) => void;
}

function persist(get: () => State) {
  const s = get();
  saveCards(s.cards);
  saveTasks(s.tasks);
  saveTodayTaskOrders(s.todayTaskOrders);
  saveWeekTaskOrders(s.weekTaskOrders);
}

function initialLoad(): Pick<State, 'cards' | 'tasks' | 'todayTaskOrders' | 'weekTaskOrders'> {
  const cards = getCards();
  const tasks = getTasks();
  const todayTaskOrders = getTodayTaskOrders();
  const weekTaskOrders = getWeekTaskOrders();
  const out = runFlagReset({
    tasks,
    todayTaskOrders,
    weekTaskOrders,
    lastTodayReset: getString(KEY_TODAY_RESET),
    lastWeekReset: getString(KEY_WEEK_RESET),
  });
  setString(KEY_TODAY_RESET, out.todayKey);
  setString(KEY_WEEK_RESET, out.weekKey);
  if (out.didResetToday || out.didResetWeek) {
    saveTasks(out.tasks);
    saveTodayTaskOrders(out.todayTaskOrders);
    saveWeekTaskOrders(out.weekTaskOrders);
  }
  return { cards, tasks: out.tasks, todayTaskOrders: out.todayTaskOrders, weekTaskOrders: out.weekTaskOrders };
}

function appendToOrderMap(
  map: Record<string, string[]>,
  cardId: string,
  taskId: string,
): Record<string, string[]> {
  const existing = map[cardId] ?? [];
  if (existing.includes(taskId)) return map;
  return { ...map, [cardId]: [...existing, taskId] };
}

function removeFromOrderMap(
  map: Record<string, string[]>,
  taskId: string,
): Record<string, string[]> {
  const next: Record<string, string[]> = {};
  for (const [cardId, ids] of Object.entries(map)) {
    const filtered = ids.filter((id) => id !== taskId);
    if (filtered.length > 0) next[cardId] = filtered;
  }
  return next;
}

function removeCardFromOrderMap(
  map: Record<string, string[]>,
  cardId: string,
): Record<string, string[]> {
  const next = { ...map };
  delete next[cardId];
  return next;
}

function migrateInOrderMap(
  map: Record<string, string[]>,
  taskId: string,
  fromCardId: string,
  toCardId: string,
): Record<string, string[]> {
  const fromList = (map[fromCardId] ?? []).filter((id) => id !== taskId);
  const toList = [...(map[toCardId] ?? []), taskId];
  return { ...map, [fromCardId]: fromList, [toCardId]: toList };
}

export const useStore = create<State>((set, get) => {
  const loaded = initialLoad();

  const after = () => persist(get);

  return {
    ...loaded,
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
        todayTaskOrders: removeCardFromOrderMap(s.todayTaskOrders, id),
        weekTaskOrders: removeCardFromOrderMap(s.weekTaskOrders, id),
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
      set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== id),
        todayTaskOrders: removeFromOrderMap(s.todayTaskOrders, id),
        weekTaskOrders: removeFromOrderMap(s.weekTaskOrders, id),
      }));
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
      set((s) => {
        const task = s.tasks.find((t) => t.id === id);
        if (!task) return s;
        const todayTaskOrders = value
          ? appendToOrderMap(s.todayTaskOrders, task.cardId, id)
          : removeFromOrderMap(s.todayTaskOrders, id);
        return {
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, todayFlag: value } : t)),
          todayTaskOrders,
        };
      });
      after();
    },
    setTaskWeekFlag: (id, value) => {
      set((s) => {
        const task = s.tasks.find((t) => t.id === id);
        if (!task) return s;
        const weekTaskOrders = value
          ? appendToOrderMap(s.weekTaskOrders, task.cardId, id)
          : removeFromOrderMap(s.weekTaskOrders, id);
        return {
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, weekFlag: value } : t)),
          weekTaskOrders,
        };
      });
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
    reorderListTasks: (tab, cardId, orderedIds) => {
      set((s) => {
        if (tab === 'today') {
          return { todayTaskOrders: { ...s.todayTaskOrders, [cardId]: orderedIds } };
        }
        return { weekTaskOrders: { ...s.weekTaskOrders, [cardId]: orderedIds } };
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

        let todayTaskOrders = s.todayTaskOrders;
        let weekTaskOrders = s.weekTaskOrders;
        if (task.todayFlag) {
          todayTaskOrders = migrateInOrderMap(todayTaskOrders, taskId, task.cardId, toCardId);
        }
        if (task.weekFlag) {
          weekTaskOrders = migrateInOrderMap(weekTaskOrders, taskId, task.cardId, toCardId);
        }

        return { tasks: [...others, ...reindexed], todayTaskOrders, weekTaskOrders };
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
