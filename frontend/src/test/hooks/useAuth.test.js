/**
 * useAuth.test.js — Tests unitarios de las funciones de autenticación.
 *
 * Todas las funciones son puras o dependen solo de localStorage,
 * lo que permite una cobertura alta con tests simples.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  parseToken,
  getToken,
  getUserRole,
  getUserId,
  isAuthenticated,
} from '../../hooks/useAuth'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Crea un JWT falso con el payload indicado (sin firma real). */
function fakeJwt(payload) {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body    = btoa(JSON.stringify(payload))
  return `${header}.${body}.fakesignature`
}

// ── parseToken ────────────────────────────────────────────────────────────────

describe('parseToken', () => {
  it('devuelve null si el token es undefined', () => {
    expect(parseToken(undefined)).toBeNull()
  })

  it('devuelve null si el token es null', () => {
    expect(parseToken(null)).toBeNull()
  })

  it('devuelve null si el token es una cadena vacía', () => {
    expect(parseToken('')).toBeNull()
  })

  it('devuelve null si el token tiene formato inválido', () => {
    expect(parseToken('no.es.jwt')).toBeNull()
  })

  it('devuelve null si el base64 no es JSON válido', () => {
    expect(parseToken('header.!!@@##.sig')).toBeNull()
  })

  it('devuelve el payload cuando el JWT es válido', () => {
    const payload = { sub: '42', rol: 'comprador', exp: 9999999999 }
    expect(parseToken(fakeJwt(payload))).toMatchObject(payload)
  })

  it('devuelve rol correcto del payload', () => {
    const token = fakeJwt({ sub: '1', rol: 'vendedor' })
    expect(parseToken(token).rol).toBe('vendedor')
  })

  it('devuelve sub correcto del payload', () => {
    const token = fakeJwt({ sub: '99', rol: 'admin' })
    expect(parseToken(token).sub).toBe('99')
  })
})

// ── getToken ──────────────────────────────────────────────────────────────────

describe('getToken', () => {
  beforeEach(() => localStorage.clear())
  afterEach(()  => localStorage.clear())

  it('devuelve null cuando no hay token en localStorage', () => {
    expect(getToken()).toBeNull()
  })

  it('devuelve el token almacenado en localStorage', () => {
    localStorage.setItem('token', 'mi.token.falso')
    expect(getToken()).toBe('mi.token.falso')
  })

  it('devuelve el último token si se sobreescribe', () => {
    localStorage.setItem('token', 'primer.token')
    localStorage.setItem('token', 'segundo.token')
    expect(getToken()).toBe('segundo.token')
  })
})

// ── getUserRole ───────────────────────────────────────────────────────────────

describe('getUserRole', () => {
  beforeEach(() => localStorage.clear())
  afterEach(()  => localStorage.clear())

  it('devuelve null cuando no hay token', () => {
    expect(getUserRole()).toBeNull()
  })

  it('devuelve null si el token no tiene campo rol', () => {
    localStorage.setItem('token', fakeJwt({ sub: '1' }))
    expect(getUserRole()).toBeNull()
  })

  it('devuelve "comprador" para un token de comprador', () => {
    localStorage.setItem('token', fakeJwt({ sub: '1', rol: 'comprador' }))
    expect(getUserRole()).toBe('comprador')
  })

  it('devuelve "vendedor" para un token de vendedor', () => {
    localStorage.setItem('token', fakeJwt({ sub: '2', rol: 'vendedor' }))
    expect(getUserRole()).toBe('vendedor')
  })

  it('devuelve "admin" para un token de administrador', () => {
    localStorage.setItem('token', fakeJwt({ sub: '3', rol: 'admin' }))
    expect(getUserRole()).toBe('admin')
  })

  it('devuelve null si el token está malformado', () => {
    localStorage.setItem('token', 'token.basura')
    expect(getUserRole()).toBeNull()
  })
})

// ── getUserId ─────────────────────────────────────────────────────────────────

describe('getUserId', () => {
  beforeEach(() => localStorage.clear())
  afterEach(()  => localStorage.clear())

  it('devuelve null cuando no hay token', () => {
    expect(getUserId()).toBeNull()
  })

  it('devuelve el id del usuario del campo sub', () => {
    localStorage.setItem('token', fakeJwt({ sub: '42', rol: 'comprador' }))
    expect(getUserId()).toBe('42')
  })

  it('devuelve null si el payload no tiene campo sub', () => {
    localStorage.setItem('token', fakeJwt({ rol: 'comprador' }))
    expect(getUserId()).toBeNull()
  })

  it('devuelve null si el token está malformado', () => {
    localStorage.setItem('token', 'malformado.xxx')
    expect(getUserId()).toBeNull()
  })
})

// ── isAuthenticated ───────────────────────────────────────────────────────────

describe('isAuthenticated', () => {
  beforeEach(() => localStorage.clear())
  afterEach(()  => localStorage.clear())

  it('devuelve false cuando no hay token en localStorage', () => {
    expect(isAuthenticated()).toBe(false)
  })

  it('devuelve true cuando hay un token', () => {
    localStorage.setItem('token', fakeJwt({ sub: '1', rol: 'comprador' }))
    expect(isAuthenticated()).toBe(true)
  })

  it('devuelve false después de eliminar el token', () => {
    localStorage.setItem('token', 'algo')
    localStorage.removeItem('token')
    expect(isAuthenticated()).toBe(false)
  })

  it('devuelve true incluso con un token malformado (verifica presencia, no validez)', () => {
    localStorage.setItem('token', 'token.invalido')
    expect(isAuthenticated()).toBe(true)
  })
})
