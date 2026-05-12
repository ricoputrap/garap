import type { Task } from '../types';
import { todayKey, weekKey } from './date';

export interface FlagResetInput {
  tasks: Task[];
  lastTodayReset: string | null;
  lastWeekReset: string | null;
  now?: Date;
}

export interface FlagResetOutput {
  tasks: Task[];
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
  if (didResetToday || didResetWeek) {
    tasks = tasks.map((t) => ({
      ...t,
      todayFlag: didResetToday ? false : t.todayFlag,
      weekFlag: didResetWeek ? false : t.weekFlag,
    }));
  }

  return { tasks, todayKey: tKey, weekKey: wKey, didResetToday, didResetWeek };
}
