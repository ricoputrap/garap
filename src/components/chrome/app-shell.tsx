import type { ReactNode } from 'react'
import { TopBar } from './top-bar'
import { TodayWeekPanel } from '@/components/panel/today-week-panel'
import { useAutoClear } from '@/hooks/use-auto-clear'

interface AppShellProps {
  children: ReactNode
}

/** 70/30 split layout: main column on the left, persistent Today/Week panel on the right. */
export const AppShell = ({ children }: AppShellProps) => {
  useAutoClear()
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <TopBar />
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[7fr_3fr]">
        <main className="min-w-0 px-6 py-8 lg:px-10 lg:py-10">{children}</main>
        <aside className="border-t border-[var(--rule)] bg-[var(--bg-2)]/40 px-6 py-8 lg:border-l lg:border-t-0 lg:px-8 lg:py-10">
          <TodayWeekPanel />
        </aside>
      </div>
    </div>
  )
}
