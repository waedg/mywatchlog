import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

import type { AuthStatus } from '@/lib/auth-status'

export interface AuthContextValue {
  status: AuthStatus
  session: Session | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth doit être utilisé dans un AuthProvider.')
  return context
}
