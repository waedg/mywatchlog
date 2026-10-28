import type { DiscoverFilters, DiscoverSort, MediaType } from '../../../shared/tmdb-types'

/** État de l'écran Explorer, relu depuis l'URL (D-34). */
export interface ExploreState {
  type: MediaType
  genres: number[]
  yearFrom?: number
  yearTo?: number
  minRating?: number
  provider?: number
  sort: DiscoverSort
}

export const MAX_GENRES = 5
export const MIN_YEAR = 1888
export const MAX_YEAR = 2100
/** Notes minimales proposées. */
export const RATING_STEPS = [6, 7, 8, 9] as const
export const SORTS: { value: DiscoverSort; label: string }[] = [
  { value: 'popularity', label: 'Popularité' },
  { value: 'rating', label: 'Mieux notés' },
  { value: 'date', label: 'Plus récents' },
]

function positiveInt(value: string | null, min: number, max: number): number | undefined {
  if (value === null || !/^\d+$/.test(value)) return undefined
  const n = Number(value)
  return n >= min && n <= max ? n : undefined
}

/** Une année saisie n'est prise en compte que complète (4 chiffres) et plausible. */
export function parseYear(value: string | null): number | undefined {
  return value !== null && /^\d{4}$/.test(value) ? positiveInt(value, MIN_YEAR, MAX_YEAR) : undefined
}

export function parseExplore(params: URLSearchParams): ExploreState {
  const type: MediaType = params.get('type') === 'tv' ? 'tv' : 'movie'
  const genres = [
    ...new Set(
      (params.get('g') ?? '')
        .split(',')
        .map((part) => positiveInt(part, 1, 99999))
        .filter((id): id is number => id !== undefined),
    ),
  ].slice(0, MAX_GENRES)
  let yearFrom = parseYear(params.get('from'))
  let yearTo = parseYear(params.get('to'))
  // Bornes inversées : on les ignore plutôt que de renvoyer une erreur.
  if (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo) {
    yearFrom = undefined
    yearTo = undefined
  }
  const rating = positiveInt(params.get('min'), 1, 10)
  const sortParam = params.get('sort')
  return {
    type,
    genres,
    yearFrom,
    yearTo,
    minRating: rating,
    provider: positiveInt(params.get('p'), 1, 99999),
    sort: sortParam === 'rating' || sortParam === 'date' ? sortParam : 'popularity',
  }
}

/** Filtres d'appel API ; la plateforme n'est envoyée qu'avec un pays. */
export function toDiscoverFilters(state: ExploreState, region: string, page: number): DiscoverFilters {
  return {
    genres: state.genres,
    yearFrom: state.yearFrom,
    yearTo: state.yearTo,
    minRating: state.minRating,
    provider: state.provider,
    region: state.provider === undefined ? undefined : region,
    sort: state.sort,
    page,
  }
}

/** Ajoute ou retire un genre en respectant le maximum. */
export function toggleGenre(genres: number[], id: number): number[] {
  if (genres.includes(id)) return genres.filter((genre) => genre !== id)
  return genres.length >= MAX_GENRES ? genres : [...genres, id]
}

/** Nombre de filtres actifs (hors type et tri), pour afficher « Réinitialiser ». */
export function activeFilterCount(state: ExploreState): number {
  return (
    state.genres.length +
    (state.yearFrom !== undefined ? 1 : 0) +
    (state.yearTo !== undefined ? 1 : 0) +
    (state.minRating !== undefined ? 1 : 0) +
    (state.provider !== undefined ? 1 : 0)
  )
}
