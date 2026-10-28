import { useState } from 'react'
import { Library } from 'lucide-react'

import EmptyState from '@/components/layout/EmptyState'
import PosterCard from '@/components/PosterCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { groupByStatus, libraryKey, STATUS_LABELS, type TypeFilter } from '@/features/library/group'
import { useLibrary } from '@/features/library/useLibrary'
import { cn } from '@/lib/utils'

const FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'movie', label: 'Films' },
  { value: 'tv', label: 'Séries' },
]

const GRID = 'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'

export default function LibraryPage() {
  const [filter, setFilter] = useState<TypeFilter>('all')
  const library = useLibrary()

  const items = library.data ?? []
  const groups = groupByStatus(items, filter)

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Ma liste</h1>

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
          </Button>
        ))}
      </div>

      {library.isPending && (
        <div className={GRID} aria-busy="true">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {library.isError && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 px-6 py-12 text-center">
          <p className="text-sm">Impossible de charger ta liste.</p>
          <Button variant="outline" onClick={() => void library.refetch()}>
            Réessayer
          </Button>
        </div>
      )}

      {library.isSuccess && groups.length === 0 && (
        <EmptyState
          icon={Library}
          title={items.length === 0 ? 'Ta liste est vide' : 'Rien dans cette catégorie'}
          description={
            items.length === 0
              ? 'Les films et séries que tu ajouteras apparaîtront ici, classés par statut.'
              : 'Essaie un autre filtre.'
          }
        />
      )}

      {library.isSuccess &&
        groups.map((group) => (
          <div key={group.status} className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
              {STATUS_LABELS[group.status]}{' '}
              <span className="text-muted-foreground">{group.items.length}</span>
            </h2>
            <div className={GRID}>
              {group.items.map((item) => (
                <PosterCard
                  key={libraryKey(item.type, item.id)}
                  title={item.title}
                  year={item.year}
                  type={item.type}
                  posterPath={item.posterPath}
                />
              ))}
            </div>
          </div>
        ))}
    </section>
  )
}
