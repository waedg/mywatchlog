import { useQueries } from '@tanstack/react-query'
import { CalendarDays, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'

import EmptyState from '@/components/layout/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { todayLocal } from '@/features/episodes/progress'
import { useLibrary } from '@/features/library/useLibrary'
import {
  buildUpcoming,
  formatDayLong,
  groupUpcoming,
  isCandidate,
  type UpcomingEntry,
} from '@/features/upcoming/upcoming'
import { getTitleDetails } from '@/lib/api'
import { posterUrl } from '@/lib/tmdb-images'

const DETAILS_STALE = 60 * 60_000

export default function UpcomingPage() {
  const library = useLibrary()
  const candidates = (library.data ?? []).filter(isCandidate)

  // Une requête par titre (cache partagé avec les fiches, valable 1 h).
  const results = useQueries({
    queries: candidates.map((item) => ({
      queryKey: ['details', item.type, item.id],
      queryFn: ({ signal }: { signal: AbortSignal }) => getTitleDetails(item.type, item.id, signal),
      staleTime: DETAILS_STALE,
    })),
  })

  const today = todayLocal()
  const entries = candidates
    .map((item, index) => buildUpcoming(item, results[index]?.data, today))
    .filter((entry): entry is UpcomingEntry => entry !== null)
  const groups = groupUpcoming(entries, today)

  const loading = results.filter((r) => r.isPending && r.fetchStatus !== 'paused').length
  const offline = candidates.length > 0 && results.every((r) => r.isPending && r.fetchStatus === 'paused')
  const failed = results.filter((r) => r.isError).length

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Sorties</h1>
      <p className="text-sm text-muted-foreground">
        Prochains épisodes de tes séries et sorties de tes films à regarder.
      </p>

      {library.isPending && library.fetchStatus !== 'paused' && <ListSkeleton />}

      {offline && (
        <EmptyState icon={WifiOff} title="Hors connexion" description="Les dates de sortie nécessitent une connexion à internet." />
      )}

      {!offline && library.isSuccess && candidates.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="Rien à suivre pour l'instant"
          description="Ajoute des séries en cours ou des films à regarder : leurs prochaines sorties apparaîtront ici."
        />
      )}

      {!offline && candidates.length > 0 && loading > 0 && (
        <p className="text-xs text-muted-foreground" role="status">
          Chargement des dates : {candidates.length - loading}/{candidates.length}
        </p>
      )}

      {groups.map((group) => (
        <div key={group.key} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">{group.label}</h2>
          <ul className="space-y-2">
            {group.entries.map((entry) => (
              <li key={entry.key}>
                <UpcomingRow entry={entry} />
              </li>
            ))}
          </ul>
        </div>
      ))}

      {!offline && candidates.length > 0 && loading === 0 && groups.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="Aucune sortie annoncée"
          description="Aucun prochain épisode ni date de sortie connus pour les titres de ta liste."
        />
      )}

      {failed > 0 && loading === 0 && (
        <p role="alert" className="text-xs text-muted-foreground">
          {failed} titre{failed > 1 ? 's' : ''} n'ont pas pu être vérifiés. Recharge la page pour réessayer.
        </p>
      )}
    </section>
  )
}

function UpcomingRow({ entry }: { entry: UpcomingEntry }) {
  const src = posterUrl(entry.posterPath, 'w185')
  return (
    <Link
      to={`/title/${entry.type}/${entry.id}`}
      className="flex items-center gap-3 rounded-xl border p-2 outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {src ? (
        <img src={src} alt="" loading="lazy" className="h-20 w-14 shrink-0 rounded-md object-cover" />
      ) : (
        <div className="h-20 w-14 shrink-0 rounded-md bg-secondary" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{entry.title}</p>
        <p className="truncate text-sm text-muted-foreground">
          <span className="text-primary">{entry.label}</span>
          {entry.detail ? ` · ${entry.detail}` : ''}
        </p>
        <p className="text-xs capitalize text-muted-foreground">{formatDayLong(entry.date)}</p>
      </div>
    </Link>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  )
}
