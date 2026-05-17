import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'garap-theme'

const readInitial = (): Theme => {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const apply = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(readInitial)

  useEffect(() => {
    apply(theme)
  }, [theme])

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      window.localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  return { theme, toggle }
}
