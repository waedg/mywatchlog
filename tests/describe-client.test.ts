import { describe, expect, it } from 'vitest'
import { DESCRIBE_MAX_CHARS as SERVER_MAX, DESCRIBE_MIN_CHARS as SERVER_MIN, normalizeDescription } from '../api/tmdb'
import { ApiError, apiErrorMessage } from '../src/lib/api-error'
import {
  DESCRIBE_MAX_CHARS,
  DESCRIBE_MIN_CHARS,
  normalizeDescriptionInput,
  parseSearchMode,
} from '../src/features/search/describe'

describe('normalizeDescriptionInput (client)', () => {
  it('nettoie les espaces et les retours à la ligne', () => {
    expect(normalizeDescriptionInput('  un homme \n\t retrouve   sa mémoire  ')).toBe('un homme retrouve sa mémoire')
  })
  it('refuse une saisie absente, trop courte ou trop longue', () => {
    expect(normalizeDescriptionInput(null)).toBeNull()
    expect(normalizeDescriptionInput(undefined)).toBeNull()
    expect(normalizeDescriptionInput('   ')).toBeNull()
    expect(normalizeDescriptionInput('ab')).toBeNull()
    expect(normalizeDescriptionInput('abc')).toBe('abc')
    expect(normalizeDescriptionInput('a'.repeat(DESCRIBE_MAX_CHARS))).not.toBeNull()
    expect(normalizeDescriptionInput('a'.repeat(DESCRIBE_MAX_CHARS + 1))).toBeNull()
  })
  it('mesure la longueur après nettoyage', () => {
    expect(normalizeDescriptionInput(`${' '.repeat(600)}abc`)).toBe('abc')
  })
})

describe('cohérence client / serveur', () => {
  it('les bornes sont identiques', () => {
    expect(DESCRIBE_MIN_CHARS).toBe(SERVER_MIN)
    expect(DESCRIBE_MAX_CHARS).toBe(SERVER_MAX)
  })
  it('le client et le serveur nettoient une saisie de la même façon', () => {
    const samples = [
      '  un homme \n\t retrouve   sa mémoire  ',
      'ab',
      'abc',
      '   ',
      'a'.repeat(DESCRIBE_MAX_CHARS),
      'a'.repeat(DESCRIBE_MAX_CHARS + 1),
      `${' '.repeat(600)}abc`,
      'accents é à ç\u0007 et contrôle',
      'ligne 1\r\nligne 2',
    ]
    for (const sample of samples) {
      expect(normalizeDescriptionInput(sample), JSON.stringify(sample)).toBe(normalizeDescription(sample))
    }
  })
})

describe('parseSearchMode', () => {
  it('ne reconnaît que « description », le mode Titre est le défaut', () => {
    expect(parseSearchMode('description')).toBe('description')
    expect(parseSearchMode('title')).toBe('title')
    expect(parseSearchMode('autre')).toBe('title')
    expect(parseSearchMode(null)).toBe('title')
  })
})

describe('apiErrorMessage : recherche par description', () => {
  it('quota IA : message dédié, pas le message générique du 429', () => {
    const message = apiErrorMessage(new ApiError(429, 'ai_quota'))
    expect(message).toBe('Quota IA atteint, réessaie plus tard.')
    expect(message).not.toBe(apiErrorMessage(new ApiError(429, 'rate_limited')))
  })
  it('IA indisponible : message dédié, distinct du 502 générique', () => {
    const message = apiErrorMessage(new ApiError(502, 'ai_unavailable'))
    expect(message).toContain('recherche par description')
    expect(message).not.toBe(apiErrorMessage(new ApiError(502, 'tmdb_error')))
  })
  it('les autres erreurs gardent leurs messages', () => {
    expect(apiErrorMessage(new ApiError(429, 'rate_limited'))).toBe('Trop de requêtes. Réessaie dans un instant.')
    expect(apiErrorMessage(new ApiError(401, 'unauthorized'))).toContain('session a expiré')
    expect(apiErrorMessage(new ApiError(500, 'server_misconfigured'))).toContain('momentanément indisponible')
  })
})
