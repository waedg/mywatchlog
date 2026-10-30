import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/auth-context'
import { addToLibrary } from '@/features/library/api'
import { LIBRARY_KEY } from '@/features/library/useLibrary'
import { ListError } from '@/lib/api-error'
import { assertOnline } from '@/lib/online'
import type { MediaType } from '../../../shared/tmdb-types'

import { addToList, createList, deleteList, fetchListsData, removeFromList, renameList } from './api'
import { countItems, type ListsData } from './derive'
import { MAX_ITEMS_PER_LIST, MAX_LISTS, validateListName } from './names'

/** Clé unique : listes et appartenances sont lues ensemble et persistées pour la lecture hors-ligne. */
export const LISTS_KEY = ['lists'] as const

export function useLists() {
  return useQuery({ queryKey: LISTS_KEY, queryFn: fetchListsData, staleTime: 60_000 })
}

type Ref = { id: number; type: MediaType }

/** Ajout d'un titre à une collection (limite de 500 titres contrôlée avant l'appel réseau). */
export function useAddToList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ listId, ref }: { listId: string; ref: Ref }) => {
      assertOnline()
      const data = queryClient.getQueryData<ListsData>(LISTS_KEY)
      if (data && countItems(data, listId) >= MAX_ITEMS_PER_LIST) throw new ListError('items_limit')
      await addToList(listId, ref)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LISTS_KEY }),
  })
}

/**
 * Ajout d'une suggestion à la collection : le titre entre aussi dans Ma liste en « À regarder » s'il n'y est pas
 * (statut, note et favori d'un titre déjà présent ne sont jamais modifiés). La limite est contrôlée avant tout appel réseau.
 */
export function useAddSuggestionToList() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  return useMutation({
    mutationFn: async ({ listId, ref, inLibrary }: { listId: string; ref: Ref; inLibrary: boolean }) => {
      assertOnline()
      const data = queryClient.getQueryData<ListsData>(LISTS_KEY)
      if (data && countItems(data, listId) >= MAX_ITEMS_PER_LIST) throw new ListError('items_limit')
      if (!inLibrary) {
        const userId = session?.user.id
        if (!userId) throw new Error('Session absente')
        await addToLibrary(ref, userId)
      }
      await addToList(listId, ref)
    },
    onSuccess: () =>
      Promise.all([queryClient.invalidateQueries({ queryKey: LISTS_KEY }), queryClient.invalidateQueries({ queryKey: LIBRARY_KEY })]),
  })
}

/** Retrait d'un titre d'une collection (hook léger : une instance par titre affiché). */
export function useTakeFromList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ listId, ref }: { listId: string; ref: Ref }) => {
      assertOnline()
      await removeFromList(listId, ref)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LISTS_KEY }),
  })
}

/** Mutations des listes : refusées hors connexion, règles de nom et de limite contrôlées avant l'appel réseau. */
export function useListActions() {
  const queryClient = useQueryClient()
  const current = () => queryClient.getQueryData<ListsData>(LISTS_KEY)
  const refresh = () => queryClient.invalidateQueries({ queryKey: LISTS_KEY })

  const create = useMutation({
    mutationFn: async (name: string) => {
      assertOnline()
      const lists = current()?.lists ?? []
      const invalid = validateListName(name, lists)
      if (invalid) throw invalid
      if (lists.length >= MAX_LISTS) throw new ListError('list_limit')
      return createList(name)
    },
    onSuccess: refresh,
  })

  const rename = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      assertOnline()
      const invalid = validateListName(
        name,
        (current()?.lists ?? []).filter((list) => list.id !== id),
      )
      if (invalid) throw invalid
      await renameList(id, name)
    },
    onSuccess: refresh,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      assertOnline()
      await deleteList(id)
    },
    // Sans attendre le rechargement : l'écran de détail peut ainsi rediriger avant que la collection disparaisse de la liste.
    onSuccess: () => {
      void refresh()
    },
  })

  const add = useAddToList()

  const take = useTakeFromList()

  return { create, rename, remove, add, take }
}
