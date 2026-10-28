import { useState } from 'react'
import { Clapperboard, LogIn } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import FullScreenLoader from '@/components/layout/FullScreenLoader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-context'

export default function LoginPage() {
  const { status, signInWithGoogle } = useAuth()
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  if (status === 'loading') return <FullScreenLoader />
  // Connecté : RequireAuth gère ensuite les cas « accès refusé » et « erreur ».
  if (status !== 'signed-out') return <Navigate to="/library" replace />

  async function handleSignIn() {
    setPending(true)
    setFailed(false)
    try {
      await signInWithGoogle()
    } catch {
      setFailed(true)
      setPending(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,oklch(0.3_0.06_95),transparent_60%)] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Clapperboard className="size-6" />
          </span>
          <CardTitle className="text-2xl">MyWatchlog</CardTitle>
          <CardDescription>Ton suivi personnel de films et séries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button size="lg" className="w-full" onClick={() => void handleSignIn()} disabled={pending}>
            <LogIn />
            {pending ? 'Redirection…' : 'Continuer avec Google'}
          </Button>
          {failed && (
            <p role="alert" className="text-center text-sm text-destructive">
              La connexion a échoué. Réessaie dans un instant.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
