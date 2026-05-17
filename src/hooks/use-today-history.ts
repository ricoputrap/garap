import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/schema'

export const useTodayHistory = () =>
  useLiveQuery(() => db.todayHistory.orderBy('clearedAt').reverse().toArray(), [], undefined)
