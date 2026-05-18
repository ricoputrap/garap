import type { ReactNode } from 'react'
import { TopBar } from './top-bar'
import { BottomNav } from './bottom-nav'
import { TodayWeekPanel } from '@/components/panel/today-week-panel'
import { useAutoClear } from '@/hooks/use-auto-clear'

interface AppShellProps {
  children: ReactNode
}

/**
 * <768px: single-pane with fixed bottom nav.
 * ≥768px:  70/30 split, main + persistent Today/Week aside.
 */
export const AppShell = ({ children }: AppShellProps) => {
  useAutoClear()
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <TopBar />
      <div className="grid flex-1 grid-cols-1 md:grid-cols-[7fr_3fr]">
        <main className="min-w-0 px-4 py-6 pb-[calc(72px+env(safe-area-inset-bottom))] md:px-10 md:py-10 md:pb-10">
          {children}
        </main>
        <aside className="hidden border-l border-[var(--rule)] bg-[var(--bg-2)]/40 px-6 py-8 md:block md:px-8 md:py-10">
          <TodayWeekPanel />
        </aside>
      </div>
      <BottomNav />
    </div>
  )
}
