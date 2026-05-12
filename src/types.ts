export interface Card {
  id: string;
  title: string;
  color?: string;
  order: number;
}

export interface Task {
  id: string;
  cardId: string;
  text: string;
  completed: boolean;
  todayFlag: boolean;
  weekFlag: boolean;
  order: number;
}

export const CARD_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
] as const;

export type CardColor = (typeof CARD_COLORS)[number];
