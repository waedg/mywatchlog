import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, Heart, Star, Trash2, WifiOff } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import EmptyState from '@/components/layout/EmptyState'
import FullScreenLoader from '@/components/layout/FullScreenLoader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import EpisodeTracker from '@/features/episodes/EpisodeTracker'
import { sameSeasonCounts, toSeasonCounts } from '@/features/episodes/progress'
import { syncTvMeta } from '@/features/episodes/api'
import { useWatched } from '@/features/episodes/useEpisodes'
import AddToLibraryButton from '@/features/library/AddToLibraryButton'
import {
  isValidRating,
  libraryKey,
  STATUS_LABELS,
  STATUS_ORDER,
  statusPatch,
  type LibraryItem,
} from '@/features/library/group'
import { useTitleDetails } from '@/features/library/useTitleDetails'
import { useLibrary, useRemoveFromLibrary, useUpdateUserTitle } from '@/features/library/useLibrary'
import { apiErrorMessage } from '@/lib/api-error'
import { posterUrl } from '@/lib/tmdb-images'
import { cn } from '@/lib/utils'
import type { MediaType } from '../../shared/tmdb-types'

export default function TitleDetailPage() {
  const params = useParams()
  const type = params.type
  const id = Number(params.id)
  if ((type !== 'movie' && type !== 'tv') || !Number.isInteger(id) || id <= 0) {
    return <Navigate to="/library" replace />
  }
  return <TitleDetail type={type} id={id} />
}

function TitleDetail({ type, id }: { type: MediaType; id: number }) {
  const navigate = useNavigate()
  const details = useTitleDetails(type, id)
  const library = useLibrary()
  const watched = useWatched()
  const queryClient = useQueryClient()

  const entry = library.data?.find((item) => libraryKey(item.type, item.id) === libraryKey(type, id))
  const tv = details.data?.tv ?? null

  // Série ajoutée avant les compteurs de saisons, ou saisons modifiées par TMDB : on remet le cache à jour.
  useEffect(() => {
    if (!entry || !tv) return
    const counts = toSeasonCounts(tv.seasons)
    if (sameSeasonCounts(counts, entry.seasonCounts) && entry.isEnded === tv.ended) return
    void syncTvMeta(id, counts, tv.ended).then(() => queryClient.invalidateQueries({ queryKey: ['library'] }))
  }, [entry, tv, id, queryClient])

  if (details.isPending && details.fetchStatus === 'paused') {
    return (
      <section className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft />
          Retour
        </Button>
        <EmptyState icon={WifiOff} title="Hors connexion" description="La fiche détaillée nécessite une connexion à internet." />
      </section>
    )
  }

  if (details.isPending || library.isPending) return <FullScreenLoader />

  return (
    <section className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft />
        Retour
      </Button>

      {details.isError && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 px-6 py-12 text-center">
          <p className="text-sm">{apiErrorMessage(details.error)}</p>
          <Button variant="outline" onClick={() => void details.refetch()}>
            Réessayer
          </Button>
        </div>
      )}

      {details.isSuccess && (
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <Poster title={details.data.title} path={details.data.posterPath} />

          <div className="space-y-5">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{details.data.title}</h1>
              {details.data.originalTitle !== details.data.title && (
                <p className="text-sm text-muted-foreground">{details.data.originalTitle}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{type === 'movie' ? 'Film' : 'Série'}</Badge>
                <span>{details.data.year ?? 'Année inconnue'}</span>
                {details.data.voteAverage !== null && details.data.voteAverage > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3.5 text-primary" />
                    {details.data.voteAverage.toFixed(1)} TMDB
                  </span>
                )}
              </div>
              {details.data.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {details.data.genres.map((genre) => (
                    <Badge key={genre} variant="outline">
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {details.data.overview && <p className="text-sm leading-relaxed">{details.data.overview}</p>}

            {details.data.imdbId && (
              <Button variant="outline" size="sm" asChild>
                <a href={`https://www.imdb.com/title/${details.data.imdbId}/`} target="_blank" rel="noreferrer">
                  <ExternalLink />
                  Voir sur IMDb
                </a>
              </Button>
            )}

            {entry ? <Actions entry={entry} /> : <AddToLibraryButton item={{ id, type }} inLibrary={false} />}
          </div>

          {entry && details.data.tv && (
            <div className="md:col-span-2">
              <EpisodeTracker tvId={id} tv={details.data.tv} watched={watched.data?.get(id) ?? new Set<string>()} />
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function Poster({ title, path }: { title: string; path: string | null }) {
  const src = posterUrl(path, 'w500')
  if (!src) {
    return (
      <div className="flex aspect-[2/3] items-center justify-center rounded-xl border bg-card text-xs text-muted-foreground">
        Pas d'affiche
      </div>
    )
  }
  return <img src={src} alt={`Affiche de ${title}`} className="aspect-[2/3] w-full max-w-60 rounded-xl border object-cover" />
}

function Actions({ entry }: { entry: LibraryItem }) {
  const navigate = useNavigate()
  const ref = { id: entry.id, type: entry.type }
  const update = useUpdateUserTitle(ref)
  const remove = useRemoveFromLibrary(ref)
  const [confirming, setConfirming] = useState(false)

  const error = update.error ?? remove.error

  return (
    <div className="space-y-5 rounded-2xl border p-4">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Statut</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Statut">
          {STATUS_ORDER.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={entry.status === status ? 'default' : 'outline'}
              className={cn('rounded-full', entry.status !== status && 'text-muted-foreground')}
              aria-pressed={entry.status === status}
              disabled={update.isPending}
              onClick={() => entry.status !== status && update.mutate(statusPatch(status))}
            >
              {STATUS_LABELS[status]}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Ma note</h2>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10" role="group" aria-label="Note sur 10">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={entry.rating === value ? 'default' : 'outline'}
              aria-pressed={entry.rating === value}
              disabled={update.isPending || !isValidRating(value)}
              onClick={() => update.mutate({ rating: entry.rating === value ? null : value })}
            >
              {value}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Touche la note choisie pour l'effacer.</p>
      </div>

      <Button
        variant={entry.isFavorite ? 'default' : 'outline'}
        size="sm"
        aria-pressed={entry.isFavorite}
        disabled={update.isPending}
        onClick={() => update.mutate({ is_favorite: !entry.isFavorite })}
      >
        <Heart className={cn(entry.isFavorite && 'fill-current')} />
        {entry.isFavorite ? 'Dans mes favoris' : 'Ajouter aux favoris'}
      </Button>

      <div className="border-t pt-4">
        {!confirming ? (
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirming(true)}>
            <Trash2 />
            Retirer de ma liste
          </Button>
        ) : (
          <div role="alertdialog" aria-label="Confirmer le retrait" className="space-y-3">
            <p className="text-sm">
              Retirer ce titre de ta liste ? Ton statut, ta note et ton favori seront supprimés.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={remove.isPending}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={remove.isPending}
                onClick={() => remove.mutate(undefined, { onSuccess: () => navigate('/library', { replace: true }) })}
              >
                Retirer
              </Button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {apiErrorMessage(error)}
        </p>
      )}
    </div>
  )
}

