import { WifiOff } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import PosterCard from '@/components/PosterCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import AddToLibraryButton from '@/features/library/AddToLibraryButton'
import { libraryKey, type LibraryItem, type TypeFilter } from '@/features/library/group'
import { apiErrorMessage } from '@/lib/api-error'
import { getForYou } from '@/lib/api'

import { FOR_YOU_MIN_SOURCES, filterForYou, forYouCacheKey, pickForYouSources, visibleSlice } from './forYou'
import ShowMoreButton from './ShowMoreButton'
import { GRID } from './TmdbSection'

const DAY = 24 * 60 * 60_000

interface Props {
  items: LibraryItem[]
  type: TypeFilter
  owned: Set<string>
}

export default function ForYouSection({ items, type, owned }: Props) {
  const sources = pickForYouSources(items)
  const enough = sources.length >= FOR_YOU_MIN_SOURCES
  const cacheKey = forYouCacheKey(sources)
  // Nombre de tranches affichées, remis à 1 quand les sources changent.
  const [expanded, setExpanded] = useState({ key: cacheKey, pages: 1 })
  const pages = expanded.key === cacheKey ? expanded.pages : 1

  const query = useQuery({
    queryKey: ['for-you', cacheKey],
    queryFn: ({ signal }) => getForYou(sources.map(({ id, type: sourceType }) => ({ id, type: sourceType })), signal),
    enabled: enough,
    staleTime: DAY,
    gcTime: DAY,
  })

  const filtered = filterForYou(query.data?.results ?? [], owned, type, Infinity)
  const results = visibleSlice(filtered, pages)

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Pour toi</h2>

      {!enough && (
        <p className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
          Il faut au moins {FOR_YOU_MIN_SOURCES} titres notés 8 ou plus, ou mis en favori, pour te recommander des titres
          (il en manque {FOR_YOU_MIN_SOURCES - sources.length}). Les titres « Vu » sans note ne comptent pas.
        </p>
      )}

      {enough && query.isPending && query.fetchStatus === 'paused' && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <WifiOff className="size-4" />
          Hors connexion : cette section nécessite internet.
        </p>
      )}

      {enough && query.isPending && query.fetchStatus !== 'paused' && (
        <div className={GRID} aria-busy="true">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {enough && query.isError && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 px-6 py-8 text-center">
          <p className="text-sm">{apiErrorMessage(query.error)}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Réessayer
          </Button>
        </div>
      )}

      {enough && query.isSuccess && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {type === 'all' ? 'Aucune nouvelle recommandation pour le moment.' : 'Aucune recommandation de ce type pour le moment.'}
        </p>
      )}

      {enough && query.isSuccess && results.length > 0 && (
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
                    {item.score > 1 ? `Recommandé via ${item.score} de tes titres` : 'Recommandé via 1 de tes titres'}
                  </p>
                  <AddToLibraryButton item={item} inLibrary={owned.has(libraryKey(item.type, item.id))} />
                </div>
              }
            />
          ))}
        </div>
      )}

      {enough && query.isSuccess && (
        <ShowMoreButton total={filtered.length} pages={pages} onMore={() => setExpanded({ key: cacheKey, pages: pages + 1 })} />
      )}
    </div>
  )
}
