const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export type PosterSize = 'w185' | 'w342' | 'w500'

/** URL d'une affiche TMDB, ou null si le titre n'en a pas. */
export function posterUrl(path: string | null | undefined, size: PosterSize = 'w342'): string | null {
  if (!path || !path.startsWith('/')) return null
  return `${IMAGE_BASE}/${size}${path}`
}

/** Photo d'une personne (casting, acteur), ou null si absente. */
export function profileUrl(path: string | null | undefined, size: 'w185' | 'h632' = 'w185'): string | null {
  if (!path || !path.startsWith('/')) return null
  return `${IMAGE_BASE}/${size}${path}`
}

/** Logo d'une plateforme de streaming, ou null si absent. */
export function logoUrl(path: string | null | undefined, size: 'w45' | 'w92' = 'w92'): string | null {
  if (!path || !path.startsWith('/')) return null
  return `${IMAGE_BASE}/${size}${path}`
}
