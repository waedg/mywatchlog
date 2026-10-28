import { useState } from 'react'
import { WifiOff } from 'lucide-react'

import PosterCard from '@/components/PosterCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import AddToLibraryButton from '@/features/library/AddToLibraryButton'
import { libraryKey } from '@/features/library/group'
import { apiErrorMessage } from '@/lib/api-error'

import { SECTION_PREVIEW, type SectionSpec } from './sections'
import { useTmdbSection } from './useDiscover'

export const GRID = 'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'

interface Props {
  section: SectionSpec
  /** Clés `libraryKey` des titres déjà dans la liste. */
  owned: Set<string>
}

export default function TmdbSection({ section, owned }: Props) {
  const query = useTmdbSection(section)
  const [expanded, setExpanded] = useState(false)
  const results = query.data?.results ?? []
  const visible = expanded ? results : results.slice(0, SECTION_PREVIEW)

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">{section.title}</h2>

      {query.isPending && query.fetchStatus === 'paused' && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <WifiOff className="size-4" />
          Hors connexion : cette section nécessite internet.
        </p>
      )}

      {query.isPending && query.fetchStatus !== 'paused' && (
        <div className={GRID} aria-busy="true">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {query.isError && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 px-6 py-8 text-center">
          <p className="text-sm">{apiErrorMessage(query.error)}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Réessayer
          </Button>
        </div>
      )}

      {query.isSuccess && results.length === 0 && <p className="text-sm text-muted-foreground">Rien à afficher pour le moment.</p>}

      {query.isSuccess && visible.length > 0 && (
        <>
          <div className={GRID}>
            {visible.map((item) => (
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
          {results.length > SECTION_PREVIEW && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setExpanded((value) => !value)}>
                {expanded ? 'Voir moins' : `Voir plus (${results.length - SECTION_PREVIEW})`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
