import { describe, expect, it } from 'vitest'
import { ApiError, apiErrorMessage } from '../src/lib/api-error'
import { posterUrl } from '../src/lib/tmdb-images'

describe('posterUrl', () => {
  it('construit l’URL d’une affiche avec la taille demandée', () => {
    expect(posterUrl('/abc.jpg')).toBe('https://image.tmdb.org/t/p/w342/abc.jpg')
    expect(posterUrl('/abc.jpg', 'w185')).toBe('https://image.tmdb.org/t/p/w185/abc.jpg')
  })
  it('renvoie null sans affiche ou avec un chemin invalide', () => {
    expect(posterUrl(null)).toBeNull()
    expect(posterUrl(undefined)).toBeNull()
    expect(posterUrl('')).toBeNull()
    expect(posterUrl('abc.jpg')).toBeNull()
  })
})

describe('apiErrorMessage', () => {
  it('traduit les codes HTTP connus', () => {
    expect(apiErrorMessage(new ApiError(401, 'unauthorized'))).toContain('session')
    expect(apiErrorMessage(new ApiError(403, 'forbidden'))).toContain('autorisé')
    expect(apiErrorMessage(new ApiError(429, 'rate_limited'))).toContain('Trop de requêtes')
    expect(apiErrorMessage(new ApiError(404, 'not_found'))).toContain('Aucun résultat')
    expect(apiErrorMessage(new ApiError(502, 'tmdb_error'))).toContain('indisponible')
  })
  it('renvoie un message générique pour une erreur inconnue', () => {
    expect(apiErrorMessage(new Error('boom'))).toContain('erreur')
    expect(apiErrorMessage(null)).toContain('erreur')
  })
})

import { OfflineError } from '../src/lib/api-error'

describe('OfflineError', () => {
  it('donne un message dédié hors connexion', () => {
    expect(apiErrorMessage(new OfflineError())).toContain('Hors connexion')
  })
})
