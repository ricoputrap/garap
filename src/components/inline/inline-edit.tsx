import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

interface InlineEditProps {
  value: string
  onSave: (next: string) => unknown | Promise<unknown>
  className?: string
  inputClassName?: string
  placeholder?: string
  ariaLabel?: string
  /** Optional renderer for the read-mode element. */
  renderRead?: (value: string) => React.ReactNode
  /** Disables empty submissions; if `false`, empty saves are allowed. */
  required?: boolean
  /** Auto-focus into edit mode on mount. Useful for newly-created entities. */
  autoEdit?: boolean
}

export const InlineEdit = ({
  value,
  onSave,
  className,
  inputClassName,
  placeholder,
  ariaLabel,
  renderRead,
  required = true,
  autoEdit = false,
}: InlineEditProps) => {
  const [editing, setEditing] = useState(autoEdit)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = async () => {
    const next = draft.trim()
    if (next === value.trim()) {
      setEditing(false)
      return
    }
    if (required && next === '') {
      setDraft(value)
      setEditing(false)
      return
    }
    await onSave(next)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          'group cursor-text text-left rounded-md transition-colors',
          'hover:bg-[var(--bg-2)] px-1 -mx-1',
          className,
        )}
        aria-label={ariaLabel}
      >
        {renderRead ? renderRead(value) : value}
      </button>
    )
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          void commit()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          cancel()
        }
      }}
      className={cn(
        'rounded-md border border-[var(--accent)] bg-[var(--bg)] px-1 -mx-1 outline-none',
        'focus:ring-2 focus:ring-[var(--accent)]/40',
        inputClassName,
      )}
      aria-label={ariaLabel}
    />
  )
}
