import { describe, it, expect } from 'vitest'
import type { Show } from '../types'
import { deriveShowTag } from './JellyMoverShell.helpers'

const baseShow: Show = {
  id: 1,
  title: 'Test',
  path: '/media/test',
  location: null,
  size_bytes: null,
  season_count: null,
  episode_count: null,
  thumbnail_path: null,
}

describe('deriveShowTag', () => {
  it('returns SERIES when multiple seasons exist', () => {
    const show = { ...baseShow, season_count: 2 }
    expect(deriveShowTag(show)).toBe('SERIES')
  })

  it('returns EPISODES when multiple episodes exist but not seasons', () => {
    const show = { ...baseShow, episode_count: 5 }
    expect(deriveShowTag(show)).toBe('EPISODES')
  })

  it('uses the location when available', () => {
    const show = { ...baseShow, location: '  hot ' }
    expect(deriveShowTag(show)).toBe('HOT')
  })

  it('falls back to MEDIA when no metadata exists', () => {
    expect(deriveShowTag(baseShow)).toBe('MEDIA')
  })
})
