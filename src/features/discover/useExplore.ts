import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { discoverTitles, getGenres, getWatchProviders } from '@/lib/api'
import type { MediaType } from '../../../shared/tmdb-types'

import { toDiscoverFilters, type ExploreState } from './explore'

const DAY = 24 * 60 * 60_000

export function useGenres(type: MediaType) {
  return useQuery({ queryKey: ['genres', type], queryFn: ({ signal }) => getGenres(type, signal), staleTime: DAY })
}

export function useWatchProviders(type: MediaType, region: string) {
  return useQuery({
    queryKey: ['watch-providers', type, region],
    queryFn: ({ signal }) => getWatchProviders(type, region, signal),
    staleTime: DAY,
  })
}

/** Résultats paginés (10 pages au plus, limite de l'API). La clé suit les filtres ; la plateforme dépend du pays. */
export function useExploreResults(state: ExploreState, region: string) {
  const filters = toDiscoverFilters(state, region, 1)
  const { page: _page, ...keyFilters } = filters
  return useInfiniteQuery({
    queryKey: ['explore', state.type, keyFilters],
    queryFn: ({ pageParam, signal }) => discoverTitles(state.type, toDiscoverFilters(state, region, pageParam), signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    staleTime: 10 * 60_000,
  })
}
