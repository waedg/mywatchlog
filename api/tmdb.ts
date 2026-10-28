// Fonction serverless Vercel : proxy TMDB protégé (phase 1.3).
// - Authentification : jeton Supabase de l'appelant + liste d'autorisation (RPC is_allowed).
// - Le token TMDB (TMDB_READ_TOKEN) n'est lu que côté serveur.
// - Langue : fr-FR, repli sur en-US quand le synopsis ou le titre est vide.

import type {
  CastMember,
  DiscoverSort,
  EpisodeInfo,
  ForYouResult,
  Genre,
  ListResult,
  MediaType,
  NextEpisode,
  PersonCredit,
  PersonDetails,
  ProviderInfo,
  ProvidersResponse,
  SearchResult,
  SeasonDetails,
  SeasonSummary,
  TitleDetails,
  TvInfo,
} from '../shared/tmdb-types'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const LANG_PRIMARY = 'fr-FR'
const LANG_FALLBACK = 'en-US'

interface TmdbItem {
  id?: number
  media_type?: string
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  release_date?: string | null
  first_air_date?: string | null
  poster_path?: string | null
  overview?: string | null
  genres?: { id?: number; name?: string }[]
  vote_average?: number | null
  imdb_id?: string | null
  external_ids?: { imdb_id?: string | null }
  status?: string
  seasons?: TmdbSeason[]
  season_number?: number
  episodes?: TmdbEpisode[]
  credits?: { cast?: TmdbCast[] }
  next_episode_to_air?: TmdbEpisode | null
  // personnes
  biography?: string | null
  birthday?: string | null
  deathday?: string | null
  place_of_birth?: string | null
  profile_path?: string | null
  combined_credits?: { cast?: TmdbCredit[] }
}

interface TmdbCast {
  id?: number
  name?: string
  character?: string
  profile_path?: string | null
  order?: number
}

interface TmdbCredit {
  id?: number
  media_type?: string
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  release_date?: string | null
  first_air_date?: string | null
  poster_path?: string | null
  character?: string
  genre_ids?: number[]
}

interface TmdbProviderEntry {
  provider_id?: number
  provider_name?: string
  logo_path?: string | null
  display_priority?: number
}

interface TmdbProviders {
  results?: Record<string, { flatrate?: TmdbProviderEntry[]; rent?: TmdbProviderEntry[]; buy?: TmdbProviderEntry[] }>
}

interface TmdbSeason {
  season_number?: number
  name?: string
  episode_count?: number
  air_date?: string | null
}

interface TmdbEpisode {
  season_number?: number
  episode_number?: number
  name?: string
  air_date?: string | null
  runtime?: number | null
}

// ---------- Fonctions pures (testées avec Vitest) ----------

export function yearFrom(date?: string | null): number | null {
  if (!date) return null
  const year = Number.parseInt(date.slice(0, 4), 10)
  return Number.isFinite(year) ? year : null
}

function pickTitle(type: MediaType, item: TmdbItem): string {
  return (type === 'movie' ? item.title : item.name)?.trim() ?? ''
}

function pickOriginalTitle(type: MediaType, item: TmdbItem): string {
  return (type === 'movie' ? item.original_title : item.original_name)?.trim() ?? ''
}

function pickYear(type: MediaType, item: TmdbItem): number | null {
  return yearFrom(type === 'movie' ? item.release_date : item.first_air_date)
}

export function mapSearchItem(item: TmdbItem): SearchResult | null {
  if (item.media_type !== 'movie' && item.media_type !== 'tv') return null
  if (typeof item.id !== 'number') return null
  const type: MediaType = item.media_type
  const title = pickTitle(type, item) || pickOriginalTitle(type, item)
  if (!title) return null
  return {
    id: item.id,
    type,
    title,
    year: pickYear(type, item),
    posterPath: item.poster_path ?? null,
    overview: item.overview?.trim() ?? '',
  }
}

