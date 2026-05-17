import { Monitor } from 'lucide-react'

export const TooSmallScreen = () => (
  <div className="flex min-h-screen items-center justify-center p-6 text-center">
    <div className="max-w-sm">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--rule)] bg-[var(--bg-2)] text-[var(--accent)]">
        <Monitor className="h-6 w-6" />
      </div>
      <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--fg)]">
        Bring a bigger screen.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--fg-3)]">
        Garap is designed for a wide desktop monitor — the paper-on-glass layout needs at least
        768 pixels across. Open it on a laptop or larger display.
      </p>
    </div>
  </div>
)
