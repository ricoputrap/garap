import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--accent)] text-white shadow-[0_1px_0_rgba(0,0,0,0.1),0_8px_20px_-12px_var(--accent)] hover:bg-[var(--accent-2)] active:translate-y-[1px]',
        secondary:
          'bg-[var(--bg-2)] text-[var(--fg)] border border-[var(--rule)] hover:bg-[var(--bg-3)]',
        ghost:
          'text-[var(--fg-2)] hover:bg-[var(--bg-2)] hover:text-[var(--fg)]',
        danger:
          'bg-[var(--bg-2)] text-[var(--accent-2)] border border-[var(--rule)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent)]',
        outline:
          'border border-[var(--rule)] text-[var(--fg)] hover:bg-[var(--bg-2)]',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9 p-0',
        iconSm: 'h-7 w-7 p-0 rounded-lg',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
