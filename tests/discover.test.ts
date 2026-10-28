import { describe, expect, it } from 'vitest'
import { SECTION_PREVIEW, tmdbSections } from '../src/features/discover/sections'

describe('tmdbSections', () => {
  it('Tout : tendances mixtes puis populaires films et séries', () => {
    expect(tmdbSections('all').map((s) => [s.kind, s.type])).toEqual([
      ['trending', 'all'],
      ['popular', 'movie'],
      ['popular', 'tv'],
    ])
  })
  it('Films et Séries : tendances et populaires du type choisi', () => {
    expect(tmdbSections('movie').map((s) => [s.kind, s.type])).toEqual([
      ['trending', 'movie'],
      ['popular', 'movie'],
    ])
    expect(tmdbSections('tv').map((s) => [s.kind, s.type])).toEqual([
      ['trending', 'tv'],
      ['popular', 'tv'],
    ])
  })
  it('n\'utilise jamais « Populaires » sans type précis et garde des identifiants uniques', () => {
    for (const filter of ['all', 'movie', 'tv'] as const) {
      const sections = tmdbSections(filter)
      expect(sections.filter((s) => s.kind === 'popular').every((s) => s.type !== 'all')).toBe(true)
      expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length)
    }
  })
  it('affiche 10 affiches avant « Voir plus »', () => {
    expect(SECTION_PREVIEW).toBe(10)
  })
})

import type { LibraryItem } from '../src/features/library/group'
import { pickAt, rerollSeed, tonightCandidates } from '../src/features/discover/tonight'

const make = (over: Partial<LibraryItem>): LibraryItem => ({
  id: 1,
  type: 'movie',
  title: 'A',
  year: 2000,
  posterPath: null,
  status: 'to_watch',
  isFavorite: false,
  rating: null,
  hasCopy: false,
  seasonCounts: [],
  isEnded: null,
  ...over,
})

describe('tonightCandidates', () => {
  const items = [
    make({ id: 1, title: 'Zorro', hasCopy: true }),
    make({ id: 2, title: 'Alien', type: 'tv' }),
    make({ id: 3, title: 'Vu', status: 'watched', hasCopy: true }),
    make({ id: 4, title: 'En cours', status: 'watching' }),
    make({ id: 5, title: 'Abandonné', status: 'dropped' }),
    make({ id: 6, title: 'Beta', hasCopy: true }),
  ]
  it('ne garde que « À regarder », trié par titre', () => {
    expect(tonightCandidates(items, { type: 'all', copyOnly: false }).map((i) => i.title)).toEqual(['Alien', 'Beta', 'Zorro'])
  })
  it('filtre par type et par copie', () => {
    expect(tonightCandidates(items, { type: 'tv', copyOnly: false }).map((i) => i.id)).toEqual([2])
    expect(tonightCandidates(items, { type: 'all', copyOnly: true }).map((i) => i.id)).toEqual([6, 1])
    expect(tonightCandidates(items, { type: 'tv', copyOnly: true })).toEqual([])
  })
})

describe('pickAt', () => {
  it('renvoie null pour une liste vide et reste dans les bornes', () => {
    expect(pickAt([], 0.5)).toBeNull()
    expect(pickAt(['a', 'b', 'c'], 0)).toBe('a')
    expect(pickAt(['a', 'b', 'c'], 0.5)).toBe('b')
    expect(pickAt(['a', 'b', 'c'], 0.999999)).toBe('c')
    expect(pickAt(['a', 'b', 'c'], 1)).toBe('c')
  })
})

describe('rerollSeed', () => {
  const list = [make({ id: 1, title: 'A' }), make({ id: 2, title: 'B' }), make({ id: 3, title: 'C' })]
  it('évite de retomber sur le titre courant', () => {
    const draws = [0.1, 0.2, 0.9]
    const random = () => draws.shift() ?? 0.9
    const seed = rerollSeed(list, list[0] as LibraryItem, random)
    expect(pickAt(list, seed)?.id).toBe(3)
  })
  it('se replie sur le titre suivant si le hasard bloque', () => {
    const seed = rerollSeed(list, list[2] as LibraryItem, () => 0.99)
    expect(pickAt(list, seed)?.id).toBe(1)
  })
  it('accepte n\'importe quel tirage quand il n\'y a qu\'un choix', () => {
    expect(pickAt([list[0]], rerollSeed([list[0] as LibraryItem], list[0] as LibraryItem, () => 0.5))?.id).toBe(1)
  })
})

import type { ForYouResult } from '../shared/tmdb-types'
import { FOR_YOU_MAX_SOURCES, filterForYou, forYouCacheKey, pickForYouSources } from '../src/features/discover/forYou'

