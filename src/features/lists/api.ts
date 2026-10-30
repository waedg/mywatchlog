import { ListError } from '@/lib/api-error'
import { supabase } from '@/lib/supabase'
import type { MediaType } from '../../../shared/tmdb-types'

import { cacheTitle } from '../library/api'
import type { ListItemRow, ListRow, ListsData } from './derive'
import { normalizeListName } from './names'

const PAGE = 1000

/** Erreurs PostgREST / Postgres connues, converties en erreurs métier. */
function toListError(error: { code?: string; message?: string }): unknown {
  if (error.code === '23505') return new ListError('duplicate')
  if (error.code === '23514' && error.message?.includes('list_items_limit_reached')) return new ListError('items_limit')
  if (error.code === '23514' && error.message?.includes('list_limit_reached')) return new ListError('list_limit')
  if (error.code === '23514') return new ListError('too_long')
  return error
}

async function fetchItems(): Promise<ListItemRow[]> {
  const items: ListItemRow[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('list_items')
      .select('list_id, title_id, title_type, added_at, titles ( title, year, poster_path )')
      .order('list_id')
      .order('title_type')
      .order('title_id')
      .range(from, from + PAGE - 1)
    if (error) throw error
    for (const row of data) {
      const title = row.titles
      if (!title || (row.title_type !== 'movie' && row.title_type !== 'tv')) continue
      items.push({
        listId: row.list_id,
        id: row.title_id,
        type: row.title_type,
        title: title.title,
        year: title.year,
        posterPath: title.poster_path,
        addedAt: row.added_at,
      })
    }
    if (data.length < PAGE) break
  }
  return items
}

/** Toutes les listes du compte et leurs titres (une seule lecture, mise en cache). */
export async function fetchListsData(): Promise<ListsData> {
  const [{ data, error }, items] = await Promise.all([
    supabase.from('lists').select('id, name, created_at, updated_at').order('name'),
    fetchItems(),
  ])
  if (error) throw error
  const lists: ListRow[] = data.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
  return { lists, items }
}

export async function createList(name: string): Promise<ListRow> {
  const { data, error } = await supabase.from('lists').insert({ name: normalizeListName(name) }).select('id, name, created_at, updated_at').single()
  if (error) throw toListError(error)
  return { id: data.id, name: data.name, createdAt: data.created_at, updatedAt: data.updated_at }
}

export async function renameList(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('lists').update({ name: normalizeListName(name) }).eq('id', id)
  if (error) throw toListError(error)
}

/** Supprime la liste et ses appartenances (cascade) ; Ma liste n'est pas touchée. */
export async function deleteList(id: string): Promise<void> {
  const { error } = await supabase.from('lists').delete().eq('id', id)
  if (error) throw error
}

/** Ajoute un titre à une liste (le titre est d'abord enregistré dans `titles` s'il manque). Sans effet s'il y est déjà. */
export async function addToList(listId: string, ref: { id: number; type: MediaType }): Promise<void> {
  const { data: known, error: lookupError } = await supabase
    .from('titles')
    .select('id')
    .eq('id', ref.id)
    .eq('type', ref.type)
    .maybeSingle()
  if (lookupError) throw lookupError
  if (!known) await cacheTitle(ref)

  const { error } = await supabase
    .from('list_items')
    .upsert({ list_id: listId, title_id: ref.id, title_type: ref.type }, { onConflict: 'list_id,title_id,title_type', ignoreDuplicates: true })
  if (error) throw toListError(error)
}

export async function removeFromList(listId: string, ref: { id: number; type: MediaType }): Promise<void> {
  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('list_id', listId)
    .eq('title_id', ref.id)
    .eq('title_type', ref.type)
  if (error) throw error
}
