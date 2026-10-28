import { useSyncExternalStore } from 'react'

// Importé tôt par main.tsx : l'événement `beforeinstallprompt` peut survenir avant le premier rendu.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallState {
  canInstall: boolean
  installed: boolean
}

let deferred: BeforeInstallPromptEvent | null = null
let state: InstallState = { canInstall: false, installed: false }
const listeners = new Set<() => void>()

function update(next: InstallState): void {
  state = next
  listeners.forEach((listener) => listener())
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  deferred = event as BeforeInstallPromptEvent
  update({ ...state, canInstall: true })
})

window.addEventListener('appinstalled', () => {
  deferred = null
  update({ canInstall: false, installed: true })
})

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
}

export function useInstall(): InstallState & { install: () => Promise<void> } {
  const snapshot = useSyncExternalStore(subscribe, () => state)
  const install = async () => {
    if (!deferred) return
    const event = deferred
    await event.prompt()
    await event.userChoice
    deferred = null
    update({ ...state, canInstall: false })
  }
  return { ...snapshot, install }
}
