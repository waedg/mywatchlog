import type { CSSProperties } from 'react'

import type { LibraryItem } from '../library/group'

import { formatEpisode, nextEpisode, progressTone, totalEpisodes, watchedCount, type ProgressTone } from './progress'

const BAR_STYLE: Record<ProgressTone, CSSProperties> = {
  progress: { backgroundColor: 'var(--primary)' },
  // Jaune rayé : tout est vu, mais de nouveaux épisodes peuvent arriver.
  'caught-up': {
    backgroundImage:
      'repeating-linear-gradient(45deg, var(--primary) 0 6px, color-mix(in oklab, var(--primary) 45%, transparent) 6px 12px)',
  },
  // Vert fluo : série terminée et entièrement vue.
  ended: { backgroundColor: 'oklch(0.87 0.27 145)' },
  dropped: { backgroundColor: 'oklch(0.63 0.25 25)' },
}

/** Barre, compteur et prochain épisode sous la carte d'une série. */
export default function TvProgress({ item, watched }: { item: LibraryItem; watched: ReadonlySet<string> | undefined }) {
  const total = totalEpisodes(item.seasonCounts)
  if (item.type !== 'tv' || total === 0) return null

  const set = watched ?? new Set<string>()
  const done = watchedCount(set, item.seasonCounts)
  const next = nextEpisode(set, item.seasonCounts)
  const tone = progressTone(item.status, done, total, item.isEnded === true)
  const width = tone === 'dropped' ? Math.max(Math.round((done / total) * 100), 8) : Math.round((done / total) * 100)

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
        <div className="h-full" style={{ ...BAR_STYLE[tone], width: `${width}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {done}/{total}
        {tone === 'dropped'
          ? ' · abandonné'
          : next
            ? ` · prochain ${formatEpisode(next.season, next.episode)}`
            : item.isEnded
              ? ' · terminé'
              : ' · à jour'}
      </p>
    </div>
  )
}
