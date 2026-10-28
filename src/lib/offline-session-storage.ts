import type { Session } from '@supabase/supabase-js'

import { authStorageKey, parseStoredSession } from './offline-session'

/** Session locale utilisable hors connexion (jeton éventuellement expiré : lecture du cache uniquement). */
export function readOfflineSession(): Session | null {
  if (navigator.onLine) return null
  const key = authStorageKey(import.meta.env.VITE_SUPABASE_URL as string)
  if (!key) return null
  try {
    return parseStoredSession(localStorage.getItem(key))
  } catch {
    return null
  }
}
