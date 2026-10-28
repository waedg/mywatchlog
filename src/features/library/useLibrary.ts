import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/auth-context'
import type { SearchResult } from '../../../shared/tmdb-types'

import {
  addToLibrary,
  fetchLibrary,
  removeFromLibrary,
  updateUserTitle,
  type TitleRef,
  type UserTitlePatch,
} from './api'

export const LIBRARY_KEY = ['library'] as const

export function useLibrary() {
  return useQuery({ queryKey: LIBRARY_KEY, queryFn: fetchLibrary, staleTime: 60_000 })
}

function useUserId(): string {
  const { session } = useAuth()
  const userId = session?.user.id
  if (!userId) throw new Error('Session absente')
  return userId
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

export function useUpdateUserTitle(ref: TitleRef) {
  const queryClient = useQueryClient()
  const userId = useUserId()

  return useMutation({
    mutationFn: (patch: UserTitlePatch) => updateUserTitle(ref, userId, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_KEY }),
  })
}

export function useRemoveFromLibrary(ref: TitleRef) {
  const queryClient = useQueryClient()
  const userId = useUserId()

  return useMutation({
    mutationFn: () => removeFromLibrary(ref, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_KEY }),
  })
}
