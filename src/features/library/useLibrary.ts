import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/auth-context'
import type { SearchResult } from '../../../shared/tmdb-types'

import { addToLibrary, fetchLibrary } from './api'

export const LIBRARY_KEY = ['library'] as const

export function useLibrary() {
  return useQuery({ queryKey: LIBRARY_KEY, queryFn: fetchLibrary, staleTime: 60_000 })
}

export function useAddToLibrary() {
  const queryClient = useQueryClient()
  const { session } = useAuth()

  return useMutation({
    mutationFn: async (item: Pick<SearchResult, 'id' | 'type'>) => {
      const userId = session?.user.id
      if (!userId) throw new Error('Session absente')
      await addToLibrary(item, userId)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_KEY }),
  })
}
