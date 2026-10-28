import { describe, expect, it } from 'vitest'
import { authStorageKey, parseStoredSession } from '../src/lib/offline-session'

describe('authStorageKey', () => {
  it('reproduit la clé de stockage de supabase-js', () => {
    expect(authStorageKey('https://jtrkhjfyisamphnymkbo.supabase.co')).toBe('sb-jtrkhjfyisamphnymkbo-auth-token')
  })
  it('renvoie null pour une URL invalide', () => {
    expect(authStorageKey('pas une url')).toBeNull()
  })
})

describe('parseStoredSession', () => {
  it('relit une session valide', () => {
    const raw = JSON.stringify({ access_token: 'a', refresh_token: 'r', user: { id: 'u1', email: 'x@y.z' } })
    expect(parseStoredSession(raw)?.user.id).toBe('u1')
  })
  it('refuse les valeurs absentes ou invalides', () => {
    expect(parseStoredSession(null)).toBeNull()
    expect(parseStoredSession('')).toBeNull()
    expect(parseStoredSession('{pas du json')).toBeNull()
    expect(parseStoredSession('{"access_token":"a"}')).toBeNull()
    expect(parseStoredSession('{"user":{"id":"u1"}}')).toBeNull()
    expect(parseStoredSession('null')).toBeNull()
  })
})
