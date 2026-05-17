import { useLiveQuery } from 'dexie-react-hooks'
import { listCards } from '@/services/db'

export const useCards = (boardId: string | undefined) =>
  useLiveQuery(() => (boardId ? listCards(boardId) : Promise.resolve([])), [boardId], undefined)
