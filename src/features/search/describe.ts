// Phase 11 : recherche par description, logique pure côté client (aucun accès DOM ni alias `@/`,
// pour rester testable avec Vitest). Les bornes reprennent celles du serveur (api/tmdb.ts) ;
// tests/describe-client.test.ts vérifie qu'elles restent identiques.

export const DESCRIBE_MIN_CHARS = 3
export const DESCRIBE_MAX_CHARS = 500

/**
 * Nettoie la saisie (caractères de contrôle et espaces multiples réduits à un espace) puis vérifie
 * la longueur. Renvoie `null` si la description est hors des bornes : elle n'est alors pas envoyée.
 */
export function normalizeDescriptionInput(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/\p{Cc}+/gu, ' ').replace(/\s+/g, ' ').trim()
  if (cleaned.length < DESCRIBE_MIN_CHARS || cleaned.length > DESCRIBE_MAX_CHARS) return null
  return cleaned
}

/** Paramètre d'URL `mode` : seule la valeur « description » est stockée, le mode Titre est le défaut. */
export type SearchMode = 'title' | 'description'

export function parseSearchMode(value: string | null): SearchMode {
  return value === 'description' ? 'description' : 'title'
}
