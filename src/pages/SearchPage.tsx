import { useState } from 'react'
import { SearchX, Search as SearchIcon, X } from 'lucide-react'

import EmptyState from '@/components/layout/EmptyState'
import PosterCard from '@/components/PosterCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import AddToLibraryButton from '@/features/library/AddToLibraryButton'
import { libraryKey } from '@/features/library/group'
import { useLibrary } from '@/features/library/useLibrary'
import { MIN_QUERY_LENGTH, useSearch } from '@/features/search/useSearch'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { apiErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'movie' | 'tv'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'movie', label: 'Films' },
  { value: 'tv', label: 'Séries' },
]

const GRID = 'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'

export default function SearchPage() {
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const debounced = useDebouncedValue(input)
  const search = useSearch(debounced)
  const library = useLibrary()
  const owned = new Set((library.data ?? []).map((item) => libraryKey(item.type, item.id)))

  const trimmed = debounced.trim()
  const results = search.data?.results ?? []
  const counts = {
    all: results.length,
    movie: results.filter((r) => r.type === 'movie').length,
    tv: results.filter((r) => r.type === 'tv').length,
  }
  const visible = filter === 'all' ? results : results.filter((r) => r.type === filter)

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Recherche</h1>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Un film, une série…"
          aria-label="Rechercher un film ou une série"
          autoFocus
          className="pl-11 pr-11"
        />
        {input && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-9 -translate-y-1/2"
            aria-label="Effacer la recherche"
            onClick={() => setInput('')}
          >
            <X />
          </Button>
        )}
      </div>

      {trimmed.length < MIN_QUERY_LENGTH && (
        <EmptyState
          icon={SearchIcon}
          title="Cherche un film ou une série"
          description={`Saisis au moins ${MIN_QUERY_LENGTH} lettres pour lancer la recherche.`}
        />
      )}

      {trimmed.length >= MIN_QUERY_LENGTH && (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les résultats">
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
                {search.data && <span className="opacity-70">{counts[value]}</span>}
              </Button>
            ))}
          </div>

          {search.isPending && (
            <div className={GRID} aria-busy="true">
              {Array.from({ length: 10 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="aspect-[2/3] rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          )}

          {search.isError && (
            <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 px-6 py-12 text-center">
              <p className="text-sm">{apiErrorMessage(search.error)}</p>
              <Button variant="outline" onClick={() => void search.refetch()}>
                Réessayer
              </Button>
            </div>
          )}

          {search.isSuccess && visible.length === 0 && (
            <EmptyState
              icon={SearchX}
              title="Aucun résultat"
              description={
                filter === 'all'
                  ? `Rien trouvé pour « ${trimmed} ». Essaie une autre orthographe.`
                  : 'Aucun résultat dans cette catégorie. Essaie un autre filtre.'
              }
            />
          )}

          {search.isSuccess && visible.length > 0 && (
            <div className={GRID}>
              {visible.map((item) => (
                <PosterCard
                  key={`${item.type}-${item.id}`}
                  title={item.title}
                  year={item.year}
                  type={item.type}
                  posterPath={item.posterPath}
                  action={
                    <AddToLibraryButton
                      item={item}
                      inLibrary={owned.has(libraryKey(item.type, item.id))}
                    />
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
