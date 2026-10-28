import { useQuery } from '@tanstack/react-query'

import { getPopular, getTrending } from '@/lib/api'

import type { SectionSpec } from './sections'

/** Tendances ou populaires : les listes TMDB changent lentement (30 min en mémoire). */
export function useTmdbSection(section: SectionSpec) {
  return useQuery({
    queryKey: ['discover', section.kind, section.type],
    queryFn: ({ signal }) =>
      section.kind === 'trending'
        ? getTrending(section.type, signal)
        : getPopular(section.type === 'tv' ? 'tv' : 'movie', signal),
    staleTime: 30 * 60_000,
  })
}
