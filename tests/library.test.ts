import { describe, expect, it } from 'vitest'
import { groupByStatus, isStatus, libraryKey, type LibraryItem } from '../src/features/library/group'

const make = (over: Partial<LibraryItem>): LibraryItem => ({
  id: 1,
  type: 'movie',
  title: 'A',
  year: 2000,
  posterPath: null,
  status: 'to_watch',
  isFavorite: false,
  rating: null,
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
