import type { QueryClient } from '@tanstack/react-query'

import { getSeason, getTitleDetails } from '@/lib/api'
import type { SeasonDetails, TitleDetails, TvInfo } from '../../../shared/tmdb-types'

import { updateUserTitle } from '../library/api'
import { isStatus, statusPatch } from '../library/group'
import { fetchStatus, fetchWatchedFor, saveSeasonFirsts, setEpisodesWatched, syncTvMeta } from './api'
import {
  autoStatus,
  firstEpisodeNumber,
  seasonsMissingFirst,
  selectAired,
  todayLocal,
  toSeasonCounts,
  totalEpisodes,
  watchedCount,
  type EpisodeRef,
  type SeasonCount,
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
    // Hors connexion : échoue au lieu de rester en pause indéfiniment (la mutation appelante resterait « en cours »).
    networkMode: 'always',
  })
}

/** Détails d'une série (cache partagé avec la fiche) ; échoue si TMDB ne renvoie pas de saisons. */
export async function loadTv(qc: QueryClient, tvId: number): Promise<TitleDetails & { tv: TvInfo }> {
  const details = await qc.fetchQuery({
    queryKey: detailsKey(tvId),
    queryFn: ({ signal }) => getTitleDetails('tv', tvId, signal),
    staleTime: DETAILS_STALE,
    networkMode: 'always',
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
  const counts = await syncTvMeta(tvId, toSeasonCounts(tv.seasons), tv.ended)
  // Relevé du premier numéro d'épisode de chaque saison, en arrière-plan (une seule fois par série).
  // Si des numéros viennent d'être relevés, les compteurs changent : le statut automatique est recalculé.
  void learnSeasonFirsts(qc, tvId, counts)
    .then(async (learned) => {
      if (!learned) return
      await applyAutoStatus(userId, tvId, counts, tv.ended)
      await qc.invalidateQueries({ queryKey: ['library'] })
    })
    .catch(() => undefined)

  await applyAutoStatus(userId, tvId, counts, tv.ended)
}

/** Applique le statut automatique (D-33) si la série est dans la liste. */
export async function applyAutoStatus(userId: string, tvId: number, counts: SeasonCount[], ended: boolean): Promise<void> {
  const current = await fetchStatus(tvId, userId)
  if (!current || !isStatus(current)) return

  const watched = await fetchWatchedFor(tvId)
  const next = autoStatus(current, watchedCount(watched, counts), totalEpisodes(counts), ended)
  if (next) await updateUserTitle({ id: tvId, type: 'tv' }, userId, statusPatch(next))
}

const LEARN_BATCH = 3

/**
 * Relève le numéro du premier épisode des saisons qui n'en ont pas encore (numérotation continue, ex. Hunter x Hunter)
 * et l'enregistre. Renvoie vrai si au moins un numéro a été enregistré. Les saisons en échec seront retentées plus tard.
 */
export async function learnSeasonFirsts(qc: QueryClient, tvId: number, counts: SeasonCount[]): Promise<boolean> {
  const missing = seasonsMissingFirst(counts)
  if (missing.length === 0) return false

  const firsts = new Map<number, number>()
  for (let i = 0; i < missing.length; i += LEARN_BATCH) {
    const batch = missing.slice(i, i + LEARN_BATCH)
    const settled = await Promise.allSettled(batch.map((season) => loadSeason(qc, tvId, season)))
    settled.forEach((entry, index) => {
      if (entry.status !== 'fulfilled') return
      const first = firstEpisodeNumber(entry.value)
      if (first !== null) firsts.set(batch[index] as number, first)
    })
  }
  if (firsts.size === 0) return false
  await saveSeasonFirsts(tvId, firsts)
  return true
}

export { setEpisodesWatched }
