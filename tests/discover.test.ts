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
