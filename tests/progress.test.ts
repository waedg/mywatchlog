import { describe, expect, it } from 'vitest'
import {
  autoStatus,
  epKey,
  firstEpisodeNumber,
  formatEpisode,
  formatNextEpisode,
  isAired,
  isUpcoming,
  mergeFirsts,
  nextEpisode,
  parseSeasonCounts,
  progressTone,
  sameSeasonCounts,
  seasonsMissingFirst,
  selectAired,
  todayLocal,
  toWatchedMap,
  totalEpisodes,
  watchedCount,
  watchedInSeason,
} from '../src/features/episodes/progress'

const counts = [
  { season: 0, episodes: 3 },
  { season: 1, episodes: 3 },
  { season: 2, episodes: 2 },
]

describe('compteurs', () => {
  it('exclut les spéciaux du total et des vus', () => {
    expect(totalEpisodes(counts)).toBe(5)
    const watched = new Set([epKey(0, 1), epKey(1, 1), epKey(1, 2), epKey(2, 2), epKey(9, 9)])
    expect(watchedCount(watched, counts)).toBe(3)
    expect(watchedInSeason(watched, 1, 3)).toBe(2)
  })
  it('trouve le prochain épisode non vu', () => {
    expect(nextEpisode(new Set(), counts)).toEqual({ season: 1, episode: 1 })
    expect(nextEpisode(new Set([epKey(1, 1), epKey(1, 2), epKey(1, 3)]), counts)).toEqual({ season: 2, episode: 1 })
    expect(nextEpisode(new Set([epKey(1, 1), epKey(1, 3), epKey(2, 1), epKey(2, 2)]), counts)).toEqual({ season: 1, episode: 2 })
    const all = new Set([epKey(1, 1), epKey(1, 2), epKey(1, 3), epKey(2, 1), epKey(2, 2)])
    expect(nextEpisode(all, counts)).toBeNull()
  })
  it('formate un épisode', () => {
    expect(formatEpisode(2, 5)).toBe('S02E05')
    expect(formatEpisode(12, 103)).toBe('S12E103')
  })
})

describe('parseSeasonCounts / sameSeasonCounts', () => {
  it('ignore les entrées invalides et trie', () => {
    expect(parseSeasonCounts([{ season: 2, episodes: 8 }, { season: 'x', episodes: 1 }, null, { season: 1, episodes: 4 }])).toEqual([
      { season: 1, episodes: 4 },
      { season: 2, episodes: 8 },
    ])
    expect(parseSeasonCounts(null)).toEqual([])
    expect(parseSeasonCounts({})).toEqual([])
  })
  it('compare deux listes', () => {
    expect(sameSeasonCounts(counts, [...counts])).toBe(true)
    expect(sameSeasonCounts(counts, counts.slice(1))).toBe(false)
    expect(sameSeasonCounts([{ season: 1, episodes: 3 }], [{ season: 1, episodes: 4 }])).toBe(false)
  })
})

