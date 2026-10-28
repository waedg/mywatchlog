import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, User, WifiOff } from 'lucide-react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import EmptyState from '@/components/layout/EmptyState'
import PosterCard from '@/components/PosterCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAirDate } from '@/features/episodes/progress'
import AddToLibraryButton from '@/features/library/AddToLibraryButton'
import { libraryKey, parseTypeFilter, type TypeFilter } from '@/features/library/group'
import { useLibrary } from '@/features/library/useLibrary'
import { getPerson } from '@/lib/api'
import { apiErrorMessage } from '@/lib/api-error'
import { profileUrl } from '@/lib/tmdb-images'
import { cn } from '@/lib/utils'

const FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'movie', label: 'Films' },
  { value: 'tv', label: 'Séries' },
]

const GRID = 'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'

export default function PersonPage() {
  const id = Number(useParams().id)
  if (!Number.isInteger(id) || id <= 0) return <Navigate to="/library" replace />
  return <Person id={id} />
}

function Person({ id }: { id: number }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filter = parseTypeFilter(params.get('type'))
  const [expanded, setExpanded] = useState(false)
  const library = useLibrary()
  const person = useQuery({
    queryKey: ['person', id],
    queryFn: ({ signal }) => getPerson(id, signal),
    staleTime: 24 * 60 * 60_000,
  })

  const owned = new Set((library.data ?? []).map((item) => libraryKey(item.type, item.id)))
  const setFilter = (value: TypeFilter) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value === 'all') next.delete('type')
        else next.set('type', value)
        return next
      },
      { replace: true },
    )

  const back = (
    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
      <ArrowLeft />
      Retour
    </Button>
  )

  if (person.isPending && person.fetchStatus === 'paused') {
    return (
      <section className="space-y-6">
        {back}
        <EmptyState icon={WifiOff} title="Hors connexion" description="La fiche d'un acteur nécessite une connexion à internet." />
      </section>
    )
  }

  if (person.isPending) {
    return (
      <section className="space-y-6" aria-busy="true">
        {back}
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className={GRID}>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
          ))}
        </div>
      </section>
    )
  }

  if (person.isError) {
    return (
      <section className="space-y-6">
        {back}
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 px-6 py-12 text-center">
          <p className="text-sm">{apiErrorMessage(person.error)}</p>
          <Button variant="outline" onClick={() => void person.refetch()}>
            Réessayer
          </Button>
        </div>
      </section>
    )
  }

  const data = person.data
  const photo = profileUrl(data.profilePath)
  const credits = filter === 'all' ? data.credits : data.credits.filter((credit) => credit.type === filter)
  const longBio = data.biography.length > 450

  return (
    <section className="space-y-6">
      {back}

      <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
        {photo ? (
          <img src={photo} alt={data.name} className="aspect-[2/3] w-40 rounded-xl border object-cover" />
        ) : (
          <div className="flex aspect-[2/3] w-40 items-center justify-center rounded-xl border bg-card text-muted-foreground">
            <User className="size-10" />
          </div>
        )}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
          <p className="text-sm text-muted-foreground">
            {data.birthday ? `Né(e) le ${formatAirDate(data.birthday)}` : ''}
            {data.placeOfBirth ? `${data.birthday ? ' · ' : ''}${data.placeOfBirth}` : ''}
            {data.deathday ? ` · Décédé(e) le ${formatAirDate(data.deathday)}` : ''}
          </p>
          {data.biography ? (
            <>
              <p className={cn('whitespace-pre-line text-sm leading-relaxed', longBio && !expanded && 'line-clamp-6')}>
                {data.biography}
              </p>
              {longBio && (
                <Button variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>
                  {expanded ? 'Réduire' : 'Lire la suite'}
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune biographie disponible.</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Filmographie</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer la filmographie">
          {FILTERS.map(({ value, label }) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? 'default' : 'outline'}
              className={cn('rounded-full', filter !== value && 'text-muted-foreground')}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        {credits.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun titre dans cette catégorie.</p>
        ) : (
          <div className={GRID}>
            {credits.map((credit) => (
              <PosterCard
                key={libraryKey(credit.type, credit.id)}
                title={credit.title}
                year={credit.year}
                type={credit.type}
                posterPath={credit.posterPath}
                to={`/title/${credit.type}/${credit.id}`}
                action={
                  <>
                    {credit.character && (
                      <p className="line-clamp-1 px-0.5 text-xs text-muted-foreground">{credit.character}</p>
                    )}
                    <AddToLibraryButton item={credit} inLibrary={owned.has(libraryKey(credit.type, credit.id))} />
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
