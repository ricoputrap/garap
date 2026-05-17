import { useLiveQuery } from 'dexie-react-hooks'
import { listBoards } from '@/services/db'

export const useBoards = () => useLiveQuery(listBoards, [], undefined)