describe('pickForYouSources', () => {
  it('garde les notes >= 8 et les favoris, hors abandonnés ; les « Vu » sans note ne comptent pas', () => {
    const items = [
      make({ id: 1, title: 'Note 8', rating: 8, status: 'watched' }),
      make({ id: 2, title: 'Note 7', rating: 7, status: 'watched' }),
      make({ id: 3, title: 'Favori', isFavorite: true }),
      make({ id: 4, title: 'Vu sans note', status: 'watched' }),
      make({ id: 5, title: 'Abandonné noté', rating: 10, status: 'dropped' }),
      make({ id: 6, title: 'Abandonné favori', isFavorite: true, status: 'dropped' }),
    ]
    expect(pickForYouSources(items).map((i) => i.id)).toEqual([1, 3])
  })
  it('classe par note puis favori puis titre, et plafonne à 15', () => {
    const items = Array.from({ length: 20 }, (_, index) => make({ id: index + 1, title: `T${String(index).padStart(2, '0')}`, rating: 8 }))
    items.push(make({ id: 99, title: 'Zèbre', rating: 10 }), make({ id: 98, title: 'Aigle', rating: 8, isFavorite: true }))
    const picked = pickForYouSources(items)
    expect(picked).toHaveLength(FOR_YOU_MAX_SOURCES)
    expect(picked[0]?.id).toBe(99)
    expect(picked[1]?.id).toBe(98)
  })
})

describe('forYouCacheKey', () => {
  it('ne dépend pas de l\'ordre et distingue film et série', () => {
    const a = forYouCacheKey([{ id: 2, type: 'movie' }, { id: 1, type: 'tv' }])
    const b = forYouCacheKey([{ id: 1, type: 'tv' }, { id: 2, type: 'movie' }])
    expect(a).toBe(b)
    expect(forYouCacheKey([{ id: 1, type: 'movie' }])).not.toBe(forYouCacheKey([{ id: 1, type: 'tv' }]))
  })
})

describe('filterForYou', () => {
  const result = (id: number, type: 'movie' | 'tv', score = 1): ForYouResult => ({
    id,
    type,
    title: `T${id}`,
    year: 2020,
    posterPath: null,
    overview: '',
    voteAverage: null,
    score,
  })
  const results = [result(1, 'movie'), result(2, 'tv'), result(3, 'movie'), result(4, 'tv')]
  it('retire les titres déjà dans la liste, sans confondre film et série', () => {
    expect(filterForYou(results, new Set(['movie-1', 'tv-3']), 'all').map((r) => `${r.type}-${r.id}`)).toEqual(['tv-2', 'movie-3', 'tv-4'])
  })
  it('filtre par type puis limite', () => {
    expect(filterForYou(results, new Set(), 'tv').map((r) => r.id)).toEqual([2, 4])
    expect(filterForYou(results, new Set(), 'all', 2)).toHaveLength(2)
  })
})

import { activeFilterCount, MAX_GENRES, parseExplore, parseYear, toDiscoverFilters, toggleGenre } from '../src/features/discover/explore'

describe('parseExplore', () => {
  const parse = (query: string) => parseExplore(new URLSearchParams(query))
  it('valeurs par défaut : films, tri par popularité, aucun filtre', () => {
    expect(parse('')).toEqual({ type: 'movie', genres: [], yearFrom: undefined, yearTo: undefined, minRating: undefined, provider: undefined, sort: 'popularity' })
  })
  it('relit tous les filtres', () => {
    expect(parse('type=tv&g=18,35&from=2000&to=2010&min=7&p=8&sort=rating')).toEqual({
      type: 'tv',
      genres: [18, 35],
      yearFrom: 2000,
      yearTo: 2010,
      minRating: 7,
      provider: 8,
      sort: 'rating',
    })
  })
  it('ignore les valeurs invalides, les doublons et plafonne les genres', () => {
    const state = parse('type=anime&g=abc,28,28,0,12,16,35,80,99,10&from=20&to=abcd&min=11&p=-3&sort=hasard')
    expect(state.type).toBe('movie')
    expect(state.genres).toEqual([28, 12, 16, 35, 80])
    expect(state.genres).toHaveLength(MAX_GENRES)
    expect([state.yearFrom, state.yearTo, state.minRating, state.provider, state.sort]).toEqual([undefined, undefined, undefined, undefined, 'popularity'])
  })
  it('ignore des années inversées', () => {
    const state = parse('from=2020&to=2010')
    expect([state.yearFrom, state.yearTo]).toEqual([undefined, undefined])
  })
})

describe('parseYear', () => {
  it('exige 4 chiffres dans les bornes', () => {
    expect(parseYear('1999')).toBe(1999)
    expect(parseYear('199')).toBeUndefined()
    expect(parseYear('1800')).toBeUndefined()
    expect(parseYear('2101')).toBeUndefined()
    expect(parseYear(null)).toBeUndefined()
  })
})

describe('toDiscoverFilters / toggleGenre / activeFilterCount', () => {
  const base = parseExplore(new URLSearchParams('g=28&p=8&min=7'))
  it('n\'envoie le pays qu\'avec une plateforme', () => {
    expect(toDiscoverFilters(base, 'FR', 2)).toMatchObject({ provider: 8, region: 'FR', page: 2, genres: [28], minRating: 7 })
    expect(toDiscoverFilters({ ...base, provider: undefined }, 'FR', 1).region).toBeUndefined()
  })
  it('ajoute, retire et respecte le maximum de genres', () => {
    expect(toggleGenre([1, 2], 3)).toEqual([1, 2, 3])
    expect(toggleGenre([1, 2], 2)).toEqual([1])
    expect(toggleGenre([1, 2, 3, 4, 5], 6)).toEqual([1, 2, 3, 4, 5])
  })
  it('compte les filtres actifs', () => {
    expect(activeFilterCount(base)).toBe(3)
    expect(activeFilterCount(parseExplore(new URLSearchParams('sort=date&type=tv')))).toBe(0)
  })
})
