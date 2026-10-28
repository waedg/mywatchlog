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
