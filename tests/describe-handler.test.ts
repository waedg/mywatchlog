import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../api/tmdb'

// Simule Supabase (is_allowed), Gemini (Interactions) et TMDB (/search/{type}) : aucun appel réseau réel.
const GEMINI_KEY = 'cle-gemini-secrete'

function geminiEnvelope(text: string) {
  return {
    status: 'completed',
    steps: [{ type: 'thought' }, { type: 'model_output', content: [{ type: 'text', text }] }],
  }
}

const candidates = (...items: { title: string; year?: number; type: 'movie' | 'tv'; id?: number }[]) =>
  JSON.stringify({ candidates: items })

interface Mocks {
  gemini?: (body: Record<string, unknown>, init: RequestInit) => Response | Promise<Response>
  tmdb?: (url: URL) => Response | Promise<Response>
  allowed?: boolean
}

function setup(mocks: Mocks = {}) {
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    if (url.pathname.endsWith('/rpc/is_allowed')) return Response.json(mocks.allowed ?? true)
    if (url.hostname === 'generativelanguage.googleapis.com') {
      const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>
      return (
        mocks.gemini?.(body, init ?? {}) ?? Response.json(geminiEnvelope(candidates({ title: 'Memento', year: 2000, type: 'movie' })))
      )
    }
    return (
      mocks.tmdb?.(url) ??
      Response.json({ results: [{ id: 77, title: 'Memento', release_date: '2000-10-11', poster_path: '/m.jpg', overview: 'Synopsis' }] })
    )
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const callsTo = (fetchMock: ReturnType<typeof setup>, host: string) =>
  fetchMock.mock.calls.filter(([input]) => new URL(String(input)).hostname === host)

const call = (query: string, headers: Record<string, string> = { authorization: 'Bearer jeton' }) =>
  handler.fetch(new Request(`https://app.test/api/tmdb?${query}`, { headers }))

const describeCall = (q: string) => call(`action=describe&q=${encodeURIComponent(q)}`)

describe('api/tmdb : action describe (phase 11.1)', () => {
  beforeEach(() => {
    vi.stubEnv('TMDB_READ_TOKEN', 'tmdb')
    vi.stubEnv('VITE_SUPABASE_URL', 'https://supabase.test')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon')
    vi.stubEnv('GEMINI_API_KEY', GEMINI_KEY)
    vi.stubEnv('GEMINI_MODEL', 'gemini-3.1-flash-lite')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('renvoie les résultats TMDB vérifiés, sans cache, avec la clé dans un en-tête', async () => {
    const fetchMock = setup()
    const response = await describeCall('un homme sans mémoire à court terme se tatoue des indices')
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    const body = (await response.json()) as { results: { id: number; type: string; title: string; year: number }[] }
    expect(body.results).toEqual([{ id: 77, type: 'movie', title: 'Memento', year: 2000, posterPath: '/m.jpg', overview: 'Synopsis' }])

    const geminiCalls = callsTo(fetchMock, 'generativelanguage.googleapis.com')
    expect(geminiCalls).toHaveLength(1)
    const geminiUrl = geminiCalls[0]?.[0]
    const geminiInit = geminiCalls[0]?.[1]
    expect(String(geminiUrl)).toBe('https://generativelanguage.googleapis.com/v1beta/interactions')
    expect(String(geminiUrl)).not.toContain(GEMINI_KEY)
    const geminiHeaders = (geminiInit?.headers ?? {}) as Record<string, string>
    expect(geminiHeaders['x-goog-api-key']).toBe(GEMINI_KEY)
    expect(JSON.stringify(body)).not.toContain(GEMINI_KEY)
    const sent = JSON.parse(String(geminiInit?.body)) as { model: string; input: string; response_format: { mime_type: string } }
    expect(sent.model).toBe('gemini-3.1-flash-lite')
    expect(sent.input).toContain('<description>un homme sans mémoire')
    expect(sent.response_format.mime_type).toBe('application/json')
  })

  it('exige une description de 3 à 500 caractères avant tout appel externe', async () => {
    const fetchMock = setup()
    for (const query of ['action=describe', 'action=describe&q=', 'action=describe&q=%20ab%20', `action=describe&q=${'a'.repeat(501)}`]) {
      expect((await call(query)).status, query).toBe(400)
    }
    expect(callsTo(fetchMock, 'generativelanguage.googleapis.com')).toHaveLength(0)
    expect(callsTo(fetchMock, 'api.themoviedb.org')).toHaveLength(0)
  })

  it('refuse sans jeton et pour un utilisateur non autorisé, sans appeler Gemini', async () => {
    const fetchMock = setup({ allowed: false })
    expect((await call('action=describe&q=une+description', {})).status).toBe(401)
    expect((await describeCall('une description')).status).toBe(403)
    expect(callsTo(fetchMock, 'generativelanguage.googleapis.com')).toHaveLength(0)
  })

  it('500 server_misconfigured si la clé ou le modèle Gemini manque, sans appel externe', async () => {
    const fetchMock = setup()
    vi.stubEnv('GEMINI_API_KEY', '')
    expect((await describeCall('une description')).status).toBe(500)
    vi.stubEnv('GEMINI_API_KEY', GEMINI_KEY)
    vi.stubEnv('GEMINI_MODEL', '')
    const response = await describeCall('une description')
    expect(response.status).toBe(500)
    expect(((await response.json()) as { error: string }).error).toBe('server_misconfigured')
    expect(callsTo(fetchMock, 'generativelanguage.googleapis.com')).toHaveLength(0)
  })

  it('429 ai_quota quand Gemini répond 429 ou 402 (crédits épuisés), sans repli', async () => {
    for (const status of [429, 402]) {
      const fetchMock = setup({ gemini: () => Response.json({ error: { code: status } }, { status }) })
      const response = await describeCall('une description')
      expect(response.status, String(status)).toBe(429)
      expect(await response.json()).toEqual({ error: 'ai_quota', reason: `http_${status}` })
      expect(callsTo(fetchMock, 'api.themoviedb.org')).toHaveLength(0)
      vi.unstubAllGlobals()
    }
  })

  it('502 ai_unavailable avec un motif non sensible, journalisé côté serveur', async () => {
    const cases: { gemini: () => Response; reason: string }[] = [
      { gemini: () => Response.json({ error: 'boom' }, { status: 500 }), reason: 'http_500' },
      { gemini: () => Response.json({ error: 'absent' }, { status: 404 }), reason: 'http_404' },
      {
        gemini: () => {
          throw new DOMException('délai', 'TimeoutError')
        },
        reason: 'timeout',
      },
      {
        gemini: () => {
          throw new TypeError('fetch failed')
        },
        reason: 'network',
      },
      { gemini: () => new Response('<html>pas du JSON', { status: 200 }), reason: 'bad_response' },
    ]
    for (const { gemini, reason } of cases) {
      setup({ gemini })
      const logs = vi.spyOn(console, 'error').mockImplementation(() => {})
      const response = await describeCall('une description secrète')
      expect(response.status, reason).toBe(502)
      expect(await response.json()).toEqual({ error: 'ai_unavailable', reason })
      const logged = logs.mock.calls.flat().join(' ')
      expect(logged).toContain(reason)
      expect(logged).not.toContain(GEMINI_KEY)
      expect(logged).not.toContain('secrète')
      logs.mockRestore()
      vi.unstubAllGlobals()
    }
  })

  it('journalise le message d\'erreur de Google (tronqué), jamais la clé ni la description', async () => {
    const message = `API key not valid. ${'x'.repeat(400)}`
    setup({ gemini: () => Response.json({ error: { code: 400, message } }, { status: 400 }) })
    const logs = vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await describeCall('une description secrète')
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'ai_unavailable', reason: 'http_400' })
    const logged = logs.mock.calls.flat().join(' ')
    expect(logged).toContain('http_400')
    expect(logged).toContain('API key not valid.')
    expect(logged.length).toBeLessThan(300)
    expect(logged).not.toContain(GEMINI_KEY)
    expect(logged).not.toContain('secrète')
    logs.mockRestore()
  })

  it('liste vide si le modèle renvoie un texte inexploitable, sans appel TMDB', async () => {
    const fetchMock = setup({ gemini: () => Response.json(geminiEnvelope('désolé, aucune idée')) })
    const response = await describeCall('une description')
    expect(response.status).toBe(200)
    expect(((await response.json()) as { results: unknown[] }).results).toEqual([])
    expect(callsTo(fetchMock, 'api.themoviedb.org')).toHaveLength(0)
  })

  it('écarte un titre inventé (aucune correspondance TMDB) et ignore tout id fourni par le modèle', async () => {
    const fetchMock = setup({
      gemini: () =>
        Response.json(
          geminiEnvelope(
            candidates(
              { title: 'Memento', year: 2000, type: 'movie', id: 999999 },
              { title: 'Film Totalement Inventé', year: 2001, type: 'movie', id: 424242 },
            ),
          ),
        ),
      tmdb: (url) =>
        url.searchParams.get('query') === 'Memento'
          ? Response.json({ results: [{ id: 77, title: 'Memento', release_date: '2000-10-11' }] })
          : Response.json({ results: [] }),
    })
    const response = await describeCall('une description')
    const body = (await response.json()) as { results: { id: number }[] }
    expect(body.results.map((item) => item.id)).toEqual([77])
    expect(JSON.stringify(body)).not.toMatch(/999999|424242/)
    const paths = callsTo(fetchMock, 'api.themoviedb.org').map(([input]) => new URL(String(input)).pathname)
    expect(paths.every((path) => path === '/3/search/movie')).toBe(true)
  })

  it('interroge TMDB par type, sans contenu adulte, en français', async () => {
    const fetchMock = setup({
      gemini: () => Response.json(geminiEnvelope(candidates({ title: 'Dark', year: 2017, type: 'tv' }))),
      tmdb: () => Response.json({ results: [{ id: 70523, name: 'Dark', first_air_date: '2017-12-01' }] }),
    })
    const response = await describeCall('une série allemande avec des boucles temporelles')
    expect(((await response.json()) as { results: { id: number; type: string }[] }).results).toEqual([
      expect.objectContaining({ id: 70523, type: 'tv' }),
    ])
    const [tmdbCall] = callsTo(fetchMock, 'api.themoviedb.org')
    const url = new URL(String(tmdbCall?.[0]))
    expect(url.pathname).toBe('/3/search/tv')
    expect(url.searchParams.get('include_adult')).toBe('false')
    expect(url.searchParams.get('language')).toBe('fr-FR')
  })

  it('dédoublonne sur la clé composite et plafonne à 5 résultats', async () => {
    setup({
      gemini: () =>
        Response.json(
          geminiEnvelope(
            candidates(
              { title: 'Heat', year: 1995, type: 'movie' },
              { title: 'Heat (1995)', year: 1995, type: 'movie' },
              { title: 'A', year: 2000, type: 'movie' },
              { title: 'B', year: 2000, type: 'movie' },
              { title: 'C', year: 2000, type: 'movie' },
              { title: 'D', year: 2000, type: 'movie' },
              { title: 'E', year: 2000, type: 'movie' },
            ),
          ),
        ),
      tmdb: (url) => {
        const query = url.searchParams.get('query') ?? ''
        const id = query.startsWith('Heat') ? 1 : query.charCodeAt(0)
        return Response.json({ results: [{ id, title: query, release_date: query.startsWith('Heat') ? '1995-12-15' : '2000-01-01' }] })
      },
    })
    const body = (await (await describeCall('une description')).json()) as { results: { id: number }[] }
    expect(body.results.length).toBeLessThanOrEqual(5)
    expect(new Set(body.results.map((item) => item.id)).size).toBe(body.results.length)
    expect(body.results.filter((item) => item.id === 1)).toHaveLength(1)
  })

  it('une erreur TMDB sur tous les candidats donne 502, pas une liste vide', async () => {
    setup({ tmdb: () => Response.json({}, { status: 500 }) })
    expect((await describeCall('une description')).status).toBe(502)
  })

  it('un 429 TMDB sur tous les candidats donne rate_limited', async () => {
    setup({ tmdb: () => Response.json({}, { status: 429 }) })
    const response = await describeCall('une description')
    expect(response.status).toBe(429)
    expect(((await response.json()) as { error: string }).error).toBe('rate_limited')
  })

  it('l\'erreur de routage cite la nouvelle action', async () => {
    setup()
    const response = await call('action=inconnue')
    expect(((await response.json()) as { detail: string }).detail).toContain('describe')
  })
})
