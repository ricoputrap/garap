import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/schema'

export const useWeekHistory = () =>
  useLiveQuery(() => db.weekHistory.orderBy('clearedAt').reverse().toArray(), [], undefined)
