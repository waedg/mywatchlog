import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import { authStatus, type AuthCheck } from '@/lib/auth-status'
import { supabase } from '@/lib/supabase'

import { AuthContext, type AuthContextValue } from './auth-context'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [checked, setChecked] = useState<{ userId: string; result: AuthCheck } | null>(null)

  // Lecture de la session existante et suivi de ses changements.
  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setInitializing(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  // Contrôle de la liste d'autorisation (RPC is_allowed, voir migration 001).
  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase.rpc('is_allowed').then(({ data, error }) => {
      if (cancelled) return
      setChecked({ userId, result: error ? 'error' : data === true ? 'allowed' : 'denied' })
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const check = session && checked?.userId === session.user.id ? checked.result : null
  const status = authStatus({ initializing, hasSession: session !== null, check })

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/library`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, signInWithGoogle, signOut }),
    [status, session, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
