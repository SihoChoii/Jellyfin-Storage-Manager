import { describe, it, expect } from 'vitest'
import { formatShowSize, formatJobTimestamp } from './formatters'

describe('formatShowSize', () => {
  it('returns 0 GB for null or invalid values', () => {
    expect(formatShowSize(null)).toBe('0 GB')
    expect(formatShowSize(0)).toBe('0 GB')
  })

  it('formats positive sizes with precision', () => {
    const tenGB = 10 * 1024 ** 3
    expect(formatShowSize(tenGB)).toBe('10.0 GB')
  })
})

describe('formatJobTimestamp', () => {
  it('returns placeholder for missing timestamps', () => {
    expect(formatJobTimestamp(null)).toBe('—')
  })

  it('formats valid unix timestamps', () => {
    const timestamp = 1_700_000_000
    const expected = `${new Date(timestamp * 1000).toLocaleDateString()} ${new Date(timestamp * 1000).toLocaleTimeString()}`
    expect(formatJobTimestamp(timestamp)).toBe(expected)
  })
})
