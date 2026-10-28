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
}
