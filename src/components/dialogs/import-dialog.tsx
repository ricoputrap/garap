import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ImportError, importFromJson } from '@/services/import-export'
import { Upload } from 'lucide-react'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ImportDialog = ({ open, onOpenChange }: ImportDialogProps) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setFile(null)
    setError(null)
    setBusy(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleConfirm = async () => {
    if (!file) {
      setError('Choose a JSON backup file first.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const text = await file.text()
      await importFromJson(text)
      reset()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ImportError ? err.message : 'Import failed unexpectedly.')
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import backup</DialogTitle>
          <DialogDescription>
            Replaces <em>all</em> current data with the contents of this backup. The current
            database is wiped first — there is no merge.
          </DialogDescription>
        </DialogHeader>

        <label
          htmlFor="import-file"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--rule)] bg-[var(--bg-2)] p-6 text-center transition-colors hover:border-[var(--accent)]"
        >
          <Upload className="h-5 w-5 text-[var(--fg-3)]" />
          <span className="text-sm text-[var(--fg-2)]">
            {file ? file.name : 'Click to choose a Garap backup (.json)'}
          </span>
          <input
            ref={fileRef}
            id="import-file"
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              setError(null)
              setFile(e.target.files?.[0] ?? null)
            }}
          />
        </label>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent-2)]"
          >
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={busy || !file}>
            {busy ? 'Replacing…' : 'Replace all data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
