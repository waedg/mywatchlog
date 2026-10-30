import type { ForYouResult } from '../../../shared/tmdb-types'
import { FOR_YOU_DISPLAY, FOR_YOU_MAX_SOURCES, FOR_YOU_MIN_SOURCES, filterForYou, forYouCacheKey, type SourceRef } from '../discover/forYou'
import { libraryKey, type LibraryItem, type TypeFilter } from '../library/group'
import type { ListItemRow } from './derive'

/** Nombre minimal de titres dans la collection pour afficher des suggestions (D-51). */
export const COLLECTION_MIN_SOURCES = FOR_YOU_MIN_SOURCES
/** Plafond de sources (une requête TMDB par source). */
export const COLLECTION_MAX_SOURCES = FOR_YOU_MAX_SOURCES

export function hasEnoughSources(items: ListItemRow[]): boolean {
  return items.length >= COLLECTION_MIN_SOURCES
}

/**
 * Sources des suggestions : titres de la collection, 15 au maximum.
 * Ordre de retenue : mieux notés, puis favoris, puis ordre alphabétique (déterministe).
 * Note et favori viennent de Ma liste ; un titre absent de Ma liste n'a ni l'un ni l'autre.
 */
export function pickCollectionSources(items: ListItemRow[], library: LibraryItem[]): SourceRef[] {
  const owned = new Map(library.map((entry) => [libraryKey(entry.type, entry.id), entry]))
  const ranked = items.map((item) => {
    const entry = owned.get(libraryKey(item.type, item.id))
    return { item, rating: entry?.rating ?? 0, favorite: entry?.isFavorite ?? false }
  })
  return ranked
    .sort(
      (a, b) =>
        b.rating - a.rating ||
        Number(b.favorite) - Number(a.favorite) ||
        a.item.title.localeCompare(b.item.title, 'fr') ||
        libraryKey(a.item.type, a.item.id).localeCompare(libraryKey(b.item.type, b.item.id)),
    )
    .slice(0, COLLECTION_MAX_SOURCES)
    .map(({ item }) => ({ id: item.id, type: item.type }))
}

/** Clé de cache TanStack Query : dépend uniquement des sources retenues (pas de l'ordre, pas de la collection). */
export function collectionSuggestionsKey(sources: SourceRef[]): readonly ['collection-suggestions', string] {
  return ['collection-suggestions', forYouCacheKey(sources)]
}

/** Retire uniquement les titres déjà dans la collection (pas ceux de Ma liste), filtre par type, limite les affiches. */
export function filterCollectionSuggestions(
  results: ForYouResult[],
  items: ListItemRow[],
  type: TypeFilter,
  limit = FOR_YOU_DISPLAY,
): ForYouResult[] {
  const inCollection = new Set(items.map((item) => libraryKey(item.type, item.id)))
  return filterForYou(results, inCollection, type, limit)
}
