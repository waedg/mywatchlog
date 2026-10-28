import { getTitleDetails } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { MediaType, SearchResult } from '../../../shared/tmdb-types'

import { isStatus, type LibraryItem, type Status } from './group'

export async function fetchLibrary(): Promise<LibraryItem[]> {
  const { data, error } = await supabase
    .from('user_titles')
    .select('status, is_favorite, rating, titles ( id, type, title, year, poster_path )')
  if (error) throw error

  const items: LibraryItem[] = []
  for (const row of data) {
    const title = row.titles
    if (!title || !isStatus(row.status)) continue
    if (title.type !== 'movie' && title.type !== 'tv') continue
    items.push({
      id: title.id,
      type: title.type,
      title: title.title,
      year: title.year,
      posterPath: title.poster_path,
      status: row.status,
      isFavorite: row.is_favorite,
      rating: row.rating,
    })
  }
  return items
}

/**
 * Ajoute un titre à la liste : récupère les détails (imdb_id), met à jour le cache `titles`,
 * puis crée la ligne `user_titles` (sans écraser une ligne existante).
 */
export async function addToLibrary(item: Pick<SearchResult, 'id' | 'type'>, userId: string): Promise<void> {
  const details = await getTitleDetails(item.type, item.id)

  const { error: titleError } = await supabase.from('titles').upsert(
    {
      id: details.id,
      type: details.type,
      imdb_id: details.imdbId,
      title: details.title,
      year: details.year,
      poster_path: details.posterPath,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id,type' },
  )
  if (titleError) throw titleError

  const { error: linkError } = await supabase.from('user_titles').upsert(
    { user_id: userId, title_id: details.id, title_type: details.type, status: 'to_watch' },
    { onConflict: 'user_id,title_id,title_type', ignoreDuplicates: true },
  )
  if (linkError) throw linkError
}

export interface TitleRef {
  id: number
  type: MediaType
}

export interface UserTitlePatch {
  status?: Status
  rating?: number | null
  is_favorite?: boolean
  watched_at?: string | null
}

export async function updateUserTitle(ref: TitleRef, userId: string, patch: UserTitlePatch): Promise<void> {
  const { error } = await supabase
    .from('user_titles')
    .update(patch)
    .eq('user_id', userId)
    .eq('title_id', ref.id)
    .eq('title_type', ref.type)
  if (error) throw error
}

/** Retire le titre de la liste : la note et le favori sont supprimés avec la ligne (D-32). */
export async function removeFromLibrary(ref: TitleRef, userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_titles')
    .delete()
    .eq('user_id', userId)
    .eq('title_id', ref.id)
    .eq('title_type', ref.type)
  if (error) throw error
}
