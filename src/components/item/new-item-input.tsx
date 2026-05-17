import { useState } from 'react'
import { Plus } from 'lucide-react'
import { createItem } from '@/services/db'

interface NewItemInputProps {
  cardId: string
}

export const NewItemInput = ({ cardId }: NewItemInputProps) => {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    const next = value.trim()
    if (!next) {
      setError('Type a task before pressing Enter.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await createItem(cardId, next)
      setValue('')
    } catch {
      setError('Could not save task. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border-t border-dashed border-[var(--rule)] px-3 py-2">
      <div className="flex items-center gap-2">
        <Plus className="h-3.5 w-3.5 text-[var(--fg-3)]" />
        <input
          value={value}
          placeholder="Add a task…"
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void submit()
            }
          }}
          disabled={busy}
          className="flex-1 bg-transparent text-sm text-[var(--fg)] placeholder:text-[var(--fg-3)] focus:outline-none disabled:opacity-60"
        />
      </div>
      {error && (
        <p role="alert" className="ml-5 mt-1 text-xs text-[var(--accent-2)]">
          {error}
        </p>
      )}
    </div>
  )
}
