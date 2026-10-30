import { describe, expect, it } from 'vitest'
import { ListError, apiErrorMessage } from '../src/lib/api-error'
import { buildSummaries, countItems, listItemsOf, listsContaining, type ListItemRow, type ListsData } from '../src/features/lists/derive'
import { LIST_NAME_MAX, listNameKey, normalizeListName, validateListName } from '../src/features/lists/names'

describe('noms de liste', () => {
  it('retire les espaces autour et compare sans la casse', () => {
    expect(normalizeListName('  Famille  ')).toBe('Famille')
    expect(listNameKey('  FAMILLE ')).toBe(listNameKey('famille'))
  })
  it('refuse un nom vide, trop long ou en double', () => {
    expect(validateListName('   ', [])?.code).toBe('empty')
    expect(validateListName('x'.repeat(LIST_NAME_MAX), [])).toBeNull()
    expect(validateListName('x'.repeat(LIST_NAME_MAX + 1), [])?.code).toBe('too_long')
    expect(validateListName(' famille ', [{ name: 'Famille' }])?.code).toBe('duplicate')
    expect(validateListName('Classiques', [{ name: 'Famille' }])).toBeNull()
  })
  it('la longueur est mesurée après suppression des espaces autour', () => {
    expect(validateListName(`  ${'x'.repeat(LIST_NAME_MAX)}  `, [])).toBeNull()
  })
  it('donne un message lisible pour chaque erreur de liste', () => {
    for (const code of ['empty', 'too_long', 'duplicate', 'list_limit', 'items_limit'] as const) {
      expect(apiErrorMessage(new ListError(code))).not.toContain('Une erreur est survenue')
    }
    expect(apiErrorMessage(new ListError('duplicate'))).toContain('déjà')
  })
})

const item = (over: Partial<ListItemRow>): ListItemRow => ({
  listId: 'l1',
  id: 1,
  type: 'movie',
  title: 'A',
  year: 2000,
  posterPath: '/a.jpg',
  addedAt: '2026-10-01T10:00:00Z',
  ...over,
})

const data: ListsData = {
  lists: [
    { id: 'l2', name: 'Zèbre', createdAt: '2026-10-01', updatedAt: '2026-10-01' },
    { id: 'l1', name: 'Classiques', createdAt: '2026-10-01', updatedAt: '2026-10-01' },
    { id: 'l3', name: 'Vide', createdAt: '2026-10-01', updatedAt: '2026-10-01' },
  ],
  items: [
    item({ listId: 'l1', id: 1, title: 'Zorro', posterPath: '/z.jpg', addedAt: '2026-10-05T00:00:00Z' }),
    item({ listId: 'l1', id: 2, title: 'Alien', type: 'tv', posterPath: '/a.jpg', addedAt: '2026-10-04T00:00:00Z' }),
    item({ listId: 'l1', id: 3, title: 'Beta', posterPath: null, addedAt: '2026-10-06T00:00:00Z' }),
    item({ listId: 'l1', id: 4, title: 'Delta', posterPath: '/d.jpg', addedAt: '2026-10-03T00:00:00Z' }),
    item({ listId: 'l1', id: 5, title: 'Echo', posterPath: '/e.jpg', addedAt: '2026-10-02T00:00:00Z' }),
    item({ listId: 'l1', id: 6, title: 'Foxtrot', posterPath: '/f.jpg', addedAt: '2026-10-01T00:00:00Z' }),
    item({ listId: 'l2', id: 1, title: 'Zorro', posterPath: '/z.jpg' }),
  ],
}

describe('buildSummaries', () => {
  const summaries = buildSummaries(data)
  it('trie les listes par nom et compte les titres', () => {
    expect(summaries.map((s) => [s.name, s.itemCount])).toEqual([
      ['Classiques', 6],
      ['Vide', 0],
      ['Zèbre', 1],
    ])
  })
  it('prend les 4 affiches des titres ajoutés le plus récemment, sans affiche manquante', () => {
    expect(summaries[0]?.previews).toEqual(['/z.jpg', '/a.jpg', '/d.jpg', '/e.jpg'])
    expect(summaries[1]?.previews).toEqual([])
  })
})

describe('listItemsOf / listsContaining / countItems', () => {
  it('trie par titre et filtre par type', () => {
    expect(listItemsOf(data, 'l1').map((i) => i.title)).toEqual(['Alien', 'Beta', 'Delta', 'Echo', 'Foxtrot', 'Zorro'])
    expect(listItemsOf(data, 'l1', 'tv').map((i) => i.title)).toEqual(['Alien'])
    expect(listItemsOf(data, 'inconnue')).toEqual([])
  })
  it('retrouve les listes d\'un titre sans confondre film et série', () => {
    expect([...listsContaining(data, { id: 1, type: 'movie' })].sort()).toEqual(['l1', 'l2'])
    expect(listsContaining(data, { id: 1, type: 'tv' }).size).toBe(0)
    expect(listsContaining(data, { id: 2, type: 'tv' }).has('l1')).toBe(true)
  })
  it('compte les titres d\'une liste', () => {
    expect(countItems(data, 'l1')).toBe(6)
    expect(countItems(data, 'l3')).toBe(0)
  })
})
