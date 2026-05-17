import * as React from 'react'
import { cn } from '@/lib/cn'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-xl border border-[var(--rule)] bg-[var(--bg-2)] px-3.5 text-sm text-[var(--fg)]',
        'placeholder:text-[var(--fg-3)] transition-colors',
        'focus:border-[var(--accent)] focus:bg-[var(--bg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-0',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
