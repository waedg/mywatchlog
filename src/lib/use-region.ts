import { useSyncExternalStore } from 'react'

import { DEFAULT_REGION, parseRegion } from './region'

const KEY = 'mywatchlog-region'
const listeners = new Set<() => void>()

function read(): string {
  try {
    return parseRegion(localStorage.getItem(KEY))
  } catch {
    return DEFAULT_REGION
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

/** Pays choisi pour les plateformes de streaming (préférence enregistrée sur l'appareil). */
export function useRegion(): [string, (region: string) => void] {
  const region = useSyncExternalStore(subscribe, read, () => DEFAULT_REGION)
  const setRegion = (next: string) => {
    try {
      localStorage.setItem(KEY, parseRegion(next))
    } catch {
      // stockage indisponible : le choix ne sera pas conservé
    }
    listeners.forEach((listener) => listener())
  }
  return [region, setRegion]
}