export function mapDetails(
  type: MediaType,
  primary: TmdbItem,
  fallback?: TmdbItem,
): TitleDetails {
  const overview = primary.overview?.trim() || fallback?.overview?.trim() || ''
  const original = pickOriginalTitle(type, primary)
  const title = pickTitle(type, primary) || pickTitle(type, fallback ?? {}) || original
  const imdb = primary.imdb_id || primary.external_ids?.imdb_id || null
  return {
    id: primary.id as number,
    type,
    imdbId: imdb && imdb.trim() ? imdb.trim() : null,
    title,
    originalTitle: original || title,
    year: pickYear(type, primary),
    posterPath: primary.poster_path ?? null,
    overview,
    genres: (primary.genres ?? []).map((g) => g.name?.trim() ?? '').filter(Boolean),
    voteAverage:
      typeof primary.vote_average === 'number' && primary.vote_average > 0
        ? Math.round(primary.vote_average * 10) / 10
        : null,
    tv: type === 'tv' ? mapTvInfo(primary) : null,
    releaseDate: (type === 'movie' ? primary.release_date : primary.first_air_date) || null,
    nextEpisode: type === 'tv' ? mapNextEpisode(primary.next_episode_to_air) : null,
    cast: mapCast(primary.credits?.cast),
  }
}

const CAST_LIMIT = 12

export function mapCast(cast?: TmdbCast[]): CastMember[] {
  return (cast ?? [])
    .filter((member) => Number.isInteger(member.id) && member.name?.trim())
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .slice(0, CAST_LIMIT)
    .map((member) => ({
      id: member.id as number,
      name: (member.name as string).trim(),
      character: member.character?.trim() ?? '',
      profilePath: member.profile_path ?? null,
    }))
}

export function mapNextEpisode(episode?: TmdbEpisode | null): NextEpisode | null {
  if (!episode || !episode.air_date) return null
  if (!Number.isInteger(episode.season_number) || !Number.isInteger(episode.episode_number)) return null
  return {
    seasonNumber: episode.season_number as number,
    episodeNumber: episode.episode_number as number,
    name: episode.name?.trim() || `Épisode ${episode.episode_number}`,
    airDate: episode.air_date,
  }
}

function mapProviderList(list?: TmdbProviderEntry[]): ProviderInfo[] {
  const seen = new Set<number>()
  return (list ?? [])
    .filter((p) => Number.isInteger(p.provider_id) && p.provider_name?.trim())
    .sort((a, b) => (a.display_priority ?? 999) - (b.display_priority ?? 999))
    .filter((p) => !seen.has(p.provider_id as number) && !!seen.add(p.provider_id as number))
    .map((p) => ({ id: p.provider_id as number, name: (p.provider_name as string).trim(), logoPath: p.logo_path ?? null }))
}

export function mapProviders(region: string, data: TmdbProviders): ProvidersResponse {
  const entry = data.results?.[region]
  return {
    region,
    available: entry !== undefined,
    flatrate: mapProviderList(entry?.flatrate),
    rent: mapProviderList(entry?.rent),
    buy: mapProviderList(entry?.buy),
  }
}

// Genres TMDB exclus de la filmographie : talk-shows (10767) et actualités (10763), où l'acteur apparaît « en tant que lui-même ».
const EXCLUDED_GENRES = [10767, 10763]
const CREDITS_LIMIT = 80

