import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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

  const add = useMutation({
    mutationFn: async ({ listId, ref }: { listId: string; ref: Ref }) => {
      assertOnline()
      const data = current()
      if (data && countItems(data, listId) >= MAX_ITEMS_PER_LIST) throw new ListError('items_limit')
      await addToList(listId, ref)
    },
    onSuccess: refresh,
  })

  const take = useTakeFromList()

  return { create, rename, remove, add, take }
}
