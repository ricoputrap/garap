export type ID = string

export interface Board {
  id: ID
  name: string
  createdAt: number
}

export interface Card {
  id: ID
  boardId: ID
  title: string
  createdAt: number
  order: number
}

export interface TodayCardOrder {
  cardId: ID
  order: number
}

export interface WeekCardOrder {
  cardId: ID
  order: number
}

export interface Item {
  id: ID
  cardId: ID
  name: string
  completed: boolean
  completedAt: number | null
  createdAt: number
  order: number
}

export interface TodayRef {
  itemId: ID
  addedAt: number
  order: number
}

export interface WeekRef {
  itemId: ID
  addedAt: number
  order: number
}

export type PanelTab = 'today' | 'week'

export interface HistoryItem {
  itemId: ID
  name: string
  cardId: ID
  cardTitle: string
  boardId: ID
  boardName: string
  completedAt: number
}

export interface TodayHistory {
  date: string
  clearedAt: number
  items: HistoryItem[]
}

export interface WeekHistory {
  weekStart: string
  clearedAt: number
  items: HistoryItem[]
}
