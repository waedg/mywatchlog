import { supabase } from '@/lib/supabase'
import type { Json } from '@/lib/database.types'

import { epKey, mergeFirsts, parseSeasonCounts, type EpisodeRef, type SeasonCount, type WatchedRecord } from './progress'

const PAGE = 1000
const CHUNK = 500

interface WatchedRow {
  title_id: number
  season_number: number
  episode_number: number
}

/** Lit les épisodes vus par pages (PostgREST plafonne à 1000 lignes par requête). */
async function pageWatched(tvId?: number): Promise<WatchedRow[]> {
  const rows: WatchedRow[] = []
  for (let from = 0; ; from += PAGE) {
    let query = supabase
      .from('user_episodes')
      .select('title_id, season_number, episode_number')
      .order('title_id')
      .order('season_number')
      .order('episode_number')
      .range(from, from + PAGE - 1)
    if (tvId !== undefined) query = query.eq('title_id', tvId)
    const { data, error } = await query
    if (error) throw error
    rows.push(...data)
    if (data.length < PAGE) break
  }
  return rows
}

export async function fetchAllWatched(): Promise<WatchedRecord> {
  const record: WatchedRecord = {}
  for (const row of await pageWatched()) {
    ;(record[row.title_id] ??= []).push(epKey(row.season_number, row.episode_number))
  }
  return record
}


export async function fetchWatchedFor(tvId: number): Promise<Set<string>> {
  return new Set((await pageWatched(tvId)).map((row) => epKey(row.season_number, row.episode_number)))
}

export async function setEpisodesWatched(
  userId: string,
  tvId: number,
  refs: EpisodeRef[],
  watched: boolean,
): Promise<void> {
  if (refs.length === 0) return

  if (watched) {
    for (let i = 0; i < refs.length; i += CHUNK) {
      const rows = refs.slice(i, i + CHUNK).map((ref) => ({
        user_id: userId,
        title_id: tvId,
        title_type: 'tv',
        season_number: ref.season,
        episode_number: ref.episode,
      }))
      const { error } = await supabase
        .from('user_episodes')
        .upsert(rows, { onConflict: 'user_id,title_id,season_number,episode_number', ignoreDuplicates: true })
      if (error) throw error
    }
    return
  }

  const bySeason = new Map<number, number[]>()
  for (const ref of refs) bySeason.set(ref.season, [...(bySeason.get(ref.season) ?? []), ref.episode])
  for (const [season, episodes] of bySeason) {
    const { error } = await supabase
      .from('user_episodes')
      .delete()
      .eq('user_id', userId)
      .eq('title_id', tvId)
      .eq('season_number', season)
      .in('episode_number', episodes)
    if (error) throw error
  }
}

async function fetchSeasonCounts(tvId: number): Promise<SeasonCount[]> {
  const { data, error } = await supabase.from('titles').select('season_counts').eq('id', tvId).eq('type', 'tv').maybeSingle()
  if (error) throw error
  return parseSeasonCounts(data?.season_counts)
}

/** Met à jour les compteurs de saisons mis en cache dans `titles` (en conservant les numéros de premier épisode relevés). */
export async function syncTvMeta(tvId: number, counts: SeasonCount[], ended: boolean): Promise<SeasonCount[]> {
  const merged = mergeFirsts(counts, await fetchSeasonCounts(tvId))
  const { error } = await supabase
    .from('titles')
    .update({ season_counts: merged as Json, is_ended: ended, updated_at: new Date().toISOString() })
    .eq('id', tvId)
    .eq('type', 'tv')
  if (error) throw error
  return merged
}

/** Enregistre le numéro du premier épisode de saisons (saison -> numéro). */
export async function saveSeasonFirsts(tvId: number, firsts: Map<number, number>): Promise<void> {
  const next = (await fetchSeasonCounts(tvId)).map((count) =>
    firsts.has(count.season) ? { ...count, first: firsts.get(count.season) as number } : count,
  )
  const { error } = await supabase
    .from('titles')
    .update({ season_counts: next as Json, updated_at: new Date().toISOString() })
    .eq('id', tvId)
    .eq('type', 'tv')
  if (error) throw error
}

export async function fetchStatus(tvId: number, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_titles')
    .select('status')
    .eq('user_id', userId)
    .eq('title_id', tvId)
    .eq('title_type', 'tv')
    .maybeSingle()
  if (error) throw error
  return data?.status ?? null
}
