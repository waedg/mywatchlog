const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export type PosterSize = 'w185' | 'w342' | 'w500'

/** URL d'une affiche TMDB, ou null si le titre n'en a pas. */
export function posterUrl(path: string | null | undefined, size: PosterSize = 'w342'): string | null {
  if (!path || !path.startsWith('/')) return null
  return `${IMAGE_BASE}/${size}${path}`
}
