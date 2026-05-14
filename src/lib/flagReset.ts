import type { Task } from '../types';
import { todayKey, weekKey } from './date';

export interface FlagResetInput {
  tasks: Task[];
  todayTaskOrders: Record<string, string[]>;
  weekTaskOrders: Record<string, string[]>;
  lastTodayReset: string | null;
  lastWeekReset: string | null;
  now?: Date;
}

export interface FlagResetOutput {
  tasks: Task[];
  todayTaskOrders: Record<string, string[]>;
  weekTaskOrders: Record<string, string[]>;
  todayKey: string;
  weekKey: string;
  didResetToday: boolean;
  didResetWeek: boolean;
}

export function runFlagReset(input: FlagResetInput): FlagResetOutput {
  const now = input.now ?? new Date();
  const tKey = todayKey(now);
  const wKey = weekKey(now);
  const didResetToday = input.lastTodayReset !== tKey;
  const didResetWeek = input.lastWeekReset !== wKey;

  let tasks = input.tasks;
  let todayTaskOrders = input.todayTaskOrders;
  let weekTaskOrders = input.weekTaskOrders;

  if (didResetToday || didResetWeek) {
    tasks = tasks.map((t) => ({
      ...t,
      todayFlag: didResetToday ? false : t.todayFlag,
      weekFlag: didResetWeek ? false : t.weekFlag,
    }));
    if (didResetToday) todayTaskOrders = {};
    if (didResetWeek) weekTaskOrders = {};
  }

  return { tasks, todayTaskOrders, weekTaskOrders, todayKey: tKey, weekKey: wKey, didResetToday, didResetWeek };
}
