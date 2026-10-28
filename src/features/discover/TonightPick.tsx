import { useState } from 'react'
import { Dices, Film, HardDrive, Tv } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { LibraryItem } from '@/features/library/group'
import { posterUrl } from '@/lib/tmdb-images'
import { cn } from '@/lib/utils'

import { pickAt, rerollSeed, tonightCandidates } from './tonight'

interface Props {
  items: LibraryItem[]
  type: 'all' | 'movie' | 'tv'
  copyOnly: boolean
  onToggleCopy: () => void
}

export default function TonightPick({ items, type, copyOnly, onToggleCopy }: Props) {
  const candidates = tonightCandidates(items, { type, copyOnly })
  const [seed, setSeed] = useState(() => Math.random())
  const pick = pickAt(candidates, seed)
  const src = posterUrl(pick?.posterPath ?? null)
  const Icon = pick?.type === 'tv' ? Tv : Film

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Que regarder ce soir ?</h2>
        <Button
          size="sm"
          variant={copyOnly ? 'default' : 'outline'}
          className={cn('rounded-full', !copyOnly && 'text-muted-foreground')}
          aria-pressed={copyOnly}
          onClick={onToggleCopy}
        >
          <HardDrive />
          J'ai une copie
        </Button>
      </div>

      {!pick ? (
        <p className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
          {items.some((item) => item.status === 'to_watch')
            ? 'Aucun titre « À regarder » ne correspond à ces filtres.'
            : 'Ajoute des titres à ta liste « À regarder » pour obtenir une suggestion.'}
        </p>
      ) : (
        <div className="flex gap-4 rounded-2xl border bg-card p-3 shadow-sm">
          <Link to={`/title/${pick.type}/${pick.id}`} className="w-24 shrink-0 sm:w-28">
            <div className="aspect-[2/3] overflow-hidden rounded-xl border bg-muted">
              {src ? (
                <img src={src} alt={`Affiche de ${pick.title}`} className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <Icon className="size-8" />
                </div>
              )}
            </div>
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="space-y-1">
              <Link to={`/title/${pick.type}/${pick.id}`} className="line-clamp-3 text-lg font-semibold leading-snug hover:underline">
                {pick.title}
              </Link>
              <p className="text-sm text-muted-foreground">{pick.year ?? 'Année inconnue'}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">
                  <Icon />
                  {pick.type === 'movie' ? 'Film' : 'Série'}
                </Badge>
                {pick.hasCopy && (
                  <Badge variant="secondary">
                    <HardDrive />
                    Copie
                  </Badge>
                )}
              </div>
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-2">
              <Button size="sm" asChild>
                <Link to={`/title/${pick.type}/${pick.id}`}>Voir la fiche</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSeed(rerollSeed(candidates, pick))} disabled={candidates.length < 2}>
                <Dices />
                Autre idée
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Parmi {candidates.length} titre{candidates.length > 1 ? 's' : ''} à regarder
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
