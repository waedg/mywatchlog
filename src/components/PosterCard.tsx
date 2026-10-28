import type { ReactNode } from 'react'
import { Film, Tv } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { posterUrl } from '@/lib/tmdb-images'
import type { MediaType } from '../../shared/tmdb-types'

interface PosterCardProps {
  title: string
  year: number | null
  type: MediaType
  posterPath: string | null
  /** Zone d'action sous la carte (bouton « Ajouter », statut…). */
  action?: ReactNode
  /** Si fourni, l'affiche et le titre mènent à cette route (page de détail). */
  to?: string
}

export default function PosterCard({ title, year, type, posterPath, action, to }: PosterCardProps) {
  const src = posterUrl(posterPath)
  const Icon = type === 'movie' ? Film : Tv

  return (
    <article className="group flex flex-col gap-2">
      <Wrapper to={to} className="flex flex-col gap-2">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border bg-card shadow-sm transition-transform duration-200 group-hover:-translate-y-1">
        {src ? (
          <img src={src} alt={`Affiche de ${title}`} loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground">
            <Icon className="size-8" />
            <span className="text-xs">Pas d'affiche</span>
          </div>
        )}
        <Badge variant="secondary" className="absolute left-2 top-2 bg-background/80 backdrop-blur">
          <Icon />
          {type === 'movie' ? 'Film' : 'Série'}
        </Badge>
      </div>
      <div className="space-y-0.5 px-0.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{title}</h3>
        <p className="text-xs text-muted-foreground">{year ?? 'Année inconnue'}</p>
      </div>
      </Wrapper>
      {action}
    </article>
  )
}

function Wrapper({ to, className, children }: { to?: string; className: string; children: ReactNode }) {
  return to ? (
    <Link to={to} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  )
}
