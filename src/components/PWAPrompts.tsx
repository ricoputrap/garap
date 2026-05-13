import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-stone-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg md:bottom-4">
      <span>Update available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="bg-white text-stone-900 px-2.5 py-1 rounded font-medium hover:bg-stone-100"
      >
        Reload
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="text-stone-400 hover:text-white"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

type InstallPromptEvent = Event & {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function getStoredPrompt() {
  return window.__pwaInstallPrompt as InstallPromptEvent | undefined
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
}

export function InstallButton() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(
    () => getStoredPrompt() ?? null
  )
  const [installed, setInstalled] = useState(() => isStandalone())
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    const onReady = () => setInstallEvent(getStoredPrompt() ?? null)
    const onInstalled = () => { setInstalled(true); setInstallEvent(null) }
    window.addEventListener('pwaInstallReady', onReady)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('pwaInstallReady', onReady)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  const handleClick = async () => {
    if (installEvent) {
      await installEvent.prompt()
      const { outcome } = await installEvent.userChoice
      if (outcome === 'accepted') {
        window.__pwaInstallPrompt = undefined
        setInstallEvent(null)
      }
    } else {
      setShowHint((v) => !v)
    }
  }

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const hint = isSafari
    ? 'Tap Share → "Add to Home Screen"'
    : 'Click the install icon in the address bar, or open browser menu → "Install app"'

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        onClick={handleClick}
        className="text-sm border border-stone-300 text-stone-700 px-3 py-1.5 rounded hover:bg-stone-50"
      >
        Install app
      </button>
      {showHint && !installEvent && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-stone-900 text-white text-xs px-3 py-2 rounded shadow-lg z-50">
          {hint}
          <button
            onClick={() => setShowHint(false)}
            className="absolute top-1 right-2 text-stone-400 hover:text-white"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
