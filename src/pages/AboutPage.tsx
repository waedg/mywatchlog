import { Download, ExternalLink, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { isStandalone, useInstall } from '@/lib/install-prompt'

const CONTACT = 'goumani.waed@gmail.com'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">{title}</h2>
      {children}
    </section>
  )
}

export default function AboutPage() {
  const { session } = useAuth()
  const { canInstall, installed, install } = useInstall()
  const standalone = isStandalone()

  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">À propos</h1>

      <Section title="MyWatchlog">
        <p className="text-sm leading-relaxed">
          Application personnelle de suivi de films et de séries : liste, statuts, notes, favoris et suivi épisode par
          épisode.
        </p>
        <p className="text-sm text-muted-foreground">
          Version {__APP_VERSION__} ({__APP_BUILD__})
          {session?.user.email ? ` · connecté en tant que ${session.user.email}` : ''}
        </p>
        {!standalone && !installed && (
          <div className="space-y-2">
            {canInstall ? (
              <Button size="sm" onClick={() => void install()}>
                <Download />
                Installer l'application
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Pour l'installer : menu du navigateur, puis « Installer l'application » ou « Ajouter à l'écran
                d'accueil ».
              </p>
            )}
          </div>
        )}
        {(standalone || installed) && <p className="text-sm text-muted-foreground">Application installée.</p>}
      </Section>

      <Section title="Développeur et contact">
        <p className="text-sm">Développé par Waed Goumani.</p>
        <Button variant="outline" size="sm" asChild>
          <a href={`mailto:${CONTACT}`}>
            <Mail />
            {CONTACT}
          </a>
        </Button>
      </Section>

      <Section title="Données et crédits">
        <p className="text-sm leading-relaxed">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Les informations sur les films et les séries (titres, affiches, synopsis, saisons, épisodes) proviennent de
          TMDB (The Movie Database).
        </p>
        <Button variant="outline" size="sm" asChild>
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">
            <ExternalLink />
            themoviedb.org
          </a>
        </Button>
        <p className="text-xs text-muted-foreground">
          Les liens « Voir sur IMDb » ouvrent le site IMDb, qui n'est pas affilié à cette application.
        </p>
      </Section>
    </section>
  )
}
