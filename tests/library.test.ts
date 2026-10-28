import { describe, expect, it } from 'vitest'
import { groupByStatus, isStatus, isValidRating, libraryKey, parseTypeFilter, statusPatch, type LibraryItem } from '../src/features/library/group'

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

describe('libraryKey', () => {
  it('distingue un film et une série de même id', () => {
    expect(libraryKey('movie', 1)).not.toBe(libraryKey('tv', 1))
  })
})

describe('isStatus', () => {
  it('valide les statuts connus uniquement', () => {
    expect(isStatus('watched')).toBe(true)
    expect(isStatus('dropped')).toBe(true)
    expect(isStatus('abandoned')).toBe(false)
  })
})

describe('groupByStatus', () => {
  const items = [
    make({ id: 1, title: 'Zorro', status: 'watched' }),
    make({ id: 2, title: 'Alien', status: 'to_watch' }),
    make({ id: 3, title: 'Breaking Bad', type: 'tv', status: 'watching' }),
    make({ id: 4, title: 'Avatar', status: 'to_watch' }),
  ]

  it('ordonne les groupes (en cours, à regarder, vu) et trie par titre', () => {
    const groups = groupByStatus(items)
    expect(groups.map((g) => g.status)).toEqual(['watching', 'to_watch', 'watched'])
    expect(groups[1]?.items.map((i) => i.title)).toEqual(['Alien', 'Avatar'])
  })

  it('filtre par type et omet les groupes vides', () => {
    const groups = groupByStatus(items, 'tv')
    expect(groups).toHaveLength(1)
    expect(groups[0]?.status).toBe('watching')
  })

  it('renvoie une liste vide sans éléments', () => {
    expect(groupByStatus([])).toEqual([])
  })
})

describe('statusPatch', () => {
  const now = new Date('2026-10-28T12:00:00.000Z')
  it('renseigne watched_at uniquement pour « Vu »', () => {
    expect(statusPatch('watched', now)).toEqual({ status: 'watched', watched_at: '2026-10-28T12:00:00.000Z' })
    expect(statusPatch('watching', now)).toEqual({ status: 'watching', watched_at: null })
    expect(statusPatch('dropped', now).watched_at).toBeNull()
    expect(statusPatch('to_watch', now)).toEqual({ status: 'to_watch', watched_at: null })
  })
})

describe('isValidRating', () => {
  it('accepte les entiers de 1 à 10', () => {
    expect(isValidRating(1)).toBe(true)
    expect(isValidRating(10)).toBe(true)
    expect(isValidRating(0)).toBe(false)
    expect(isValidRating(11)).toBe(false)
    expect(isValidRating(7.5)).toBe(false)
  })
})

describe('groupByStatus favoris et abandonnés', () => {
  it('filtre les favoris et place « Abandonné » en dernier', () => {
    const items = [
      make({ id: 1, title: 'A', status: 'dropped', isFavorite: true }),
      make({ id: 2, title: 'B', status: 'watched', isFavorite: true }),
      make({ id: 3, title: 'C', status: 'watched' }),
    ]
    const groups = groupByStatus(items, 'all', true)
    expect(groups.map((g) => g.status)).toEqual(['watched', 'dropped'])
    expect(groups[0]?.items).toHaveLength(1)
  })
})

describe('parseTypeFilter', () => {
  it('relit le filtre de l\'URL, Tout par défaut', () => {
    expect(parseTypeFilter('movie')).toBe('movie')
    expect(parseTypeFilter('tv')).toBe('tv')
    expect(parseTypeFilter('autre')).toBe('all')
    expect(parseTypeFilter(null)).toBe('all')
  })
})
