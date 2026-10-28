import type { MediaType } from '../../../shared/tmdb-types'

export type DiscoverFilter = 'all' | MediaType

export interface SectionSpec {
  /** Identifiant stable (clé React et de requête). */
  id: string
  kind: 'trending' | 'popular'
  type: DiscoverFilter
  title: string
}

/** Sections TMDB de la page Découvrir pour un filtre de type (« Populaires » exige un type précis). */
export function tmdbSections(filter: DiscoverFilter): SectionSpec[] {
  if (filter === 'movie') {
    return [
      { id: 'trending-movie', kind: 'trending', type: 'movie', title: 'Films : tendances de la semaine' },
      { id: 'popular-movie', kind: 'popular', type: 'movie', title: 'Films populaires' },
    ]
  }
  if (filter === 'tv') {
    return [
      { id: 'trending-tv', kind: 'trending', type: 'tv', title: 'Séries : tendances de la semaine' },
      { id: 'popular-tv', kind: 'popular', type: 'tv', title: 'Séries populaires' },
    ]
  }
  return [
    { id: 'trending-all', kind: 'trending', type: 'all', title: 'Tendances de la semaine' },
    { id: 'popular-movie', kind: 'popular', type: 'movie', title: 'Films populaires' },
    { id: 'popular-tv', kind: 'popular', type: 'tv', title: 'Séries populaires' },
  ]
}

/** Nombre d'affiches affichées avant « Voir plus ». */
export const SECTION_PREVIEW = 10
