import type { MediaType } from '../../../shared/tmdb-types'
import type { SeasonCount } from '../episodes/progress'

export type Status = 'to_watch' | 'watching' | 'watched' | 'dropped'

export const STATUS_ORDER: Status[] = ['watching', 'to_watch', 'watched', 'dropped']

export const STATUS_LABELS: Record<Status, string> = {
  to_watch: 'À regarder',
  watching: 'En cours',
  watched: 'Vu',
  dropped: 'Abandonné',
}

export interface LibraryItem {
  id: number
  type: MediaType
  title: string
  year: number | null
  posterPath: string | null
  status: Status
  isFavorite: boolean
  rating: number | null
  /** Séries : épisodes par saison (vide tant que la fiche n'a pas été ouverte). */
  seasonCounts: SeasonCount[]
  isEnded: boolean | null
}

export type TypeFilter = 'all' | MediaType

/** Clé unique d'un titre : les ids TMDB films / séries sont deux espaces distincts. */
export function libraryKey(type: MediaType, id: number): string {
  return `${type}-${id}`
}

export function isStatus(value: string): value is Status {
  return value === 'to_watch' || value === 'watching' || value === 'watched' || value === 'dropped'
}

/** Filtre par type puis regroupe par statut (ordre d'affichage fixe, groupes vides omis, tri alphabétique). */
export function groupByStatus(
  items: LibraryItem[],
  filter: TypeFilter = 'all',
  favoritesOnly = false,
): { status: Status; items: LibraryItem[] }[] {
  const byType = filter === 'all' ? items : items.filter((item) => item.type === filter)
  const filtered = favoritesOnly ? byType.filter((item) => item.isFavorite) : byType
  return STATUS_ORDER.map((status) => ({
    status,
    items: filtered
      .filter((item) => item.status === status)
      .sort((a, b) => a.title.localeCompare(b.title, 'fr')),
  })).filter((group) => group.items.length > 0)
}

/** Champs à écrire quand le statut change : `watched_at` suit le statut « Vu ». */
export function statusPatch(
  status: Status,
  now: Date = new Date(),
): { status: Status; watched_at: string | null } {
  return { status, watched_at: status === 'watched' ? now.toISOString() : null }
}

export function isValidRating(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 10
}
