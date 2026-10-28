import type { SeasonDetails, SeasonSummary } from '../../../shared/tmdb-types'
import type { Status } from '../library/group'

/**
 * Nombre d'épisodes d'une saison (stocké dans titles.season_counts).
 * `first` : numéro du premier épisode de la saison, quand il n'est pas 1 (certaines séries, comme Hunter x Hunter,
 * numérotent leurs épisodes en continu d'une saison à l'autre sur TMDB). Absent tant qu'il n'a pas été relevé.
 */
export type SeasonCount = { season: number; episodes: number; first?: number }

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
    const { season, episodes, first } = entry as Record<string, unknown>
    if (Number.isInteger(season) && Number.isInteger(episodes) && (season as number) >= 0 && (episodes as number) >= 0) {
      const count: SeasonCount = { season: season as number, episodes: episodes as number }
      if (Number.isInteger(first) && (first as number) >= 0) count.first = first as number
      counts.push(count)
    }
  }
  return counts.sort((a, b) => a.season - b.season)
}

/** Compare les saisons et leurs nombres d'épisodes (le numéro de premier épisode `first` est ignoré). */
export function sameSeasonCounts(a: SeasonCount[], b: SeasonCount[]): boolean {
  return a.length === b.length && a.every((c, i) => c.season === b[i]?.season && c.episodes === b[i]?.episodes)
}

/** Total hors épisodes spéciaux (saison 0). */
export function totalEpisodes(counts: SeasonCount[]): number {
  return counts.filter((c) => c.season > 0).reduce((sum, c) => sum + c.episodes, 0)
}

/** Nombre d'épisodes cochés par saison, quel que soit leur numéro (clés « SxE »). */
function watchedPerSeason(watched: ReadonlySet<string>): Map<number, number> {
  const perSeason = new Map<number, number>()
  for (const key of watched) {
    const season = Number.parseInt(key, 10)
    if (Number.isInteger(season)) perSeason.set(season, (perSeason.get(season) ?? 0) + 1)
  }
  return perSeason
}

/**
 * Épisodes vus d'une saison. Avec `first` connu : compte exactement les numéros de la saison.
 * Sans : compte les épisodes cochés de la saison, plafonné à son nombre d'épisodes, sans supposer la numérotation 1 à N.
 */
export function watchedInSeason(
  watched: ReadonlySet<string>,
  season: number,
  episodes: number,
  first?: number,
  perSeason: Map<number, number> = watchedPerSeason(watched),
): number {
  if (first !== undefined) {
    let n = 0
    for (let e = first; e < first + episodes; e += 1) if (watched.has(epKey(season, e))) n += 1
    return n
  }
  return Math.min(episodes, perSeason.get(season) ?? 0)
}

/** Épisodes vus compris dans le total (hors spéciaux, hors épisodes en trop). */
export function watchedCount(watched: ReadonlySet<string>, counts: SeasonCount[]): number {
  const perSeason = watchedPerSeason(watched)
  let n = 0
  for (const { season, episodes, first } of counts) {
    if (season === 0) continue
    n += watchedInSeason(watched, season, episodes, first, perSeason)
  }
  return n
}

/** Prochain épisode : `episode` est null quand la numérotation de la saison n'est pas connue. */
export interface NextEpisodeRef {
  season: number
  episode: number | null
}

/** Premier épisode non vu (hors spéciaux), ou null si tout est vu. */
export function nextEpisode(watched: ReadonlySet<string>, counts: SeasonCount[]): NextEpisodeRef | null {
  const perSeason = watchedPerSeason(watched)
  for (const { season, episodes, first } of counts) {
    if (season === 0 || episodes <= 0) continue
    if (watchedInSeason(watched, season, episodes, first, perSeason) >= episodes) continue

    const start = first ?? 1
    for (let e = start; e < start + episodes; e += 1) {
      if (watched.has(epKey(season, e))) continue
      // Sans premier numéro connu, des épisodes cochés hors de 1..N trahissent une numérotation continue : on n'invente pas de numéro.
      const irregular = first === undefined && (perSeason.get(season) ?? 0) > 0 && hasWatchedBeyond(watched, season, episodes)
      return { season, episode: irregular ? null : e }
    }
    return { season, episode: null }
  }
  return null
}

function hasWatchedBeyond(watched: ReadonlySet<string>, season: number, episodes: number): boolean {
  for (const key of watched) {
    const [s, e] = key.split('x').map(Number)
    if (s === season && (e as number) > episodes) return true
  }
  return false
}

export function formatNextEpisode(next: NextEpisodeRef): string {
  return next.episode === null ? `S${String(next.season).padStart(2, '0')}` : formatEpisode(next.season, next.episode)
}

/** Numéro du premier épisode d'une saison chargée (null si elle est vide). */
export function firstEpisodeNumber(season: SeasonDetails): number | null {
  return season.episodes.length === 0 ? null : Math.min(...season.episodes.map((episode) => episode.episodeNumber))
}

/** Conserve les numéros de premier épisode déjà relevés quand les saisons sont rafraîchies depuis TMDB. */
export function mergeFirsts(fresh: SeasonCount[], previous: SeasonCount[]): SeasonCount[] {
  const known = new Map(previous.flatMap((count) => (count.first === undefined ? [] : [[count.season, count.first] as const])))
  return fresh.map((count) => {
    const first = known.get(count.season)
    return first === undefined ? { season: count.season, episodes: count.episodes } : { ...count, first }
  })
}

/** Saisons (hors spéciaux, non vides) dont le premier numéro d'épisode reste à relever. */
export function seasonsMissingFirst(counts: SeasonCount[]): number[] {
  return counts.filter((count) => count.season > 0 && count.episodes > 0 && count.first === undefined).map((count) => count.season)
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

export type ProgressTone = 'dropped' | 'ended' | 'caught-up' | 'progress'

/**
 * Aspect de la barre de progression (D-34) :
 * abandonné -> rouge ; terminée et tout vu -> vert fluo ;
 * tout vu sur une série encore diffusée -> jaune rayé ; sinon jaune.
 */
export function progressTone(status: Status, watched: number, total: number, ended: boolean): ProgressTone {
  if (status === 'dropped') return 'dropped'
  if (total > 0 && watched >= total) return ended ? 'ended' : 'caught-up'
  return 'progress'
}

/** Épisodes vus par série, sous forme sérialisable (persistée pour la lecture hors-ligne). */
export type WatchedRecord = Record<number, string[]>

export function toWatchedMap(record: WatchedRecord): Map<number, Set<string>> {
  return new Map(Object.entries(record).map(([id, keys]) => [Number(id), new Set(keys)]))
}
