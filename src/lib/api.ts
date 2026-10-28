import type { MediaType, SearchResponse, SeasonDetails, TitleDetails } from '../../shared/tmdb-types'

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
