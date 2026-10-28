import type { SeasonDetails, SeasonSummary } from '../../../shared/tmdb-types'
import type { Status } from '../library/group'

/** Nombre d'épisodes d'une saison (stocké dans titles.season_counts). */
export type SeasonCount = { season: number; episodes: number }

export interface EpisodeRef {
  season: number
  episode: number
}

export function epKey(season: number, episode: number): string {
  return `${season}x${episode}`
}

export function formatEpisode(season: number, episode: number): string {
  return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
}

export function toSeasonCounts(seasons: SeasonSummary[]): SeasonCount[] {
  return seasons.map((s) => ({ season: s.seasonNumber, episodes: s.episodeCount }))
}

/** Relit la colonne jsonb en ignorant toute entrée invalide. */
export function parseSeasonCounts(value: unknown): SeasonCount[] {
  if (!Array.isArray(value)) return []
  const counts: SeasonCount[] = []
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue
    const { season, episodes } = entry as Record<string, unknown>
    if (Number.isInteger(season) && Number.isInteger(episodes) && (season as number) >= 0 && (episodes as number) >= 0) {
      counts.push({ season: season as number, episodes: episodes as number })
    }
  }
  return counts.sort((a, b) => a.season - b.season)
}

export function sameSeasonCounts(a: SeasonCount[], b: SeasonCount[]): boolean {
  return a.length === b.length && a.every((c, i) => c.season === b[i]?.season && c.episodes === b[i]?.episodes)
}

/** Total hors épisodes spéciaux (saison 0). */
export function totalEpisodes(counts: SeasonCount[]): number {
  return counts.filter((c) => c.season > 0).reduce((sum, c) => sum + c.episodes, 0)
}

/** Épisodes vus compris dans le total (hors spéciaux, hors numéros hors saison). */
export function watchedCount(watched: ReadonlySet<string>, counts: SeasonCount[]): number {
  let n = 0
  for (const { season, episodes } of counts) {
    if (season === 0) continue
    for (let e = 1; e <= episodes; e += 1) if (watched.has(epKey(season, e))) n += 1
  }
  return n
}

export function watchedInSeason(watched: ReadonlySet<string>, season: number, episodes: number): number {
  let n = 0
  for (let e = 1; e <= episodes; e += 1) if (watched.has(epKey(season, e))) n += 1
  return n
}

/** Premier épisode non vu (hors spéciaux), ou null si tout est vu. */
export function nextEpisode(watched: ReadonlySet<string>, counts: SeasonCount[]): EpisodeRef | null {
  for (const { season, episodes } of counts) {
    if (season === 0) continue
    for (let e = 1; e <= episodes; e += 1) if (!watched.has(epKey(season, e))) return { season, episode: e }
  }
  return null
}

/** Diffusé à une date connue passée ou égale à aujourd'hui (date inconnue = non diffusé pour les actions groupées). */
export function isAired(airDate: string | null, today: string): boolean {
  return airDate !== null && airDate <= today
}

/** Diffusion à venir, date connue. Seul cas où un épisode n'est pas cochable à la main. */
export function isUpcoming(airDate: string | null, today: string): boolean {
  return airDate !== null && airDate > today
}

export function todayLocal(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function formatAirDate(airDate: string | null): string {
  if (!airDate) return 'Date inconnue'
  const date = new Date(`${airDate}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? airDate
    : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Épisodes diffusés des saisons fournies qui satisfont `include`. */
export function selectAired(
  seasons: SeasonDetails[],
  today: string,
  include: (season: number, episode: number) => boolean = () => true,
): EpisodeRef[] {
  const refs: EpisodeRef[] = []
  for (const season of seasons) {
    for (const episode of season.episodes) {
      if (isAired(episode.airDate, today) && include(season.seasonNumber, episode.episodeNumber)) {
        refs.push({ season: season.seasonNumber, episode: episode.episodeNumber })
      }
    }
  }
  return refs
}

/**
 * Statut automatique d'une série après un changement d'épisodes (D-33) :
 * - tout vu sur une série terminée -> « Vu »
 * - « Vu » mais il reste des épisodes -> « En cours »
 * - au moins un épisode vu et statut « À regarder » -> « En cours »
 * Renvoie null quand le statut ne change pas.
 */
export function autoStatus(current: Status, watched: number, total: number, ended: boolean): Status | null {
  if (total <= 0) return null
  if (ended && watched >= total) return current === 'watched' ? null : 'watched'
  if (current === 'watched' && watched < total) return 'watching'
  if (watched > 0 && current === 'to_watch') return 'watching'
  return null
}
