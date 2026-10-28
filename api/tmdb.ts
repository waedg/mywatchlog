// Fonction serverless Vercel : proxy TMDB protégé (phase 1.3).
// - Authentification : jeton Supabase de l'appelant + liste d'autorisation (RPC is_allowed).
// - Le token TMDB (TMDB_READ_TOKEN) n'est lu que côté serveur.
// - Langue : fr-FR, repli sur en-US quand le synopsis ou le titre est vide.

import type { MediaType, SearchResult, TitleDetails } from '../shared/tmdb-types'

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
  genres?: { name?: string }[]
  vote_average?: number | null
  imdb_id?: string | null
  external_ids?: { imdb_id?: string | null }
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
  }
}

// ---------- Accès TMDB ----------

class TmdbError extends Error {
  status: number
  constructor(status: number) {
    super(`TMDB ${status}`)
    this.status = status
  }
}

async function tmdbGet(path: string, params: Record<string, string>): Promise<TmdbItem> {
  const url = new URL(TMDB_BASE + path)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
      accept: 'application/json',
    },
  })
  if (!response.ok) throw new TmdbError(response.status)
  return (await response.json()) as TmdbItem
}

// ---------- Réponses HTTP ----------

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
        const primary = await tmdbGet(path, { language: LANG_PRIMARY, append_to_response: 'external_ids' })
        const needsFallback = !primary.overview?.trim() || !pickTitle(type, primary)
        const fallback = needsFallback ? await tmdbGet(path, { language: LANG_FALLBACK }) : undefined
        return json(mapDetails(type, primary, fallback))
      }

      return json({ error: 'bad_request', detail: 'action (search ou details)' }, 400)
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
