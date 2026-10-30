import type { QueryClient } from '@tanstack/react-query'

/** Clé localStorage du cache persistant (liste et épisodes vus, lecture hors-ligne). */
export const CACHE_KEY = 'mywatchlog-cache'
/** Mémorise l'identifiant de l'utilisateur autorisé pour ouvrir l'application hors connexion. */
export const ALLOWED_KEY = 'mywatchlog-allowed'
export const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000
/** Seules ces requêtes sont persistées (aucune donnée TMDB). */
export const PERSISTED_KEYS = ['library', 'watched-all', 'lists']

export function rememberAllowed(userId: string | null): void {
  try {
    if (userId) localStorage.setItem(ALLOWED_KEY, userId)
    else localStorage.removeItem(ALLOWED_KEY)
  } catch {
    // stockage indisponible : le mode hors-ligne sera simplement désactivé
  }
}

export function isRememberedAllowed(userId: string): boolean {
  try {
    return localStorage.getItem(ALLOWED_KEY) === userId
  } catch {
    return false
  }
}

/** Vide le cache mémoire et persistant (déconnexion : aucune donnée ne reste sur l'appareil). */
export function clearLocalCache(queryClient: QueryClient): void {
  queryClient.clear()
  try {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(ALLOWED_KEY)
  } catch {
    // stockage indisponible
  }
}
