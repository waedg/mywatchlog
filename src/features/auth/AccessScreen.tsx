import { ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { useAuth } from './auth-context'

export default function AccessScreen({ status }: { status: 'denied' | 'error' }) {
  const { signOut } = useAuth()
  const denied = status === 'denied'

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex size-12 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
            <ShieldAlert className="size-6" />
          </span>
          <CardTitle className="text-xl">{denied ? 'Accès non autorisé' : 'Vérification impossible'}</CardTitle>
          <CardDescription>
            {denied
              ? "Ce compte Google n'est pas autorisé à utiliser MyWatchlog. Connecte-toi avec une autre adresse."
              : "Impossible de vérifier ton accès pour le moment. Vérifie ta connexion puis réessaie."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!denied && (
            <Button className="w-full" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          )}
          <Button variant={denied ? 'default' : 'outline'} className="w-full" onClick={() => void signOut()}>
            {denied ? 'Changer de compte' : 'Se déconnecter'}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
