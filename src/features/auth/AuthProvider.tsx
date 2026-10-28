import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'

import { authStatus, type AuthCheck } from '@/lib/auth-status'
import { readOfflineSession } from '@/lib/offline-session-storage'
import { clearLocalCache, isRememberedAllowed, rememberAllowed } from '@/lib/query-cache'
import { supabase } from '@/lib/supabase'

import { AuthContext, type AuthContextValue } from './auth-context'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [checked, setChecked] = useState<{ userId: string; result: AuthCheck } | null>(null)

  // Lecture de la session existante et suivi de ses changements.
  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      // Hors connexion avec un jeton expiré : on garde la session locale (lecture du cache uniquement).
      setSession(data.session ?? readOfflineSession())
      setInitializing(false)
    })
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'SIGNED_OUT') clearLocalCache(queryClient)
      // Hors connexion, une session absente n'est pas une déconnexion (seul SIGNED_OUT l'est).
      if (next === null && event !== 'SIGNED_OUT' && !navigator.onLine) return
      setSession(next)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [queryClient])

  // Contrôle de la liste d'autorisation (RPC is_allowed, voir migration 001).
  const userId = session?.user.id
  // Hors connexion : on se fie au dernier contrôle réussi sur cet appareil.
  const offlineAllowed = userId !== undefined && !navigator.onLine && isRememberedAllowed(userId)
  useEffect(() => {
    if (!userId || offlineAllowed) return
    let cancelled = false
    supabase.rpc('is_allowed').then(({ data, error }) => {
      if (cancelled) return
      if (!error) rememberAllowed(data === true ? userId : null)
      setChecked({ userId, result: error ? 'error' : data === true ? 'allowed' : 'denied' })
    })
    return () => {
      cancelled = true
    }
  }, [userId, offlineAllowed])

  const check: AuthCheck | null = offlineAllowed
    ? 'allowed'
    : session && checked?.userId === session.user.id
      ? checked.result
      : null
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
