import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell } from '@/components/chrome/app-shell'
import { TooSmallScreen } from '@/components/chrome/too-small-screen'
import { useViewportTooSmall } from '@/hooks/use-viewport-too-small'

const RootLayout = () => {
  const tooSmall = useViewportTooSmall()
  if (tooSmall) return <TooSmallScreen />
  return (
    <TooltipProvider delayDuration={250} skipDelayDuration={120}>
      <AppShell>
        <Outlet />
      </AppShell>
    </TooltipProvider>
  )
}

export const Route = createRootRoute({ component: RootLayout })
