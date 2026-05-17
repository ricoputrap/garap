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
}

export interface Item {
  id: ID
  cardId: ID
  name: string
  completed: boolean
  completedAt: number | null
  createdAt: number
}

export interface TodayRef {
  itemId: ID
  addedAt: number
}

export interface WeekRef {
  itemId: ID
  addedAt: number
}

export type PanelTab = 'today' | 'week'
