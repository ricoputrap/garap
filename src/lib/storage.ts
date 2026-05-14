import type { Card, Task } from '../types';

const KEY_CARDS = 'garap.cards';
const KEY_TASKS = 'garap.tasks';
export const KEY_TODAY_RESET = 'garap.lastTodayReset';
export const KEY_WEEK_RESET = 'garap.lastWeekReset';
const KEY_TODAY_ORDERS = 'garap.todayTaskOrders';
const KEY_WEEK_ORDERS = 'garap.weekTaskOrders';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getCards(): Card[] {
  return safeParse<Card[]>(localStorage.getItem(KEY_CARDS), []);
}

export function saveCards(cards: Card[]): void {
  localStorage.setItem(KEY_CARDS, JSON.stringify(cards));
}

export function getTasks(): Task[] {
  return safeParse<Task[]>(localStorage.getItem(KEY_TASKS), []);
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(KEY_TASKS, JSON.stringify(tasks));
}

export function getString(key: string): string | null {
  return localStorage.getItem(key);
}

export function setString(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function getTodayTaskOrders(): Record<string, string[]> {
  return safeParse<Record<string, string[]>>(localStorage.getItem(KEY_TODAY_ORDERS), {});
}

export function saveTodayTaskOrders(orders: Record<string, string[]>): void {
  localStorage.setItem(KEY_TODAY_ORDERS, JSON.stringify(orders));
}

export function getWeekTaskOrders(): Record<string, string[]> {
  return safeParse<Record<string, string[]>>(localStorage.getItem(KEY_WEEK_ORDERS), {});
}

export function saveWeekTaskOrders(orders: Record<string, string[]>): void {
  localStorage.setItem(KEY_WEEK_ORDERS, JSON.stringify(orders));
}
