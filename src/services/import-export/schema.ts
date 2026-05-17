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

export const snapshotSchema = z.object({
  version: z.literal(1),
  exportedAt: z.number(),
  boards: z.array(board),
  cards: z.array(card),
  items: z.array(item),
  todayRefs: z.array(ref),
  weekRefs: z.array(ref),
})

export type Snapshot = z.infer<typeof snapshotSchema>
