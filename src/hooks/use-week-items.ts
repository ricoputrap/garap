import { useLiveQuery } from 'dexie-react-hooks'
import { loadWeekPanel } from '@/services/db'

export const useWeekItems = () => useLiveQuery(loadWeekPanel, [], undefined)
