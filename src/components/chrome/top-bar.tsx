import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ImportDialog } from '@/components/dialogs/import-dialog'
import { downloadJson } from '@/services/import-export'

export const TopBar = () => {
  const [importOpen, setImportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await downloadJson()
    } finally {
      setExporting(false)
    }
  }

  return (
    <header className="relative z-10 flex items-center justify-between gap-6 border-b border-[var(--rule)] bg-[var(--bg)]/80 px-8 py-5 backdrop-blur">
      <div className="flex items-center gap-4">
        <Link to="/" className="group flex items-center gap-3">
          <Mark />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-2xl font-medium tracking-tight text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors">
              Garap
            </span>
            <span className="smallcaps text-[var(--fg-3)]">personal&nbsp;broadsheet</span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleExport} disabled={exporting} aria-label="Export backup">
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{exporting ? 'Exporting…' : 'Export backup (JSON)'}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setImportOpen(true)} aria-label="Import backup">
              <Upload className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import backup (replaces all data)</TooltipContent>
        </Tooltip>
      </div>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </header>
  )
}

const Mark = () => (
  <svg viewBox="0 0 36 36" className="h-9 w-9" aria-hidden="true">
    <rect x="1" y="1" width="34" height="34" rx="9" fill="var(--bg-2)" stroke="var(--rule)" />
    <path
      d="M9 12 L9 26 M9 12 L19 12 M9 19 L17 19"
      stroke="var(--ink)"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
      className="dark:stroke-white"
    />
    <circle cx="25" cy="24" r="3.2" fill="var(--accent)" />
  </svg>
)
