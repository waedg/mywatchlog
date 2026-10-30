import { ListError } from '../../lib/api-error'

export const LIST_NAME_MAX = 60
export const MAX_LISTS = 50
export const MAX_ITEMS_PER_LIST = 500

/** Nom enregistré : espaces autour retirés (comme le fait la base). */
export function normalizeListName(name: string): string {
  return name.trim()
}

/** Clé de comparaison des noms : sans espaces autour, sans distinction de majuscules (comme l'index unique de la base). */
export function listNameKey(name: string): string {
  return normalizeListName(name).toLowerCase()
}

/**
 * Valide un nom de liste. `others` : les autres listes du compte (pour le doublon) ;
 * lors d'un renommage, la liste elle-même est exclue par l'appelant.
 */
export function validateListName(name: string, others: { name: string }[]): ListError | null {
  const normalized = normalizeListName(name)
  if (normalized.length === 0) return new ListError('empty')
  if (normalized.length > LIST_NAME_MAX) return new ListError('too_long')
  const key = listNameKey(normalized)
  if (others.some((other) => listNameKey(other.name) === key)) return new ListError('duplicate')
  return null
}
