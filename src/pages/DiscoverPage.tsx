import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import ForYouSection from '@/features/discover/ForYouSection'
import TmdbSection from '@/features/discover/TmdbSection'
import TonightPick from '@/features/discover/TonightPick'
import { tmdbSections } from '@/features/discover/sections'
import { libraryKey, parseTypeFilter, type TypeFilter } from '@/features/library/group'
import { useLibrary } from '@/features/library/useLibrary'
import { cn } from '@/lib/utils'

const FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'movie', label: 'Films' },
  { value: 'tv', label: 'Séries' },
]

export default function DiscoverPage() {
  // Filtre dans l'URL : le bouton retour restitue la même vue (D-34).
  const [params, setParams] = useSearchParams()
  const filter = parseTypeFilter(params.get('type'))
  const copyOnly = params.get('copy') === '1'
  const update = (key: string, value: string | null) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  const setFilter = (value: TypeFilter) => update('type', value === 'all' ? null : value)
  const library = useLibrary()
  const owned = new Set((library.data ?? []).map((item) => libraryKey(item.type, item.id)))

  return (
    <section className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Découvrir</h1>

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

      {library.isSuccess && (
        <TonightPick items={library.data} type={filter} copyOnly={copyOnly} onToggleCopy={() => update('copy', copyOnly ? null : '1')} />
      )}

      {library.isSuccess && <ForYouSection items={library.data} type={filter} owned={owned} />}

      {tmdbSections(filter).map((section) => (
        <TmdbSection key={section.id} section={section} owned={owned} />
      ))}
    </section>
  )
}
