// Types partagés entre la fonction serverless (api/tmdb.ts) et l'interface (src/).
// Import en `import type` uniquement : aucun code n'est embarqué.

export type MediaType = 'movie' | 'tv'

export interface SearchResult {
  id: number
  type: MediaType
  title: string
  year: number | null
  posterPath: string | null
  overview: string
}

export interface SearchResponse {
  page: number
  totalPages: number
  results: SearchResult[]
}

export interface TitleDetails {
  id: number
  type: MediaType
  imdbId: string | null
  title: string
  originalTitle: string
  year: number | null
  posterPath: string | null
  overview: string
  genres: string[]
  voteAverage: number | null
  /** Renseigné pour les séries uniquement. */
  tv: TvInfo | null
}

export interface SeasonSummary {
  seasonNumber: number
  name: string
  episodeCount: number
  airDate: string | null
}

export interface TvInfo {
  /** Saisons triées par numéro (la saison 0 = épisodes spéciaux). */
  seasons: SeasonSummary[]
  /** Série terminée ou annulée. */
  ended: boolean
}

export interface EpisodeInfo {
  episodeNumber: number
  name: string
  airDate: string | null
  runtime: number | null
}

export interface SeasonDetails {
  seasonNumber: number
  episodes: EpisodeInfo[]
}
