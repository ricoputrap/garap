import { useEffect, useState } from 'react'

const MIN_WIDTH = 768

export const useViewportTooSmall = (): boolean => {
  const [tooSmall, setTooSmall] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < MIN_WIDTH,
  )
  useEffect(() => {
    const check = () => setTooSmall(window.innerWidth < MIN_WIDTH)
    window.addEventListener('resize', check)
    check()
    return () => window.removeEventListener('resize', check)
  }, [])
  return tooSmall
}
