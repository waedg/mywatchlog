import { getTitleDetails } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import type { SearchResult } from '../../../shared/tmdb-types'

import { isStatus, type LibraryItem } from './group'

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
