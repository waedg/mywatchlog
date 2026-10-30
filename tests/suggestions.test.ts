import { describe, expect, it } from 'vitest'
import type { ForYouResult } from '../shared/tmdb-types'
import type { ListItemRow } from '../src/features/lists/derive'
import type { LibraryItem } from '../src/features/library/group'
import {
  COLLECTION_MAX_SOURCES,
  COLLECTION_MIN_SOURCES,
  collectionSuggestionsKey,
  filterCollectionSuggestions,
  hasEnoughSources,
  pickCollectionSources,
} from '../src/features/lists/suggestions'

const row = (id: number, title: string, type: 'movie' | 'tv' = 'movie'): ListItemRow => ({
  listId: 'l1',
  id,
  type,
  title,
  year: 2020,
  posterPath: null,
  addedAt: '2026-01-01T00:00:00Z',
})

const owned = (id: number, over: Partial<LibraryItem> = {}): LibraryItem => ({
  id,
  type: 'movie',
  title: `T${id}`,
  year: 2020,
  posterPath: null,
  status: 'watched',
  isFavorite: false,
  rating: null,
  hasCopy: false,
  seasonCounts: [],
  isEnded: null,
  ...over,
})

const result = (id: number, type: 'movie' | 'tv' = 'movie', score = 1): ForYouResult => ({
  id,
  type,
  title: `R${id}`,
  year: 2021,
  posterPath: null,
  overview: '',
  voteAverage: 7,
  score,
})

describe('seuil', () => {
  it('exige 3 titres', () => {
    expect(COLLECTION_MIN_SOURCES).toBe(3)
    expect(hasEnoughSources([row(1, 'A'), row(2, 'B')])).toBe(false)
    expect(hasEnoughSources([row(1, 'A'), row(2, 'B'), row(3, 'C')])).toBe(true)
  })
})

describe('pickCollectionSources', () => {
  it('trie par note, puis favori, puis ordre alphabétique', () => {
    const items = [row(1, 'Zèbre'), row(2, 'Alpha'), row(3, 'Mille'), row(4, 'Beta')]
    const library = [owned(1, { rating: 9 }), owned(3, { isFavorite: true }), owned(4, { rating: 5 })]
    expect(pickCollectionSources(items, library).map((s) => s.id)).toEqual([1, 4, 3, 2])
  })
  it('un titre absent de Ma liste est classé à l’ordre alphabétique, derrière les notés', () => {
    const items = [row(1, 'Zèbre'), row(2, 'Alpha')]
    expect(pickCollectionSources(items, [owned(1, { rating: 6 })]).map((s) => s.id)).toEqual([1, 2])
  })
  it('plafonne à 15 sources, de façon déterministe', () => {
    const items = Array.from({ length: 20 }, (_, i) => row(i + 1, `Titre ${String(i + 1).padStart(2, '0')}`))
    const picked = pickCollectionSources(items, [])
    expect(picked).toHaveLength(COLLECTION_MAX_SOURCES)
    expect(picked.map((s) => s.id)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1))
    expect(pickCollectionSources([...items].reverse(), [])).toEqual(picked)
  })
  it('distingue un film et une série de même identifiant', () => {
    const items = [row(7, 'Same', 'movie'), row(7, 'Same', 'tv')]
    const library = [owned(7, { type: 'tv', rating: 9 })]
    expect(pickCollectionSources(items, library)).toEqual([
      { id: 7, type: 'tv' },
      { id: 7, type: 'movie' },
    ])
  })
})

describe('collectionSuggestionsKey', () => {
  it('ne dépend pas de l’ordre des sources', () => {
    const a = collectionSuggestionsKey([{ id: 1, type: 'movie' }, { id: 2, type: 'tv' }])
    const b = collectionSuggestionsKey([{ id: 2, type: 'tv' }, { id: 1, type: 'movie' }])
    expect(a).toEqual(b)
    expect(a[0]).toBe('collection-suggestions')
  })
  it('change quand la composition change', () => {
    expect(collectionSuggestionsKey([{ id: 1, type: 'movie' }])).not.toEqual(collectionSuggestionsKey([{ id: 1, type: 'tv' }]))
  })
})

describe('filterCollectionSuggestions', () => {
  it('retire seulement les titres de la collection', () => {
    const results = [result(1), result(2), result(3, 'tv')]
    const out = filterCollectionSuggestions(results, [row(1, 'A')], 'all')
    expect(out.map((r) => r.id)).toEqual([2, 3])
  })
  it('un film et une série de même identifiant ne s’excluent pas', () => {
    const out = filterCollectionSuggestions([result(1, 'tv')], [row(1, 'A', 'movie')], 'all')
    expect(out).toHaveLength(1)
  })
  it('filtre par type et limite le nombre d’affiches', () => {
    const results = [result(1), result(2, 'tv'), result(3), result(4)]
    expect(filterCollectionSuggestions(results, [], 'movie').map((r) => r.id)).toEqual([1, 3, 4])
    expect(filterCollectionSuggestions(results, [], 'all', 2)).toHaveLength(2)
  })
})
