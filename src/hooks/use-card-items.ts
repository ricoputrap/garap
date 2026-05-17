import { useLiveQuery } from 'dexie-react-hooks'
import { listItemsForCard } from '@/services/db'

export const useCardItems = (cardId: string) =>
  useLiveQuery(() => listItemsForCard(cardId), [cardId], undefined)