export function mapPersonCredits(cast?: TmdbCredit[]): PersonCredit[] {
  const seen = new Set<string>()
  const credits: PersonCredit[] = []
  for (const credit of cast ?? []) {
    if (credit.media_type !== 'movie' && credit.media_type !== 'tv') continue
    if (!Number.isInteger(credit.id)) continue
    if (credit.genre_ids?.some((genre) => EXCLUDED_GENRES.includes(genre))) continue
    const type: MediaType = credit.media_type
    const title = pickTitle(type, credit) || pickOriginalTitle(type, credit)
    if (!title) continue
    const key = `${type}-${credit.id}`
    if (seen.has(key)) continue
    seen.add(key)
    const date = (type === 'movie' ? credit.release_date : credit.first_air_date) || null
    credits.push({
      id: credit.id as number,
      type,
      title,
      year: yearFrom(date),
      posterPath: credit.poster_path ?? null,
      character: credit.character?.trim() ?? '',
      date,
    })
  }
  // Plus récents d'abord ; les titres sans date (annoncés) en tête.
  credits.sort((a, b) => (b.date ?? '9999').localeCompare(a.date ?? '9999'))
  return credits.slice(0, CREDITS_LIMIT)
}

export function mapPerson(primary: TmdbItem, fallback?: TmdbItem): PersonDetails {
  return {
    id: primary.id as number,
    name: primary.name?.trim() || fallback?.name?.trim() || '',
    biography: primary.biography?.trim() || fallback?.biography?.trim() || '',
    birthday: primary.birthday || null,
    deathday: primary.deathday || null,
    placeOfBirth: primary.place_of_birth?.trim() || null,
    profilePath: primary.profile_path ?? null,
    credits: mapPersonCredits(primary.combined_credits?.cast),
  }
}

export function mapTvInfo(item: TmdbItem): TvInfo {
  const seasons: SeasonSummary[] = (item.seasons ?? [])
    .filter((season) => Number.isInteger(season.season_number) && (season.season_number as number) >= 0)
    .map((season) => ({
      seasonNumber: season.season_number as number,
      name: season.name?.trim() || `Saison ${season.season_number}`,
      episodeCount: Math.max(0, Math.trunc(season.episode_count ?? 0)),
      airDate: season.air_date || null,
    }))
    .sort((a, b) => a.seasonNumber - b.seasonNumber)
  return { seasons, ended: item.status === 'Ended' || item.status === 'Canceled' }
}

export function mapSeason(seasonNumber: number, item: TmdbItem): SeasonDetails {
  const episodes: EpisodeInfo[] = (item.episodes ?? [])
    .filter((episode) => Number.isInteger(episode.episode_number) && (episode.episode_number as number) >= 1)
    .map((episode) => ({
      episodeNumber: episode.episode_number as number,
      name: episode.name?.trim() || `Épisode ${episode.episode_number}`,
      airDate: episode.air_date || null,
      runtime: typeof episode.runtime === 'number' && episode.runtime > 0 ? episode.runtime : null,
    }))
    .sort((a, b) => a.episodeNumber - b.episodeNumber)
  return { seasonNumber, episodes }
}

// ---------- Phase 8 : découverte (fonctions pures) ----------

function roundVote(value?: number | null): number | null {
  return typeof value === 'number' && value > 0 ? Math.round(value * 10) / 10 : null
}

/** Mappe un élément de liste ; `fallback` fournit le type quand TMDB n'indique pas `media_type`. */
export function mapListItem(item: TmdbItem, fallback?: MediaType): ListResult | null {
  const mediaType = item.media_type ?? fallback
  if (mediaType !== 'movie' && mediaType !== 'tv') return null
  const base = mapSearchItem({ ...item, media_type: mediaType })
  return base ? { ...base, voteAverage: roundVote(item.vote_average) } : null
}

export function mapList(results: TmdbItem[] | undefined, fallback?: MediaType): ListResult[] {
  const seen = new Set<string>()
  const list: ListResult[] = []
  for (const item of results ?? []) {
    const mapped = mapListItem(item, fallback)
    if (!mapped) continue
    const key = `${mapped.type}-${mapped.id}`
    if (seen.has(key)) continue
    seen.add(key)
    list.push(mapped)
  }
  return list
}

