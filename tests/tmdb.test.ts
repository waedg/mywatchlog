import { describe, expect, it } from 'vitest'
import { mapDetails, mapSearchItem, yearFrom } from '../api/tmdb'

describe('yearFrom', () => {
  it('extrait l’année d’une date ISO', () => {
    expect(yearFrom('1999-03-31')).toBe(1999)
  })
  it('renvoie null pour une date absente ou vide', () => {
    expect(yearFrom(undefined)).toBeNull()
    expect(yearFrom(null)).toBeNull()
    expect(yearFrom('')).toBeNull()
  })
  it('renvoie null pour une valeur invalide', () => {
    expect(yearFrom('abcd')).toBeNull()
  })
})

describe('mapSearchItem', () => {
  it('mappe un film', () => {
    expect(
      mapSearchItem({
        id: 603,
        media_type: 'movie',
        title: 'Matrix',
        release_date: '1999-03-30',
        poster_path: '/m.jpg',
        overview: ' Un hacker. ',
      }),
    ).toEqual({
      id: 603,
      type: 'movie',
      title: 'Matrix',
      year: 1999,
      posterPath: '/m.jpg',
      overview: 'Un hacker.',
    })
  })

  it('mappe une série avec first_air_date', () => {
    const result = mapSearchItem({
      id: 1396,
      media_type: 'tv',
      name: 'Breaking Bad',
      first_air_date: '2008-01-20',
    })
    expect(result).toMatchObject({ id: 1396, type: 'tv', title: 'Breaking Bad', year: 2008, posterPath: null })
  })

  it('utilise le titre original en l’absence de titre traduit', () => {
    const result = mapSearchItem({ id: 1, media_type: 'movie', title: '', original_title: 'Original' })
    expect(result?.title).toBe('Original')
  })

  it('ignore les personnes et les éléments sans identifiant ou sans titre', () => {
    expect(mapSearchItem({ id: 5, media_type: 'person', name: 'Quelqu’un' })).toBeNull()
    expect(mapSearchItem({ media_type: 'movie', title: 'Sans id' })).toBeNull()
    expect(mapSearchItem({ id: 2, media_type: 'tv' })).toBeNull()
  })
})

describe('mapDetails', () => {
  it('prend le synopsis français quand il existe', () => {
    const details = mapDetails(
      'movie',
      { id: 603, title: 'Matrix', original_title: 'The Matrix', overview: 'Synopsis FR', imdb_id: 'tt0133093', release_date: '1999-03-30', genres: [{ name: 'Action' }, { name: 'Science-Fiction' }], vote_average: 8.2349 },
      { overview: 'Synopsis EN' },
    )
    expect(details).toMatchObject({
      id: 603,
      type: 'movie',
      imdbId: 'tt0133093',
      title: 'Matrix',
      originalTitle: 'The Matrix',
      year: 1999,
      overview: 'Synopsis FR',
      genres: ['Action', 'Science-Fiction'],
      voteAverage: 8.2,
    })
  })

  it('se replie sur le synopsis anglais quand le français est vide', () => {
    const details = mapDetails('tv', { id: 1, name: 'Série', overview: '   ' }, { overview: 'English overview' })
    expect(details.overview).toBe('English overview')
  })

  it('se replie sur le titre anglais puis original quand le titre français est vide', () => {
    expect(mapDetails('tv', { id: 1, name: '' }, { name: 'English name' }).title).toBe('English name')
    expect(mapDetails('tv', { id: 1, name: '', original_name: 'Nom original' }).title).toBe('Nom original')
  })

  it('lit l’identifiant IMDb dans external_ids pour une série', () => {
    const details = mapDetails('tv', { id: 1396, name: 'Breaking Bad', external_ids: { imdb_id: 'tt0903747' } })
    expect(details.imdbId).toBe('tt0903747')
  })

  it('renvoie imdbId null quand il est absent ou vide', () => {
    expect(mapDetails('movie', { id: 1, title: 'A', imdb_id: '' }).imdbId).toBeNull()
    expect(mapDetails('movie', { id: 1, title: 'A' }).imdbId).toBeNull()
  })

  it('renvoie voteAverage null quand la note vaut 0 ou est absente', () => {
    expect(mapDetails('movie', { id: 1, title: 'A', vote_average: 0 }).voteAverage).toBeNull()
    expect(mapDetails('movie', { id: 1, title: 'A' }).voteAverage).toBeNull()
  })
})
