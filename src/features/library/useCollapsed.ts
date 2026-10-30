import { useSyncExternalStore } from 'react'

import { COLLAPSED_KEY, parseCollapsed, toggleCollapsed } from './collapse'
import type { Status } from './group'

const listeners = new Set<() => void>()
const NONE: Status[] = []
let cache: { raw: string | null; value: Status[] } = { raw: null, value: NONE }

function readRaw(): string | null {
  try {
    return localStorage.getItem(COLLAPSED_KEY)
  } catch {
    return null
  }
}

// Instantané stable tant que la valeur enregistrée ne change pas (exigé par useSyncExternalStore).
function snapshot(): Status[] {
  const raw = readRaw()
  if (raw !== cache.raw) cache = { raw, value: raw ? parseCollapsed(raw) : NONE }
  return cache.value
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

/** Groupes repliés de « Ma liste », mémorisés sur l'appareil. */
export function useCollapsedGroups(): [Status[], (status: Status) => void] {
  const collapsed = useSyncExternalStore(subscribe, snapshot, () => NONE)
  const toggle = (status: Status) => {
    const next = toggleCollapsed(snapshot(), status)
    try {
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next))
    } catch {
      // stockage indisponible : le repli ne sera pas conservé
    }
    listeners.forEach((listener) => listener())
  }
  return [collapsed, toggle]
}
