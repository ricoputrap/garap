import { describe, it, expect, beforeEach } from 'vitest';
import { getCards, saveCards, getTasks, saveTasks } from './storage';
import type { Card, Task } from '../types';

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips cards', () => {
    const cards: Card[] = [{ id: 'c1', title: 'Work', order: 0 }];
    saveCards(cards);
    expect(getCards()).toEqual(cards);
  });

  it('round-trips tasks', () => {
    const tasks: Task[] = [
      {
        id: 't1',
        cardId: 'c1',
        text: 'do thing',
        completed: false,
        todayFlag: true,
        weekFlag: false,
        order: 0,
      },
    ];
    saveTasks(tasks);
    expect(getTasks()).toEqual(tasks);
  });

  it('returns empty array on missing key', () => {
    expect(getCards()).toEqual([]);
    expect(getTasks()).toEqual([]);
  });

  it('returns empty array on corrupted JSON', () => {
    localStorage.setItem('garap.cards', '{not json');
    expect(getCards()).toEqual([]);
  });
});
