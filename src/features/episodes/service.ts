import type { QueryClient } from '@tanstack/react-query'

import { getSeason, getTitleDetails } from '@/lib/api'
import type { SeasonDetails, TitleDetails, TvInfo } from '../../../shared/tmdb-types'

import { updateUserTitle } from '../library/api'
import { isStatus, statusPatch } from '../library/group'
import { fetchStatus, fetchWatchedFor, setEpisodesWatched, syncTvMeta } from './api'
import {
  autoStatus,
  selectAired,
  todayLocal,
  toSeasonCounts,
  totalEpisodes,
  watchedCount,
  type EpisodeRef,
} from './progress'

const DETAILS_STALE = 10 * 60_000
const SEASON_STALE = 30 * 60_000

export const detailsKey = (id: number) => ['details', 'tv', id] as const
export const seasonKey = (id: number, season: number) => ['season', id, season] as const

export function loadSeason(qc: QueryClient, tvId: number, season: number): Promise<SeasonDetails> {
  return qc.fetchQuery({
    queryKey: seasonKey(tvId, season),
    queryFn: ({ signal }) => getSeason(tvId, season, signal),
    staleTime: SEASON_STALE,
  })
}

/** Détails d'une série (cache partagé avec la fiche) ; échoue si TMDB ne renvoie pas de saisons. */
export async function loadTv(qc: QueryClient, tvId: number): Promise<TitleDetails & { tv: TvInfo }> {
  const details = await qc.fetchQuery({
    queryKey: detailsKey(tvId),
    queryFn: ({ signal }) => getTitleDetails('tv', tvId, signal),
    staleTime: DETAILS_STALE,
  })
  if (!details.tv) throw new Error('Série sans informations de saisons')
  return details as TitleDetails & { tv: TvInfo }
}

/** Épisodes diffusés (date connue passée) des saisons retenues par `seasonFilter`. */
export async function collectAired(
  qc: QueryClient,
  tvId: number,
  seasonFilter: (season: number) => boolean,
  include?: (season: number, episode: number) => boolean,
): Promise<EpisodeRef[]> {
  const { tv } = await loadTv(qc, tvId)
  const seasons = await Promise.all(
    tv.seasons.filter((s) => seasonFilter(s.seasonNumber)).map((s) => loadSeason(qc, tvId, s.seasonNumber)),
  )
  return selectAired(seasons, todayLocal(), include)
}

export async function collectAllOfSeason(qc: QueryClient, tvId: number, season: number): Promise<EpisodeRef[]> {
  const data = await loadSeason(qc, tvId, season)
  return data.episodes.map((e) => ({ season, episode: e.episodeNumber }))
}

/**
 * Après un changement d'épisodes : rafraîchit les compteurs de saisons en cache et applique
 * le statut automatique (D-33) si la série est dans la liste.
 */
export async function reconcile(qc: QueryClient, userId: string, tvId: number): Promise<void> {
  const { tv } = await loadTv(qc, tvId)
  const counts = toSeasonCounts(tv.seasons)
  await syncTvMeta(tvId, counts, tv.ended)

  const current = await fetchStatus(tvId, userId)
  if (!current || !isStatus(current)) return

  const watched = await fetchWatchedFor(tvId)
  const next = autoStatus(current, watchedCount(watched, counts), totalEpisodes(counts), tv.ended)
  if (next) await updateUserTitle({ id: tvId, type: 'tv' }, userId, statusPatch(next))
}

export { setEpisodesWatched }
