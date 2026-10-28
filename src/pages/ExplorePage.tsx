import type { ReactNode } from 'react'
import { ArrowLeft, Loader2, SearchX, WifiOff } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import PosterCard from '@/components/PosterCard'
import EmptyState from '@/components/layout/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  activeFilterCount,
  MAX_GENRES,
  parseExplore,
  RATING_STEPS,
  SORTS,
  toggleGenre,
} from '@/features/discover/explore'
import { GRID } from '@/features/discover/TmdbSection'
import { useExploreResults, useGenres, useWatchProviders } from '@/features/discover/useExplore'
import AddToLibraryButton from '@/features/library/AddToLibraryButton'
import { libraryKey } from '@/features/library/group'
import { useLibrary } from '@/features/library/useLibrary'
import { apiErrorMessage } from '@/lib/api-error'
import { regionName } from '@/lib/region'
import { useRegion } from '@/lib/use-region'
import { cn } from '@/lib/utils'

const SELECT =
  'h-11 w-full rounded-lg border border-input bg-secondary/40 px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 md:text-sm'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

export default function ExplorePage() {
  // Tous les filtres sont dans l'URL : le bouton retour restitue la même exploration (D-34).
  const [params, setParams] = useSearchParams()
  const state = parseExplore(params)
  const [region] = useRegion()
  const update = (changes: Record<string, string | null>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace: true },
    )

  const genres = useGenres(state.type)
  const providers = useWatchProviders(state.type, region)
  const results = useExploreResults(state, region)
  const library = useLibrary()
  const owned = new Set((library.data ?? []).map((item) => libraryKey(item.type, item.id)))

  const items = (() => {
    const seen = new Set<string>()
    return (results.data?.pages ?? []).flatMap((page) => page.results).filter((item) => {
      const key = libraryKey(item.type, item.id)
      return !seen.has(key) && !!seen.add(key)
    })
  })()
  const filters = activeFilterCount(state)

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/discover">
            <ArrowLeft />
            Découvrir
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Explorer</h1>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Type">
        {(
          [
            ['movie', 'Films'],
            ['tv', 'Séries'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={state.type === value ? 'default' : 'outline'}
            className={cn('rounded-full', state.type !== value && 'text-muted-foreground')}
            aria-pressed={state.type === value}
            // Les identifiants de genre diffèrent entre films et séries : on repart sans genre.
            onClick={() => update({ type: value === 'movie' ? null : value, g: null })}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="space-y-5 rounded-2xl border p-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Genres <span className="opacity-70">({state.genres.length}/{MAX_GENRES}, tous doivent correspondre)</span>
          </p>
          {genres.isPending && <Skeleton className="h-8 w-full" />}
          {genres.isError && <p className="text-xs text-destructive">{apiErrorMessage(genres.error)}</p>}
          {genres.data && (
            <div className="flex flex-wrap gap-2">
              {genres.data.genres.map((genre) => {
                const active = state.genres.includes(genre.id)
                return (
                  <Button
                    key={genre.id}
                    size="sm"
                    variant={active ? 'default' : 'outline'}
                    className={cn('rounded-full', !active && 'text-muted-foreground')}
                    aria-pressed={active}
                    disabled={!active && state.genres.length >= MAX_GENRES}
                    onClick={() => update({ g: toggleGenre(state.genres, genre.id).join(',') || null })}
                  >
                    {genre.name}
                  </Button>
                )
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Année de début">
            <Input
              inputMode="numeric"
              maxLength={4}
              placeholder="1990"
              value={params.get('from') ?? ''}
              onChange={(event) => update({ from: event.target.value.replace(/\D/g, '') || null })}
            />
          </Field>
          <Field label="Année de fin">
            <Input
              inputMode="numeric"
              maxLength={4}
              placeholder="2026"
              value={params.get('to') ?? ''}
              onChange={(event) => update({ to: event.target.value.replace(/\D/g, '') || null })}
            />
          </Field>
          <Field label="Note minimale">
            <select className={SELECT} value={state.minRating ?? ''} onChange={(event) => update({ min: event.target.value || null })}>
              <option value="" className="bg-background">
                Toutes
              </option>
              {RATING_STEPS.map((step) => (
                <option key={step} value={step} className="bg-background">
                  {step}/10 et plus
                </option>
              ))}
            </select>
          </Field>
          <Field label="Trier par">
            <select
              className={SELECT}
              value={state.sort}
              onChange={(event) => update({ sort: event.target.value === 'popularity' ? null : event.target.value })}
            >
              {SORTS.map((sort) => (
                <option key={sort.value} value={sort.value} className="bg-background">
                  {sort.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label={`Plateforme (${regionName(region)})`}>
            <select
              className={SELECT}
              value={state.provider ?? ''}
              disabled={providers.isPending || providers.isError}
              onChange={(event) => update({ p: event.target.value || null })}
            >
              <option value="" className="bg-background">
                {providers.isError ? 'Indisponible' : 'Toutes'}
              </option>
              {(providers.data?.providers ?? []).map((provider) => (
                <option key={provider.id} value={provider.id} className="bg-background">
                  {provider.name}
                </option>
              ))}
            </select>
          </Field>
          {filters > 0 && (
            <div className="flex items-end">
              <Button variant="outline" onClick={() => update({ g: null, from: null, to: null, min: null, p: null })}>
                Réinitialiser les filtres ({filters})
              </Button>
            </div>
          )}
        </div>
        {state.provider !== undefined && (
          <p className="text-xs text-muted-foreground">
            Disponibilité (abonnement) fournie par{' '}
            <a href="https://www.justwatch.com" target="_blank" rel="noreferrer" className="underline underline-offset-2">
              JustWatch
            </a>
            . Le pays se change dans « À propos ».
          </p>
        )}
      </div>

      {results.isPending && results.fetchStatus === 'paused' && (
        <EmptyState icon={WifiOff} title="Hors connexion" description="L'exploration nécessite une connexion à internet." />
      )}

      {results.isPending && results.fetchStatus !== 'paused' && (
        <div className={GRID} aria-busy="true">
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {results.isError && !results.data && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 px-6 py-12 text-center">
          <p className="text-sm">{apiErrorMessage(results.error)}</p>
          <Button variant="outline" onClick={() => void results.refetch()}>
            Réessayer
          </Button>
        </div>
      )}

      {results.isSuccess && items.length === 0 && (
        <EmptyState icon={SearchX} title="Aucun résultat" description="Aucun titre ne correspond à ces critères. Retire un genre ou assouplis la note." />
      )}

      {items.length > 0 && (
        <>
          <div className={GRID}>
            {items.map((item) => (
              <PosterCard
                key={libraryKey(item.type, item.id)}
                title={item.title}
                year={item.year}
                type={item.type}
                posterPath={item.posterPath}
                to={`/title/${item.type}/${item.id}`}
                action={<AddToLibraryButton item={item} inLibrary={owned.has(libraryKey(item.type, item.id))} />}
              />
            ))}
          </div>
          {results.hasNextPage && (
            <div className="flex justify-center">
              <Button variant="outline" className="rounded-full" disabled={results.isFetchingNextPage} onClick={() => void results.fetchNextPage()}>
                {results.isFetchingNextPage && <Loader2 className="animate-spin" />}
                Voir plus
              </Button>
            </div>
          )}
          {results.isError && (
            <p role="alert" className="text-center text-xs text-destructive">
              {apiErrorMessage(results.error)}
            </p>
          )}
        </>
      )}
    </section>
  )
}
