import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/auth-context'

import { fetchAllWatched } from './api'
import { collectAired, collectAllOfSeason, reconcile, setEpisodesWatched } from './service'

export const WATCHED_KEY = ['watched-all'] as const

/** Épisodes vus de toutes les séries : tvId -> ensemble de clés « saisonxépisode ». */
export function useWatched() {
  return useQuery({ queryKey: WATCHED_KEY, queryFn: fetchAllWatched, staleTime: 60_000 })
}

export function useEpisodeActions(tvId: number) {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const userId = session?.user.id

  const mutation = useMutation({
    mutationFn: async (change: () => Promise<void>) => {
      if (!userId) throw new Error('Session absente')
      await change()
      await reconcile(queryClient, userId, tvId)
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: WATCHED_KEY }),
        queryClient.invalidateQueries({ queryKey: ['library'] }),
      ]),
  })

  const write = (refs: { season: number; episode: number }[], watched: boolean) => async () => {
    if (!userId) throw new Error('Session absente')
    await setEpisodesWatched(userId, tvId, refs, watched)
  }

  return {
    isPending: mutation.isPending,
    error: mutation.error,
    toggle: (season: number, episode: number, watched: boolean) =>
      mutation.mutate(write([{ season, episode }], watched)),
    markSeason: (season: number) =>
      mutation.mutate(async () => write(await collectAired(queryClient, tvId, (s) => s === season), true)()),
    unmarkSeason: (season: number) =>
      mutation.mutate(async () => write(await collectAllOfSeason(queryClient, tvId, season), false)()),
    markUpTo: (season: number, episode: number) =>
      mutation.mutate(async () => {
        // Hors spéciaux, sauf si l'épisode visé est lui-même un spécial.
        const refs =
          season === 0
            ? await collectAired(queryClient, tvId, (s) => s === 0, (_s, e) => e <= episode)
            : await collectAired(
                queryClient,
                tvId,
                (s) => s > 0 && s <= season,
                (s, e) => s < season || e <= episode,
              )
        await write(refs, true)()
      }),
    markAllAired: () =>
      mutation.mutate(async () => write(await collectAired(queryClient, tvId, (s) => s > 0), true)()),
  }
}
