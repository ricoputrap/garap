import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { TodayList } from '@/components/panel/today-list'

export const Route = createFileRoute('/today')({ component: TodayPage })

function TodayPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    if (mql.matches) {
      navigate({ to: '/', replace: true })
      return
    }
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) navigate({ to: '/', replace: true })
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [navigate])

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--rule)] pb-4">
        <p className="smallcaps text-[var(--accent)]">the schedule</p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--fg)]">
          Today
        </h1>
      </div>
      <TodayList />
    </div>
  )
}
