/**
 * chatEmojiData.test.js — Tests de las constantes de emojis, GIFs y stickers.
 */

import { describe, it, expect } from 'vitest'
import { EMOJI_CATEGORIES, GIF_OPTIONS, STICKER_OPTIONS } from '../../data/chatEmojiData'

describe('chatEmojiData — EMOJI_CATEGORIES', () => {
  it('tiene 8 categorías', () => {
    expect(EMOJI_CATEGORIES).toHaveLength(8)
  })

  it('cada categoría tiene id, icon, name y emojis', () => {
    EMOJI_CATEGORIES.forEach((cat) => {
      expect(cat.id).toBeTruthy()
      expect(cat.icon).toBeTruthy()
      expect(cat.name).toBeTruthy()
      expect(Array.isArray(cat.emojis)).toBe(true)
      expect(cat.emojis.length).toBeGreaterThan(0)
    })
  })

  it('la primera categoría es smileys', () => {
    expect(EMOJI_CATEGORIES[0].id).toBe('smileys')
  })

  it('contiene categoría de banderas', () => {
    const flags = EMOJI_CATEGORIES.find((c) => c.id === 'flags')
    expect(flags).toBeDefined()
    expect(flags.emojis).toContain('🇨🇴')
  })
})

describe('chatEmojiData — GIF_OPTIONS', () => {
  it('tiene 6 GIFs', () => {
    expect(GIF_OPTIONS).toHaveLength(6)
  })

  it('cada GIF tiene id, title y url', () => {
    GIF_OPTIONS.forEach((gif) => {
      expect(gif.id).toBeTruthy()
      expect(gif.title).toBeTruthy()
      expect(gif.url).toMatch(/^https?:\/\//)
    })
  })
})

describe('chatEmojiData — STICKER_OPTIONS', () => {
  it('tiene 8 stickers', () => {
    expect(STICKER_OPTIONS).toHaveLength(8)
  })

  it('cada sticker tiene id, emoji, label y url', () => {
    STICKER_OPTIONS.forEach((s) => {
      expect(s.id).toBeTruthy()
      expect(s.emoji).toBeTruthy()
      expect(s.label).toBeTruthy()
      expect(s.url).toMatch(/^https?:\/\//)
    })
  })

  it('contiene el sticker de libros', () => {
    const libros = STICKER_OPTIONS.find((s) => s.label === 'Libros')
    expect(libros).toBeDefined()
    expect(libros.emoji).toBe('📚')
  })
})
