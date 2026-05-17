import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

interface CheckboxProps {
  checked: boolean
  onChange: () => void
  className?: string
  ariaLabel?: string
}

export const Checkbox = ({ checked, onChange, className, ariaLabel = 'Toggle complete' }: CheckboxProps) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={onChange}
    className={cn(
      'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-all',
      checked
        ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_2px_6px_-2px_var(--accent)]'
        : 'border-[var(--rule)] bg-[var(--bg)] hover:border-[var(--accent)]',
      className,
    )}
  >
    {checked && <Check className="h-3 w-3" strokeWidth={3} />}
  </button>
)
