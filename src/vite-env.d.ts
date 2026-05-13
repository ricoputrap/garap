/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface Window {
  __pwaInstallPrompt?: Event & {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
}
