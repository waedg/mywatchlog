import { libraryKey, type LibraryItem, type TypeFilter } from '../library/group'

export interface TonightFilters {
  type: TypeFilter
  /** Ne garder que les titres dont j'ai une copie. */
  copyOnly: boolean
}

/** Titres tirables : statut « À regarder », filtrés par type et par copie, dans un ordre stable (titre, puis clé). */
export function tonightCandidates(items: LibraryItem[], { type, copyOnly }: TonightFilters): LibraryItem[] {
  return items
    .filter((item) => item.status === 'to_watch')
    .filter((item) => type === 'all' || item.type === type)
    .filter((item) => !copyOnly || item.hasCopy)
    .sort((a, b) => a.title.localeCompare(b.title, 'fr') || libraryKey(a.type, a.id).localeCompare(libraryKey(b.type, b.id)))
}

/** Choisit un élément à partir d'un nombre dans [0, 1[ (null si la liste est vide). */
export function pickAt<T>(list: T[], seed: number): T | null {
  if (list.length === 0) return null
  const index = Math.min(list.length - 1, Math.max(0, Math.floor(seed * list.length)))
  return list[index] ?? null
}

/** Tire un nouveau nombre dont le résultat diffère du titre actuel (quand plusieurs choix existent). */
export function rerollSeed(list: LibraryItem[], current: LibraryItem | null, random: () => number = Math.random): number {
  let seed = random()
  if (list.length < 2 || !current) return seed
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const next = pickAt(list, seed)
    if (!next || libraryKey(next.type, next.id) !== libraryKey(current.type, current.id)) return seed
    seed = random()
  }
  // Repli déterministe : l'élément suivant, avec retour au début.
  const index = list.findIndex((item) => libraryKey(item.type, item.id) === libraryKey(current.type, current.id))
  return ((index + 1) % list.length) / list.length
}
