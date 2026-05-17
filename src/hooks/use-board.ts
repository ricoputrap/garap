import { useLiveQuery } from 'dexie-react-hooks'
import { getBoard } from '@/services/db'

export const useBoard = (id: string | undefined) =>
  useLiveQuery(() => (id ? getBoard(id) : Promise.resolve(undefined)), [id], undefined)
