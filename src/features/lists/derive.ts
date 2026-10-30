import type { MediaType } from '../../../shared/tmdb-types'

export interface ListRow {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface ListItemRow {
  listId: string
  id: number
  type: MediaType
  title: string
  year: number | null
  posterPath: string | null
  addedAt: string
}

/** Contenu complet récupéré en une requête : listes et appartenances. */
export interface ListsData {
  lists: ListRow[]
  items: ListItemRow[]
}

export interface ListSummary extends ListRow {
  itemCount: number
  /** Jusqu'à 4 affiches (titres ajoutés le plus récemment) pour la mosaïque. */
  previews: string[]
}

const PREVIEW_COUNT = 4

const byTitle = (a: ListItemRow, b: ListItemRow) =>
  a.title.localeCompare(b.title, 'fr') || a.type.localeCompare(b.type) || a.id - b.id

/** Listes triées par nom, avec leur nombre de titres et leur mosaïque. */
export function buildSummaries(data: ListsData): ListSummary[] {
  const byList = new Map<string, ListItemRow[]>()
  for (const item of data.items) byList.set(item.listId, [...(byList.get(item.listId) ?? []), item])
  return [...data.lists]
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    .map((list) => {
      const items = byList.get(list.id) ?? []
      const previews = [...items]
        .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
        .flatMap((item) => (item.posterPath ? [item.posterPath] : []))
        .slice(0, PREVIEW_COUNT)
      return { ...list, itemCount: items.length, previews }
    })
}

/** Titres d'une liste, triés par titre, filtrés par type. */
export function listItemsOf(data: ListsData, listId: string, type: 'all' | MediaType = 'all'): ListItemRow[] {
  return data.items
    .filter((item) => item.listId === listId)
    .filter((item) => type === 'all' || item.type === type)
    .sort(byTitle)
}

/** Identifiants des listes qui contiennent le titre. */
export function listsContaining(data: ListsData, ref: { id: number; type: MediaType }): Set<string> {
  return new Set(data.items.filter((item) => item.id === ref.id && item.type === ref.type).map((item) => item.listId))
}

export function countItems(data: ListsData, listId: string): number {
  return data.items.reduce((count, item) => count + (item.listId === listId ? 1 : 0), 0)
}