export function mapGenres(data: { genres?: { id?: number; name?: string }[] }): Genre[] {
  return (data.genres ?? [])
    .filter((genre) => Number.isInteger(genre.id) && genre.name?.trim())
    .map((genre) => ({ id: genre.id as number, name: (genre.name as string).trim() }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

export interface DiscoverInput {
  genres: number[]
  yearFrom?: number
  yearTo?: number
  minRating?: number
  provider?: number
  region?: string
  sort: DiscoverSort
}

const MIN_VOTES_FOR_RATING = 200

/** Construit les paramètres `/discover` (films ou séries). Les genres sont combinés en ET. */
export function buildDiscoverParams(type: MediaType, input: DiscoverInput, today: string): Record<string, string> {
  const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date'
  const params: Record<string, string> = {
    language: LANG_PRIMARY,
    include_adult: 'false',
    include_video: 'false',
  }
  if (input.genres.length > 0) params.with_genres = input.genres.join(',')
  if (input.yearFrom !== undefined) params[`${dateField}.gte`] = `${input.yearFrom}-01-01`
  if (input.yearTo !== undefined) params[`${dateField}.lte`] = `${input.yearTo}-12-31`
  if (input.minRating !== undefined && input.minRating > 0) {
    params['vote_average.gte'] = String(input.minRating)
    params['vote_count.gte'] = '100'
  }
  if (input.provider !== undefined && input.region) {
    params.with_watch_providers = String(input.provider)
    params.watch_region = input.region
    params.with_watch_monetization_types = 'flatrate'
  }
  if (input.sort === 'rating') {
    params.sort_by = 'vote_average.desc'
    params['vote_count.gte'] = String(MIN_VOTES_FOR_RATING)
  } else if (input.sort === 'date') {
    params.sort_by = `${dateField}.desc`
    // Évite de lister en tête les titres annoncés dont la date est future.
    if (params[`${dateField}.lte`] === undefined || (params[`${dateField}.lte`] as string) > today) {
      params[`${dateField}.lte`] = today
    }
  } else {
    params.sort_by = 'popularity.desc'
  }
  return params
}

export interface SourceRef {
  id: number
  type: MediaType
}

export const FOR_YOU_MAX_SOURCES = 15
export const FOR_YOU_MAX_RESULTS = 60

/**
 * Agrège les recommandations de plusieurs titres sources : score = nombre de sources qui recommandent le titre,
 * puis note TMDB. Les titres sources eux-mêmes sont exclus.
 */
export function aggregateRecommendations(
  sources: SourceRef[],
  lists: ListResult[][],
  limit = FOR_YOU_MAX_RESULTS,
): ForYouResult[] {
  const sourceKeys = new Set(sources.map((source) => `${source.type}-${source.id}`))
  const byKey = new Map<string, ForYouResult>()
  for (const list of lists) {
    const seenInList = new Set<string>()
    for (const item of list) {
      const key = `${item.type}-${item.id}`
      if (sourceKeys.has(key) || seenInList.has(key)) continue
      seenInList.add(key)
      const known = byKey.get(key)
      if (known) known.score += 1
      else byKey.set(key, { ...item, score: 1 })
    }
  }
  return [...byKey.values()]
    .sort((a, b) => b.score - a.score || (b.voteAverage ?? 0) - (a.voteAverage ?? 0) || a.title.localeCompare(b.title, 'fr'))
    .slice(0, limit)
}

/** Relit `sources=movie:603,tv:1396` ; renvoie null si le format est invalide. */
export function parseSources(value: string | null): SourceRef[] | null {
  if (!value) return null
  const parts = value.split(',')
  if (parts.length < 1 || parts.length > FOR_YOU_MAX_SOURCES) return null
  const seen = new Set<string>()
  const sources: SourceRef[] = []
  for (const part of parts) {
    const match = /^(movie|tv):(\d{1,9})$/.exec(part)
    if (!match) return null
    const id = Number(match[2])
    if (id < 1) return null
    if (seen.has(part)) continue
    seen.add(part)
    sources.push({ id, type: match[1] as MediaType })
  }
  return sources
}

// ---------- Accès TMDB ----------

class TmdbError extends Error {
  status: number
  constructor(status: number) {
    super(`TMDB ${status}`)
    this.status = status
  }
}

async function tmdbGet<T = TmdbItem>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(TMDB_BASE + path)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
      accept: 'application/json',
    },
  })
  if (!response.ok) throw new TmdbError(response.status)
  return (await response.json()) as T
}

