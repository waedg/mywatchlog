import { useQuery } from '@tanstack/react-query'

import { getTitleDetails } from '@/lib/api'
import type { MediaType } from '../../../shared/tmdb-types'

export function useTitleDetails(type: MediaType, id: number) {
  return useQuery({
    queryKey: ['details', type, id],
    queryFn: ({ signal }) => getTitleDetails(type, id, signal),
    staleTime: 10 * 60_000,
  })
}
