import { describe, expect, it } from 'vitest'
import { authStatus } from '../src/lib/auth-status'

describe('authStatus', () => {
  it('reste en chargement pendant la lecture de la session', () => {
    expect(authStatus({ initializing: true, hasSession: false, check: null })).toBe('loading')
    expect(authStatus({ initializing: true, hasSession: true, check: 'allowed' })).toBe('loading')
  })

  it('signale une déconnexion sans session', () => {
    expect(authStatus({ initializing: false, hasSession: false, check: null })).toBe('signed-out')
  })

  it('reste en chargement tant que le contrôle d’autorisation est inconnu', () => {
    expect(authStatus({ initializing: false, hasSession: true, check: null })).toBe('loading')
  })

  it('renvoie le résultat du contrôle d’autorisation', () => {
    expect(authStatus({ initializing: false, hasSession: true, check: 'allowed' })).toBe('allowed')
    expect(authStatus({ initializing: false, hasSession: true, check: 'denied' })).toBe('denied')
    expect(authStatus({ initializing: false, hasSession: true, check: 'error' })).toBe('error')
  })
})
