import { useQuery } from '@tanstack/react-query'

import { searchTitles } from '@/lib/api'

export const MIN_QUERY_LENGTH = 2

export function useSearch(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: ['search', trimmed],
    queryFn: ({ signal }) => searchTitles(trimmed, signal),
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
    staleTime: 5 * 60_000,
  })
}
