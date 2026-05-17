import { z } from 'zod'

const board = z.object({
  id: z.string().min(1),
  name: z.string(),
  createdAt: z.number(),
})

const card = z.object({
  id: z.string().min(1),
  boardId: z.string().min(1),
  title: z.string(),
  createdAt: z.number(),
})

const item = z.object({
  id: z.string().min(1),
  cardId: z.string().min(1),
  name: z.string(),
  completed: z.boolean(),
  completedAt: z.number().nullable(),
  createdAt: z.number(),
})

const ref = z.object({
  itemId: z.string().min(1),
  addedAt: z.number(),
})

const historyItem = z.object({
  itemId: z.string().min(1),
  name: z.string(),
  cardId: z.string(),
  cardTitle: z.string(),
  boardId: z.string(),
  boardName: z.string(),
  completedAt: z.number(),
})

const todayHistory = z.object({
  date: z.string().min(1),
  clearedAt: z.number(),
  items: z.array(historyItem),
})

const weekHistory = z.object({
  weekStart: z.string().min(1),
  clearedAt: z.number(),
  items: z.array(historyItem),
})

export const snapshotSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  exportedAt: z.number(),
  boards: z.array(board),
  cards: z.array(card),
  items: z.array(item),
  todayRefs: z.array(ref),
  weekRefs: z.array(ref),
  todayHistory: z.array(todayHistory).optional().default([]),
  weekHistory: z.array(weekHistory).optional().default([]),
})

export type Snapshot = z.infer<typeof snapshotSchema>