// ---------- Réponses HTTP ----------

// Listes TMDB publiques : cache navigateur uniquement (« private »), jamais en cache partagé,
// sinon le CDN servirait la réponse sans passer par la liste d'autorisation.
const LISTS_CACHE = { 'Cache-Control': 'private, max-age=3600' }
const GENRES_CACHE = { 'Cache-Control': 'private, max-age=86400' }

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store', ...extra },
  })
}

// Vérifie le jeton Supabase (validé par PostgREST) et la liste d'autorisation.
async function checkAccess(request: Request): Promise<Response | null> {
  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return json({ error: 'unauthorized' }, 401)

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return json({ error: 'server_misconfigured' }, 500)

  let response: Response
  try {
    response = await fetch(`${supabaseUrl}/rest/v1/rpc/is_allowed`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })
  } catch {
    return json({ error: 'auth_unavailable' }, 502)
  }
  if (response.status === 401 || response.status === 403) return json({ error: 'unauthorized' }, 401)
  if (!response.ok) return json({ error: 'auth_unavailable' }, 502)
  const allowed = await response.json().catch(() => false)
  return allowed === true ? null : json({ error: 'forbidden' }, 403)
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405, { Allow: 'GET' })

    const denied = await checkAccess(request)
    if (denied) return denied

    if (!process.env.TMDB_READ_TOKEN) return json({ error: 'server_misconfigured' }, 500)

    const params = new URL(request.url).searchParams
    const action = params.get('action')

    try {
      if (action === 'search') {
        const query = params.get('q')?.trim() ?? ''
        const page = Number(params.get('page') ?? '1')
        if (query.length < 1 || query.length > 100) return json({ error: 'bad_request', detail: 'q (1 à 100 caractères)' }, 400)
        if (!Number.isInteger(page) || page < 1 || page > 10) return json({ error: 'bad_request', detail: 'page (1 à 10)' }, 400)

        const data = (await tmdbGet('/search/multi', {
          query,
          language: LANG_PRIMARY,
          include_adult: 'false',
          page: String(page),
        })) as TmdbItem & { results?: TmdbItem[]; page?: number; total_pages?: number }

        const results = (data.results ?? [])
          .map(mapSearchItem)
          .filter((item): item is SearchResult => item !== null)
        return json({ page: data.page ?? page, totalPages: data.total_pages ?? 1, results })
      }

      if (action === 'details') {
        const type = params.get('type')
        const id = Number(params.get('id'))
        if (type !== 'movie' && type !== 'tv') return json({ error: 'bad_request', detail: 'type (movie ou tv)' }, 400)
        if (!Number.isInteger(id) || id < 1) return json({ error: 'bad_request', detail: 'id (entier positif)' }, 400)

        const path = `/${type}/${id}`
        const primary = await tmdbGet(path, { language: LANG_PRIMARY, append_to_response: 'external_ids,credits' })
        const needsFallback = !primary.overview?.trim() || !pickTitle(type, primary)
        const fallback = needsFallback ? await tmdbGet(path, { language: LANG_FALLBACK }) : undefined
        return json(mapDetails(type, primary, fallback))
      }

      if (action === 'season') {
        const id = Number(params.get('id'))
        const season = Number(params.get('season'))
        if (!Number.isInteger(id) || id < 1) return json({ error: 'bad_request', detail: 'id (entier positif)' }, 400)
        if (!Number.isInteger(season) || season < 0 || season > 500) return json({ error: 'bad_request', detail: 'season (0 à 500)' }, 400)

        const data = await tmdbGet(`/tv/${id}/season/${season}`, { language: LANG_PRIMARY })
        return json(mapSeason(season, data))
      }

      if (action === 'providers') {
        const type = params.get('type')
        const id = Number(params.get('id'))
        const region = params.get('region') ?? ''
        if (type !== 'movie' && type !== 'tv') return json({ error: 'bad_request', detail: 'type (movie ou tv)' }, 400)
        if (!Number.isInteger(id) || id < 1) return json({ error: 'bad_request', detail: 'id (entier positif)' }, 400)
        if (!/^[A-Z]{2}$/.test(region)) return json({ error: 'bad_request', detail: 'region (code pays à 2 lettres majuscules)' }, 400)

        const data = await tmdbGet<TmdbProviders>(`/${type}/${id}/watch/providers`, {})
        return json(mapProviders(region, data))
      }

      if (action === 'trending' || action === 'popular') {
        const type = params.get('type')
        const page = Number(params.get('page') ?? '1')
        if (action === 'trending' ? !['all', 'movie', 'tv'].includes(type ?? '') : type !== 'movie' && type !== 'tv')
          return json({ error: 'bad_request', detail: action === 'trending' ? 'type (all, movie ou tv)' : 'type (movie ou tv)' }, 400)
        if (!Number.isInteger(page) || page < 1 || page > 10) return json({ error: 'bad_request', detail: 'page (1 à 10)' }, 400)

        const path = action === 'trending' ? `/trending/${type}/week` : `/${type}/popular`
        const data = (await tmdbGet(path, { language: LANG_PRIMARY, page: String(page) })) as TmdbItem & {
          results?: TmdbItem[]
          page?: number
          total_pages?: number
        }
        const fallback = type === 'movie' || type === 'tv' ? type : undefined
        return json(
          { page: data.page ?? page, totalPages: Math.min(data.total_pages ?? 1, 10), results: mapList(data.results, fallback) },
          200,
          LISTS_CACHE,
        )
      }

      if (action === 'genres') {
        const type = params.get('type')
        if (type !== 'movie' && type !== 'tv') return json({ error: 'bad_request', detail: 'type (movie ou tv)' }, 400)
        const data = await tmdbGet<{ genres?: { id?: number; name?: string }[] }>(`/genre/${type}/list`, { language: LANG_PRIMARY })
        return json({ genres: mapGenres(data) }, 200, GENRES_CACHE)
      }

      if (action === 'discover') {
        const type = params.get('type')
        if (type !== 'movie' && type !== 'tv') return json({ error: 'bad_request', detail: 'type (movie ou tv)' }, 400)
        const page = Number(params.get('page') ?? '1')
        if (!Number.isInteger(page) || page < 1 || page > 10) return json({ error: 'bad_request', detail: 'page (1 à 10)' }, 400)

        const genreValue = params.get('genres')
        const genres = genreValue ? genreValue.split(',').map(Number) : []
        if (genres.length > 5 || genres.some((genre) => !Number.isInteger(genre) || genre < 1 || genre > 99999))
          return json({ error: 'bad_request', detail: 'genres (5 entiers positifs maximum, séparés par des virgules)' }, 400)

        const optionalInt = (name: string, min: number, max: number): number | undefined | null => {
          const raw = params.get(name)
          if (raw === null || raw === '') return undefined
          const value = Number(raw)
          return Number.isInteger(value) && value >= min && value <= max ? value : null
        }
        const yearFromValue = optionalInt('yearFrom', 1888, 2100)
        const yearToValue = optionalInt('yearTo', 1888, 2100)
        const provider = optionalInt('provider', 1, 99999)
        if (yearFromValue === null || yearToValue === null) return json({ error: 'bad_request', detail: 'yearFrom / yearTo (1888 à 2100)' }, 400)
        if (yearFromValue !== undefined && yearToValue !== undefined && yearFromValue > yearToValue)
          return json({ error: 'bad_request', detail: 'yearFrom doit être inférieur ou égal à yearTo' }, 400)
        if (provider === null) return json({ error: 'bad_request', detail: 'provider (entier positif)' }, 400)

        const minRatingRaw = params.get('minRating')
        const minRating = minRatingRaw === null || minRatingRaw === '' ? undefined : Number(minRatingRaw)
        if (minRating !== undefined && !(minRating >= 0 && minRating <= 10)) return json({ error: 'bad_request', detail: 'minRating (0 à 10)' }, 400)

        const region = params.get('region') ?? undefined
        if (provider !== undefined && !(region && /^[A-Z]{2}$/.test(region)))
          return json({ error: 'bad_request', detail: 'region (code pays à 2 lettres majuscules) requis avec provider' }, 400)

        const sortRaw = params.get('sort') ?? 'popularity'
        if (sortRaw !== 'popularity' && sortRaw !== 'rating' && sortRaw !== 'date')
          return json({ error: 'bad_request', detail: 'sort (popularity, rating ou date)' }, 400)

        const query = buildDiscoverParams(
          type,
          { genres, yearFrom: yearFromValue, yearTo: yearToValue, minRating, provider, region, sort: sortRaw },
          new Date().toISOString().slice(0, 10),
        )
        const data = (await tmdbGet(`/discover/${type}`, { ...query, page: String(page) })) as TmdbItem & {
          results?: TmdbItem[]
          page?: number
          total_pages?: number
        }
        return json(
          { page: data.page ?? page, totalPages: Math.min(data.total_pages ?? 1, 10), results: mapList(data.results, type) },
          200,
          LISTS_CACHE,
        )
      }

      if (action === 'forYou') {
        const sources = parseSources(params.get('sources'))
        if (!sources) return json({ error: 'bad_request', detail: `sources (1 à ${FOR_YOU_MAX_SOURCES} éléments « movie:id » ou « tv:id »)` }, 400)

        const settled = await Promise.allSettled(
          sources.map(async (source) => {
            const data = (await tmdbGet(`/${source.type}/${source.id}/recommendations`, { language: LANG_PRIMARY, page: '1' })) as TmdbItem & {
              results?: TmdbItem[]
            }
            return mapList(data.results, source.type)
          }),
        )
        const lists = settled.flatMap((entry) => (entry.status === 'fulfilled' ? [entry.value] : []))
        // Aucune source n'a répondu : l'erreur est probablement côté TMDB (ou quota), pas un résultat vide.
        if (lists.length === 0) {
          const rejected = settled.find((entry): entry is PromiseRejectedResult => entry.status === 'rejected')
          throw rejected?.reason ?? new Error('forYou')
        }
        return json({ results: aggregateRecommendations(sources, lists) })
      }

      if (action === 'person') {
        const id = Number(params.get('id'))
        if (!Number.isInteger(id) || id < 1) return json({ error: 'bad_request', detail: 'id (entier positif)' }, 400)

        const path = `/person/${id}`
        const primary = await tmdbGet(path, { language: LANG_PRIMARY, append_to_response: 'combined_credits' })
        const fallback = primary.biography?.trim() ? undefined : await tmdbGet(path, { language: LANG_FALLBACK })
        return json(mapPerson(primary, fallback))
      }

      return json({ error: 'bad_request', detail: 'action (search, details, season, providers, person, trending, popular, genres, discover ou forYou)' }, 400)
    } catch (error) {
      if (error instanceof TmdbError) {
        if (error.status === 404) return json({ error: 'not_found' }, 404)
        if (error.status === 429) return json({ error: 'rate_limited' }, 429, { 'Retry-After': '2' })
        return json({ error: 'tmdb_error' }, 502)
      }
      return json({ error: 'internal' }, 500)
    }
  },
}
