import { Clapperboard } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,oklch(0.25_0.08_285),transparent_60%)] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Clapperboard className="size-6" />
          </span>
          <CardTitle className="text-2xl">MyWatchlog</CardTitle>
          <CardDescription>Ton suivi personnel de films et séries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button size="lg" className="w-full" disabled>
            Continuer avec Google
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            La connexion sera activée au prochain bloc.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
