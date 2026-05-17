import { useLiveQuery } from 'dexie-react-hooks'
import { loadTodayPanel } from '@/services/db'

export const useTodayItems = () => useLiveQuery(loadTodayPanel, [], undefined)
