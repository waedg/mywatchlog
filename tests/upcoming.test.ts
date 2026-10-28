import { describe, expect, it } from 'vitest'
import { addDays, buildUpcoming, groupUpcoming, isCandidate } from '../src/features/upcoming/upcoming'
import { DEFAULT_REGION, parseRegion } from '../src/lib/region'
import type { LibraryItem } from '../src/features/library/group'
import type { TitleDetails } from '../shared/tmdb-types'

const item = (over: Partial<LibraryItem>): LibraryItem => ({
  id: 1,
  type: 'tv',
  title: 'Série',
  year: 2020,
  posterPath: null,
  status: 'watching',
  isFavorite: false,
  rating: null,
  seasonCounts: [],
  isEnded: false,
  ...over,
})

const details = (over: Partial<TitleDetails>): TitleDetails => ({
  id: 1,
  type: 'tv',
  imdbId: null,
  title: 'Série',
  originalTitle: 'Série',
  year: 2020,
  posterPath: null,
  overview: '',
  genres: [],
  voteAverage: null,
  tv: null,
  releaseDate: null,
  nextEpisode: null,
  cast: [],
  ...over,
})

const TODAY = '2026-10-28'

describe('isCandidate', () => {
  it('retient les films à regarder et les séries en cours ou à regarder', () => {
    expect(isCandidate(item({ type: 'movie', status: 'to_watch' }))).toBe(true)
    expect(isCandidate(item({ type: 'movie', status: 'watched' }))).toBe(false)
    expect(isCandidate(item({ type: 'tv', status: 'watching' }))).toBe(true)
    expect(isCandidate(item({ type: 'tv', status: 'to_watch' }))).toBe(true)
    expect(isCandidate(item({ type: 'tv', status: 'dropped' }))).toBe(false)
    expect(isCandidate(item({ type: 'tv', status: 'watched' }))).toBe(false)
  })
})

describe('addDays', () => {
  it('ajoute des jours en franchissant les mois et les années', () => {
    expect(addDays('2026-10-28', 7)).toBe('2026-11-04')
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
  })
})

describe('buildUpcoming', () => {
  it('série : prochain épisode à partir d\'aujourd\'hui', () => {
    const entry = buildUpcoming(
      item({}),
      details({ nextEpisode: { seasonNumber: 2, episodeNumber: 5, name: 'Titre', airDate: '2026-11-02' } }),
      TODAY,
    )
    expect(entry).toMatchObject({ date: '2026-11-02', label: 'S02E05', detail: 'Titre', key: 'tv-1' })
    expect(buildUpcoming(item({}), details({ nextEpisode: { seasonNumber: 1, episodeNumber: 1, name: 'x', airDate: TODAY } }), TODAY)).not.toBeNull()
    expect(buildUpcoming(item({}), details({ nextEpisode: { seasonNumber: 1, episodeNumber: 1, name: 'x', airDate: '2026-10-01' } }), TODAY)).toBeNull()
    expect(buildUpcoming(item({}), details({}), TODAY)).toBeNull()
  })
  it('film : date de sortie à venir uniquement', () => {
    const movie = item({ type: 'movie', status: 'to_watch', id: 2 })
    expect(buildUpcoming(movie, details({ type: 'movie', releaseDate: '2027-01-15' }), TODAY)).toMatchObject({ label: 'Sortie', date: '2027-01-15' })
    expect(buildUpcoming(movie, details({ type: 'movie', releaseDate: '2020-01-15' }), TODAY)).toBeNull()
    expect(buildUpcoming(movie, details({ type: 'movie', releaseDate: null }), TODAY)).toBeNull()
  })
  it('sans détails, rien', () => {
    expect(buildUpcoming(item({}), undefined, TODAY)).toBeNull()
  })
})

describe('groupUpcoming', () => {
  const entry = (title: string, date: string) => ({ key: title, id: 1, type: 'tv' as const, title, posterPath: null, date, label: 'S01E01', detail: null })
  it('regroupe aujourd\'hui, cette semaine, plus tard, triés par date puis titre', () => {
    const groups = groupUpcoming(
      [entry('Z', '2027-02-01'), entry('B', '2026-10-30'), entry('A', '2026-10-30'), entry('T', TODAY), entry('W', '2026-11-04'), entry('L', '2026-11-05')],
      TODAY,
    )
    expect(groups.map((g) => g.key)).toEqual(['today', 'week', 'later'])
    expect(groups[1]?.entries.map((e) => e.title)).toEqual(['A', 'B', 'W'])
    expect(groups[2]?.entries.map((e) => e.title)).toEqual(['L', 'Z'])
  })
  it('omet les groupes vides', () => {
    expect(groupUpcoming([], TODAY)).toEqual([])
    expect(groupUpcoming([entry('T', TODAY)], TODAY).map((g) => g.key)).toEqual(['today'])
  })
})

describe('parseRegion', () => {
  it('accepte les pays proposés, sinon France', () => {
    expect(parseRegion('BE')).toBe('BE')
    expect(parseRegion('XX')).toBe(DEFAULT_REGION)
    expect(parseRegion(null)).toBe('FR')
    expect(parseRegion('fr')).toBe('FR')
  })
})
