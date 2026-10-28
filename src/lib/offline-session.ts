import type { Session } from '@supabase/supabase-js'

/** Clé de stockage de la session supabase-js (valeur par défaut de la bibliothèque). */
export function authStorageKey(supabaseUrl: string): string | null {
  try {
    return `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
  } catch {
    return null
  }
}

/** Relit la session stockée localement, sans réseau ; null si absente ou invalide. */
export function parseStoredSession(raw: string | null): Session | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<Session> | null
    if (value && typeof value === 'object' && typeof value.access_token === 'string' && typeof value.user?.id === 'string') {
      return value as Session
    }
  } catch {
    return null
  }
  return null
}
