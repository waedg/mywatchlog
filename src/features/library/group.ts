import type { MediaType } from '../../../shared/tmdb-types'

export type Status = 'to_watch' | 'watching' | 'watched'

export const STATUS_ORDER: Status[] = ['watching', 'to_watch', 'watched']

export const STATUS_LABELS: Record<Status, string> = {
  to_watch: 'À regarder',
  watching: 'En cours',
  watched: 'Vu',
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
}

export type TypeFilter = 'all' | MediaType

/** Clé unique d'un titre : les ids TMDB films / séries sont deux espaces distincts. */
export function libraryKey(type: MediaType, id: number): string {
  return `${type}-${id}`
}

export function isStatus(value: string): value is Status {
  return value === 'to_watch' || value === 'watching' || value === 'watched'
}

/** Filtre par type puis regroupe par statut (ordre d'affichage fixe, groupes vides omis, tri alphabétique). */
export function groupByStatus(
  items: LibraryItem[],
  filter: TypeFilter = 'all',
): { status: Status; items: LibraryItem[] }[] {
  const filtered = filter === 'all' ? items : items.filter((item) => item.type === filter)
  return STATUS_ORDER.map((status) => ({
    status,
    items: filtered
      .filter((item) => item.status === status)
      .sort((a, b) => a.title.localeCompare(b.title, 'fr')),
  })).filter((group) => group.items.length > 0)
}