describe('dates', () => {
  it('distingue diffusé, à venir et inconnu', () => {
    expect(isAired('2026-10-28', '2026-10-28')).toBe(true)
    expect(isAired('2026-10-29', '2026-10-28')).toBe(false)
    expect(isAired(null, '2026-10-28')).toBe(false)
    expect(isUpcoming('2026-10-29', '2026-10-28')).toBe(true)
    expect(isUpcoming(null, '2026-10-28')).toBe(false)
  })
  it('formate la date locale', () => {
    expect(todayLocal(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('selectAired', () => {
  const seasons = [
    { seasonNumber: 1, episodes: [
      { episodeNumber: 1, name: 'a', airDate: '2026-01-01', runtime: null },
      { episodeNumber: 2, name: 'b', airDate: '2026-12-01', runtime: null },
      { episodeNumber: 3, name: 'c', airDate: null, runtime: null },
    ] },
    { seasonNumber: 2, episodes: [{ episodeNumber: 1, name: 'd', airDate: '2026-02-01', runtime: null }] },
  ]
  it('ne garde que les épisodes diffusés', () => {
    expect(selectAired(seasons, '2026-10-28')).toEqual([{ season: 1, episode: 1 }, { season: 2, episode: 1 }])
  })
  it('applique le filtre « jusqu\'ici »', () => {
    expect(selectAired(seasons, '2026-10-28', (s, e) => s < 2 || (s === 2 && e <= 1))).toHaveLength(2)
    expect(selectAired(seasons, '2026-10-28', (s) => s === 1)).toEqual([{ season: 1, episode: 1 }])
  })
})

describe('autoStatus', () => {
  it('série terminée entièrement vue -> Vu', () => {
    expect(autoStatus('watching', 5, 5, true)).toBe('watched')
    expect(autoStatus('watched', 5, 5, true)).toBeNull()
  })
  it('série en cours de diffusion reste En cours', () => {
    expect(autoStatus('watching', 5, 5, false)).toBeNull()
  })
  it('premier épisode coché -> En cours', () => {
    expect(autoStatus('to_watch', 1, 5, false)).toBe('watching')
    expect(autoStatus('dropped', 1, 5, false)).toBeNull()
  })
  it('décocher depuis Vu -> En cours', () => {
    expect(autoStatus('watched', 4, 5, true)).toBe('watching')
  })
  it('sans total connu, ne change rien', () => {
    expect(autoStatus('to_watch', 1, 0, true)).toBeNull()
  })
})

describe('progressTone', () => {
  it('abandonné -> rouge, quelle que soit la progression', () => {
    expect(progressTone('dropped', 44, 44, true)).toBe('dropped')
    expect(progressTone('dropped', 3, 44, false)).toBe('dropped')
  })
  it('tout vu : vert fluo si terminée, rayé si encore diffusée', () => {
    expect(progressTone('watched', 44, 44, true)).toBe('ended')
    expect(progressTone('watching', 44, 44, false)).toBe('caught-up')
  })
  it('sinon progression normale', () => {
    expect(progressTone('watching', 10, 44, false)).toBe('progress')
    expect(progressTone('to_watch', 0, 0, false)).toBe('progress')
  })
})

describe('toWatchedMap', () => {
  it('reconstruit les ensembles après un aller-retour JSON', () => {
    const record = JSON.parse(JSON.stringify({ 1396: ['1x1', '1x2'], 42: ['2x5'] }))
    const map = toWatchedMap(record)
    expect(map.get(1396)?.has('1x2')).toBe(true)
    expect(map.get(42)?.size).toBe(1)
    expect(map.get(7)).toBeUndefined()
  })
})

// Hunter x Hunter (2011) : TMDB numérote les épisodes en continu (S2 = 63 à 136, S3 = 137 à 148).
describe('numérotation continue des épisodes', () => {
  const hxh = [
    { season: 1, episodes: 62 },
    { season: 2, episodes: 74 },
    { season: 3, episodes: 12 },
  ]
  const range = (season: number, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => epKey(season, from + i))
  const all = new Set([...range(1, 1, 62), ...range(2, 63, 136), ...range(3, 137, 148)])

  it('compte 148/148 sans connaître les premiers numéros', () => {
    expect(totalEpisodes(hxh)).toBe(148)
    expect(watchedCount(all, hxh)).toBe(148)
    expect(watchedInSeason(all, 2, 74)).toBe(74)
  })
  it('compte exactement avec les premiers numéros connus', () => {
    const known = [
      { season: 1, episodes: 62, first: 1 },
      { season: 2, episodes: 74, first: 63 },
      { season: 3, episodes: 12, first: 137 },
    ]
    expect(watchedCount(all, known)).toBe(148)
    expect(watchedCount(new Set(range(2, 63, 70)), known)).toBe(8)
    // un épisode hors plage n'est pas compté
    expect(watchedCount(new Set([epKey(2, 5)]), known)).toBe(0)
  })
  it('affiche « terminé » (aucun prochain épisode) quand tout est vu', () => {
    expect(nextEpisode(all, hxh)).toBeNull()
  })
  it('trouve le vrai prochain épisode quand le premier numéro est connu', () => {
    const known = [
      { season: 1, episodes: 62, first: 1 },
      { season: 2, episodes: 74, first: 63 },
    ]
    const watched = new Set([...range(1, 1, 62), ...range(2, 63, 70)])
    expect(nextEpisode(watched, known)).toEqual({ season: 2, episode: 71 })
    expect(formatNextEpisode({ season: 2, episode: 71 })).toBe('S02E71')
  })
  it('n\'invente pas de numéro quand la numérotation est inconnue et irrégulière', () => {
    const watched = new Set([...range(1, 1, 62), ...range(2, 63, 100)])
    expect(nextEpisode(watched, hxh)).toEqual({ season: 2, episode: null })
    expect(formatNextEpisode({ season: 2, episode: null })).toBe('S02')
  })
})

describe('premiers numéros d\'épisode', () => {
  it('relit et conserve first dans season_counts', () => {
    expect(parseSeasonCounts([{ season: 2, episodes: 74, first: 63 }, { season: 1, episodes: 62, first: 'x' }])).toEqual([
      { season: 1, episodes: 62 },
      { season: 2, episodes: 74, first: 63 },
    ])
  })
  it('sameSeasonCounts ignore first', () => {
    expect(sameSeasonCounts([{ season: 1, episodes: 3, first: 5 }], [{ season: 1, episodes: 3 }])).toBe(true)
  })
  it('mergeFirsts garde les premiers numéros déjà relevés', () => {
    const fresh = [{ season: 1, episodes: 62 }, { season: 2, episodes: 74 }, { season: 3, episodes: 12 }]
    const previous = [{ season: 1, episodes: 62, first: 1 }, { season: 2, episodes: 74, first: 63 }]
    expect(mergeFirsts(fresh, previous)).toEqual([
      { season: 1, episodes: 62, first: 1 },
      { season: 2, episodes: 74, first: 63 },
      { season: 3, episodes: 12 },
    ])
  })
  it('seasonsMissingFirst ignore les spéciaux et les saisons vides', () => {
    expect(seasonsMissingFirst([{ season: 0, episodes: 3 }, { season: 1, episodes: 5, first: 1 }, { season: 2, episodes: 4 }, { season: 3, episodes: 0 }])).toEqual([2])
  })
  it('firstEpisodeNumber prend le plus petit numéro', () => {
    const episode = (n: number) => ({ episodeNumber: n, name: '', airDate: null, runtime: null })
    expect(firstEpisodeNumber({ seasonNumber: 2, episodes: [episode(64), episode(63), episode(65)] })).toBe(63)
    expect(firstEpisodeNumber({ seasonNumber: 2, episodes: [] })).toBeNull()
  })
})
