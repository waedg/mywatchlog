import { RefreshCw, WifiOff } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import PosterCard from '@/components/PosterCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GRID } from '@/features/discover/TmdbSection'
import AddToLibraryButton from '@/features/library/AddToLibraryButton'
import { libraryKey, type TypeFilter } from '@/features/library/group'
import { useLibrary } from '@/features/library/useLibrary'
import { getForYou } from '@/lib/api'
import { apiErrorMessage } from '@/lib/api-error'

import type { ListItemRow } from './derive'
import {
  COLLECTION_MIN_SOURCES,
  collectionSuggestionsKey,
  filterCollectionSuggestions,
  hasEnoughSources,
  pickCollectionSources,
} from './suggestions'

const DAY = 24 * 60 * 60_000

interface Props {
  /** Tous les titres de la collection (non filtrés : ce sont les sources). */
  items: ListItemRow[]
  /** Filtre de type de la page, appliqué aux suggestions. */
  type: TypeFilter
  online: boolean
}

export default function CollectionSuggestions({ items, type, online }: Props) {
  const queryClient = useQueryClient()
  const library = useLibrary()
  const enough = hasEnoughSources(items)
  // Note et favori viennent de Ma liste : on attend son chargement pour ne pas changer de clé en cours de route.
  const libraryReady = library.isSuccess || library.isError
  const sources = pickCollectionSources(items, library.data ?? [])
  const queryKey = collectionSuggestionsKey(sources)
  const owned = new Set((library.data ?? []).map((entry) => libraryKey(entry.type, entry.id)))

  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => getForYou(sources, signal),
    enabled: enough && online && libraryReady,
    staleTime: DAY,
    gcTime: DAY,
  })

  const results = filterCollectionSuggestions(query.data?.results ?? [], items, type)
  const loading = enough && online && (!libraryReady || (query.isPending && query.fetchStatus !== 'paused'))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Suggestions</h2>
        {enough && online && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            disabled={query.isFetching}
            onClick={() => void queryClient.invalidateQueries({ queryKey })}
          >
            <RefreshCw className={query.isFetching ? 'animate-spin' : undefined} />
            Actualiser
          </Button>
        )}
      </div>

      {!enough && (
        <p className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
          Ajoute au moins {COLLECTION_MIN_SOURCES} titres à cette collection pour obtenir des suggestions
          (il en manque {COLLECTION_MIN_SOURCES - items.length}).
        </p>
      )}

      {enough && !online && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <WifiOff className="size-4" />
          Hors connexion : les suggestions nécessitent internet.
        </p>
      )}

      {loading && (
        <div className={GRID} aria-busy="true">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {enough && online && query.isError && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 px-6 py-8 text-center">
          <p className="text-sm">{apiErrorMessage(query.error)}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Réessayer
          </Button>
        </div>
      )}

      {enough && online && query.isSuccess && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {type === 'all' ? 'Aucune suggestion pour le moment.' : 'Aucune suggestion de ce type pour le moment.'}
        </p>
      )}

      {enough && online && query.isSuccess && results.length > 0 && (
        <div className={GRID}>
          {results.map((item) => (
            <PosterCard
              key={libraryKey(item.type, item.id)}
              title={item.title}
              year={item.year}
              type={item.type}
              posterPath={item.posterPath}
              to={`/title/${item.type}/${item.id}`}
              action={
                <div className="space-y-2">
                  <p className="px-0.5 text-xs text-muted-foreground">
                    {item.score > 1 ? `Suggéré via ${item.score} titres de la collection` : 'Suggéré via 1 titre de la collection'}
                  </p>
                  <AddToLibraryButton item={item} inLibrary={owned.has(libraryKey(item.type, item.id))} />
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
