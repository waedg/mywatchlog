import type { ForYouResult } from '../../../shared/tmdb-types'
import { libraryKey, type LibraryItem, type TypeFilter } from '../library/group'

/** En dessous de ce nombre de titres sources, les recommandations ne sont pas fiables : on ne les affiche pas. */
export const FOR_YOU_MIN_SOURCES = 3
/** Plafond imposé par l'API (une requête TMDB par source). */
export const FOR_YOU_MAX_SOURCES = 15
/** Nombre de recommandations affichées. */
export const FOR_YOU_DISPLAY = 20
/** Note à partir de laquelle un titre sert de source. */
export const FOR_YOU_MIN_RATING = 8

export interface SourceRef {
  id: number
  type: 'movie' | 'tv'
}

/**
 * Titres sources : notés 8 ou plus, ou favoris, hors « Abandonné » (les « Vu » sans note ne comptent pas).
 * Quand il y en a plus que le plafond : mieux notés d'abord, puis favoris, puis ordre alphabétique (déterministe).
 */
export function pickForYouSources(items: LibraryItem[]): LibraryItem[] {
  return items
    .filter((item) => item.status !== 'dropped')
    .filter((item) => item.isFavorite || (item.rating ?? 0) >= FOR_YOU_MIN_RATING)
    .sort(
      (a, b) =>
        (b.rating ?? 0) - (a.rating ?? 0) ||
        Number(b.isFavorite) - Number(a.isFavorite) ||
        a.title.localeCompare(b.title, 'fr') ||
        libraryKey(a.type, a.id).localeCompare(libraryKey(b.type, b.id)),
    )
    .slice(0, FOR_YOU_MAX_SOURCES)
}

/** Clé de cache stable : indépendante de l'ordre des sources. */
export function forYouCacheKey(sources: SourceRef[]): string {
  return sources
    .map((source) => libraryKey(source.type, source.id))
    .sort()
    .join(',')
}

/** Retire les titres déjà dans la liste (tous statuts), applique le filtre de type et limite le nombre d'affiches. */
export function filterForYou(
  results: ForYouResult[],
  owned: Set<string>,
  type: TypeFilter,
  limit = FOR_YOU_DISPLAY,
): ForYouResult[] {
  return results
    .filter((result) => !owned.has(libraryKey(result.type, result.id)))
    .filter((result) => type === 'all' || result.type === type)
    .slice(0, limit)
}
