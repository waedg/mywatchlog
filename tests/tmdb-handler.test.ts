import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../api/tmdb'

// Simule Supabase (is_allowed) et TMDB : vérifie le routage, la validation et les en-têtes de cache.
function mockFetch(tmdb: (url: URL) => Response | Promise<Response>) {
  return vi.fn(async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    if (url.pathname.endsWith('/rpc/is_allowed')) return Response.json(true)
    return tmdb(url)
  })
}

const call = (query: string) =>
  handler.fetch(new Request(`https://app.test/api/tmdb?${query}`, { headers: { authorization: 'Bearer jeton' } }))

describe('api/tmdb — phase 8', () => {
  beforeEach(() => {
    vi.stubEnv('TMDB_READ_TOKEN', 'tmdb')
    vi.stubEnv('VITE_SUPABASE_URL', 'https://supabase.test')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('trending : mappe les résultats et autorise un cache navigateur privé', async () => {
    const fetchMock = mockFetch(() =>
      Response.json({ page: 1, total_pages: 500, results: [{ id: 1, media_type: 'tv', name: 'Série', first_air_date: '2024-02-01' }] }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const response = await call('action=trending&type=all')
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600')
    const body = (await response.json()) as { totalPages: number; results: { title: string }[] }
    expect(body.totalPages).toBe(10)
    expect(body.results[0]?.title).toBe('Série')
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('/trending/all/week'))).toBe(true)
  })

  it('popular : type obligatoire (movie ou tv)', async () => {
    vi.stubGlobal('fetch', mockFetch(() => Response.json({ results: [] })))
    expect((await call('action=popular&type=all')).status).toBe(400)
    expect((await call('action=popular&type=movie')).status).toBe(200)
  })

  it('discover : valide les paramètres avant tout appel TMDB', async () => {
    const fetchMock = mockFetch(() => Response.json({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    for (const query of [
      'type=movie&genres=abc',
      'type=movie&genres=1,2,3,4,5,6',
      'type=movie&yearFrom=2020&yearTo=2010',
      'type=movie&minRating=11',
      'type=movie&provider=8',
      'type=movie&provider=8&region=fr',
      'type=movie&sort=hasard',
      'type=anime',
    ]) {
      expect((await call(`action=discover&${query}`)).status, query).toBe(400)
    }
    expect(fetchMock.mock.calls.filter(([u]) => String(u).includes('/discover/'))).toHaveLength(0)
  })

  it('discover : transmet les filtres à TMDB', async () => {
    const fetchMock = mockFetch(() => Response.json({ page: 1, total_pages: 3, results: [{ id: 9, title: 'Film', release_date: '2021-05-05' }] }))
    vi.stubGlobal('fetch', fetchMock)
    const response = await call('action=discover&type=movie&genres=28,12&minRating=7&provider=8&region=FR&sort=rating')
    expect(response.status).toBe(200)
    const tmdbUrl = new URL(String(fetchMock.mock.calls.find(([u]) => String(u).includes('/discover/movie'))?.[0]))
    expect(tmdbUrl.searchParams.get('with_genres')).toBe('28,12')
    expect(tmdbUrl.searchParams.get('watch_region')).toBe('FR')
    expect(tmdbUrl.searchParams.get('sort_by')).toBe('vote_average.desc')
    expect(((await response.json()) as { results: { type: string }[] }).results[0]?.type).toBe('movie')
  })

  it('forYou : agrège les recommandations et tolère l’échec d’une source', async () => {
    const fetchMock = mockFetch((url) => {
      if (url.pathname === '/3/movie/1/recommendations')
        return Response.json({ results: [{ id: 10, title: 'A', vote_average: 7 }, { id: 11, title: 'B', vote_average: 8 }] })
      if (url.pathname === '/3/tv/2/recommendations') return Response.json({ results: [{ id: 10, media_type: 'movie', title: 'A', vote_average: 7 }] })
      return new Response('{}', { status: 500 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const response = await call('action=forYou&sources=movie:1,tv:2,movie:3')
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    const body = (await response.json()) as { results: { id: number; score: number }[] }
    expect(body.results.map((r) => [r.id, r.score])).toEqual([
      [10, 2],
      [11, 1],
    ])
  })

  it('forYou : 502 si aucune source ne répond, 400 si les sources sont invalides', async () => {
    vi.stubGlobal('fetch', mockFetch(() => new Response('{}', { status: 500 })))
    expect((await call('action=forYou&sources=movie:1')).status).toBe(502)
    expect((await call('action=forYou&sources=')).status).toBe(400)
    expect((await call('action=forYou')).status).toBe(400)
  })

  it('genres : cache d’une journée', async () => {
    vi.stubGlobal('fetch', mockFetch(() => Response.json({ genres: [{ id: 28, name: 'Action' }] })))
    const response = await call('action=genres&type=tv')
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=86400')
    expect(await response.json()).toEqual({ genres: [{ id: 28, name: 'Action' }] })
  })
})

describe('api/tmdb — watchProviders', () => {
  beforeEach(() => {
    vi.stubEnv('TMDB_READ_TOKEN', 'tmdb')
    vi.stubEnv('VITE_SUPABASE_URL', 'https://supabase.test')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })
  it('valide type et pays puis interroge le catalogue', async () => {
    const fetchMock = mockFetch(() => Response.json({ results: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png', display_priorities: { FR: 1 } }] }))
    vi.stubGlobal('fetch', fetchMock)
    expect((await call('action=watchProviders&type=all&region=FR')).status).toBe(400)
    expect((await call('action=watchProviders&type=movie&region=fr')).status).toBe(400)
    const response = await call('action=watchProviders&type=movie&region=FR')
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=86400')
    expect(((await response.json()) as { providers: { name: string }[] }).providers[0]?.name).toBe('Netflix')
    const url = new URL(String(fetchMock.mock.calls.find(([u]) => String(u).includes('/watch/providers/movie'))?.[0]))
    expect(url.searchParams.get('watch_region')).toBe('FR')
  })
})
