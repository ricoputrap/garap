import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell } from '@/components/chrome/app-shell'

const RootLayout = () => (
  <TooltipProvider delayDuration={250} skipDelayDuration={120}>
    <AppShell>
      <Outlet />
    </AppShell>
  </TooltipProvider>
)

export const Route = createRootRoute({ component: RootLayout })
