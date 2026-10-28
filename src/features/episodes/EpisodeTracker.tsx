import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronDown, ChevronRight, ListChecks, Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getSeason } from '@/lib/api'
import { apiErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import type { SeasonSummary, TvInfo } from '../../../shared/tmdb-types'

import { epKey, formatAirDate, formatEpisode, isUpcoming, todayLocal, watchedInSeason } from './progress'
import { seasonKey } from './service'
import { useEpisodeActions } from './useEpisodes'

interface Props {
  tvId: number
  tv: TvInfo
  watched: ReadonlySet<string>
}

export default function EpisodeTracker({ tvId, tv, watched }: Props) {
  const [showSpecials, setShowSpecials] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const actions = useEpisodeActions(tvId)

  const hasSpecials = tv.seasons.some((s) => s.seasonNumber === 0 && s.episodeCount > 0)
  const seasons = tv.seasons.filter((s) => s.episodeCount > 0 && (showSpecials || s.seasonNumber > 0))

  if (seasons.length === 0 && !hasSpecials) {
    return <p className="text-sm text-muted-foreground">Aucune saison disponible pour cette série.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Saisons et épisodes</h2>
        {hasSpecials && (
          <Button variant="ghost" size="sm" aria-pressed={showSpecials} onClick={() => setShowSpecials((v) => !v)}>
            {showSpecials ? 'Masquer les spéciaux' : 'Afficher les spéciaux'}
          </Button>
        )}
      </div>

      {actions.error && (
        <p role="alert" className="text-xs text-destructive">
          {apiErrorMessage(actions.error)}
        </p>
      )}

      <ul className="space-y-2">
        {seasons.map((season) => (
          <SeasonPanel
            key={season.seasonNumber}
            tvId={tvId}
            season={season}
            watched={watched}
            expanded={open === season.seasonNumber}
            onToggle={() => setOpen((current) => (current === season.seasonNumber ? null : season.seasonNumber))}
            actions={actions}
          />
        ))}
      </ul>
    </div>
  )
}

type Actions = ReturnType<typeof useEpisodeActions>

interface PanelProps {
  tvId: number
  season: SeasonSummary
  watched: ReadonlySet<string>
  expanded: boolean
  onToggle: () => void
  actions: Actions
}

function SeasonPanel({ tvId, season, watched, expanded, onToggle, actions }: PanelProps) {
  const done = watchedInSeason(watched, season.seasonNumber, season.episodeCount)
  const complete = done >= season.episodeCount
  const Chevron = expanded ? ChevronDown : ChevronRight
  const label = season.seasonNumber === 0 ? 'Épisodes spéciaux' : season.name

  return (
    <li className="rounded-xl border">
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-expanded={expanded}
          onClick={onToggle}
        >
          <Chevron className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{label}</span>
          <span className={cn('ml-auto shrink-0 text-xs', complete ? 'text-primary' : 'text-muted-foreground')}>
            {done}/{season.episodeCount}
          </span>
        </button>
        <Button
          variant="outline"
          size="sm"
          disabled={actions.isPending}
          aria-label={complete ? `Décocher ${label}` : `Marquer ${label} comme vue`}
          onClick={() => (complete ? actions.unmarkSeason(season.seasonNumber) : actions.markSeason(season.seasonNumber))}
        >
          {actions.isPending ? <Loader2 className="animate-spin" /> : <Check />}
          {complete ? 'Décocher' : 'Tout vu'}
        </Button>
      </div>

      {expanded && <SeasonEpisodes tvId={tvId} season={season.seasonNumber} watched={watched} actions={actions} />}
    </li>
  )
}

function SeasonEpisodes({
  tvId,
  season,
  watched,
  actions,
}: {
  tvId: number
  season: number
  watched: ReadonlySet<string>
  actions: Actions
}) {
  const data = useQuery({
    queryKey: seasonKey(tvId, season),
    queryFn: ({ signal }) => getSeason(tvId, season, signal),
    staleTime: 30 * 60_000,
  })
  const today = todayLocal()

  if (data.isPending) {
    return (
      <div className="space-y-2 border-t p-3" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (data.isError) {
    return (
      <div role="alert" className="flex items-center justify-between gap-3 border-t p-3 text-sm">
        <span>{apiErrorMessage(data.error)}</span>
        <Button variant="outline" size="sm" onClick={() => void data.refetch()}>
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <ul className="divide-y border-t">
      {data.data.episodes.map((episode) => {
        const isWatched = watched.has(epKey(season, episode.episodeNumber))
        const upcoming = isUpcoming(episode.airDate, today)
        return (
          <li key={episode.episodeNumber} className="flex items-center gap-2 p-2">
            <button
              type="button"
              role="checkbox"
              aria-checked={isWatched}
              aria-label={`${formatEpisode(season, episode.episodeNumber)} ${episode.name}`}
              disabled={actions.isPending || (upcoming && !isWatched)}
              onClick={() => actions.toggle(season, episode.episodeNumber, !isWatched)}
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-md border outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40',
                isWatched ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
              )}
            >
              {isWatched && <Check className="size-4" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                <span className="text-muted-foreground">E{episode.episodeNumber}</span> {episode.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatAirDate(episode.airDate)}
                {episode.runtime ? ` · ${episode.runtime} min` : ''}
              </p>
            </div>
            {upcoming ? (
              <Badge variant="outline">À venir</Badge>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                disabled={actions.isPending}
                aria-label={`Marquer jusqu'à ${formatEpisode(season, episode.episodeNumber)}`}
                title="Marquer tout jusqu'ici comme vu"
                onClick={() => actions.markUpTo(season, episode.episodeNumber)}
              >
                <ListChecks />
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
