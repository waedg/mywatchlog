import type { MediaType, TitleDetails } from '../../../shared/tmdb-types'
import { formatEpisode } from '../episodes/progress'
import type { LibraryItem } from '../library/group'

export interface UpcomingEntry {
  key: string
  id: number
  type: MediaType
  title: string
  posterPath: string | null
  /** Date de sortie ou de diffusion, AAAA-MM-JJ. */
  date: string
  /** Ex. « S02E05 » pour une série, « Sortie » pour un film. */
  label: string
  /** Titre de l'épisode (séries). */
  detail: string | null
}

export type UpcomingGroupKey = 'today' | 'week' | 'later'

export interface UpcomingGroup {
  key: UpcomingGroupKey
  label: string
  entries: UpcomingEntry[]
}

/** Titres de la liste dont on cherche une prochaine date (D-36) : films à regarder, séries en cours ou à regarder. */
export function isCandidate(item: LibraryItem): boolean {
  if (item.type === 'movie') return item.status === 'to_watch'
  return item.status === 'watching' || item.status === 'to_watch'
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Prochaine sortie d'un titre de la liste, ou null si rien n'est annoncé à partir d'aujourd'hui. */
export function buildUpcoming(item: LibraryItem, details: TitleDetails | undefined, today: string): UpcomingEntry | null {
  if (!details) return null
  const base = { key: `${item.type}-${item.id}`, id: item.id, type: item.type, title: item.title, posterPath: item.posterPath }

  if (item.type === 'movie') {
    if (!details.releaseDate || details.releaseDate < today) return null
    return { ...base, date: details.releaseDate, label: 'Sortie', detail: null }
  }

  const next = details.nextEpisode
  if (!next || next.airDate < today) return null
  return { ...base, date: next.airDate, label: formatEpisode(next.seasonNumber, next.episodeNumber), detail: next.name }
}

const LABELS: Record<UpcomingGroupKey, string> = {
  today: "Aujourd'hui",
  week: 'Cette semaine',
  later: 'Plus tard',
}

/** Trie par date puis par titre, et regroupe : aujourd'hui, 7 jours suivants, plus tard. */
export function groupUpcoming(entries: UpcomingEntry[], today: string): UpcomingGroup[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'fr'))
  const weekEnd = addDays(today, 7)
  const keyOf = (date: string): UpcomingGroupKey => (date === today ? 'today' : date <= weekEnd ? 'week' : 'later')

  return (['today', 'week', 'later'] as const)
    .map((key) => ({ key, label: LABELS[key], entries: sorted.filter((entry) => keyOf(entry.date) === key) }))
    .filter((group) => group.entries.length > 0)
}

export function formatDayLong(date: string): string {
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}
