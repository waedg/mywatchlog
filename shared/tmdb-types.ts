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
  /** Date de sortie (film) ou de première diffusion (série), AAAA-MM-JJ. */
  releaseDate: string | null
  /** Prochain épisode annoncé (séries). */
  nextEpisode: NextEpisode | null
  /** Premiers rôles, dans l'ordre du générique. */
  cast: CastMember[]
}

export interface NextEpisode {
  seasonNumber: number
  episodeNumber: number
  name: string
  airDate: string
}

export interface CastMember {
  id: number
  name: string
  character: string
  profilePath: string | null
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

export interface ProviderInfo {
  id: number
  name: string
  logoPath: string | null
}

export interface ProvidersResponse {
  region: string
  /** Faux si TMDB ne référence aucune plateforme pour ce pays. */
  available: boolean
  flatrate: ProviderInfo[]
  rent: ProviderInfo[]
  buy: ProviderInfo[]
}

export interface PersonCredit {
  id: number
  type: MediaType
  title: string
  year: number | null
  posterPath: string | null
  character: string
  /** Date de sortie, AAAA-MM-JJ (null si inconnue). */
  date: string | null
}

export interface PersonDetails {
  id: number
  name: string
  biography: string
  birthday: string | null
  deathday: string | null
  placeOfBirth: string | null
  profilePath: string | null
  credits: PersonCredit[]
}
