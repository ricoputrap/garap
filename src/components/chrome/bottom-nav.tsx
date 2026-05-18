import { useEffect } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { CalendarRange, LayoutGrid, Sun } from 'lucide-react'
import { cn } from '@/lib/cn'
import { readLastBoardRoute, rememberBoardRoute } from '@/lib/last-board-route'

type Section = 'board' | 'today' | 'week'

const sectionFromPath = (pathname: string): Section | null => {
  if (pathname === '/today') return 'today'
  if (pathname === '/week') return 'week'
  if (pathname === '/' || pathname.startsWith('/board/')) return 'board'
  return null
}

export const BottomNav = () => {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const active = sectionFromPath(pathname)

  useEffect(() => {
    if (pathname === '/' || pathname.startsWith('/board/')) {
      rememberBoardRoute(pathname)
    }
  }, [pathname])

  const goBoard = () => {
    if (active === 'board') {
      navigate({ to: '/' })
      return
    }
    const last = readLastBoardRoute()
    navigate({ to: last as '/' })
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[var(--rule)] bg-[var(--bg)]/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <NavItem label="Board" icon={LayoutGrid} active={active === 'board'} onClick={goBoard} />
      <NavItem
        label="Today"
        icon={Sun}
        active={active === 'today'}
        onClick={() => navigate({ to: '/today' })}
      />
      <NavItem
        label="Week"
        icon={CalendarRange}
        active={active === 'week'}
        onClick={() => navigate({ to: '/week' })}
      />
    </nav>
  )
}

interface NavItemProps {
  label: string
  icon: typeof Sun
  active: boolean
  onClick: () => void
}

const NavItem = ({ label, icon: Icon, active, onClick }: NavItemProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={cn(
      'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
      active ? 'text-[var(--accent)]' : 'text-[var(--fg-3)] hover:text-[var(--fg)]',
    )}
  >
    <Icon className="h-5 w-5" />
    {label}
  </button>
)
