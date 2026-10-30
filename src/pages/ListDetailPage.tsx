import { ArrowLeft, FolderOpen, SearchX, WifiOff } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import EmptyState from '@/components/layout/EmptyState'
import PosterCard from '@/components/PosterCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { libraryKey, parseTypeFilter, type TypeFilter } from '@/features/library/group'
import { listItemsOf } from '@/features/lists/derive'
import CollectionSuggestions from '@/features/lists/CollectionSuggestions'
import ListHeader from '@/features/lists/ListHeader'
import RemoveFromListButton from '@/features/lists/RemoveFromListButton'
import { useLists } from '@/features/lists/useLists'
import { useOnline } from '@/hooks/useOnline'
import { cn } from '@/lib/utils'

const GRID = 'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
const FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'movie', label: 'Films' },
  { value: 'tv', label: 'Séries' },
]

export default function ListDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const online = useOnline()
  const lists = useLists()
  // Filtre dans l'URL : le bouton retour restitue la même vue (D-34).
  const [params, setParams] = useSearchParams()
  const filter = parseTypeFilter(params.get('type'))
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

  const list = lists.data?.lists.find((entry) => entry.id === id)
  const all = lists.data && list ? listItemsOf(lists.data, list.id) : []
  const items = filter === 'all' ? all : all.filter((item) => item.type === filter)
  const counts = { all: all.length, movie: all.filter((i) => i.type === 'movie').length, tv: all.filter((i) => i.type === 'tv').length }

  return (
    <section className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/library/lists">
          <ArrowLeft />
          Collections
        </Link>
      </Button>

      {lists.isPending && lists.fetchStatus === 'paused' && (
        <EmptyState icon={WifiOff} title="Hors connexion" description="Tes collections n'ont pas encore été enregistrées sur cet appareil. Reconnecte-toi une première fois." />
      )}

      {lists.isPending && lists.fetchStatus !== 'paused' && (
        <div aria-busy="true" className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <div className={GRID}>
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="aspect-[2/3] rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {lists.isError && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 px-6 py-12 text-center">
          <p className="text-sm">Impossible de charger cette collection.</p>
          <Button variant="outline" onClick={() => void lists.refetch()}>
            Réessayer
          </Button>
        </div>
      )}

      {lists.isSuccess && !list && (
        <EmptyState icon={FolderOpen} title="Collection introuvable" description="Cette collection n'existe plus. Elle a peut-être été supprimée sur un autre appareil." />
      )}

      {list && (
        <>
          <ListHeader key={list.id} list={list} itemCount={all.length} online={online} onDeleted={() => navigate('/library/lists', { replace: true })} />

          {all.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par type">
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
                  <span className="opacity-70">{counts[value]}</span>
                </Button>
              ))}
            </div>
          )}

          {!online && <p className="flex items-center gap-2 text-xs text-muted-foreground"><WifiOff className="size-3.5" />Hors connexion : cette collection est en lecture seule.</p>}

          {all.length === 0 && (
            <EmptyState
              icon={FolderOpen}
              title="Collection vide"
              description="Ajoute des films et des séries à cette collection depuis leur fiche."
            />
          )}

          {all.length > 0 && items.length === 0 && (
            <EmptyState icon={SearchX} title="Rien dans cette sélection" description="Aucun titre de ce type dans la collection. Essaie un autre filtre." />
          )}

          {items.length > 0 && (
            <div className={GRID}>
              {items.map((item) => (
                <PosterCard
                  key={libraryKey(item.type, item.id)}
                  title={item.title}
                  year={item.year}
                  type={item.type}
                  posterPath={item.posterPath}
                  to={`/title/${item.type}/${item.id}`}
                  action={<RemoveFromListButton listId={list.id} item={item} online={online} />}
                />
              ))}
            </div>
          )}

          <CollectionSuggestions listId={list.id} items={all} type={filter} online={online} />
        </>
      )}
    </section>
  )
}
