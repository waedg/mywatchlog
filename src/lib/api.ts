import type {
  DiscoverFilters,
  ForYouResponse,
  GenresResponse,
  ListResponse,
  MediaType,
  PersonDetails,
  ProviderListResponse,
  ProvidersResponse,
  SearchResponse,
  SeasonDetails,
  TitleDetails,
} from '../../shared/tmdb-types'

import { ApiError } from './api-error'
import { supabase } from './supabase'

async function tmdbRequest<T>(params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new ApiError(401, 'unauthorized')

  const url = new URL('/api/tmdb', window.location.origin)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)

  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: unknown }
    throw new ApiError(response.status, typeof body.error === 'string' ? body.error : 'error')
  }
  return (await response.json()) as T
}

export function searchTitles(query: string, signal?: AbortSignal): Promise<SearchResponse> {
  return tmdbRequest<SearchResponse>({ action: 'search', q: query }, signal)
}

export function getTitleDetails(type: MediaType, id: number, signal?: AbortSignal): Promise<TitleDetails> {
  return tmdbRequest<TitleDetails>({ action: 'details', type, id: String(id) }, signal)
}

export function getSeason(tvId: number, seasonNumber: number, signal?: AbortSignal): Promise<SeasonDetails> {
  return tmdbRequest<SeasonDetails>({ action: 'season', id: String(tvId), season: String(seasonNumber) }, signal)
}

export function getProviders(type: MediaType, id: number, region: string, signal?: AbortSignal): Promise<ProvidersResponse> {
  return tmdbRequest<ProvidersResponse>({ action: 'providers', type, id: String(id), region }, signal)
}

export function getPerson(id: number, signal?: AbortSignal): Promise<PersonDetails> {
  return tmdbRequest<PersonDetails>({ action: 'person', id: String(id) }, signal)
}

export function getTrending(type: 'all' | MediaType, signal?: AbortSignal): Promise<ListResponse> {
  return tmdbRequest<ListResponse>({ action: 'trending', type }, signal)
}

export function getPopular(type: MediaType, signal?: AbortSignal): Promise<ListResponse> {
  return tmdbRequest<ListResponse>({ action: 'popular', type }, signal)
}

export function getGenres(type: MediaType, signal?: AbortSignal): Promise<GenresResponse> {
  return tmdbRequest<GenresResponse>({ action: 'genres', type }, signal)
}

export function discoverTitles(type: MediaType, filters: DiscoverFilters, signal?: AbortSignal): Promise<ListResponse> {
  const params: Record<string, string> = { action: 'discover', type }
  if (filters.genres?.length) params.genres = filters.genres.join(',')
  if (filters.yearFrom !== undefined) params.yearFrom = String(filters.yearFrom)
  if (filters.yearTo !== undefined) params.yearTo = String(filters.yearTo)
  if (filters.minRating !== undefined) params.minRating = String(filters.minRating)
  if (filters.provider !== undefined && filters.region) {
    params.provider = String(filters.provider)
    params.region = filters.region
  }
  if (filters.sort) params.sort = filters.sort
  if (filters.page !== undefined) params.page = String(filters.page)
  return tmdbRequest<ListResponse>(params, signal)
}

/** `sources` : 15 titres au maximum (les autres sont ignorés par l'appelant). */
export function getForYou(sources: { id: number; type: MediaType }[], signal?: AbortSignal): Promise<ForYouResponse> {
  return tmdbRequest<ForYouResponse>({ action: 'forYou', sources: sources.map((s) => `${s.type}:${s.id}`).join(',') }, signal)
}

export function getWatchProviders(type: MediaType, region: string, signal?: AbortSignal): Promise<ProviderListResponse> {
  return tmdbRequest<ProviderListResponse>({ action: 'watchProviders', type, region }, signal)
}
