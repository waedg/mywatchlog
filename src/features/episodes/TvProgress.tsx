import type { LibraryItem } from '../library/group'

import { formatEpisode, nextEpisode, totalEpisodes, watchedCount } from './progress'

/** Compteur et prochain épisode sous la carte d'une série. */
export default function TvProgress({ item, watched }: { item: LibraryItem; watched: ReadonlySet<string> | undefined }) {
  const total = totalEpisodes(item.seasonCounts)
  if (item.type !== 'tv' || total === 0) return null

  const set = watched ?? new Set<string>()
  const done = watchedCount(set, item.seasonCounts)
  const next = nextEpisode(set, item.seasonCounts)

  return (
    <div className="space-y-1.5 px-0.5">
      <div
        className="h-1.5 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label="Épisodes vus"
      >
        <div className="h-full bg-primary" style={{ width: `${Math.round((done / total) * 100)}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {done}/{total}
        {next ? ` · prochain ${formatEpisode(next.season, next.episode)}` : item.isEnded ? ' · terminé' : ' · à jour'}
      </p>
    </div>
  )
}
