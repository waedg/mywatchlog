import { describe, expect, it } from 'vitest'
import {
  autoStatus,
  epKey,
  formatEpisode,
  isAired,
  isUpcoming,
  nextEpisode,
  parseSeasonCounts,
  progressTone,
  sameSeasonCounts,
  selectAired,
  todayLocal,
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
