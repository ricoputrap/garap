import { describe, it, expect } from 'vitest';
import { runFlagReset } from './flagReset';
import { todayKey, weekKey } from './date';
import type { Task } from '../types';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    cardId: 'c1',
    text: 'x',
    completed: false,
    todayFlag: true,
    weekFlag: true,
    order: 0,
    ...overrides,
  };
}

describe('runFlagReset', () => {
  it('clears todayFlag when date key changed', () => {
    const now = new Date('2026-05-11T10:00:00Z');
    const out = runFlagReset({
      tasks: [makeTask()],
      lastTodayReset: '2026-05-10',
      lastWeekReset: weekKey(now),
      now,
    });
    expect(out.didResetToday).toBe(true);
    expect(out.didResetWeek).toBe(false);
    expect(out.tasks[0].todayFlag).toBe(false);
    expect(out.tasks[0].weekFlag).toBe(true);
  });

  it('clears weekFlag when week key changed', () => {
    const now = new Date('2026-05-11T10:00:00Z');
    const out = runFlagReset({
      tasks: [makeTask()],
      lastTodayReset: todayKey(now),
      lastWeekReset: '2026-W17',
      now,
    });
    expect(out.didResetWeek).toBe(true);
    expect(out.tasks[0].weekFlag).toBe(false);
    expect(out.tasks[0].todayFlag).toBe(true);
  });

  it('does nothing when keys match', () => {
    const now = new Date('2026-05-11T10:00:00Z');
    const out = runFlagReset({
      tasks: [makeTask()],
      lastTodayReset: todayKey(now),
      lastWeekReset: weekKey(now),
      now,
    });
    expect(out.didResetToday).toBe(false);
    expect(out.didResetWeek).toBe(false);
    expect(out.tasks[0].todayFlag).toBe(true);
    expect(out.tasks[0].weekFlag).toBe(true);
  });

  it('first load (null timestamps) resets both', () => {
    const now = new Date('2026-05-11T10:00:00Z');
    const out = runFlagReset({
      tasks: [makeTask()],
      lastTodayReset: null,
      lastWeekReset: null,
      now,
    });
    expect(out.didResetToday).toBe(true);
    expect(out.didResetWeek).toBe(true);
    expect(out.tasks[0].todayFlag).toBe(false);
    expect(out.tasks[0].weekFlag).toBe(false);
  });
});
