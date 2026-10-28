import { describe, expect, it } from 'vitest'
import { mapCast, mapDetails, mapNextEpisode, mapPerson, mapPersonCredits, mapProviders, mapSearchItem, mapSeason, mapTvInfo, yearFrom } from '../api/tmdb'

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

describe('mapTvInfo', () => {
  it('trie les saisons, nomme les saisons sans nom et détecte une série terminée', () => {
    const tv = mapTvInfo({
      status: 'Ended',
      seasons: [
        { season_number: 2, name: '', episode_count: 8, air_date: '2009-03-08' },
        { season_number: 0, name: 'Épisodes spéciaux', episode_count: 9 },
        { season_number: 1, name: 'Saison 1', episode_count: 7, air_date: '' },
        { name: 'sans numéro', episode_count: 3 },
      ],
    })
    expect(tv.ended).toBe(true)
    expect(tv.seasons.map((s) => s.seasonNumber)).toEqual([0, 1, 2])
    expect(tv.seasons[2]).toEqual({ seasonNumber: 2, name: 'Saison 2', episodeCount: 8, airDate: '2009-03-08' })
    expect(tv.seasons[1]?.airDate).toBeNull()
  })
  it('série en cours ou sans saisons', () => {
    expect(mapTvInfo({ status: 'Returning Series' }).ended).toBe(false)
    expect(mapTvInfo({ status: 'Canceled' }).ended).toBe(true)
    expect(mapTvInfo({}).seasons).toEqual([])
  })
  it('mapDetails renseigne tv pour une série et null pour un film', () => {
    expect(mapDetails('tv', { id: 1, name: 'S', seasons: [{ season_number: 1, episode_count: 2 }] }).tv?.seasons).toHaveLength(1)
    expect(mapDetails('movie', { id: 1, title: 'F' }).tv).toBeNull()
  })
})

describe('mapSeason', () => {
  it('filtre, trie et complète les épisodes', () => {
    const season = mapSeason(1, {
      episodes: [
        { episode_number: 2, name: '', air_date: '', runtime: 0 },
        { episode_number: 1, name: 'Pilote', air_date: '2008-01-20', runtime: 58 },
        { name: 'sans numéro' },
      ],
    })
    expect(season.seasonNumber).toBe(1)
    expect(season.episodes).toEqual([
      { episodeNumber: 1, name: 'Pilote', airDate: '2008-01-20', runtime: 58 },
      { episodeNumber: 2, name: 'Épisode 2', airDate: null, runtime: null },
    ])
  })
})

describe('mapCast / mapNextEpisode (détails)', () => {
  it('trie le casting par ordre, limite à 12 et ignore les entrées invalides', () => {
    const cast = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: `Acteur ${i + 1}`, character: ' Rôle ', order: 15 - i }))
    const result = mapCast([...cast, { name: 'sans id' }, { id: 99, name: '  ' }])
    expect(result).toHaveLength(12)
    expect(result[0]?.id).toBe(15)
    expect(result[0]?.character).toBe('Rôle')
    expect(result[0]?.profilePath).toBeNull()
    expect(mapCast(undefined)).toEqual([])
  })
  it('lit le prochain épisode et ignore les données incomplètes', () => {
    expect(mapNextEpisode({ season_number: 2, episode_number: 5, name: '', air_date: '2026-11-04' })).toEqual({
      seasonNumber: 2,
      episodeNumber: 5,
      name: 'Épisode 5',
      airDate: '2026-11-04',
    })
    expect(mapNextEpisode({ season_number: 2, episode_number: 5 })).toBeNull()
    expect(mapNextEpisode(null)).toBeNull()
  })
  it('mapDetails expose date de sortie, prochain épisode et casting', () => {
    const tv = mapDetails('tv', {
      id: 1,
      name: 'S',
      first_air_date: '2020-01-01',
      next_episode_to_air: { season_number: 1, episode_number: 2, air_date: '2026-12-01' },
      credits: { cast: [{ id: 7, name: 'A', order: 0 }] },
    })
    expect(tv.releaseDate).toBe('2020-01-01')
    expect(tv.nextEpisode?.airDate).toBe('2026-12-01')
    expect(tv.cast).toHaveLength(1)
    const movie = mapDetails('movie', { id: 2, title: 'F', release_date: '' })
    expect(movie.releaseDate).toBeNull()
    expect(movie.nextEpisode).toBeNull()
  })
})

describe('mapProviders', () => {
  const data = {
    results: {
      FR: {
        flatrate: [
          { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.jpg', display_priority: 2 },
          { provider_id: 119, provider_name: 'Prime Video', logo_path: '/p.jpg', display_priority: 1 },
          { provider_id: 8, provider_name: 'Netflix (doublon)', display_priority: 3 },
        ],
        rent: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: null }],
      },
    },
  }
  it('trie par priorité, dédoublonne et sépare abonnement, location, achat', () => {
    const result = mapProviders('FR', data)
    expect(result.available).toBe(true)
    expect(result.flatrate.map((p) => p.name)).toEqual(['Prime Video', 'Netflix'])
    expect(result.rent).toHaveLength(1)
    expect(result.buy).toEqual([])
  })
  it('signale un pays sans données', () => {
    const result = mapProviders('BE', data)
    expect(result.available).toBe(false)
    expect(result.flatrate).toEqual([])
  })
})

describe('mapPerson / mapPersonCredits', () => {
  const cast = [
    { id: 1, media_type: 'movie', title: 'Ancien', release_date: '2001-05-01', character: 'Jim' },
    { id: 2, media_type: 'tv', name: 'Récent', first_air_date: '2024-02-02', character: ' Eve ' },
    { id: 3, media_type: 'tv', name: 'Talk-show', first_air_date: '2025-01-01', genre_ids: [10767], character: 'Self' },
    { id: 1, media_type: 'movie', title: 'Ancien', release_date: '2001-05-01' },
    { id: 4, media_type: 'movie', title: 'Annoncé', release_date: '' },
    { id: 5, media_type: 'person', name: 'ignoré' },
  ]
  it('filtre, dédoublonne et trie la filmographie', () => {
    const credits = mapPersonCredits(cast)
    expect(credits.map((c) => c.title)).toEqual(['Annoncé', 'Récent', 'Ancien'])
    expect(credits[1]).toMatchObject({ id: 2, type: 'tv', year: 2024, character: 'Eve' })
  })
  it('utilise la biographie de repli quand celle en français est vide', () => {
    const person = mapPerson({ id: 9, name: 'Nom', biography: '  ' }, { biography: 'English bio' })
    expect(person.biography).toBe('English bio')
    expect(mapPerson({ id: 9, name: 'Nom', biography: 'Bio', birthday: '' }).birthday).toBeNull()
  })
})
