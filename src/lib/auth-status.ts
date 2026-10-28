export type AuthCheck = 'allowed' | 'denied' | 'error'

export type AuthStatus = 'loading' | 'signed-out' | 'allowed' | 'denied' | 'error'

interface AuthStatusInput {
  /** La session Supabase est en cours de lecture (premier chargement). */
  initializing: boolean
  hasSession: boolean
  /** Résultat du contrôle is_allowed() pour la session courante, null tant qu'il n'est pas connu. */
  check: AuthCheck | null
}

export function authStatus({ initializing, hasSession, check }: AuthStatusInput): AuthStatus {
  if (initializing) return 'loading'
  if (!hasSession) return 'signed-out'
  if (check === null) return 'loading'
  return check
}
