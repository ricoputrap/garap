import { useEffect } from 'react'
import { startAutoClear } from '@/services/auto-clear'

export const useAutoClear = (): void => {
  useEffect(() => startAutoClear(), [])
}
