import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Capture beforeinstallprompt before React mounts — event fires early
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.__pwaInstallPrompt = e as any
  window.dispatchEvent(new Event('pwaInstallReady'))
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
